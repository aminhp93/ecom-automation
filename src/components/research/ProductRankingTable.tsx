'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ProductOverview, Readiness } from '@/lib/research/db';
import {
  DECISION_CLASS, DECISION_LABEL, READINESS, STAGE_LABEL, fmtNum, fmtPct, fmtScore, scoreClass,
} from '@/lib/research/labels';

type DecisionFilter = 'all' | 'chosen' | 'khong_chon' | 'undecided' | 'conflict';

/** Điểm tiềm năng đã nhân độ đầy đủ bằng chứng — chỉ để sắp xếp trong nhóm, không hiển thị như một điểm mới. */
const sortKey = (r: ProductOverview) => (r.score ?? 0) * (r.completeness ?? 0);

export function ProductRankingTable({ rows, names }: { rows: ProductOverview[]; names: Record<string, string> }) {
  const [text, setText] = useState('');
  const [decision, setDecision] = useState<DecisionFilter>('all');
  const [category, setCategory] = useState('all');

  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.category).filter(Boolean) as string[])).sort(),
    [rows],
  );
  const visible = rows.filter((r) => {
    if (text && !`${r.name_vi} ${r.keyword ?? ''} ${r.slug}`.toLowerCase().includes(text.toLowerCase())) return false;
    if (category !== 'all' && r.category !== category) return false;
    if (decision === 'chosen') return r.decision !== null && r.decision !== 'khong_chon';
    if (decision === 'khong_chon') return r.decision === 'khong_chon';
    if (decision === 'undecided') return r.decision === null;
    if (decision === 'conflict') return !!r.decision_conflict;
    return true;
  });
  const groups = READINESS.map((g) => ({
    ...g,
    rows: visible.filter((r) => (r.readiness ?? 'can_xac_minh') === g.key).sort((a, b) => sortKey(b) - sortKey(a)),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tìm SP / keyword…"
          className="px-2.5 py-1.5 border border-zinc-200 rounded-md w-48 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
        <select value={decision} onChange={(e) => setDecision(e.target.value as DecisionFilter)} className="px-2 py-1.5 border border-zinc-200 rounded-md bg-white">
          <option value="all">Mọi quyết định</option>
          <option value="chosen">Đang chọn</option>
          <option value="conflict">Quyết định mâu thuẫn</option>
          <option value="khong_chon">Không chọn</option>
          <option value="undecided">Chưa quyết</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-2 py-1.5 border border-zinc-200 rounded-md bg-white">
          <option value="all">Mọi ngành</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="ml-auto text-zinc-500">{visible.length}/{rows.length} SP</span>
      </div>

      {groups.map((g) => (
        <section key={g.key} className="bg-white border border-zinc-200 rounded-lg">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100">
            <span className={`text-[11px] px-1.5 py-0.5 rounded border ${g.cls}`}>{g.label}</span>
            <span className="text-xs text-zinc-500">{g.hint}</span>
            <span className="ml-auto text-xs text-zinc-500">{g.rows.length} SP</span>
          </div>
          {g.rows.length === 0 ? (
            <p className="px-3 py-3 text-xs text-zinc-400">Không có SP.</p>
          ) : (
            <GroupTable rows={g.rows} readiness={g.key} names={names} />
          )}
        </section>
      ))}
    </div>
  );
}

function GroupTable({ rows, readiness, names }: { rows: ProductOverview[]; readiness: Readiness; names: Record<string, string> }) {
  const [showAll, setShowAll] = useState(readiness !== 'rot_loc_cung');
  const list = showAll ? rows : rows.slice(0, 8);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="text-zinc-500 bg-zinc-50">
          <tr className="text-left">
            <th className="px-3 py-2 font-medium">Sản phẩm</th>
            <th className="px-3 py-2 font-medium text-right" title="Điểm tiềm năng theo tiêu chí hiện hành — chỉ tính trên tiêu chí có dữ liệu">Điểm tiềm năng</th>
            <th className="px-3 py-2 font-medium text-right" title="Tỷ lệ trọng số tiêu chí có dữ liệu">Dữ liệu</th>
            <th className="px-3 py-2 font-medium">{readiness === 'rot_loc_cung' ? 'Rớt' : 'Còn thiếu'}</th>
            <th className="px-3 py-2 font-medium" title="Anh Thanh: mỗi khách một size/mẫu → sàn không bán được">Rào cản sàn</th>
            <th className="px-3 py-2 font-medium text-right">AU search</th>
            <th className="px-3 py-2 font-medium text-right" title="Số brand khác nhau (theo website) đã xác nhận bán đúng SP, ≥5 ad đang chạy ở AU">Brand AU</th>
            <th className="px-3 py-2 font-medium text-right" title="Tỷ lệ ad đã chạy >60 ngày trong mẫu Meta AU (mẫu ≥20)">Ad &gt;60 ngày</th>
            <th className="px-3 py-2 font-medium">Quyết định</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r) => {
            const gaps = readiness === 'rot_loc_cung' ? r.failed_filters ?? [] : [...(r.unknown_filters ?? []), ...(r.missing_required ?? [])];
            return (
              <tr key={r.product_id} className="border-t border-zinc-100 hover:bg-zinc-50 align-top">
                <td className="px-3 py-2 max-w-xs">
                  <Link href={`/research/p/${r.slug}`} className="font-medium text-zinc-900 hover:underline">{r.name_vi}</Link>
                  <div className="text-zinc-500">{r.category} · {STAGE_LABEL[r.stage] ?? r.stage}</div>
                </td>
                <td className={`px-3 py-2 text-right font-semibold tabular-nums ${scoreClass(r.score)}`}>{fmtScore(r.score)}</td>
                <td className={`px-3 py-2 text-right tabular-nums ${(r.completeness ?? 0) < 0.7 ? 'text-amber-700' : 'text-zinc-600'}`}>
                  {r.completeness === null ? '—' : `${Math.round(r.completeness * 100)}%`}
                </td>
                <td className="px-3 py-2 max-w-[220px]">
                  {gaps.length === 0 ? <span className="text-zinc-400">—</span> : (
                    <span className={readiness === 'rot_loc_cung' ? 'text-rose-700' : 'text-amber-800'}>{gaps.map((k) => names[k] ?? k).join(' · ')}</span>
                  )}
                </td>
                <td className="px-3 py-2">{r.marketplace_barrier ?? <span className="text-zinc-400">chưa đánh giá</span>}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtNum(r.au_searches)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.ad_signal_brands ?? <span className="text-zinc-400">chưa quét</span>}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.meta_au_over60_ratio === null ? <span className="text-zinc-400">—</span> : (
                    <span title={r.meta_au_method ?? undefined}>{fmtPct(r.meta_au_over60_ratio, 0)} <span className="text-zinc-400">/{r.meta_au_sample}</span></span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {r.decision ? (
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border whitespace-nowrap ${DECISION_CLASS[r.decision]}`}>
                      {r.decision_conflict && <AlertTriangle className="w-3 h-3 text-rose-600" aria-label="Quyết định mâu thuẫn" />}
                      {DECISION_LABEL[r.decision]}
                    </span>
                  ) : (
                    <span className="text-zinc-400">Chưa quyết</span>
                  )}
                  {r.decision_conflict && <div className="text-[10px] text-rose-700 mt-0.5">Chưa đủ bằng chứng, chưa có lý do ngoại lệ</div>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!showAll && rows.length > 8 && (
        <button type="button" onClick={() => setShowAll(true)} className="w-full py-2 text-xs text-zinc-500 hover:bg-zinc-50 border-t border-zinc-100">
          Hiện thêm {rows.length - 8} SP
        </button>
      )}
    </div>
  );
}
