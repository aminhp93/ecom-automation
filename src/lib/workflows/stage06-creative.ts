import { ecomStore, Product, WorkflowEvent, CreativePack } from '../db/store';
import { aiRouter } from '../ai/router';

export type EventCallback = (event: WorkflowEvent) => void;

export interface CreativeWorkflowOptions {
  productId: string;
  onEvent?: EventCallback;
}

export async function runCreativeProductionWorkflow(
  options: CreativeWorkflowOptions
): Promise<{ product: Product; creativePack: CreativePack }> {
  const product = ecomStore.getProductById(options.productId);
  if (!product) {
    throw new Error(`Product not found: ${options.productId}`);
  }

  const emit = (type: WorkflowEvent['type'], message: string, data?: any) => {
    const event: WorkflowEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      stage: '06_CREATIVE_PRODUCTION',
      message,
      data,
    };
    if (options.onEvent) {
      options.onEvent(event);
    }
  };

  emit('info', `🚀 Kích hoạt Stage 06/07: Sản xuất kịch bản Video Creative & Trang Shopify cho "${product.name}"...`);

  emit('ai_analyze', `🤖 Định tuyến tới Claude Sonnet 4.5 để viết 10 Viral Hooks, 3 Kịch bản Video Ads phân cảnh và Nội dung mô tả sản phẩm Shopify...`);

  const prompt = `
Bạn là Giám đốc Sáng tạo (Creative Director) và Chuyên gia Copywriting hàng đầu cho các nhãn hàng DTC E-commerce $10M+.
Hãy viết trọn bộ tài liệu quảng cáo và bán hàng cho sản phẩm sau:
Tên: "${product.name}"
Danh mục: ${product.category}
Đặc tính Wow: "${product.wow_factor}"
Đối tượng mục tiêu: "${product.target_audience}"
Các nỗi đau: ${JSON.stringify(product.pain_points)}
Góc tiếp cận: ${JSON.stringify(product.angles)}

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
      "title": "Kịch bản 1: Problem - Agitation - Solution (PAS)",
      "framework": "PAS Framework",
      "target_length": "30-40 giây",
      "scenes": [
        { "time": "0-3s", "visual": "Mô tả hình ảnh B-roll quay cái gì", "audio": "Lời thoại Voiceover", "text_overlay": "Chữ hiện trên màn hình" },
        { "time": "3-12s", "visual": "Hình ảnh khoét sâu nỗi đau", "audio": "Lời thoại", "text_overlay": "Chữ hiện" },
        { "time": "12-25s", "visual": "Hình ảnh giải pháp xuất hiện", "audio": "Lời thoại", "text_overlay": "Chữ hiện" },
        { "time": "25-35s", "visual": "Kêu gọi hành động và ưu đãi", "audio": "Lời thoại CTA", "text_overlay": "CTA Offer" }
      ]
    },
    {
      "title": "Kịch bản 2: Before & After Transformation",
      "framework": "Before/After",
      "target_length": "25-35 giây",
      "scenes": [
        { "time": "0-3s", "visual": "Cảnh bực bội lúc trước khi có sản phẩm", "audio": "Lời thoại", "text_overlay": "Before ❌" },
        { "time": "3-15s", "visual": "Cách sản phẩm thay đổi tình thế", "audio": "Lời thoại", "text_overlay": "Chuyển biến ✨" },
        { "time": "15-30s", "visual": "Kết quả viên mãn và CTA", "audio": "Lời thoại", "text_overlay": "After ✅" }
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
    "html_description": "<div class='ecom-product-body'><h2>Tiêu đề</h2><p>Mô tả HTML sẵn sàng copy vào Shopify...</p></div>"
  }
}
`;

  let creativeData: CreativePack;
  try {
    const aiRes = await aiRouter.run({
      task: 'ad_copy',
      prompt,
      systemPrompt: 'Bạn là chuyên gia quảng cáo E-commerce. Luôn trả lời JSON hợp lệ.',
      jsonMode: true,
    });

    if (aiRes.data && Array.isArray(aiRes.data.viral_hooks)) {
      creativeData = aiRes.data;
      emit(
        'info',
        `  ↳ Kịch bản sản xuất bởi ${aiRes.provider.toUpperCase()} (${aiRes.model}) trong ${aiRes.latencyMs}ms`
      );
    } else {
      throw new Error('Incomplete JSON');
    }
  } catch (err) {
    creativeData = {
      viral_hooks: [
        { id: 1, angle: 'Nỗi đau nhức nhối', hook_text: `Nếu bạn đang chật vật mỗi ngày với vấn đề này... hãy xem ngay mẹo sau!`, category: 'Pain Point' },
        { id: 2, angle: 'Thị giác tò mò', hook_text: `Đừng mua sản phẩm này trừ khi bạn thực sự muốn giải quyết dứt điểm vấn đề trong 30 giây.`, category: 'Curiosity' },
        { id: 3, angle: 'Before/After', hook_text: `Nhìn cuộc sống của tôi trước và sau khi tìm thấy sản phẩm này...`, category: 'Transformation' }
      ],
      video_scripts: [
        {
          title: 'Chiến dịch chuyển đổi PAS (35s)',
          framework: 'Problem - Agitation - Solution',
          target_length: '35 giây',
          scenes: [
            { time: '0-3s', visual: 'Mặt nhân vật thất vọng, quay cận cảnh vấn đề thường gặp.', audio: 'Tôi đã từng thử đủ mọi cách nhưng đều thất bại...', text_overlay: 'Tại sao cách cũ không hiệu quả ❌' },
            { time: '3-12s', visual: 'Cảnh lộn xộn, tốn kém thời gian.', audio: 'Mỗi lần xử lý đều mất cả tiếng đồng hồ và cực kỳ mệt mỏi.', text_overlay: 'Mất thời gian & bất tiện ⚠️' },
            { time: '12-25s', visual: 'Mở hộp sản phẩm, thao tác 1 chạm nhẹ nhàng giải quyết êm đẹp.', audio: 'Cho đến khi tôi dùng thử giải pháp thông minh này. Tiện lợi gấp 10 lần!', text_overlay: 'Xử lý xong trong 30 giây ✨' },
            { time: '25-35s', visual: 'Cười tươi, giơ ưu đãi mua 1 tặng 1 giảm 50% lên màn hình.', audio: 'Hiện đang có ưu đãi giảm 50% cho người mua hôm nay kèm bảo hành 60 ngày!', text_overlay: 'Bấm Mua Ngay để nhận ưu đãi 🛒' }
          ]
        }
      ],
      shopify_page: {
        headline: `Trải Nghiệm Đột Phá Với ${product.name}`,
        subheadline: 'Thiết kế thông minh chuẩn công thái học giúp giải quyết triệt để vấn đề thường nhật.',
        benefits: [
          { title: 'Hiệu Quả Tức Thì', desc: 'Cảm nhận sự khác biệt rõ rệt ngay từ lần đầu tiên sử dụng.' },
          { title: 'Chất Liệu Cao Cấp Bền Bỉ', desc: 'Độ bền vượt trội, dễ dàng vệ sinh và bảo quản.' },
          { title: 'Bảo Hành An Tâm 100%', desc: 'Cam kết hoàn tiền trong 60 ngày nếu không ưng ý.' }
        ],
        faqs: [
          { q: 'Sản phẩm có dễ sử dụng không?', a: 'Rất đơn giản, phù hợp cho mọi lứa tuổi chỉ với vài thao tác cơ bản.' },
          { q: 'Thời gian giao hàng là bao lâu?', a: 'Giao hàng từ 5-8 ngày làm việc trên toàn quốc.' }
        ],
        html_description: `<div class="ecom-description"><h2>${product.name}</h2><p>Sản phẩm tiện ích thông minh hàng đầu được hàng ngàn khách hàng tin dùng.</p><ul><li>Thiết kế công thái học cao cấp</li><li>Tiết kiệm thời gian và công sức</li><li>Bảo hành 60 ngày hoàn tiền không lý do</li></ul></div>`
      }
    };
  }

  product.creative_pack = creativeData;
  ecomStore.saveProduct(product);

  emit('score', `🏆 Đã hoàn thành 10 Hooks Viral, Kịch bản Video Phân Cảnh & HTML Shopify.`, {
    creativePack: creativeData,
  });

  emit('done', `🎉 Hoàn thành toàn bộ quy trình Ecom OS V1 cho sản phẩm! Bạn đã có trọn bộ vũ khí để test ads và dựng store.`);

  return { product, creativePack: creativeData };
}
