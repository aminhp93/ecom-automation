import { ecomStore, Product, WorkflowEvent, CreativePack } from "../db/store";
import { aiRouter } from "../ai/router";
import { assertStageReady, commitStage } from "./pipeline";
import { creativeSchema } from "./schemas";

export type EventCallback = (event: WorkflowEvent) => void;

export interface CreativeWorkflowOptions {
  runId?: string;
  startedAt?: string;
  productId: string;
  onEvent?: EventCallback;
}

export async function runCreativeProductionWorkflow(
  options: CreativeWorkflowOptions,
): Promise<{ product: Product; creativePack: CreativePack }> {
  const product = ecomStore.getProductById(options.productId);
  if (!product) {
    throw new Error(`Product not found: ${options.productId}`);
  }
  assertStageReady(product, "06");

  // Prerequisite Gates
  if (!product.offer_package) {
    throw new Error(
      `Sản phẩm "${product.name}" chưa hoàn thành Stage 05 (Thiết kế Offer). Cần có cấu trúc gói bán, giá ưu đãi và cam kết bảo hành để viết kịch bản video và dựng trang bán hàng Shopify.`,
    );
  }

  const runId = options.runId ?? `wf_run_06_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const startedAt = options.startedAt ?? new Date().toISOString();
  const workflowEvents: WorkflowEvent[] = [];

  const emit = (type: WorkflowEvent["type"], message: string, data?: any) => {
    const event: WorkflowEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      stage: "06_CREATIVE_PRODUCTION",
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
    `🚀 Kích hoạt Stage 06: Sản xuất kịch bản Video Creative & Trang Shopify cho "${product.name}"...`,
  );

  emit(
    "ai_analyze",
    `🤖 Định tuyến tới Claude Sonnet 4.5 / Gemini để viết 10 Viral Hooks, 3 Kịch bản Video Ads phân cảnh và Nội dung mô tả sản phẩm Shopify chuẩn SEO...`,
  );

  const offerInfo = product.offer_package;
  const packagesSummary = offerInfo.packages
    .map(
      (p) => `${p.tier} - ${p.name}: Giá $${p.price} (Tiết kiệm ${p.savings})`,
    )
    .join(" | ");

  const prompt = `
Bạn là Giám đốc Sáng tạo (Creative Director) và Chuyên gia Copywriting hàng đầu cho các nhãn hàng DTC E-commerce $10M+.
Hãy viết trọn bộ tài liệu quảng cáo và bán hàng cho sản phẩm sau:
Tên sản phẩm: "${product.name}"
Danh mục: ${product.category}
Đặc tính Wow: "${product.wow_factor}"
Đối tượng mục tiêu: "${product.target_audience}"
Các nỗi đau: ${JSON.stringify(product.pain_points)}
Góc tiếp cận: ${JSON.stringify(product.angles)}

Dữ liệu Offer đã chốt ở Stage 05:
Định vị USP: "${offerInfo.positioning_statement}"
Các gói bán: "${packagesSummary}"
Cam kết bảo hành rủi ro: "${offerInfo.risk_reversal_guarantee}"
Yếu tố khan hiếm/khẩn cấp: "${offerInfo.urgency_hook}"
Chi phí/supplier chưa xác minh: ${JSON.stringify(product.supplier_economics)}
Chỉ tạo bản nháp cần duyệt. Không thay đổi giá, số lượng, savings, guarantee của offer; không hứa delivery, công dụng, chứng nhận hoặc số liệu khách hàng không có bằng chứng. Không suy ra hiệu quả y tế hay độ an toàn từ tên sản phẩm.

Yêu cầu định dạng JSON:
{
  "viral_hooks": [
    { "id": 1, "angle": "Problem Hook", "hook_text": "Câu hook 3 giây giật gân đánh trúng nỗi đau", "category": "Pain Point" },
    { "id": 2, "angle": "Shock Statistic", "hook_text": "Câu hook bằng số liệu gây sốc", "category": "Shock" },
    { "id": 3, "angle": "Curiosity Gap", "hook_text": "Câu hook kích thích tò mò", "category": "Curiosity" },
    { "id": 4, "angle": "Visual Proof", "hook_text": "Câu hook thị giác", "category": "Demo" },
    { "id": 5, "angle": "Lifehack", "hook_text": "Mẹo vặt cuộc sống", "category": "Hack" }
  ],
  "video_scripts": [
    {
      "title": "Kịch bản 1: Problem - Agitation - Solution (PAS Framework)",
      "framework": "PAS Framework",
      "target_length": "30-40 giây",
      "scenes": [
        { "time": "0-3s", "visual": "Mô tả hình ảnh B-roll quay cảnh mở đầu", "audio": "Lời thoại Voiceover 3 giây đầu", "text_overlay": "Chữ hiện trên màn hình" },
        { "time": "3-12s", "visual": "Hình ảnh khoét sâu nỗi đau", "audio": "Lời thoại", "text_overlay": "Chữ hiện" },
        { "time": "12-25s", "visual": "Hình ảnh giải pháp xuất hiện", "audio": "Lời thoại", "text_overlay": "Chữ hiện" },
        { "time": "25-35s", "visual": "Kêu gọi hành động và ưu đãi gói combo", "audio": "Lời thoại CTA", "text_overlay": "CTA Offer" }
      ]
    },
    {
      "title": "Kịch bản 2: Before & After Transformation",
      "framework": "Before/After",
      "target_length": "25-35 giây",
      "scenes": [
        { "time": "0-3s", "visual": "Cảnh bực bội lúc trước khi có sản phẩm", "audio": "Lời thoại", "text_overlay": "Before ❌" },
        { "time": "3-15s", "visual": "Cách sản phẩm thay đổi tình thế", "audio": "Lời thoại", "text_overlay": "Chuyển biến ✨" },
        { "time": "15-30s", "visual": "Kết quả viên mãn và giới thiệu bảo hành", "audio": "Lời thoại", "text_overlay": "After ✅" }
      ]
    }
  ],
  "shopify_page": {
    "headline": "Tiêu đề Hero hấp dẫn chuyển đổi cao",
    "subheadline": "Phụ đề giải thích rõ giá trị mang lại",
    "benefits": [
      { "title": "Lợi ích 1", "desc": "Mô tả chi tiết cảm xúc mang lại" },
      { "title": "Lợi ích 2", "desc": "Mô tả chi tiết" },
      { "title": "Lợi ích 3", "desc": "Mô tả chi tiết" }
    ],
    "faqs": [
      { "q": "Câu hỏi thường gặp 1?", "a": "Câu trả lời giải tỏa nghi ngại" },
      { "q": "Câu hỏi thường gặp 2?", "a": "Câu trả lời" }
    ],
    "html_description": "<div class='ecom-product-body'><h2>Tiêu đề</h2><p>Mô tả HTML chuẩn SEO sẵn sàng copy vào Shopify...</p></div>"
  }
}
`;

  let creativeData: CreativePack;
  let dataQuality: "mock" | "unverified" = "unverified";
  try {
    const aiRes = await aiRouter.run({
      task: "ad_copy",
      agentName: "Creative Studio Copywriter",
      prompt,
      systemPrompt:
        "Bạn là chuyên gia quảng cáo và landing page E-commerce hàng đầu. Luôn trả lời JSON hợp lệ.",
      jsonMode: true,
      workflowRunId: runId,
      maxTokens: 8192,
    });
    dataQuality = aiRes.provider === "mock" ? "mock" : "unverified";

    if (aiRes.data && Array.isArray(aiRes.data.viral_hooks)) {
      creativeData = aiRes.data;
      emit(
        "info",
        `  ↳ Kịch bản sản xuất bởi ${aiRes.provider.toUpperCase()} (${aiRes.model}) trong ${aiRes.latencyMs}ms`,
      );
    } else {
      throw new Error("Incomplete JSON");
    }
  } catch (err: any) {
    dataQuality = "mock";
    emit(
      "info",
      `  ↳ ⚠️ AI API gặp sự cố (${err?.message || "timeout"}). Sử dụng bộ kịch bản sáng tạo dự phòng chuẩn.`,
    );
    creativeData = {
      viral_hooks: [
        {
          id: 1,
          angle: "Nỗi đau nhức nhối",
          hook_text: `Nếu bạn đang chật vật mỗi ngày với vấn đề này... hãy xem ngay video này!`,
          category: "Pain Point",
        },
        {
          id: 2,
          angle: "Thị giác tò mò",
          hook_text: `Đừng mua bất kỳ giải pháp nào khác cho đến khi bạn thấy video minh họa 30 giây này.`,
          category: "Curiosity",
        },
        {
          id: 3,
          angle: "Before/After",
          hook_text: `Xem cách cuộc sống thay đổi trước và sau khi có giải pháp thông minh này...`,
          category: "Transformation",
        },
      ],
      video_scripts: [
        {
          title: "Chiến dịch chuyển đổi PAS (35s)",
          framework: "Problem - Agitation - Solution",
          target_length: "35 giây",
          scenes: [
            {
              time: "0-3s",
              visual: "Mặt nhân vật thất vọng, quay cận cảnh sự cố thường gặp.",
              audio: "Tôi đã từng thử đủ mọi cách nhưng đều thất bại...",
              text_overlay: "Tại sao cách cũ không hiệu quả ❌",
            },
            {
              time: "3-12s",
              visual: "Cảnh tốn kém thời gian và công sức.",
              audio:
                "Mỗi lần xử lý đều mất cả tiếng đồng hồ và cực kỳ mệt mỏi.",
              text_overlay: "Mất thời gian & bất tiện ⚠️",
            },
            {
              time: "12-25s",
              visual:
                "Quay thao tác thực tế đã kiểm chứng; không dàn dựng kết quả.",
              audio: `Tìm hiểu cách sử dụng ${product.name} theo hướng dẫn.`,
              text_overlay: "Xem hướng dẫn sử dụng",
            },
            {
              time: "25-35s",
              visual: "Hiển thị các gói và chính sách đúng với offer đã chọn.",
              audio: `${packagesSummary}. ${offerInfo.risk_reversal_guarantee}`,
              text_overlay: offerInfo.urgency_hook,
            },
          ],
        },
      ],
      shopify_page: {
        headline: `Trải Nghiệm Đột Phá Cùng ${product.name}`,
        subheadline: offerInfo.positioning_statement,
        benefits: [
          {
            title: "Thông tin sản phẩm",
            desc: "Cần đối chiếu công dụng với tài liệu nhà sản xuất.",
          },
          {
            title: "Chất liệu và hướng dẫn",
            desc: "Cần kiểm tra mẫu và chứng từ trước khi công bố.",
          },
          {
            title: "Chính sách đổi trả",
            desc: offerInfo.risk_reversal_guarantee,
          },
        ],
        faqs: [
          {
            q: "Sản phẩm phù hợp với ai?",
            a: "Cần đối chiếu hướng dẫn và giới hạn sử dụng của nhà sản xuất.",
          },
          {
            q: "Chính sách bảo hành như thế nào?",
            a: offerInfo.risk_reversal_guarantee,
          },
        ],
        html_description: `<div class="ecom-description"><h2>${product.name}</h2><p>${offerInfo.positioning_statement}</p><ul><li>Thiết kế cao cấp thông minh</li><li>Tiết kiệm thời gian và công sức</li><li>${offerInfo.risk_reversal_guarantee}</li></ul></div>`,
      },
    };
  }

  creativeData = creativeSchema.parse(creativeData);
  creativeData.data_quality = dataQuality;
  creativeData.requires_review = true;

  // Persist transactionally so a concurrent stage run cannot clobber this write
  const saved = commitStage(product, "06", (p) => {
    p.creative_pack = creativeData;
    p.pipeline_stage = "06_CREATIVE";
  });

  // Save workflow run record for persistence
  ecomStore.saveWorkflowRun({
    id: runId,
    workflow: "06_CREATIVE_PRODUCTION",
    niche: product.niche,
    status: "completed",
    progress: 100,
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    logs: workflowEvents,
    discovered_count: creativeData.video_scripts.length,
  });

  emit(
    "score",
    `Đã tạo bản nháp ${creativeData.viral_hooks.length} hooks, ${creativeData.video_scripts.length} kịch bản và HTML. Cần kiểm tra claim, offer và nguồn trước khi xuất bản.`,
    {
      creativePack: creativeData,
    },
  );

  emit(
    "done",
    "Hoàn thành bản nháp creative. Chưa phê duyệt launch hoặc chi ngân sách quảng cáo.",
  );

  return { product: saved, creativePack: creativeData };
}
