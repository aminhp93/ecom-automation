import type { PipelineRow } from '@/lib/research/db';

/**
 * Cột "Cổng chốt": điểm tiềm năng chỉ cho biết nên điều tra sản phẩm nào trước, chưa trả lời được biên lợi nhuận.
 * Chỉ gắn cho sản phẩm đang được chấm điểm (qua lọc cứng). Hiện chỉ phân biệt được có/không có giá vốn về AU (landed_cost);
 * unit economics và margin chưa có chỗ lưu riêng nên không bịa trạng thái.
 */
export const GATE_NONE = 'Chưa có báo giá';
export const GATE_COST = 'Có giá vốn, chưa tính margin';

export function attachGate(rows: PipelineRow[]): PipelineRow[] {
  return rows.map((r) =>
    r.loai_dong === 'san_pham' && r.diem_tiem_nang != null ? { ...r, gate: typeof r.landed_cost === 'number' ? GATE_COST : GATE_NONE } : r,
  );
}
