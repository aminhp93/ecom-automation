'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ProductOverview } from '@/lib/research/db';
import { DECISION_CLASS, DECISION_LABEL, STAGE_LABEL, fmtMoney, fmtNum, fmtScore, scoreClass } from '@/lib/research/labels';

type DecisionFilter = 'all' | 'chosen' | 'khong_chon' | 'undecided';

export function ProductRankingTable({ rows, filterNames }: { rows: ProductOverview[]; filterNames: Record<string, string> }) {
  const [text, setText] = useState('');
  const [decision, setDecision] = useState<DecisionFilter>('all');
  const [category, setCategory] = useState('all');
  const [onlyPassed, setOnlyPassed] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(rows.map((r) => r.category).filter(Boolean) as string[])).sort(),
    [rows],
  );
  const visible = rows.filter((r) => {
    if (text && !`${r.name_vi} ${r.keyword ?? ''} ${r.slug}`.toLowerCase().includes(text.toLowerCase())) return false;
    if (category !== 'all' && r.category !== category) return false;
    if (onlyPassed && !r.passed_filters) return false;
    if (decision === 'chosen') return r.decision !== null && r.decision !== 'khong_chon';
    if (decision === 'khong_chon') return r.decision === 'khong_chon';
    if (decision === 'undecided') return r.decision === null;
    return true;
  });

  return (
    <div className="bg-white border border-zinc-200 rounded-lg">
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-zinc-200 text-xs">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tìm SP / keyword…"
          className="px-2.5 py-1.5 border border-zinc-200 rounded-md w-48 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
        <select value={decision} onChange={(e) => setDecision(e.target.value as DecisionFilter)} className="px-2 py-1.5 border border-zinc-200 rounded-md bg-white">
          <option value="all">Mọi quyết định</option>
          <option value="chosen">Đang chọn</option>
          <option value="khong_chon">Không chọn</option>
          <option value="undecided">Chưa quyết</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-2 py-1.5 border border-zinc-200 rounded-md bg-white">
          <option value="all">Mọi ngành</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-zinc-600">
          <input type="checkbox" checked={onlyPassed} onChange={(e) => setOnlyPassed(e.target.checked)} />
          Chỉ SP qua lọc cứng
        </label>
        <span className="ml-auto text-zinc-500">{visible.length}/{rows.length} SP</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-zinc-500 bg-zinc-50">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Sản phẩm</th>
              <th className="px-3 py-2 font-medium text-right">Điểm</th>
              <th className="px-3 py-2 font-medium">Lọc cứng</th>
              <th className="px-3 py-2 font-medium text-right">AU search</th>
              <th className="px-3 py-2 font-medium text-right">Giá AU</th>
              <th className="px-3 py-2 font-medium text-right" title="Số page brand/advertorial có ≥50 ad đang chạy">Page DTC mạnh</th>
              <th className="px-3 py-2 font-medium text-right" title="Trong ~30 ad đầu trên Meta Ads Library AU">Ad &gt;60 ngày</th>
              <th className="px-3 py-2 font-medium">Quyết định</th>
              <th className="px-3 py-2 font-medium">Bước</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={r.product_id} className="border-t border-zinc-100 hover:bg-zinc-50 align-top">
                <td className="px-3 py-2 text-zinc-400">{i + 1}</td>
                <td className="px-3 py-2 max-w-xs">
                  <Link href={`/research/p/${r.slug}`} className="font-medium text-zinc-900 hover:underline">
                    {r.name_vi}
                  </Link>
                  <div className="text-zinc-500 line-clamp-2" title={r.headline ?? undefined}>
                    {r.category}{r.headline ? ` · ${r.headline}` : ''}
                  </div>
                </td>
                <td className={`px-3 py-2 text-right font-semibold tabular-nums ${scoreClass(r.score)}`}>
                  {fmtScore(r.score)}
                  {r.completeness !== null && r.completeness < 0.7 && (
                    <div className="font-normal text-[10px] text-zinc-400" title="Tỷ lệ trọng số có dữ liệu">
                      dữ liệu {Math.round(r.completeness * 100)}%
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  {r.passed_filters === null ? (
                    <span className="text-zinc-400">—</span>
                  ) : r.passed_filters ? (
                    <span className="text-emerald-700">Qua</span>
                  ) : (
                    <span className="text-rose-700">{(r.failed_filters ?? []).map((f) => filterNames[f] ?? f).join('; ')}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtNum(r.au_searches)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(r.au_price, 'A$')}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.adswin_pages}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.meta_over60 === null ? '—' : `${r.meta_over60}/${r.meta_sample ?? '?'}`}
                </td>
                <td className="px-3 py-2">
                  {r.decision ? (
                    <span className={`inline-block px-1.5 py-0.5 rounded border whitespace-nowrap ${DECISION_CLASS[r.decision]}`}>
                      {DECISION_LABEL[r.decision]}
                    </span>
                  ) : (
                    <span className="text-zinc-400">Chưa quyết</span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-zinc-600">{STAGE_LABEL[r.stage] ?? r.stage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
