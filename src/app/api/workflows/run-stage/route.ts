import { NextRequest } from "next/server";
import { runProductValidationWorkflow } from "@/lib/workflows/stage02-validation";
import { runCompetitorResearchWorkflow } from "@/lib/workflows/stage03-competitor";
import { runSupplierValidationWorkflow } from "@/lib/workflows/stage04-supplier";
import { runOfferCreationWorkflow } from "@/lib/workflows/stage05-offer";
import { runCreativeProductionWorkflow } from "@/lib/workflows/stage06-creative";
import { ecomStore, WorkflowEvent, WorkflowRun } from "@/lib/db/store";
import { randomUUID } from "node:crypto";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json(
      { error: "Body phải là JSON object." },
      { status: 400 },
    );
  }
  const { productId, stage, allowNoGoOverride } = body;

  if (
    typeof productId !== "string" ||
    !productId.trim() ||
    !["02", "03", "04", "05", "06"].includes(stage) ||
    (allowNoGoOverride !== undefined && typeof allowNoGoOverride !== "boolean")
  ) {
    return new Response(
      JSON.stringify({ error: "Missing productId or stage" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const encoder = new TextEncoder();
  const product = ecomStore.getProductById(productId);
  if (!product)
    return Response.json(
      { error: "Không tìm thấy sản phẩm." },
      { status: 404 },
    );
  const run: WorkflowRun = {
    id: randomUUID(),
    workflow: `STAGE_${stage}`,
    niche: product.niche,
    status: "running",
    progress: 0,
    started_at: new Date().toISOString(),
    logs: [],
    discovered_count: 0,
  };

  const stream = new ReadableStream({
    async start(controller) {
      // Keep-alive heartbeat ping every 5 seconds to prevent proxy/browser timeout
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          clearInterval(pingInterval);
        }
      }, 5000);

      const sendEvent = (event: WorkflowEvent) => {
        run.logs.push(event);
        try {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (e) {
          console.error("Error sending SSE chunk:", e);
        }
      };

      try {
        ecomStore.saveWorkflowRun(run);
        const options = {
          productId,
          onEvent: sendEvent,
          runId: run.id,
          startedAt: run.started_at,
        };
        if (stage === "02") {
          await runProductValidationWorkflow(options);
        } else if (stage === "03") {
          await runCompetitorResearchWorkflow({
            ...options,
            allowNoGoOverride,
          });
        } else if (stage === "04") {
          await runSupplierValidationWorkflow(options);
        } else if (stage === "05") {
          await runOfferCreationWorkflow(options);
        } else if (stage === "06") {
          await runCreativeProductionWorkflow(options);
        } else {
          throw new Error(
            `Giai đoạn Stage ${stage} chưa được hỗ trợ trong V1 Pipeline (hiện thuộc Roadmap V2).`,
          );
        }
        run.status = "completed";
        run.progress = 100;
      } catch (err: any) {
        run.status = "failed";
        sendEvent({
          id: `err_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: "error",
          stage: `STAGE_${stage}`,
          message: `Lỗi thực thi: ${err?.message || "Unknown error"}`,
        });
      } finally {
        clearInterval(pingInterval);
        try {
          const completed = ecomStore.getWorkflowRun(run.id);
          ecomStore.saveWorkflowRun({
            ...run,
            discovered_count: completed?.discovered_count ?? 0,
            completed_at: new Date().toISOString(),
          });
        } catch (error) {
          console.error("Không lưu được nhật ký workflow:", error);
          sendEvent({
            id: randomUUID(),
            timestamp: new Date().toISOString(),
            stage: `STAGE_${stage}`,
            type: "error",
            message:
              "Không lưu được nhật ký; cần kiểm tra store trước khi chạy lại.",
          });
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
