// Nhãn + định dạng dùng chung cho Market Research (an toàn cho cả client & server).
import type { Decision, Readiness, ProductOverview } from './db';

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


export const READINESS: { key: Readiness; label: string; hint: string; cls: string }[] = [
  { key: 'san_sang', label: 'Sẵn sàng quyết định', hint: 'Qua lọc cứng + đủ bằng chứng bắt buộc', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'can_xac_minh', label: 'Cần xác minh', hint: 'Còn thiếu bằng chứng bắt buộc hoặc ô an toàn chưa đánh giá', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  { key: 'rot_loc_cung', label: 'Rớt lọc cứng', hint: 'Rớt ít nhất 1 điều kiện lọc cứng', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
];
export const READINESS_LABEL = Object.fromEntries(READINESS.map((r) => [r.key, r.label])) as Record<Readiness, string>;
export const READINESS_CLASS = Object.fromEntries(READINESS.map((r) => [r.key, r.cls])) as Record<Readiness, string>;

export const CHECK_LABEL: Record<string, string> = {
  competitors_au: 'Đối thủ AU (đã xác nhận đúng SP)',
  marketplace_presence: 'Sàn có bán đúng phiên bản SP',
  safety: 'An toàn / chính sách',
  variant: 'Phiên bản SP',
  landed_cost: 'Giá vốn về AU',
  barrier: 'Rào cản với sàn',
  competitor_model: 'Mô hình đối thủ (local / dropship)',
  policy: 'Chính sách đối thủ',
  content: 'Content',
  sourcing: 'Nguồn hàng (xưởng có làm được không)',
  ip: 'Bằng sáng chế / sở hữu trí tuệ',
};

export const MATCH_LABEL: Record<string, { label: string; cls: string }> = {
  yes: { label: 'Đúng SP', cls: 'text-emerald-700' },
  no: { label: 'Khác SP', cls: 'text-rose-700' },
  unverified: { label: 'Chưa xác nhận', cls: 'text-zinc-400' },
};

// Nhóm quyết định tách biệt với giai đoạn công việc và lịch theo dõi.
export type PipelineGroup = 'chon' | 'theo_doi' | 'loai';

export const PIPELINE: { key: PipelineGroup; label: string; hint: string; cls: string }[] = [
  { key: 'chon', label: 'Chọn', hint: 'Đã chọn, qua lọc cứng và đủ bằng chứng bắt buộc', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'theo_doi', label: 'Theo dõi', hint: 'Đang nghiên cứu, cần bổ sung bằng chứng hoặc chờ quyết định', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  { key: 'loai', label: 'Loại', hint: 'Đã quyết định không chọn hoặc rớt lọc cứng', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
];

type GroupEvidence = Pick<ProductOverview, 'decision' | 'stage' | 'readiness' | 'passed_filters' | 'failed_filters' | 'missing_required' | 'unknown_filters' | 'decision_conflict'>;

export function pipelineGroup(r: GroupEvidence): PipelineGroup {
  if (r.decision === 'khong_chon' || r.stage === 'filtered_out' || r.readiness === 'rot_loc_cung' || r.failed_filters?.length) return 'loai';
  if (r.decision && r.readiness === 'san_sang' && r.passed_filters === true && !r.decision_conflict &&
    r.missing_required?.length === 0 && r.unknown_filters?.length === 0) return 'chon';
  return 'theo_doi';
}

export function pipelineReason(r: GroupEvidence): string {
  const group = pipelineGroup(r);
  if (group === 'loai') return r.decision === 'khong_chon' ? 'Đã quyết định không chọn' : 'Không đạt lọc cứng';
  if (group === 'chon') return 'Đã chọn và đủ bằng chứng nghiên cứu';
  if (r.decision) return 'Quyết định chọn cần rà lại bằng chứng';
  if (r.readiness === 'san_sang') return 'Đủ bằng chứng, chờ quyết định chọn';
  return r.stage === 'monitoring' ? 'Đang theo dõi số liệu' : 'Đang nghiên cứu · cần bổ sung bằng chứng';
}
