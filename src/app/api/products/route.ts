import { NextRequest, NextResponse } from 'next/server';
import { ecomStore, Product } from '@/lib/db/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const niche = searchParams.get('niche') || undefined;
  const status = searchParams.get('status') || undefined;
  const minScoreStr = searchParams.get('minScore');
  const minScore = minScoreStr ? Number(minScoreStr) : undefined;
  const q = searchParams.get('q')?.toLowerCase() || '';

  let products = ecomStore.getProducts({ niche, status, minScore });

  if (q) {
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.niche.toLowerCase().includes(q) ||
        p.wow_factor.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({
    success: true,
    total: products.length,
    products,
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Thiếu id hoặc status' },
        { status: 400 }
      );
    }

    const updated = ecomStore.updateProductStatus(id, status as Product['status']);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy sản phẩm' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: updated,
      message:
        status === 'approved_for_validation'
          ? 'Đã duyệt sản phẩm và mở khóa Stage 02: Product Validation!'
          : `Đã cập nhật trạng thái sang "${status}"`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
