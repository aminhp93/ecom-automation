import type { PipelineRow, QuoteRef } from '@/lib/research/db';

const money = (n: number | null) => (n == null ? '?' : n.toFixed(2).replace('.', ','));

/** Một dòng chữ cho Excel: "CJ · 36x60 inch · AU: hàng 48,69 + ship 138,16 = 186,85 USD · giao 4-6 ngày". */
export const quoteLine = (q: QuoteRef) =>
  `${q.supplier} · ${q.size ?? '?'} · ${q.to ?? '?'}: hàng ${money(q.unit)} + ship ${money(q.ship)} = ${money(q.total)} ${q.cur}${q.days ? ` · giao ${q.days} ngày` : ''}`;

/** Gắn báo giá vào từng sản phẩm: quotes_json (để web vẽ) và quotes (chữ, cho Excel). Ứng viên chưa thành sản phẩm không có báo giá. */
export function attachQuotes(rows: PipelineRow[], quotes: Map<string, QuoteRef[]>): PipelineRow[] {
  return rows.map((r) => {
    const q = r.loai_dong === 'san_pham' ? quotes.get(String(r.ref)) : undefined;
    return q?.length ? { ...r, quotes_json: q, quotes: q.map(quoteLine).join('\n') } : r;
  });
}
