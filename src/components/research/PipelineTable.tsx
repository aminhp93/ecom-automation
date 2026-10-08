'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import columns from '@/lib/research/pipeline-columns.json';
import type { MetaPageRef, PipelineRow } from '@/lib/research/db';
import { ScoreHelp } from '@/components/research/ScoreHelp';
import { adsLibraryPageUrl } from '@/lib/research/adsLibraryUrl';
import { textToneOf, toneOf, TONE_CLASS } from '@/lib/research/pipeline-rules';

type Col = (typeof columns)[number];
const NAME_KEY = 'name_vi';
// Nền theo nhóm cột (khóa `tint` trong pipeline-columns.json): Amazon xanh lá, Meta Ads vàng.
const TINT_HEAD: Record<string, string> = { amazon: 'bg-green-100', meta: 'bg-yellow-100' };
const TINT_CELL: Record<string, string> = { amazon: 'bg-green-50', meta: 'bg-yellow-50' };

export type GroupTab = 'tat-ca' | 'theo-doi' | 'loai' | 'chua-tag';

// Chỉ có 2 tag do người dùng đặt (cột `nhom` trong view): Theo dõi và Loại. Chưa tag thì để trống.
type Tag = 'theo_doi' | 'loai' | null;
const tagOf = (r: PipelineRow): Tag => (r.nhom === 'theo_doi' ? 'theo_doi' : r.nhom === 'loai' ? 'loai' : null);
const TAG_LABEL: Record<string, string> = { theo_doi: 'Theo dõi', loai: 'Loại' };
const TAG_CLS: Record<string, string> = { theo_doi: 'bg-sky-50 text-sky-700 border-sky-200', loai: 'bg-zinc-100 text-zinc-500 border-zinc-200' };
const TAB_TAG: Record<Exclude<GroupTab, 'tat-ca'>, Tag> = { 'theo-doi': 'theo_doi', loai: 'loai', 'chua-tag': null };
// Thứ tự mặc định (khi chưa bấm sắp xếp): theo quyết định, rồi search AU giảm dần, rồi số ad Meta AU.

const fmtNum = (n: number, d: number) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

function fmt(col: Col, v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  switch (col.type) {
    case 'int': return fmtNum(Number(v), 0);
    case 'num1': return fmtNum(Number(v), 1);
    case 'num2': return fmtNum(Number(v), 2);
    case 'pct': return `${(Number(v) * 100).toFixed(1)}%`;
    case 'group': return TAG_LABEL[String(v)] ?? '';
    default: return String(v);
  }
}

const adsLibrary = adsLibraryPageUrl;
// Page đã quét riêng: "tên: ad đang chạy/tổng - năm tạo". Page chỉ thấy trong mẫu quét keyword: "tên: n ad trong mẫu" (hoặc chỉ tên).
const pageLine = (p: MetaPageRef) =>
  p.a == null && p.t == null ? `${p.n}${p.s != null ? `: ${p.s} ad trong mẫu` : ''}` : `${p.n}: ${p.a ?? '?'}/${p.t ?? '?'}${p.y ? ` - ${p.y}` : ''}`;
const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

function MetaPages({ pages, fallback }: { pages: MetaPageRef[] | null | undefined; fallback: string }) {
  if (!pages?.length) return fallback ? <span className="whitespace-pre-line">{fallback}</span> : <span className="text-zinc-300">—</span>;
  return (
    <ul className="space-y-0.5">
      {pages.map((p, i) => (
        <li key={`${p.id}-${i}`}>
          {/^\d+$/.test(p.id) ? (
            <a href={adsLibrary(p.id)} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline" title="Mở Ads Library của page này">{pageLine(p)}</a>
          ) : (
            pageLine(p)
          )}
        </li>
      ))}
    </ul>
  );
}

export function PipelineTable({ rows, initialTab = 'tat-ca', toolbarLeft, toolbarRight }: { rows: PipelineRow[]; initialTab?: GroupTab; toolbarLeft?: React.ReactNode; toolbarRight?: React.ReactNode }) {
  const [tab, setTab] = useState<GroupTab>(initialTab);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const counts = useMemo(() => {
    const c = { theo_doi: 0, loai: 0, none: 0 };
    for (const r of rows) {
      const t = tagOf(r);
      c[t ?? 'none']++;
    }
    return c;
  }, [rows]);
  const categories = useMemo(() => [...new Set(rows.map((r) => r.category).filter(Boolean) as string[])].sort(), [rows]);

  const switchTab = (t: GroupTab) => {
    setTab(t);
    try { window.history.replaceState(null, '', t === 'tat-ca' ? '/market-research/pipeline' : `/market-research/pipeline?nhom=${t}`); } catch { /* không bắt buộc */ }
  };

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter(
      (r) =>
        (tab === 'tat-ca' || tagOf(r) === TAB_TAG[tab]) &&
        (!category || r.category === category) &&
        (!needle || `${r.name_vi} ${r.keyword ?? ''} ${r.ref ?? ''}`.toLowerCase().includes(needle)),
    );
    const num = (v: unknown) => (typeof v === 'number' ? v : -1);
    const tag = (r: PipelineRow) => (tagOf(r) === 'theo_doi' ? 0 : tagOf(r) === 'loai' ? 2 : 1); // Theo dõi lên trước, chưa tag giữa, Loại cuối
    out = [...out].sort((a, b) => {
      if (sort) {
        const { key, dir } = sort;
        const x = a[key], y = b[key];
        if (x === null || x === undefined) return y === null || y === undefined ? 0 : 1; // ô trống luôn xuống cuối
        if (y === null || y === undefined) return -1;
        return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'vi')) * dir;
      }
      return tag(a) - tag(b) || num(b.diem_tiem_nang) - num(a.diem_tiem_nang) || num(b.au_searches) - num(a.au_searches) || num(b.meta_au_active_ads) - num(a.meta_au_active_ads);
    });
    return out;
  }, [rows, tab, q, category, sort]);

  const sel = 'text-xs border border-zinc-200 rounded-md px-2 py-1 bg-white';
  const tabs: { key: GroupTab; label: string; n: number; hint: string }[] = [
    { key: 'tat-ca', label: 'Tất cả', n: rows.length, hint: 'Mọi sản phẩm đã quét' },
    { key: 'theo-doi', label: 'Theo dõi', n: counts.theo_doi, hint: 'Sản phẩm bạn đã tag Theo dõi' },
    { key: 'loai', label: 'Loại', n: counts.loai, hint: 'Sản phẩm bạn đã tag Loại' },
    { key: 'chua-tag', label: 'Chưa tag', n: counts.none, hint: 'Chưa được tag, chờ bạn phân loại' },
  ];

  return (
    <div className="space-y-2">
      {/* Một dòng duy nhất: tiêu đề, bản dữ liệu, nhóm, tìm kiếm, ngành, xuất Excel, trợ giúp */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {toolbarLeft}
        <nav className="flex items-center gap-1" aria-label="Nhóm sản phẩm">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              title={t.hint}
              aria-current={tab === t.key ? 'page' : undefined}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${tab === t.key ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
            >
              {t.label} <span className={`tabular-nums ${tab === t.key ? 'text-zinc-300' : 'text-zinc-400'}`}>{t.n}</span>
            </button>
          ))}
        </nav>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên, keyword, mã…" className={`${sel} w-48`} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={sel}>
          <option value="">Mọi ngành</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2">{toolbarRight}</div>
      </div>

      <div className="overflow-auto border border-zinc-200 rounded-lg bg-white max-h-[75vh]">
        <table className="text-xs border-separate border-spacing-0">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => setSort((s) => (s?.key === c.key ? (s.dir === 1 ? { key: c.key, dir: -1 } : null) : { key: c.key, dir: 1 }))}
                  className={`sticky top-0 ${TINT_HEAD[(c as { tint?: string }).tint ?? ''] ?? 'bg-zinc-100'} border-b border-zinc-200 px-2 py-2 text-left font-medium text-zinc-600 cursor-pointer select-none align-bottom ${c.key === NAME_KEY ? 'left-0 z-30 border-r' : 'z-20'}`}
                  style={{ minWidth: c.w, maxWidth: 'maxw' in c ? c.maxw : undefined }}
                  title="Bấm để sắp xếp"
                >
                  {c.label}{sort?.key === c.key ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}{c.key === 'diem_tiem_nang' && <ScoreHelp />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={`${r.loai_dong}-${r.ref}`}>
                {columns.map((c) => {
                  const text = fmt(c, r[c.key]);
                  const numeric = ['int', 'num1', 'num2', 'pct'].includes(c.type);
                  const isName = c.key === NAME_KEY;
                  let body: React.ReactNode;
                  if (isName) {
                    body = (
                      <Link
                        href={r.loai_dong === 'san_pham' ? `/market-research/p/${r.ref}` : `/market-research/discover/${r.ref}`}
                        className="text-blue-700 hover:underline underline-offset-2"
                        title="Mở chi tiết sản phẩm"
                      >
                        {text}
                      </Link>
                    );
                  } else if (c.key === 'nhom') {
                    const t = tagOf(r);
                    body = t ? <span className={`inline-block px-1.5 py-0.5 rounded border text-[11px] ${TAG_CLS[t]}`}>{TAG_LABEL[t]}</span> : null;
                  } else if (c.key === 'meta_pages') {
                    body = <MetaPages pages={r.meta_pages_json as MetaPageRef[] | null | undefined} fallback={text} />;
                  } else if (c.type === 'url' && text) {
                    body = <a href={text} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">Mở video</a>;
                  } else {
                    const tone = numeric ? toneOf(c.key, r[c.key]) : textToneOf(c.key, r[c.key]);
                    body = text ? <span className={tone ? TONE_CLASS[tone] : ''}>{text}</span> : <span className="text-zinc-300">—</span>;
                  }
                  return (
                    <td
                      key={c.key}
                      style={'maxw' in c ? { maxWidth: c.maxw } : undefined}
                      className={`border-b border-zinc-100 px-2 py-1.5 align-top ${TINT_CELL[(c as { tint?: string }).tint ?? ''] ?? ''} ${numeric ? 'text-right tabular-nums' : 'whitespace-pre-line'} ${
                        isName ? 'sticky left-0 z-10 bg-white border-r font-medium' : ''
                      }`}
                    >
                      {body}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
