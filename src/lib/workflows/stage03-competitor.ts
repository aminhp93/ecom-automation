import {
  ecomStore,
  Product,
  WorkflowEvent,
  CompetitorAnalysis,
} from "../db/store";
import { aiRouter } from "../ai/router";
import { competitorSchema } from "./schemas";
import { assertStageReady, commitStage } from "./pipeline";
import { errorMessage } from "@/lib/errors";

export type EventCallback = (event: WorkflowEvent) => void;

export interface CompetitorWorkflowOptions {
  runId?: string;
  startedAt?: string;
  productId: string;
  onEvent?: EventCallback;
  allowNoGoOverride?: boolean;
}

export async function runCompetitorResearchWorkflow(
  options: CompetitorWorkflowOptions,
): Promise<{ product: Product; competitorAnalysis: CompetitorAnalysis }> {
  const product = ecomStore.getProductById(options.productId);
  if (!product) {
    throw new Error(`Product not found: ${options.productId}`);
  }
  assertStageReady(product, "03", options.allowNoGoOverride);

  // Prerequisite Gates
  if (!product.validation) {
    throw new Error(
      `Sản phẩm "${product.name}" chưa hoàn thành Thẩm định Stage 02. Vui lòng chạy Stage 02 trước khi phân tích đối thủ.`,
    );
  }

  if (product.validation.verdict === "NO_GO" && !options.allowNoGoOverride) {
    throw new Error(
      `Sản phẩm "${product.name}" có kết quả Thẩm định là [NO_GO]. Hệ thống khuyến nghị dừng sản phẩm hoặc cần xác nhận ghi đè rủi ro (Override) để tiếp tục.`,
    );
  }

  const runId =
    options.runId ??
    `wf_run_03_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const startedAt = options.startedAt ?? new Date().toISOString();
  const workflowEvents: WorkflowEvent[] = [];

  const emit = (type: WorkflowEvent["type"], message: string, data?: any) => {
    const event: WorkflowEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      stage: "03_COMPETITOR_RESEARCH",
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
    `🚀 Khởi động Stage 03: Phân tích đối thủ cạnh tranh cho "${product.name}"...`,
  );

  emit(
    "search",
    "Đang đề xuất đối thủ để nghiên cứu; chưa kết nối crawler hoặc Ad Library.",
  );
  await new Promise((r) => setTimeout(r, 600));

  emit(
    "info",
    "Tên đối thủ, giá, theme và apps do AI đề xuất chưa được xác minh.",
  );

  emit(
    "ai_analyze",
    `🤖 AI Worker (Claude/Gemini) đang trích xuất giá bán, thời gian ship, cấu trúc offer và điểm yếu đối thủ...`,
  );

  const cleanName = product.name.replace(/[™®©]/g, "").split("(")[0].trim();
  const cleanCategory = product.category.split("&")[0].trim();

  const prompt = `
Bạn là chuyên gia phân tích chiến lược cạnh tranh E-commerce và chuyên gia tình báo Shopify (Shopify Intelligence).
Hãy phân tích 3 đối thủ cạnh tranh thực tế hàng đầu trên thị trường cho sản phẩm: "${product.name}" (${product.category}, giá bán đề xuất: $${product.selling_price}).

QUY TẮC BẮT BUỘC VỀ NỀN TẢNG (CRITICAL):
- TẤT CẢ 3 ĐỐI THỦ PHẢI LÀ CỬA HÀNG ĐANG CHẠY SHOPIFY (Shopify DTC Brands / Independent Stores).
- TUYỆT ĐỐI KHÔNG chọn các thương hiệu dược phẩm/bán lẻ offline/Amazon (như Boiron Camilia hay Walmart).
- TUYỆT ĐỐI KHÔNG chọn website WordPress/WooCommerce (như Punkin Butt) hay Magento.
- Không bịa domain, theme, apps hay bằng chứng xác minh. Nếu chưa biết URL, dùng link Google Search và ghi rõ đây là gợi ý nghiên cứu.
- Không có dữ liệu crawl được cung cấp: shopify_detected phải là false; không khẳng định đã phát hiện nền tảng.

Trả về JSON cấu trúc:
{
  "competitors": [
    {
      "name": "Tên Store Đối Thủ 1",
      "url": "https://...",
      "platform": "Shopify DTC",
      "shopify_detected": true,
      "shopify_theme": "Dawn (Customized)",
      "shopify_apps": ["Loox Photo Reviews", "Klaviyo", "Rebuy Upsell"],
      "bestseller_item": "Tên sản phẩm bán chạy nhất của họ",
      "selling_price": 29.99,
      "shipping_days": "5-9 ngày",
      "rating": 4.3,
      "offer_type": "Bán lẻ 1 chiếc tiêu chuẩn",
      "hook_score": 84,
      "weakness": "Điểm yếu lớn nhất về offer, phí ship, bao bì hoặc dịch vụ"
    },
    {
      "name": "Tên Store Đối Thủ 2",
      "url": "https://...",
      "platform": "Shopify DTC",
      "shopify_detected": true,
      "shopify_theme": "Prestige / Broadcast",
      "shopify_apps": ["Judge.me Reviews", "Videeo Mobile", "Klaviyo"],
      "bestseller_item": "Tên sản phẩm bán chạy",
      "selling_price": 24.00,
      "shipping_days": "6-10 ngày",
      "rating": 4.4,
      "offer_type": "Mua 2 Giảm 15%",
      "hook_score": 78,
      "weakness": "Điểm yếu đối thủ"
    },
    {
      "name": "Tên Store Đối Thủ 3",
      "url": "https://...",
      "platform": "Shopify DTC",
      "shopify_detected": true,
      "shopify_theme": "Impulse Theme",
      "shopify_apps": ["Loox Reviews", "Recharge Subscriptions", "Privy Email Capture"],
      "bestseller_item": "Tên sản phẩm",
      "selling_price": 19.99,
      "shipping_days": "7-12 ngày",
      "rating": 4.5,
      "offer_type": "Combo tiết kiệm",
      "hook_score": 74,
      "weakness": "Điểm yếu đối thủ"
    }
  ],
  "outpositioning_strategy": "Chiến lược cụ thể giúp sản phẩm của chúng ta vượt trội hơn hẳn đối thủ",
  "price_opportunity": "Cơ hội định giá tốt nhất (ví dụ: giá thấp hơn $5 nhưng upsell bundle)",
  "gap_identified": "Khoảng trống thị trường mà các đối thủ đang bỏ quên"
}
`;

  let competitorData: CompetitorAnalysis;
  let dataQuality: "mock" | "unverified" = "unverified";
  try {
    const aiRes = await aiRouter.run({
      task: "competitor_analysis",
      agentName: "Shopify Intelligence & Competitor Analyst",
      prompt,
      systemPrompt:
        "Bạn là chuyên gia tình báo Shopify và chiến lược E-commerce. BẮT BUỘC tất cả đối thủ phải là cửa hàng SHOPIFY DTC THỰC TẾ (100% Shopify). Trả lời định dạng JSON hợp lệ.",
      jsonMode: true,
      workflowRunId: runId,
    });
    dataQuality = aiRes.provider === "mock" ? "mock" : "unverified";

    if (
      aiRes.data &&
      Array.isArray(aiRes.data.competitors) &&
      aiRes.data.competitors.length > 0
    ) {
      competitorData = aiRes.data;
    } else {
      throw new Error("Incomplete JSON");
    }
  } catch (err: unknown) {
    dataQuality = "mock";
    emit(
      "info",
      `  ↳ ⚠️ AI API gặp sự cố (${errorMessage(err, "timeout")}). Khởi tạo bộ đối thủ chuẩn hóa động theo ngành hàng.`,
    );

    // Dynamic fallback generation based on product name & category (NOT hardcoded to teething oil)
    const pPrice = product.selling_price || 24.99;
    const comp1Price = Number((pPrice * 1.15).toFixed(2));
    const comp2Price = Number((pPrice * 0.9).toFixed(2));
    const comp3Price = Number((pPrice * 1.25).toFixed(2));

    competitorData = {
      competitors: [
        {
          name: `${cleanName} Direct Official`,
          url: `https://www.google.com/search?q=site:myshopify.com+${encodeURIComponent(cleanName)}`,
          platform: "Shopify DTC",
          shopify_detected: true,
          shopify_theme: "Dawn (Customized High-Converting)",
          shopify_apps: ["Loox Photo Reviews", "Klaviyo Email", "Rebuy Upsell"],
          bestseller_item: `${cleanName} Standard Unit`,
          selling_price: comp1Price,
          shipping_days: "5-9 ngày",
          rating: 4.3,
          offer_type: "Single Unit + Fake Countdown Timer",
          hook_score: 82,
          weakness:
            "Giá bán đơn lẻ đắt, tính thêm phí vận chuyển, dùng đồng hồ đếm ngược giả làm giảm uy tín, không có combo bundle tặng kèm phụ kiện.",
          ad_library_url: `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=${encodeURIComponent(cleanName)}`,
          tiktok_url: `https://www.tiktok.com/search?q=${encodeURIComponent(cleanName)}`,
        },
        {
          name: `${cleanCategory} Studio Brand`,
          url: `https://www.google.com/search?q=site:myshopify.com+${encodeURIComponent(cleanCategory)}`,
          platform: "Shopify DTC",
          shopify_detected: true,
          shopify_theme: "Prestige / Broadcast (Shopify 2.0)",
          shopify_apps: [
            "Judge.me Reviews",
            "Videeo Mobile Commerce",
            "Klaviyo",
          ],
          bestseller_item: `${cleanCategory} Essential Edition`,
          selling_price: comp2Price,
          shipping_days: "6-10 ngày",
          rating: 4.5,
          offer_type: "Mua 2 Giảm 15%",
          hook_score: 76,
          weakness:
            "Bao bì đơn sắc đại trà, thời gian đóng gói và giao hàng 6-10 ngày khá chậm, video ads thiếu hook giật gân.",
          ad_library_url: `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=${encodeURIComponent(cleanCategory)}`,
          tiktok_url: `https://www.tiktok.com/search?q=${encodeURIComponent(cleanCategory)}`,
        },
        {
          name: `${cleanName} Express Store`,
          url: `https://www.google.com/search?q=site:myshopify.com+${encodeURIComponent(cleanName)}+dropship`,
          platform: "Shopify DTC",
          shopify_detected: true,
          shopify_theme: "Impulse / Custom Shopify Theme",
          shopify_apps: [
            "Loox Reviews",
            "Recharge Subscriptions",
            "Privy Email Capture",
          ],
          bestseller_item: `${cleanName} Deluxe Pack`,
          selling_price: comp3Price,
          shipping_days: "5-8 ngày",
          rating: 4.6,
          offer_type: "Chai đơn hoặc Gói quà tặng",
          hook_score: 74,
          weakness:
            "Không có phụ kiện silicone/bảo quản đi kèm, không có chính sách cam kết hoàn tiền không rủi ro.",
          ad_library_url: `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=${encodeURIComponent(cleanName)}`,
          tiktok_url: `https://www.tiktok.com/search?q=${encodeURIComponent(cleanName)}`,
        },
      ],
      outpositioning_strategy: `Định vị "${product.name}" bằng giải pháp kép toàn diện: Vượt trội hơn đối thủ về độ an toàn vật liệu, bổ sung quà tặng phụ kiện độc quyền và cam kết hoàn tiền 100% không rủi ro.`,
      price_opportunity: `Định giá $${product.selling_price} kèm gói ưu đãi Mua 1 Tặng 1 Giảm 50% (BOGO 50%) = $${(product.selling_price * 1.5).toFixed(2)} đạt AOV cao và Miễn phí vận chuyển.`,
      gap_identified: `Các đối thủ trên thị trường chỉ bán sản phẩm đơn điệu, thiếu combo phụ kiện đi kèm và không giải quyết trọn vẹn cả nhu cầu tức thời lẫn lâu dài của người dùng.`,
    };
  }

  // Validate before any string operations or persistence. AI output is not platform detection.
  competitorData = competitorSchema.parse(competitorData);
  competitorData.data_quality = dataQuality;
  competitorData.requires_review = true;
  competitorData.competitors = competitorData.competitors.map((c) => {
    const cCleanName = c.name.replace(/[™®©]/g, "").trim();
    return {
      ...c,
      platform: "Chưa xác minh",
      shopify_detected: false,
      shopify_theme: undefined,
      shopify_apps: [],
      bestseller_item: undefined,
      bestseller_url: undefined,
      products_json_url: undefined,
      ad_library_url:
        c.ad_library_url ||
        `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=${encodeURIComponent(cCleanName)}`,
      tiktok_url:
        c.tiktok_url ||
        `https://www.tiktok.com/search?q=${encodeURIComponent(cCleanName)}`,
    };
  });

  // Persist transactionally so a concurrent stage run cannot clobber this write
  const saved = commitStage(
    product,
    "03",
    (p) => {
      p.competitor_analysis = competitorData;
      p.pipeline_stage = "03_COMPETITOR";
    },
    options.allowNoGoOverride,
  );

  // Save workflow run record for persistence
  ecomStore.saveWorkflowRun({
    id: runId,
    workflow: "03_COMPETITOR_RESEARCH",
    niche: product.niche,
    status: "completed",
    progress: 100,
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    logs: workflowEvents,
    discovered_count: competitorData.competitors.length,
  });

  emit(
    "score",
    `🏆 Đã xây dựng xong Bảng Ma Trận So Sánh Đối Thủ & Chiến Lược Vượt Trội.`,
    {
      competitorAnalysis: competitorData,
    },
  );

  emit(
    "done",
    `🎉 Hoàn thành Stage 03! Sẵn sàng thẩm định nhà cung cấp ở Stage 04.`,
  );

  return { product: saved, competitorAnalysis: competitorData };
}
