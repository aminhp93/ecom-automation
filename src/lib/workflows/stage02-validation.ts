import {
  ecomStore,
  Product,
  WorkflowEvent,
  ProductValidation,
} from "../db/store";
import { aiRouter } from "../ai/router";
import { validationSchema } from "./schemas";
import { assertStageReady, commitStage } from "./pipeline";

export type EventCallback = (event: WorkflowEvent) => void;

export interface ValidationWorkflowOptions {
  runId?: string;
  startedAt?: string;
  productId: string;
  onEvent?: EventCallback;
}

export async function runProductValidationWorkflow(
  options: ValidationWorkflowOptions,
): Promise<{ product: Product; validation: ProductValidation }> {
  const product = ecomStore.getProductById(options.productId);
  if (!product) {
    throw new Error(`Product not found: ${options.productId}`);
  }

  assertStageReady(product, "02");

  const runId = options.runId ?? `wf_run_02_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const startedAt = options.startedAt ?? new Date().toISOString();
  const workflowEvents: WorkflowEvent[] = [];

  const emit = (type: WorkflowEvent["type"], message: string, data?: any) => {
    const event: WorkflowEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      stage: "02_PRODUCT_VALIDATION",
      message,
      data,
    };
    workflowEvents.push(event);
    if (options.onEvent) {
      options.onEvent(event);
    }
  };

  emit(
    "info",
    `🚀 Bắt đầu Stage 02: Thẩm định chuyên sâu sản phẩm "${product.name}"...`,
  );

  emit(
    "info",
    "Chưa kết nối nguồn Google Trends, Ads Library hoặc reviews. Các chỉ số thực tế để trống; AI chỉ đề xuất giả thuyết cần kiểm chứng.",
  );
  emit(
    "ai_analyze",
    "Đang lập bản nháp phân tích rủi ro, không phải kết quả khảo sát thị trường.",
  );

  const prompt = `
Bạn là chuyên gia phân tích chất lượng sản phẩm E-commerce.
Hãy bóc tách các vấn đề thường gặp và nỗi thất vọng của người mua về sản phẩm: "${product.name}" (${product.category}).
Đề xuất 3 giả thuyết rủi ro và cách kiểm chứng. Không có review hay dữ liệu thị trường được cung cấp; không bịa tần suất, thống kê hay bằng chứng có lợi nhuận. Ghi frequency là "Chưa có dữ liệu".
Trả về JSON định dạng:
{
  "trend_status": "surging",
  "review_sentiment_score": 85,
  "negative_reviews_mined": [
    { "issue": "Lỗi/khuyết điểm 1", "frequency": "25%", "workaround": "Cách chúng ta khắc phục để làm USP" },
    { "issue": "Lỗi/khuyết điểm 2", "frequency": "18%", "workaround": "Cách khắc phục" },
    { "issue": "Lỗi/khuyết điểm 3", "frequency": "12%", "workaround": "Cách khắc phục" }
  ],
  "validation_score": 88,
  "verdict": "GO",
  "verdict_reason": "Lý do súc tích cho phán quyết"
}

"verdict" BẮT BUỘC là một trong 3 giá trị:
- "GO": tín hiệu nhu cầu + độ bền ads mạnh, validation_score >= 75, nên test ngay.
- "CONDITIONAL_GO": có tiềm năng nhưng còn rủi ro (sentiment trung bình, ads biến động, review lỗi nặng), validation_score khoảng 60-74, cần kiểm chứng thêm trước khi chi tiền tìm nguồn hàng.
- "NO_GO": rủi ro cao (nhu cầu yếu, quá bão hòa, lỗi sản phẩm không khắc phục được), validation_score < 60, nên dừng.
`;

  const aiRes = await aiRouter.run({
    task: "market_extraction",
    prompt,
    systemPrompt: "Trả lời JSON hợp lệ phân tích rủi ro sản phẩm.",
    jsonMode: true,
    workflowRunId: runId,
  });
  const parsed = validationSchema.parse(aiRes.data);
  const validationData: ProductValidation = {
    ...parsed,
    trend_growth_pct: null,
    active_competitor_ads: null,
    ads_longevity_days: null,
    negative_reviews_mined: parsed.negative_reviews_mined.map((review) => ({
      ...review,
      frequency: "Chưa có dữ liệu",
    })),
    verdict:
      parsed.verdict === "NO_GO" || parsed.validation_score < 60
        ? "NO_GO"
        : "CONDITIONAL_GO",
    verdict_reason: `Chưa xác minh nguồn; chỉ dùng lập kế hoạch. ${parsed.verdict_reason}`,
    data_quality: aiRes.provider === "mock" ? "mock" : "unverified",
    requires_review: true,
  };

  // Persist transactionally so a concurrent stage run cannot clobber this write
  const saved = commitStage(product, "02", (p) => {
    p.validation = validationData;
    p.pipeline_stage = "02_VALIDATION";
  });

  // Save workflow run record for persistence
  ecomStore.saveWorkflowRun({
    id: runId,
    workflow: "02_PRODUCT_VALIDATION",
    niche: product.niche,
    status: "completed",
    progress: 100,
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    logs: workflowEvents,
    discovered_count: 1,
  });

  emit(
    "score",
    `🏆 Phán quyết Stage 02: [${validationData.verdict}] với Điểm xác thực ${validationData.validation_score}/100.`,
    {
      validation: validationData,
    },
  );

  emit(
    "done",
    `🎉 Hoàn thành Stage 02 (Product Validation)! Sẵn sàng bước sang Stage 03: Competitor Research.`,
  );

  return { product: saved, validation: validationData };
}
