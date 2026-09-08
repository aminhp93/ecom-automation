import {
  ecomStore,
  Product,
  WorkflowEvent,
  SupplierEconomics,
} from "../db/store";
import { aiRouter } from "../ai/router";
import { calculateFinancials } from "../tools/scoring";
import { assertStageReady, commitStage } from "./pipeline";
import { supplierSchema } from "./schemas";

export type EventCallback = (event: WorkflowEvent) => void;

export interface SupplierWorkflowOptions {
  runId?: string;
  startedAt?: string;
  productId: string;
  onEvent?: EventCallback;
}

export async function runSupplierValidationWorkflow(
  options: SupplierWorkflowOptions,
): Promise<{ product: Product; supplierEconomics: SupplierEconomics }> {
  const product = ecomStore.getProductById(options.productId);
  if (!product) {
    throw new Error(`Product not found: ${options.productId}`);
  }
  assertStageReady(product, "04");
  const financials = calculateFinancials(product);
  if (financials.gross_margin <= 0) {
    throw new Error(
      "Margin không dương: không có ROAS hòa vốn. Cần tăng giá hoặc giảm chi phí trước.",
    );
  }
  Object.assign(product, financials);

  // Prerequisite Gates
  if (!product.competitor_analysis) {
    throw new Error(
      `Sản phẩm "${product.name}" chưa hoàn thành Phân tích đối thủ Stage 03. Vui lòng hoàn tất Stage 03 trước khi thẩm định nhà cung cấp.`,
    );
  }

  const runId =
    options.runId ??
    `wf_run_04_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const startedAt = options.startedAt ?? new Date().toISOString();
  const workflowEvents: WorkflowEvent[] = [];

  const emit = (type: WorkflowEvent["type"], message: string, data?: any) => {
    const event: WorkflowEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      stage: "04_SUPPLIER_VALIDATION",
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
    `🚀 Bắt đầu Stage 04: Thẩm định nhà cung cấp & Tính toán hòa vốn cho "${product.name}"...`,
  );

  // Extract clean generic keywords for supplier search (no brand hardcoding)
  const cleanKeyword =
    product.name
      .replace(/[™®©]/g, "")
      .replace(/\([^)]*\)/g, "")
      .replace(/\b(official|edition|pack|set|brand)\b/gi, "")
      .trim() ||
    product.category ||
    "product";

  emit(
    "search",
    "Lập kịch bản chi phí ước tính và link tìm nguồn. Chưa có báo giá, SKU hoặc kết nối supplier API.",
  );

  // AI Logistics & Sourcing Risk Assessment
  emit(
    "ai_analyze",
    `🤖 Đang phân tích rủi ro logistics & đàm phán nguồn hàng với AI...`,
  );

  let aiSourcingNotes = {
    packaging_advice:
      "Đóng gói túi bóng khí hoặc hộp carton tiêu chuẩn, dán nhãn chống sốc.",
    freight_sensitivity: "Tuyến hàng thông thường (Standard General Cargo).",
    moq_negotiation_angle:
      "Đàm phán sample test 1 chiếc trước khi nhập sỉ 50-100 chiếc.",
    target_roas_multiplier: 1.55,
  };

  try {
    const aiRes = await aiRouter.run({
      task: "strategic_reasoning",
      prompt: `Bạn là Giám đốc Sourcing & Vận chuyển Dropshipping quốc tế.
Phân tích sản phẩm: "${product.name}" (Ngành: ${product.niche}, Giá bán: $${product.selling_price}, Landed Cost: $${product.landed_cost}).

Hãy xuất ra JSON hợp lệ với cấu trúc sau:
{
  "packaging_advice": "Lời khuyên đóng gói chống bể/hư hỏng/trầy xước cụ thể cho sản phẩm này khi vận chuyển quốc tế",
  "freight_sensitivity": "Phân loại hàng hóa (hàng thông thường / nhạy cảm / pin / chất lỏng / cồng kềnh)",
  "moq_negotiation_angle": "Chiến lược đàm phán MOQ và yêu cầu in thương hiệu riêng (Private Label) với xưởng",
  "recommended_target_roas_buffer": 1.55
}`,
      systemPrompt:
        "Trả lời JSON hợp lệ phân tích logistics và đàm phán nguồn hàng.",
      jsonMode: true,
      workflowRunId: runId,
    });

    if (aiRes.data && aiRes.data.packaging_advice) {
      aiSourcingNotes = {
        packaging_advice: aiRes.data.packaging_advice,
        freight_sensitivity:
          aiRes.data.freight_sensitivity || aiSourcingNotes.freight_sensitivity,
        moq_negotiation_angle:
          aiRes.data.moq_negotiation_angle ||
          aiSourcingNotes.moq_negotiation_angle,
        target_roas_multiplier: Number.isFinite(
          aiRes.data.recommended_target_roas_buffer,
        )
          ? aiRes.data.recommended_target_roas_buffer
          : 1.55,
      };
      emit(
        "info",
        `  ↳ AI Logistics (${aiRes.provider.toUpperCase()}): Phân loại hàng [${aiSourcingNotes.freight_sensitivity}]. Đóng gói: ${aiSourcingNotes.packaging_advice}`,
      );
    }
  } catch (e: any) {
    emit(
      "info",
      `  ↳ ⚠️ AI Logistics không phản hồi (${e?.message || "timeout"}). Áp dụng mô hình benchmark tiêu chuẩn.`,
    );
  }

  const sup1Cost = Number(product.supplier_price.toFixed(2));
  const sup2Cost = Number((product.supplier_price * 1.08).toFixed(2));
  const sup3Cost = Number((product.supplier_price * 0.65).toFixed(2)); // Wholesale OEM / 1688 price

  const cjSearchUrl = `https://cjdropshipping.com/list/product-list.html?key=${encodeURIComponent(cleanKeyword)}`;
  const aliSearchUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(cleanKeyword)}`;
  const s1688SearchUrl = `https://s.1688.com/youyuan.html?keywords=${encodeURIComponent(cleanKeyword)}`;

  // Logistics benchmark derived from the product's own shipping-friendliness score + AI freight class.
  // These are ESTIMATES to prioritise which supplier to verify first — not verified vendor stats.
  const freightText = (aiSourcingNotes.freight_sensitivity || "").toLowerCase();
  const isSensitiveFreight =
    /nhạy cảm|chất lỏng|lỏng|pin|battery|liquid|cồng kềnh|bulky|sensitive|aerosol|từ tính|magnet|cấm bay/.test(
      freightText,
    );
  const shippingScore = Number.isFinite(product.shipping_score)
    ? product.shipping_score
    : 0;
  const baseReliability = Math.round(
    78 + (Math.min(100, Math.max(0, shippingScore)) / 100) * 18,
  ); // ~78-96
  const sensitivityPenalty = isSensitiveFreight ? 6 : 0;
  const deliveryPad = isSensitiveFreight ? 3 : 0; // extra transit days for restricted goods
  const cjReliability = Math.min(97, baseReliability + 2 - sensitivityPenalty);
  const aliReliability = Math.max(72, baseReliability - 4 - sensitivityPenalty);
  const factoryReliability = Math.min(
    98,
    baseReliability + 4 - sensitivityPenalty,
  );
  const estNote =
    "Chỉ số reliability & thời gian giao là ước tính benchmark theo độ thân thiện logistics của sản phẩm — cần xác minh trực tiếp qua link nguồn.";

  if (isSensitiveFreight) {
    emit(
      "info",
      `  ↳ ⚠️ Hàng thuộc nhóm nhạy cảm/hạn chế vận chuyển ([${aiSourcingNotes.freight_sensitivity}]) — cộng thêm ${deliveryPad} ngày transit và hạ ${sensitivityPenalty} điểm reliability benchmark.`,
    );
  }

  const exactBreakEvenRoas = product.selling_price / product.gross_margin;
  const breakEvenRoas = Number(exactBreakEvenRoas.toFixed(2));
  const dynamicMultiplier = Math.max(
    1.35,
    Math.min(2.1, aiSourcingNotes.target_roas_multiplier),
  );
  const targetRoas = Number(
    (exactBreakEvenRoas * dynamicMultiplier).toFixed(2),
  );

  // 100 Orders Economics
  const grossMarginPool100 = Math.round(product.gross_margin * 100);
  const adSpend100 = Math.round((product.selling_price * 100) / targetRoas);
  const netProfit100 = Math.round(grossMarginPool100 - adSpend100);

  // 500 Orders Economics: Volume Wholesale Discount from Factory (1688 tier)
  const wholesaleShipCost = Number((product.shipping_cost * 0.88).toFixed(2));
  const wholesaleLandedCost =
    sup3Cost + wholesaleShipCost + product.payment_fee + product.refund_reserve;
  const wholesaleGrossMargin = Number(
    (product.selling_price - wholesaleLandedCost).toFixed(2),
  );
  const grossMarginPool500 = Math.round(wholesaleGrossMargin * 500);
  const adSpend500 = Math.round((product.selling_price * 500) / targetRoas);
  const netProfit500 = Math.round(grossMarginPool500 - adSpend500);

  const supplierData: SupplierEconomics = {
    data_quality: "estimated",
    requires_review: true,
    suppliers: [
      {
        source: "CJ Dropshipping (CJPacket Line)",
        unit_cost: sup1Cost,
        moq: 1,
        shipping_method: "CJPacket Fast Line",
        shipping_cost: Number((product.shipping_cost * 0.95).toFixed(2)),
        delivery_days: `${7 + deliveryPad}-${11 + deliveryPad} ngày`,
        reliability_rating: cjReliability,
        url: cjSearchUrl,
        verification_url: "https://cjdropshipping.com/",
        badge: "Ước tính — chưa kết nối API",
        notes: `Chưa xác minh tồn kho/SKU/báo giá. Đóng gói khuyến nghị: ${aiSourcingNotes.packaging_advice} ${estNote}`,
      },
      {
        source: "AliExpress — kênh tìm nguồn chưa xác minh",
        unit_cost: sup2Cost,
        moq: 1,
        shipping_method: "AliExpress Standard Shipping",
        shipping_cost: product.shipping_cost,
        delivery_days: `${8 + deliveryPad}-${12 + deliveryPad} ngày`,
        reliability_rating: aliReliability,
        url: aliSearchUrl,
        verification_url: `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(cleanKeyword)}`,
        badge: "Buyer Protection",
        notes: `Tuyến ${aiSourcingNotes.freight_sensitivity}. Dễ dàng đối chiếu chất lượng qua ảnh chụp review thật từ khách hàng quốc tế. ${estNote}`,
      },
      {
        source: "1688 OEM Factory (Xưởng Gốc Trung Quốc)",
        unit_cost: sup3Cost,
        moq: 50,
        shipping_method: "YunExpress Dedicated Line",
        shipping_cost: wholesaleShipCost,
        delivery_days: `${6 + deliveryPad}-${9 + deliveryPad} ngày`,
        reliability_rating: factoryReliability,
        url: s1688SearchUrl,
        verification_url: "https://www.yunexpress.com/",
        badge: "Factory Wholesale",
        notes: `Giá xuất xưởng theo giá sỉ RMB. Chiến lược đàm phán: ${aiSourcingNotes.moq_negotiation_angle} ${estNote}`,
      },
    ],
    break_even_roas: breakEvenRoas,
    target_roas: targetRoas,
    gross_margin_pool_100: grossMarginPool100,
    ad_spend_projection_100: adSpend100,
    net_profit_projection_100_orders: netProfit100,
    gross_margin_pool_500: grossMarginPool500,
    ad_spend_projection_500: adSpend500,
    net_profit_projection_500_orders: netProfit500,
    profit_projection_100_orders: netProfit100, // Legacy alias
    profit_projection_500_orders: netProfit500, // Legacy alias
  };

  supplierSchema.parse(supplierData);
  emit(
    "found",
    `Đã tính kịch bản ước tính: Break-Even ROAS ${supplierData.break_even_roas}x | Target ${supplierData.target_roas}x; chưa gồm thuế và vận hành.`,
  );

  emit(
    "score",
    `🏆 Dự phóng tài chính: 100 đơn = Lãi ròng $${netProfit100} (sau khi trừ $${adSpend100} chi phí Ads) | 500 đơn sỉ = Lãi ròng $${netProfit500} (sau khi trừ $${adSpend500} Ads).`,
    { supplierEconomics: supplierData },
  );

  // Persist transactionally so a concurrent stage run cannot clobber this write
  const saved = commitStage(product, "04", (p) => {
    Object.assign(p, financials);
    p.supplier_economics = supplierData;
    p.pipeline_stage = "04_SUPPLIER";
  });

  // Save workflow run record for persistence
  ecomStore.saveWorkflowRun({
    id: runId,
    workflow: "04_SUPPLIER_VALIDATION",
    niche: product.niche,
    status: "completed",
    progress: 100,
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    logs: workflowEvents,
    discovered_count: supplierData.suppliers.length,
  });

  emit(
    "done",
    `🎉 Hoàn thành Stage 04! Sẵn sàng tạo các gói Offer chuyển đổi cao ở Stage 05.`,
  );

  return { product: saved, supplierEconomics: supplierData };
}
