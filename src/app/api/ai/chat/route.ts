import { NextRequest, NextResponse } from 'next/server';
import { aiRouter } from '@/lib/ai/router';
import { ecomStore } from '@/lib/db/store';
import { errorMessage } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const currentProducts = ecomStore.getProducts();
    const systemPrompt = `
Bạn là AI Copilot phân tích kinh doanh trong Ecom AI Operating System.
Dưới đây là danh sách ${currentProducts.length} sản phẩm hiện có trong cơ sở dữ liệu:
${JSON.stringify(
  currentProducts.map((p) => ({
    name: p.name,
    niche: p.niche,
    source: p.source,
    selling_price: p.selling_price,
    supplier_price: p.supplier_price,
    margin: p.gross_margin,
    margin_percent: p.margin_percentage,
    score: p.product_score,
    recommendation: p.recommendation,
    wow_factor: p.wow_factor,
    status: p.status,
  }))
)}

Hãy trả lời ngắn gọn, sắc bén, mang tính tư vấn chiến lược dropshipping thực chiến (theo đúng câu hỏi của người dùng). Nếu họ yêu cầu lọc hoặc gợi ý sản phẩm cụ thể, chỉ ra rõ tên sản phẩm và lý do định lượng.
`;

    const response = await aiRouter.run({
      task: 'general_chat',
      prompt: message,
      systemPrompt,
      temperature: 0.5,
    });

    return NextResponse.json({
      success: true,
      reply: response.content,
      provider: response.provider,
      model: response.model,
      costUsd: response.costUsd,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: errorMessage(err, 'Chat error') },
      { status: 500 }
    );
  }
}
