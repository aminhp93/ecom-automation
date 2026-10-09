import type { LocalRef, MetaPageRef, PipelineRow } from '@/lib/research/db';

/** Bản đồ page_id → kết quả kiểm mô hình kinh doanh mới nhất (advertiser_business_checks). */
export type LocalMap = Map<string, Omit<LocalRef, 'id' | 'n'>>;

/** Nhãn mô hình (cùng bộ giá trị với advertiser_business_checks.model). local = bán từ Úc. */
export const MODEL_LABEL: Record<string, string> = {
  local_manufacturer: 'Local Úc · xưởng riêng',
  local_brand: 'Local Úc · brand',
  local_retailer: 'Local Úc · bán lẻ',
  local_stockist: 'Local Úc · nhà phân phối',
  local_service: 'Local Úc · dịch vụ',
  global_dtc: 'Nước ngoài · DTC',
  dropship: 'Dropship',
  marketplace: 'Sàn (marketplace)',
  advertorial: 'Advertorial',
};
const CONF: Record<string, string> = { cao: 'độ tin cậy cao', trung_binh: 'độ tin cậy vừa', thap: 'độ tin cậy thấp' };

export function localLine(r: LocalRef): string {
  if (!r.model) return `${r.n}: —`;
  return `${r.n}: ${MODEL_LABEL[r.model] ?? r.model}${r.celeb ? ' ★' : ''}`;
}

export const localTitle = (r: LocalRef) =>
  !r.model
    ? 'Chưa kiểm local hay nước ngoài'
    : [
        `${MODEL_LABEL[r.model] ?? r.model}${r.conf ? ` (${CONF[r.conf] ?? r.conf})` : ''}`,
        r.ships ? `Gửi từ: ${r.ships}` : '',
        r.entity ? `Pháp nhân: ${r.entity}` : '',
        r.celeb ? `★ Người nổi tiếng: ${r.celeb}` : '',
        r.on ? `Kiểm ngày ${r.on.slice(8, 10)}/${r.on.slice(5, 7)}` : '',
      ].filter(Boolean).join('\n');

/** Gắn vào từng dòng: local_json (để web vẽ) và local_brand_check (chữ, cho Excel), cùng thứ tự với cột Meta pages. */
export function attachLocal(rows: PipelineRow[], map: LocalMap): PipelineRow[] {
  return rows.map((r) => {
    const pages = (r.meta_pages_json as MetaPageRef[] | null | undefined) ?? [];
    const refs: LocalRef[] = pages.map((p) => ({ id: p.id, n: p.n, ...(map.get(p.id) ?? {}) }));
    const any = refs.some((x) => x.model);
    return { ...r, local_json: any ? refs : null, local_brand_check: any ? refs.map(localLine).join('\n') : null };
  });
}
