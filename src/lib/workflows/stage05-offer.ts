import { ecomStore, Product, WorkflowEvent, OfferPackage } from '../db/store';
import { aiRouter } from '../ai/router';

export type EventCallback = (event: WorkflowEvent) => void;

export interface OfferWorkflowOptions {
  productId: string;
  onEvent?: EventCallback;
}

export async function runOfferCreationWorkflow(
  options: OfferWorkflowOptions
): Promise<{ product: Product; offerPackage: OfferPackage }> {
  const product = ecomStore.getProductById(options.productId);
  if (!product) {
    throw new Error(`Product not found: ${options.productId}`);
  }

  const emit = (type: WorkflowEvent['type'], message: string, data?: any) => {
    const event: WorkflowEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      stage: '05_OFFER_CREATION',
      message,
      data,
    };
    if (options.onEvent) {
      options.onEvent(event);
    }
  };

  emit('info', `🚀 Kích hoạt Stage 05: Thiết kế Grand Slam Offer cho "${product.name}"...`);

  emit('ai_analyze', `🤖 Định tuyến tới Claude Sonnet 4.5 để xây dựng định vị USP và cấu trúc 3 gói Offer tối đa hóa AOV...`);

  const pPrice = product.selling_price;
  const tierAPrice = pPrice;
  const tierBPrice = Number((pPrice * 1.5).toFixed(2)); // Buy 1 Get 1 50% OFF
  const tierCPrice = Number((pPrice * 2.2).toFixed(2)); // Buy 2 Get 1 Free or Deluxe

  const prompt = `
Bạn là Alex Hormozi và David Ogilvy kết hợp trong E-commerce.
Hãy thiết kế 1 "Grand Slam Offer" không thể chối từ cho sản phẩm sau:
Tên: "${product.name}"
Ngành hàng: ${product.category}
Nỗi đau: ${JSON.stringify(product.pain_points)}
Wow factor: "${product.wow_factor}"
Giá cơ bản: $${product.selling_price}

Yêu cầu trả về định dạng JSON:
{
  "positioning_statement": "Câu định vị USP ngắn gọn, sắc bén, độc nhất",
  "target_desire": "Khao khát sâu kín nhất của khách hàng",
  "packages": [
    {
      "tier": "A",
      "name": "Starter Pack (1 Món)",
      "badge": "TIÊU CHUẨN",
      "price": ${tierAPrice},
      "value": ${Number((tierAPrice * 1.6).toFixed(2))},
      "savings": "Tiết kiệm 25%",
      "description": "Mô tả ngắn gọn cho gói dùng thử",
      "items": ["1x Sản phẩm chính", "1x Phụ kiện bảo vệ"]
    },
    {
      "tier": "B",
      "name": "Combo Phổ Biến Nhất (Mua 1 Tặng 1 Giảm 50%)",
      "badge": "MOST POPULAR",
      "price": ${tierBPrice},
      "value": ${Number((tierAPrice * 2).toFixed(2))},
      "savings": "TIẾT KIỆM NHIỀU NHẤT",
      "description": "Lợi ích khi có 2 chiếc (1 chiếc dùng, 1 chiếc sơ cua/chia sẻ)",
      "items": ["2x Sản phẩm chính", "2x Phụ kiện", "Miễn phí vận chuyển hỏa tốc"]
    },
    {
      "tier": "C",
      "name": "Gói Gia Đình / Deluxe VIP",
      "badge": "GIÁ TRỊ TỐT NHẤT",
      "price": ${tierCPrice},
      "value": ${Number((tierAPrice * 3.2).toFixed(2))},
      "savings": "TIẾT KIỆM 45%",
      "description": "Bộ sản phẩm toàn diện nhất",
      "items": ["3x Sản phẩm chính", "Bộ quà tặng độc quyền", "Bảo hành trọn đời"]
    }
  ],
  "risk_reversal_guarantee": "Cam kết bảo hành đảo ngược rủi ro cực mạnh (ví dụ 60-90 ngày hoàn tiền 100% nếu không hài lòng)",
  "urgency_hook": "Lý do khan hiếm và cấp bách để mua ngay hôm nay"
}
`;

  let offerData: OfferPackage;
  try {
    const aiRes = await aiRouter.run({
      task: 'strategic_reasoning',
      prompt,
      systemPrompt: 'Bạn là chuyên gia chiến lược E-commerce hàng đầu. Luôn trả lời JSON hợp lệ.',
      jsonMode: true,
    });

    if (aiRes.data && Array.isArray(aiRes.data.packages)) {
      offerData = aiRes.data;
      emit(
        'info',
        `  ↳ Xử lý bởi ${aiRes.provider.toUpperCase()} (${aiRes.model}) | Phản hồi trong ${aiRes.latencyMs}ms`
      );
    } else {
      throw new Error('Incomplete JSON');
    }
  } catch (err) {
    offerData = {
      positioning_statement: `Giải pháp số 1 đánh bại mọi lo âu về ${product.name}, giúp bạn tiết kiệm thời gian và tận hưởng cuộc sống.`,
      target_desire: 'Giải quyết triệt để vấn đề chỉ trong vài phút mà không cần tốn kém chi phí lớn.',
      packages: [
        {
          tier: 'A',
          name: 'Starter Pack (1 Chiếc)',
          badge: 'TIÊU CHUẨN',
          price: tierAPrice,
          value: Number((tierAPrice * 1.5).toFixed(2)),
          savings: 'Giá cơ bản',
          description: 'Gói trải nghiệm cho cá nhân',
          items: ['1x Sản phẩm chính hãng', '1x Túi bảo quản vệ sinh']
        },
        {
          tier: 'B',
          name: 'Gói Phổ Biến Nhất (Mua 1 Tặng 1 Giảm 50%)',
          badge: 'MOST POPULAR',
          price: tierBPrice,
          value: Number((tierAPrice * 2).toFixed(2)),
          savings: 'TIẾT KIỆM $15',
          description: 'Gói được 84% khách hàng lựa chọn để có 1 chiếc dự phòng hoặc tặng người thân.',
          items: ['2x Sản phẩm chính', '2x Túi bảo quản', 'Miễn phí Express Shipping']
        },
        {
          tier: 'C',
          name: 'Bộ Gia Đình Deluxe VIP',
          badge: 'BEST VALUE',
          price: tierCPrice,
          value: Number((tierAPrice * 3.2).toFixed(2)),
          savings: 'TIẾT KIỆM 40%',
          description: 'Gói toàn diện nhất bảo vệ bạn và gia đình.',
          items: ['3x Sản phẩm', 'Bộ quà tặng phụ kiện cao cấp', 'Bảo hành 1 đổi 1 trong 12 tháng']
        }
      ],
      risk_reversal_guarantee: 'Bảo hành 60 ngày "Dùng thử không rủi ro": Hoàn tiền 100% nếu không thấy hài lòng.',
      urgency_hook: 'Số lượng đợt hàng ưu đãi đầu tiên có hạn — Chỉ còn 35 suất giá gốc hôm nay.'
    };
  }

  product.offer_package = offerData;
  ecomStore.saveProduct(product);

  emit('score', `🏆 Đã tạo xong 3 Gói Offer Tối Ưu Hóa AOV & Cam Kết Bảo Hành Rủi Ro.`, {
    offerPackage: offerData,
  });

  emit('done', `🎉 Hoàn thành Stage 05! Sẵn sàng tạo Kịch bản Video Ads & Nội dung Shopify ở Stage 06/07.`);

  return { product, offerPackage: offerData };
}
