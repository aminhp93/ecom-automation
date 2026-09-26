// Nhãn + định dạng dùng chung cho Market Research (an toàn cho cả client & server).
import type { Decision } from './db';

export const DECISION_LABEL: Record<Decision, string> = {
  chon_chinh: 'Chọn – SP chính',
  chon_phu: 'Chọn – SP phụ',
  du_phong: 'Chọn – dự phòng',
  khong_chon: 'Không chọn',
};

export const DECISION_CLASS: Record<Decision, string> = {
  chon_chinh: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  chon_phu: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  du_phong: 'bg-sky-50 text-sky-700 border-sky-200',
  khong_chon: 'bg-rose-50 text-rose-700 border-rose-200',
};

// 7 bước của quy trình nghiên cứu (Confluence: 1. Nghiên cứu thị trường)
export const STAGES: { key: string; label: string; hint: string }[] = [
  { key: 'idea', label: '0. Ý tưởng', hint: 'Mới ghi nhận, chưa có số liệu' },
  { key: 'raw', label: '1. Dữ liệu thô', hint: 'Đã kéo Amazon/Trends/TikTok/Meta' },
  { key: 'verified', label: '2. Đã kiểm tra', hint: 'Đã soát số liệu, gắn độ tin cậy' },
  { key: 'filtered_out', label: '3. Loại ở lọc cứng', hint: 'Rớt tiêu chí lọc cứng' },
  { key: 'scored', label: '4. Đã chấm điểm', hint: 'Có điểm theo bộ tiêu chí hiện hành' },
  { key: 'deep_dive', label: '5. Phân tích sâu', hint: 'Đang lấy báo giá, xem ad đối thủ' },
  { key: 'decided', label: '6. Đã quyết định', hint: 'Có quyết định + lý do' },
  { key: 'monitoring', label: '7. Theo dõi', hint: 'Chụp số liệu định kỳ' },
];
export const STAGE_LABEL = Object.fromEntries(STAGES.map((s) => [s.key, s.label]));

export const ADVERTISER_KIND: Record<string, string> = {
  brand: 'Brand',
  advertorial: 'Trang review/advertorial',
  retailer: 'Chuỗi bán lẻ',
  marketplace: 'Sàn (Temu…)',
  local_service: 'Dịch vụ địa phương',
  other: 'Khác',
  unknown: 'Chưa rõ',
};

const nf = new Intl.NumberFormat('en-US');
export const fmtNum = (v: number | null | undefined) => (v === null || v === undefined ? '—' : nf.format(Number(v)));
export const fmtPct = (v: number | null | undefined, digits = 1) =>
  v === null || v === undefined ? '—' : `${(Number(v) * 100).toFixed(digits)}%`;
export const fmtMoney = (v: number | null | undefined, prefix = '$') =>
  v === null || v === undefined ? '—' : `${prefix}${Number(v).toFixed(2)}`;
export const fmtScore = (v: number | null | undefined) => (v === null || v === undefined ? '—' : Number(v).toFixed(1));

export const scoreClass = (v: number | null | undefined) =>
  v === null || v === undefined
    ? 'text-zinc-400'
    : v >= 75
      ? 'text-emerald-700'
      : v >= 60
        ? 'text-amber-700'
        : 'text-rose-700';

export const PRICE_PREFIX: Record<string, string> = { US: '$', AU: 'A$', UK: '£' };
