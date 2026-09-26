import { ecomStore, Product, WorkflowEvent, OfferPackage } from "../db/store";
import { aiRouter } from "../ai/router";
import { assertStageReady, commitStage } from "./pipeline";
import { offerSchema } from "./schemas";
import { buildOfferPackages } from "./offer-economics";
import { errorMessage } from "@/lib/errors";

export type EventCallback = (event: WorkflowEvent) => void;

export interface OfferWorkflowOptions {
  runId?: string;
  startedAt?: string;
  productId: string;
  onEvent?: EventCallback;
}

export async function runOfferCreationWorkflow(
  options: OfferWorkflowOptions,
): Promise<{ product: Product; offerPackage: OfferPackage }> {
  const product = ecomStore.getProductById(options.productId);
  if (!product) {
    throw new Error(`Product not found: ${options.productId}`);
  }
  assertStageReady(product, "05");
  const safePackages = buildOfferPackages(product);

  // Prerequisite Gates
  if (!product.competitor_analysis || !product.supplier_economics) {
    throw new Error(
      `Sản phẩm "${product.name}" cần hoàn tất cả Stage 03 (Đối thủ) và Stage 04 (Nhà cung cấp & ROAS) trước khi thiết kế Offer để đảm bảo tính cạnh tranh về giá và biên độ lợi nhuận.`,
    );
  }

  const runId =
    options.runId ??
    `wf_run_05_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const startedAt = options.startedAt ?? new Date().toISOString();
  const workflowEvents: WorkflowEvent[] = [];

  const emit = (type: WorkflowEvent["type"], message: string, data?: any) => {
    const event: WorkflowEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      stage: "05_OFFER_CREATION",
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
    `🚀 Kích hoạt Stage 05: Thiết kế Grand Slam Offer cho "${product.name}"...`,
  );

  emit(
    "ai_analyze",
    `🤖 Định tuyến tới Claude Sonnet 4.5 / Gemini để xây dựng định vị USP và 3 tầng Offer tối đa hóa AOV dựa trên điểm yếu đối thủ...`,
  );

  const [tierAPrice, tierBPrice, tierCPrice] = safePackages.map(
    (item) => item.price,
  );

  const compOutposition = product.competitor_analysis.outpositioning_strategy;
  const compGap = product.competitor_analysis.gap_identified;
  const priceOpp = product.competitor_analysis.price_opportunity;

  // Steer the positioning toward the offer archetype that fits this product (economics stay deterministic).
  const consumable =
    /\b(oil|serum|cream|gel|refill|refills|supplement|capsule|drops|balm|spray|powder|tea)\b|dầu|tinh chất|kem|serum|viên|bột|trà|xịt|liều/i.test(
      `${product.name} ${product.category}`,
    );
  const offerArchetype = consumable
    ? "Sản phẩm TIÊU HAO (dùng hết mua lại): định vị nên nhấn mua nhiều để dùng dần / mô hình đăng ký định kỳ (Subscribe & Save) — KHÔNG phải Mua 1 Tặng 1."
    : product.selling_price < 25
      ? "AOV THẤP (<$25): định vị nên đẩy bundle 2-3 chiếc để nâng giá trị đơn và chạm ngưỡng miễn phí ship."
      : "Sản phẩm BỀN, AOV khá: định vị hợp với bundle gia đình / mua để tặng.";

  const prompt = `
Bạn là Alex Hormozi và David Ogilvy kết hợp trong E-commerce.
Hãy thiết kế 1 "Grand Slam Offer" không thể chối từ cho sản phẩm sau, dựa trên dữ liệu đối thủ và chi phí thực tế:
Tên sản phẩm: "${product.name}"
Ngành hàng: ${product.category}
Nỗi đau khách hàng: ${JSON.stringify(product.pain_points)}
Đặc tính Wow: "${product.wow_factor}"
Giá bán cơ bản: $${product.selling_price}
Lợi thế đè bẹp đối thủ đã phân tích: "${compOutposition}"
Khoảng trống thị trường bỏ quên: "${compGap}"
Cơ hội định giá tốt nhất: "${priceOpp}"
Kiểu offer phù hợp sản phẩm này: ${offerArchetype}
Chi phí đầu vào chưa xác minh: vốn $${product.supplier_price}/chiếc, ship $${product.shipping_cost}/chiếc; phí thanh toán 2.9% + $0.30, dự phòng hoàn tiền 3%.
BẮT BUỘC dùng nguyên các gói đã tính economics: ${JSON.stringify(safePackages)}.
Không thêm quà, shipping hỏa tốc, số khách hàng, tồn kho, chứng nhận hay bảo hành chưa được xác nhận. Chỉ tạo bản nháp định vị.

Yêu cầu định dạng JSON:
{
  "positioning_statement": "Câu định vị USP ngắn gọn, sắc bén, độc nhất đánh thẳng vào khoảng trống thị trường",
  "target_desire": "Khao khát sâu kín nhất của khách hàng mục tiêu",
  "packages": [
    {
      "tier": "A",
      "name": "Starter Pack (1 Món)",
      "badge": "TIÊU CHUẨN",
      "price": ${tierAPrice},
      "value": ${Number((tierAPrice * 1.6).toFixed(2))},
      "savings": "${safePackages[0].savings}",
      "description": "Mô tả ngắn gọn cho gói dùng thử",
      "items": ["1x Sản phẩm chính"]
    },
    {
      "tier": "B",
      "name": "Gói 2 sản phẩm",
      "badge": "MOST POPULAR",
      "price": ${tierBPrice},
      "value": ${Number((tierAPrice * 2).toFixed(2))},
      "savings": "${safePackages[1].savings}",
      "description": "Lợi ích khi có 2 chiếc (1 chiếc để dùng, 1 chiếc dự phòng/tặng người thân)",
      "items": ["2x Sản phẩm chính"]
    },
    {
      "tier": "C",
      "name": "Gói Gia Đình / Deluxe VIP",
      "badge": "BEST VALUE",
      "price": ${tierCPrice},
      "value": ${Number((tierAPrice * 3.2).toFixed(2))},
      "savings": "${safePackages[2].savings}",
      "description": "Bộ sản phẩm toàn diện nhất kèm quà tặng độc quyền",
      "items": ["3x Sản phẩm chính"]
    }
  ],
  "risk_reversal_guarantee": "Chính sách đổi trả cần được người bán xác nhận trước khi xuất bản.",
  "urgency_hook": "Xem các gói sản phẩm và điều kiện mua hàng."
}
`;

  let offerData: OfferPackage;
  let dataQuality: "mock" | "unverified" = "unverified";
  try {
    const aiRes = await aiRouter.run({
      task: "strategic_reasoning",
      agentName: "Offer & Guarantee Architect",
      prompt,
      systemPrompt:
        "Bạn là chuyên gia chiến lược Offer E-commerce hàng đầu. Luôn trả lời JSON hợp lệ.",
      jsonMode: true,
      workflowRunId: runId,
    });
    dataQuality = aiRes.provider === "mock" ? "mock" : "unverified";

    if (aiRes.data && Array.isArray(aiRes.data.packages)) {
      offerData = aiRes.data;
      emit(
        "info",
        `  ↳ Xử lý bởi ${aiRes.provider.toUpperCase()} (${aiRes.model}) | Phản hồi trong ${aiRes.latencyMs}ms`,
      );
    } else {
      throw new Error("Incomplete JSON");
    }
  } catch (err: unknown) {
    dataQuality = "mock";
    emit(
      "info",
      `  ↳ ⚠️ AI Router gặp lỗi (${errorMessage(err, "timeout")}), sử dụng thuật toán thiết kế offer dự phòng.`,
    );
    offerData = {
      positioning_statement: `Bản nháp giới thiệu ${product.name} — cần kiểm chứng công dụng trước khi xuất bản.`,
      target_desire: "Tìm sản phẩm phù hợp với nhu cầu đã xác nhận.",
      packages: [
        {
          tier: "A",
          name: "Starter Pack (1 Chiếc)",
          badge: "TIÊU CHUẨN",
          price: tierAPrice,
          value: Number((tierAPrice * 1.5).toFixed(2)),
          savings: "Giá tiêu chuẩn",
          description: "Gói trải nghiệm cho cá nhân",
          items: ["1x Sản phẩm chính hãng", "1x Túi bảo quản vệ sinh"],
        },
        {
          tier: "B",
          name: "Combo Bán Chạy Nhất (Mua 1 Tặng 1 Giảm 50%)",
          badge: "MOST POPULAR",
          price: tierBPrice,
          value: Number((tierAPrice * 2).toFixed(2)),
          savings: safePackages[1].savings,
          description: "Gói hai sản phẩm, chi phí cần xác minh trước khi bán.",
          items: [
            "2x Sản phẩm chính",
            "2x Túi bảo quản",
            "Miễn phí Express Shipping",
          ],
        },
        {
          tier: "C",
          name: "Bộ Deluxe VIP Toàn Diện",
          badge: "BEST VALUE",
          price: tierCPrice,
          value: Number((tierAPrice * 3.2).toFixed(2)),
          savings: safePackages[2].savings,
          description: "Gói toàn diện nhất bảo vệ gia đình bạn.",
          items: [
            "3x Sản phẩm",
            "Bộ quà tặng phụ kiện cao cấp",
            "Bảo hành 1 đổi 1 trong 12 tháng",
          ],
        },
      ],
      risk_reversal_guarantee:
        "Chính sách đổi trả cần được người bán xác nhận trước khi xuất bản.",
      urgency_hook: "Xem các gói sản phẩm và điều kiện mua hàng.",
    };
  }

  offerData = offerSchema.parse(offerData);
  // Prices, quantities, savings and costs have one deterministic source of truth, never AI arithmetic.
  offerData.packages = safePackages;
  offerData.risk_reversal_guarantee =
    "Chính sách đổi trả cần được người bán xác nhận trước khi xuất bản.";
  offerData.urgency_hook = "Xem các gói sản phẩm và điều kiện mua hàng.";
  offerData.data_quality = dataQuality;
  offerData.requires_review = true;

  // Persist transactionally so a concurrent stage run cannot clobber this write
  const saved = commitStage(product, "05", (p) => {
    p.offer_package = offerData;
    p.pipeline_stage = "05_OFFER";
  });

  // Save workflow run record for persistence
  ecomStore.saveWorkflowRun({
    id: runId,
    workflow: "05_OFFER_CREATION",
    niche: product.niche,
    status: "completed",
    progress: 100,
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    logs: workflowEvents,
    discovered_count: offerData.packages.length,
  });

  emit(
    "score",
    `🏆 Đã tạo xong 3 Gói Offer Tối Ưu Hóa AOV & Cam Kết Bảo Hành Rủi Ro.`,
    {
      offerPackage: offerData,
    },
  );

  emit(
    "done",
    `🎉 Hoàn thành Stage 05! Sẵn sàng tạo Kịch bản Video Ads & Trang Shopify ở Stage 06.`,
  );

  return { product: saved, offerPackage: offerData };
}
