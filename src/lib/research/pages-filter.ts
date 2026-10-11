import type { MetaPageRef, PipelineRow } from '@/lib/research/db';
import { pageLine } from '@/lib/research/metaPages';

/** Bỏ page sàn/brand quá lớn (advertisers.kind = 'marketplace') khỏi cột Meta pages. Gọi trước attachSocial/attachLocal để social và local cũng không liệt kê chúng.
 *  Chỉ ẩn ở hiển thị: các cột đếm tổng ad (Meta Ads AU/US, mọi nước) vẫn tính cả sàn vì lấy từ số đếm keyword. */
// Cột "advertiser nổi bật" (dạng chữ "Tên(số ad); ...") không có page_id nên lọc theo tên sàn.
const MARKETPLACE_NAME = /^(temu|shoptemu|shopee|amazon|aliexpress|alibaba|shein|tiktok ?shop|flipkart)/i;
const TOP_COLS = ['meta_au_top', 'meta_au_top2', 'meta_us_top', 'meta_us_top2'];
const stripTop = (v: unknown) => {
  if (typeof v !== 'string' || !v) return v;
  return v.split('; ').filter((e) => !MARKETPLACE_NAME.test(e.trim())).join('; ') || null;
};

export function dropMarketplacePages(rows: PipelineRow[], excluded: Set<string>): PipelineRow[] {
  return rows.map((r0) => {
    let r = r0;
    for (const c of TOP_COLS) {
      if (typeof r[c] === 'string') { const v = stripTop(r[c]); if (v !== r[c]) r = { ...r, [c]: v as string | null }; }
    }
    const pages = r.meta_pages_json as MetaPageRef[] | null | undefined;
    if (!pages?.length) return r;
    const kept = pages.filter((p) => !excluded.has(p.id));
    if (kept.length === pages.length) return r;
    return { ...r, meta_pages_json: kept.length ? kept : null, meta_pages: kept.length ? kept.map(pageLine).join('\n') : null };
  });
}
