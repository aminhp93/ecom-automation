import { NextRequest } from "next/server";
import { runProductDiscoveryWorkflow } from "@/lib/workflows/stage01-discovery";
import { WorkflowEvent } from "@/lib/db/store";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { errorMessage } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const discoveryBody = z.object({
  niche: z.string().trim().min(1).max(120).default("Baby Products"),
  sources: z
    .array(z.enum(["tiktok", "meta_ads", "amazon", "aliexpress", "kalodata"]))
    .min(1)
    .max(10)
    .default(["tiktok", "meta_ads", "amazon", "aliexpress"]),
});

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => ({}));
  const parsed = discoveryBody.safeParse(json ?? {});
  if (!parsed.success) {
    return Response.json(
      {
        error: "Body không hợp lệ.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }
  const { niche, sources } = parsed.data;

  const encoder = new TextEncoder();

  let clientGone = false;
  const stream = new ReadableStream({
    cancel() {
      clientGone = true;
    },
    async start(controller) {
      req.signal?.addEventListener("abort", () => {
        clientGone = true;
      });
      // Keep-alive heartbeat ping every 5 seconds to prevent connection drops during AI reasoning
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch {
          clearInterval(pingInterval);
        }
      }, 5000);

      const sendEvent = (event: WorkflowEvent) => {
        if (clientGone) return;
        try {
          const payload = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (e) {
          console.error("Error sending SSE chunk:", e);
        }
      };

      try {
        await runProductDiscoveryWorkflow({
          niche,
          sources,
          onEvent: (evt) => sendEvent(evt),
        });
      } catch (err: unknown) {
        sendEvent({
          id: randomUUID(),
          timestamp: new Date().toISOString(),
          type: "error",
          stage: "01_PRODUCT_DISCOVERY",
          message: `Lỗi thực thi: ${errorMessage(err)}`,
        });
      } finally {
        clearInterval(pingInterval);
        try {
          controller.close();
        } catch {
          // already closed by client disconnect
        }
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
