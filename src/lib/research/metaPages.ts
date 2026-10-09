import type { MetaPageRef } from '@/lib/research/db';

// Page đã quét riêng: "tên: ad đang chạy/tổng - năm tạo". Page chỉ thấy trong mẫu quét keyword: "tên: n ad trong mẫu" (hoặc chỉ tên).
// Đuôi " ✓" = đã đọc ad/website và xác nhận đúng sản phẩm (matches_product = yes); không dấu = chưa xác minh. Page đã xác nhận KHÔNG đúng sản phẩm bị ẩn ở view.
export const pageLine = (p: MetaPageRef) =>
  (p.a == null && p.t == null ? `${p.n}${p.s != null ? `: ${p.s} ad trong mẫu` : ''}` : `${p.n}: ${p.a ?? '?'}/${p.t ?? '?'}${p.y ? ` - ${p.y}` : ''}`) + (p.m === 'yes' ? ' ✓' : '');

/** Tỷ lệ ad đang chạy / tổng ad của page; null nếu page chưa quét riêng (không có số). */
export const pageRatio = (p: MetaPageRef): number | null => (p.a != null && p.t ? p.a / p.t : null);

export const PAGE_RATIO_BAD_BELOW = 0.3; // < 30%: đỏ (phần lớn ad đã tắt)
export const PAGE_RATIO_GOOD_ABOVE = 0.8; // > 80%: xanh (hầu hết ad còn chạy)

/** Màu cột Meta pages: mặc định đen; đỏ nếu active/tổng < 30%; xanh nếu > 80%. */
export function pageTone(p: MetaPageRef): 'good' | 'bad' | null {
  const r = pageRatio(p);
  if (r == null) return null;
  return r < PAGE_RATIO_BAD_BELOW ? 'bad' : r > PAGE_RATIO_GOOD_ABOVE ? 'good' : null;
}

export const PAGE_TONE_CLASS = { good: 'text-emerald-700 font-medium', bad: 'text-red-600 font-medium', none: 'text-zinc-900' } as const;
export const PAGE_TONE_ARGB = { good: 'FF15803D', bad: 'FFDC2626', none: 'FF18181B' } as const;
