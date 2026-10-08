import columns from './pipeline-columns.json';
import type { PipelineRow } from './db';

// Tag (nhom), số ô trống (n_empty) và các cột phụ không tính là "thay đổi dữ liệu".
const SKIP = new Set(['nhom', 'n_empty']);
const cols = columns.filter((c) => !SKIP.has(c.key));

export interface CellChange { label: string; old: string; new: string }
export interface RowChange { key: string; name: string; kind: 'them' | 'bo' | 'doi'; cells: CellChange[] }
export interface DiffResult { added: RowChange[]; removed: RowChange[]; changed: RowChange[]; cellCount: number }

const fmtNum = (n: number, d: number) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
export function fmtCell(type: string, v: unknown): string {
  if (v === null || v === undefined || v === '') return '(trống)';
  switch (type) {
    case 'int': return fmtNum(Number(v), 0);
    case 'num1': return fmtNum(Number(v), 1);
    case 'num2': return fmtNum(Number(v), 2);
    case 'pct': return `${(Number(v) * 100).toFixed(1)}%`;
    default: return String(v);
  }
}

const same = (x: unknown, y: unknown) => (x ?? null) === (y ?? null) || (typeof x === 'number' && typeof y === 'number' && x === y);

export function diffSnapshots(a: Map<string, PipelineRow>, b: Map<string, PipelineRow>): DiffResult {
  const added: RowChange[] = [], removed: RowChange[] = [], changed: RowChange[] = [];
  let cellCount = 0;
  for (const [key, rb] of b) {
    const ra = a.get(key);
    const name = String(rb.name_vi ?? key);
    if (!ra) { added.push({ key, name, kind: 'them', cells: [] }); continue; }
    const cells: CellChange[] = [];
    for (const c of cols) {
      if (same(ra[c.key], rb[c.key])) continue;
      let o = fmtCell(c.type, ra[c.key]), n = fmtCell(c.type, rb[c.key]);
      if (typeof ra[c.key] === 'string' && typeof rb[c.key] === 'string' && (o.includes('\n') || n.includes('\n'))) {
        // Ô nhiều dòng (danh sách page đối thủ): chỉ hiện các dòng khác nhau
        const lo = o.split('\n'), ln = n.split('\n');
        o = lo.filter((x) => !ln.includes(x)).join('\n') || '(không đổi dòng nào bị mất)';
        n = ln.filter((x) => !lo.includes(x)).join('\n') || '(không có dòng mới)';
      }
      cells.push({ label: c.label.replace(' (bấm để mở Ads Library)', ''), old: o, new: n });
    }
    if (cells.length) { changed.push({ key, name, kind: 'doi', cells }); cellCount += cells.length; }
  }
  for (const [key, ra] of a) if (!b.has(key)) removed.push({ key, name: String(ra.name_vi ?? key), kind: 'bo', cells: [] });
  return { added, removed, changed, cellCount };
}

export const toMap = (rows: { key: string; row: PipelineRow }[]) => new Map(rows.map((r) => [r.key, r.row]));
