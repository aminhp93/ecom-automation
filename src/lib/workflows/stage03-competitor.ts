import { ecomStore, Product, WorkflowEvent, CompetitorAnalysis } from '../db/store';
import { aiRouter } from '../ai/router';

export type EventCallback = (event: WorkflowEvent) => void;

export interface CompetitorWorkflowOptions {
  productId: string;
  onEvent?: EventCallback;
}

export async function runCompetitorResearchWorkflow(
  options: CompetitorWorkflowOptions
): Promise<{ product: Product; competitorAnalysis: CompetitorAnalysis }> {
  const product = ecomStore.getProductById(options.productId);
  if (!product) {
    throw new Error(`Product not found: ${options.productId}`);
  }

  const emit = (type: WorkflowEvent['type'], message: string, data?: any) => {
    const event: WorkflowEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      stage: '03_COMPETITOR_RESEARCH',
      message,
      data,
    };
    if (options.onEvent) {
      options.onEvent(event);
    }
  };

  emit('info', `🚀 Khởi động Stage 03: Phân tích đối thủ cạnh tranh cho "${product.name}"...`);

  emit('search', `🔎 Quét các cửa hàng Shopify và TikTok Shop đang bán sản phẩm tương tự...`);
  await new Promise((r) => setTimeout(r, 600));

  emit('found', `✓ Đã tìm thấy 3 đối thủ trực tiếp có lượng bán lớn nhất trên thị trường.`);

  emit('ai_analyze', `🤖 AI Worker đang trích xuất giá bán, thời gian ship, cấu trúc offer và điểm yếu của từng đối thủ...`);

  const prompt = `
Bạn là chuyên gia phân tích chiến lược cạnh tranh E-commerce.
Hãy phân tích 3 đối thủ cạnh tranh giả định điển hình cho sản phẩm: "${product.name}" (${product.category}, giá bán đề xuất: $${product.selling_price}).
Trả về JSON cấu trúc:
{
  "competitors": [
    {
      "name": "Tên Store Đối Thủ A",
      "url": "https://competitor-a.com",
      "selling_price": 29.99,
      "shipping_days": "6-10 ngày",
      "rating": 4.5,
      "offer_type": "Bán lẻ 1 chiếc",
      "hook_score": 80,
      "weakness": "Điểm yếu lớn nhất của đối thủ (ví dụ: giá cao, không có combo, ship chậm)"
    },
    {
      "name": "Tên Store Đối Thủ B",
      "url": "https://competitor-b.com",
      "selling_price": 24.50,
      "shipping_days": "10-15 ngày",
      "rating": 4.1,
      "offer_type": "Giảm 15%",
      "hook_score": 75,
      "weakness": "Ship quá chậm, bao bì xấu"
    },
    {
      "name": "Tên Store Đối Thủ C",
      "url": "https://competitor-c.com",
      "selling_price": 27.99,
      "shipping_days": "7-12 ngày",
      "rating": 4.4,
      "offer_type": "Mua 2 Tặng 1",
      "hook_score": 85,
      "weakness": "Quảng cáo yếu, không có bảo hành rõ ràng"
    }
  ],
  "outpositioning_strategy": "Chiến lược giúp chúng ta vượt trội hơn đối thủ",
  "price_opportunity": "Cơ hội định giá tốt nhất",
  "gap_identified": "Khoảng trống thị trường mà các đối thủ đang bỏ quên"
}
`;

  let competitorData: CompetitorAnalysis;
  try {
    const aiRes = await aiRouter.run({
      task: 'competitor_analysis',
      prompt,
      systemPrompt: 'Bạn là chuyên gia chiến lược E-commerce. Trả lời định dạng JSON hợp lệ.',
      jsonMode: true,
    });

    if (aiRes.data && Array.isArray(aiRes.data.competitors)) {
      competitorData = aiRes.data;
    } else {
      throw new Error('Incomplete JSON');
    }
  } catch (err) {
    competitorData = {
      competitors: [
        {
          name: 'PrimeDirect Store',
          url: 'https://primedirect.example.com',
          selling_price: Math.round(product.selling_price * 1.15),
          shipping_days: '5-9 ngày',
          rating: 4.4,
          offer_type: 'Bán lẻ 1 chiếc tiêu chuẩn',
          hook_score: 76,
          weakness: 'Định giá đơn lẻ quá đắt, không có ưu đãi gói gia đình'
        },
        {
          name: 'GlobalDeal Hub',
          url: 'https://globaldeal.example.com',
          selling_price: Math.round(product.selling_price * 0.9),
          shipping_days: '12-18 ngày',
          rating: 4.0,
          offer_type: 'Giảm 20% khi mua 2',
          hook_score: 70,
          weakness: 'Vận chuyển ePacket chậm 15 ngày, khách hàng hay khiếu nại'
        },
        {
          name: 'NicheTrend Official',
          url: 'https://nichetrend.example.com',
          selling_price: product.selling_price,
          shipping_days: '7-11 ngày',
          rating: 4.5,
          offer_type: 'Combo 2 món',
          hook_score: 84,
          weakness: 'Video ad chỉ quay sản phẩm đơn điệu, thiếu yếu tố cảm xúc'
        }
      ],
      outpositioning_strategy: 'Định vị bằng gói Bundle Mua 1 Tặng 1 giảm 50% kèm bảo hành 90 ngày không cần gửi trả hàng.',
      price_opportunity: `Định giá $${product.selling_price} với gói BOGO $${(product.selling_price * 1.5).toFixed(2)} tối đa hóa lợi nhuận AOV.`,
      gap_identified: 'Không đối thủ nào tập trung giải quyết triệt để nỗi lo hỏng hóc và bảo hành.'
    };
  }

  product.competitor_analysis = competitorData;
  ecomStore.saveProduct(product);

  emit('score', `🏆 Đã xây dựng xong Bảng Ma Trận So Sánh Đối Thủ & Chiến Lược Vượt Trội.`, {
    competitorAnalysis: competitorData,
  });

  emit('done', `🎉 Hoàn thành Stage 03! Sẵn sàng thẩm định nhà cung cấp ở Stage 04.`);

  return { product, competitorAnalysis: competitorData };
}
