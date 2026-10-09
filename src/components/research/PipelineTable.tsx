'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import columns from '@/lib/research/pipeline-columns.json';
import type { LocalRef, MetaPageRef, PipelineRow, SocialRef } from '@/lib/research/db';
import { pageLine, pageTone, PAGE_TONE_CLASS } from '@/lib/research/metaPages';
import { socialLine, socialTitle } from '@/lib/research/social';
import { localLine, localTitle } from '@/lib/research/local';
import { ScoreHelp } from '@/components/research/ScoreHelp';
import { CopyCommand } from '@/components/research/CopyCommand';
import { adsLibraryPageUrl } from '@/lib/research/adsLibraryUrl';
import { textToneOf, toneOf, TONE_CLASS } from '@/lib/research/pipeline-rules';

type Col = (typeof columns)[number];
const NAME_KEY = 'name_vi';
const PAGE_SIZE = 10;
// Cột ẩn mặc định (người dùng bật lại ở nút "Cột"; lựa chọn được nhớ trong trình duyệt). Cột tên sản phẩm luôn hiện.
const DEFAULT_HIDDEN = ['keyword', 'ref', 'cluster', 'landed_cost'];
const HIDDEN_STORAGE_KEY = 'pipeline.hiddenColumns.v1';
const shortLabel = (label: string) => {
  const t = label.replace(/\s*\([^)]*\)\s*$/, ''); // chỉ bỏ phần giải thích trong ngoặc ở cuối nhãn
  return t.length > 56 ? `${t.slice(0, 55)}…` : t;
};
// Nền theo nhóm cột (khóa `tint` trong pipeline-columns.json): Amazon xanh lá, Meta Ads vàng.
const TINT_HEAD: Record<string, string> = { amazon: 'bg-green-100', meta: 'bg-yellow-100' };
const TINT_CELL: Record<string, string> = { amazon: 'bg-green-50', meta: 'bg-yellow-50' };

export type GroupTab = 'tat-ca' | 'theo-doi' | 'loai' | 'chua-tag';
// Lọc phụ trong tab Chưa tag: đã xem (có reviewed_on, do lệnh seen ghi) hay chưa xem.
type SeenFilter = 'all' | 'unseen' | 'seen';
const isSeen = (r: PipelineRow) => !!r.reviewed_on;
const dmShort = (iso: unknown) => (typeof iso === 'string' && iso.length >= 10 ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '');

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
const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

function MetaPages({ pages, fallback }: { pages: MetaPageRef[] | null | undefined; fallback: string }) {
  if (!pages?.length) return fallback ? <span className="whitespace-pre-line">{fallback}</span> : <span className="text-zinc-300">—</span>;
  return (
    <ul className="space-y-0.5">
      {pages.map((p, i) => {
        // Chữ đen mặc định; đỏ nếu ad đang chạy / tổng < 30%, xanh nếu > 80% (chỉ page đã quét riêng mới có số).
        const cls = PAGE_TONE_CLASS[pageTone(p) ?? 'none'];
        return (
          <li key={`${p.id}-${i}`} className={cls}>
            {/^\d+$/.test(p.id) ? (
              <a href={adsLibrary(p.id)} target="_blank" rel="noreferrer" className="hover:underline" title="Mở Ads Library của page này">{pageLine(p)}</a>
            ) : (
              pageLine(p)
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Cột Local brand check: một dòng cho mỗi page Meta, cùng thứ tự với cột Meta pages (— nếu chưa kiểm). Rê chuột xem nơi gửi hàng, pháp nhân, độ tin cậy. */
function LocalPages({ refs }: { refs: LocalRef[] | null | undefined }) {
  if (!refs?.length) return <span className="text-zinc-300">—</span>;
  return (
    <ul className="space-y-0.5">
      {refs.map((x, i) => (
        <li key={`${x.id}-${i}`} title={localTitle(x)} className={x.model ? 'text-zinc-900' : 'text-zinc-300'}>
          {localLine(x)}
        </li>
      ))}
    </ul>
  );
}

/** Cột Social đối thủ: một dòng cho mỗi page Meta, cùng thứ tự với cột Meta pages (— nếu chưa quét social). */
function SocialPages({ refs }: { refs: SocialRef[] | null | undefined }) {
  if (!refs?.length) return <span className="text-zinc-300">—</span>;
  return (
    <ul className="space-y-0.5">
      {refs.map((x, i) => (
        <li key={`${x.id}-${i}`} title={socialTitle(x)} className={x.fb || x.ig || x.tt ? 'text-zinc-900' : 'text-zinc-300'}>
          {socialLine(x)}
        </li>
      ))}
    </ul>
  );
}

/** Nút "Cột": bật/tắt từng cột của bảng. Cột tên sản phẩm luôn hiện. */
function ColumnPicker({ hidden, onToggle, onReset, onShowAll }: { hidden: Set<string>; onToggle: (key: string) => void; onReset: () => void; onShowAll: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  const toggleable = columns.filter((c) => c.key !== NAME_KEY);
  const shownCount = toggleable.filter((c) => !hidden.has(c.key)).length;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title="Chọn cột hiển thị"
        className="inline-flex items-center gap-1 text-xs border border-zinc-200 rounded-md px-2 py-1 bg-white hover:bg-zinc-50 text-zinc-700"
      >
        Cột <span className="tabular-nums text-zinc-400">{shownCount}/{toggleable.length}</span>
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-1 z-50 w-80 max-h-[70vh] overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg p-2 text-xs">
          <div className="flex items-center justify-between gap-2 pb-1.5 mb-1 border-b border-zinc-100 sticky top-0 bg-white">
            <span className="text-zinc-500">Cột Sản phẩm luôn hiện</span>
            <span className="flex gap-1.5">
              <button type="button" onClick={onReset} className="rounded border border-zinc-200 px-1.5 py-0.5 hover:bg-zinc-50">Mặc định</button>
              <button type="button" onClick={onShowAll} className="rounded border border-zinc-200 px-1.5 py-0.5 hover:bg-zinc-50">Hiện hết</button>
            </span>
          </div>
          <ul>
            {toggleable.map((c) => (
              <li key={c.key}>
                <label className="flex items-start gap-2 rounded px-1 py-0.5 hover:bg-zinc-50 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 accent-sky-600" checked={!hidden.has(c.key)} onChange={() => onToggle(c.key)} />
                  <span className={hidden.has(c.key) ? 'text-zinc-400' : 'text-zinc-800'}>{shortLabel(c.label)}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function PipelineTable({ rows, initialTab = 'tat-ca', toolbarLeft, settingsStart, settingsEnd }: { rows: PipelineRow[]; initialTab?: GroupTab; toolbarLeft?: React.ReactNode; settingsStart?: React.ReactNode; settingsEnd?: React.ReactNode }) {
  const [tab, setTab] = useState<GroupTab>(initialTab);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [seenFilter, setSeenFilter] = useState<SeenFilter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set()); // dòng đã chọn (giữ khi đổi trang, lọc, sắp xếp)
  const [copiedN, setCopiedN] = useState<number | null>(null);
  const [page, setPage] = useState(0); // phân trang 10 dòng; về trang đầu khi đổi nhóm, tìm kiếm, ngành, sắp xếp
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(DEFAULT_HIDDEN)); // cột đang ẩn
  useEffect(() => {
    // Đọc lựa chọn đã lưu sau khi mount (tránh lệch HTML giữa server và client).
    try {
      const raw = window.localStorage.getItem(HIDDEN_STORAGE_KEY);
      if (raw) setHidden(new Set((JSON.parse(raw) as unknown[]).filter((k): k is string => typeof k === 'string')));
    } catch { /* không bắt buộc */ }
  }, []);
  const saveHidden = (next: Set<string>) => {
    setHidden(next);
    try { window.localStorage.setItem(HIDDEN_STORAGE_KEY, JSON.stringify([...next])); } catch { /* không bắt buộc */ }
  };
  const toggleColumn = (key: string) => { const n = new Set(hidden); if (n.has(key)) n.delete(key); else n.add(key); saveHidden(n); };
  const shownCols = useMemo(() => columns.filter((c) => c.key === NAME_KEY || !hidden.has(c.key)), [hidden]);

  const counts = useMemo(() => {
    const c = { theo_doi: 0, loai: 0, none: 0, seen: 0, unseen: 0 };
    for (const r of rows) {
      const t = tagOf(r);
      c[t ?? 'none']++;
      if (!t) c[isSeen(r) ? 'seen' : 'unseen']++; // chỉ đếm trong nhóm chưa tag
    }
    return c;
  }, [rows]);
  const categories = useMemo(() => [...new Set(rows.map((r) => r.category).filter(Boolean) as string[])].sort(), [rows]);

  const switchTab = (t: GroupTab) => {
    setTab(t);
    setSeenFilter('all');
    setPage(0);
    try {
      // Giữ các tham số khác (đặc biệt v = bản dữ liệu đang xem), chỉ đổi nhom.
      const params = new URLSearchParams(window.location.search);
      if (t === 'tat-ca') params.delete('nhom'); else params.set('nhom', t);
      const qs = params.toString();
      window.history.replaceState(null, '', `/market-research/pipeline${qs ? `?${qs}` : ''}`);
    } catch { /* không bắt buộc */ }
  };

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter(
      (r) =>
        (tab === 'tat-ca' || tagOf(r) === TAB_TAG[tab]) &&
        (tab !== 'chua-tag' || seenFilter === 'all' || (seenFilter === 'seen') === isSeen(r)) &&
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
  }, [rows, tab, q, category, sort, seenFilter]);

  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const cur = Math.min(page, pages - 1);
  const visible = shown.slice(cur * PAGE_SIZE, (cur + 1) * PAGE_SIZE);
  const pageBtn = 'text-xs border border-zinc-200 rounded-md px-2.5 py-1 bg-white text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-white';
  const sel = 'text-xs border border-zinc-200 rounded-md px-2 py-1 bg-white';

  // Chọn nhiều dòng: khoá = loai_dong:ref. Sao chép tên theo thứ tự đang hiển thị (dòng đã chọn nhưng đang bị lọc ẩn xếp sau cùng).
  const keyOf = (r: PipelineRow) => `${r.loai_dong}:${r.ref}`;
  const toggleRow = (r: PipelineRow) => setSelected((prev) => { const n = new Set(prev); const k = keyOf(r); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const visibleKeys = visible.map(keyOf);
  const allVisible = visible.length > 0 && visibleKeys.every((k) => selected.has(k));
  const someVisible = visibleKeys.some((k) => selected.has(k));
  const togglePage = () => setSelected((prev) => { const n = new Set(prev); if (allVisible) visibleKeys.forEach((k) => n.delete(k)); else visibleKeys.forEach((k) => n.add(k)); return n; });
  const selectAllShown = () => setSelected((prev) => { const n = new Set(prev); shown.forEach((r) => n.add(keyOf(r))); return n; });
  const hiddenSelected = [...selected].filter((k) => !shown.some((r) => keyOf(r) === k)).length;
  const copyNames = async () => {
    const shownSel = shown.filter((r) => selected.has(keyOf(r)));
    const shownKeys = new Set(shownSel.map(keyOf));
    const rest = rows.filter((r) => selected.has(keyOf(r)) && !shownKeys.has(keyOf(r)));
    const names = [...shownSel, ...rest].map((r) => String(r.name_vi ?? '')).filter(Boolean);
    const text = names.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedN(names.length);
      setTimeout(() => setCopiedN(null), 2000);
    } catch {
      window.prompt('Copy tên sản phẩm:', text);
    }
  };
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
        {tab === 'chua-tag' && (
          <div className="flex items-center gap-1 text-xs" role="group" aria-label="Lọc theo đã xem">
            <span className="text-zinc-400">Trong chưa tag:</span>
            {([['all', 'Tất cả', counts.none], ['unseen', 'Chưa xem', counts.unseen], ['seen', 'Đã xem', counts.seen]] as const).map(([k, label, n]) => (
              <button
                key={k}
                type="button"
                onClick={() => { setSeenFilter(k); setPage(0); }}
                aria-pressed={seenFilter === k}
                title={k === 'seen' ? 'Đã dùng lệnh seen (có ngày xem), chưa tag' : k === 'unseen' ? 'Chưa tag và chưa xem' : 'Mọi mục chưa tag'}
                className={`px-2 py-0.5 rounded-md border whitespace-nowrap ${seenFilter === k ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'}`}
              >
                {label} <span className={`tabular-nums ${seenFilter === k ? 'text-zinc-300' : 'text-zinc-400'}`}>{n}</span>
              </button>
            ))}
          </div>
        )}
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Tìm tên, keyword, mã…" className={`${sel} w-48`} />
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(0); }} className={sel}>
          <option value="">Mọi ngành</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="overflow-auto border border-zinc-200 rounded-lg bg-white max-h-[75vh]">
        <table className="text-xs border-separate border-spacing-0">
          <thead>
            <tr>
              {shownCols.map((c) => (
                <th
                  key={c.key}
                  onClick={() => { setSort((s) => (s?.key === c.key ? (s.dir === 1 ? { key: c.key, dir: -1 } : null) : { key: c.key, dir: 1 })); setPage(0); }}
                  className={`sticky top-0 ${TINT_HEAD[(c as { tint?: string }).tint ?? ''] ?? 'bg-zinc-100'} border-b border-zinc-200 px-2 py-2 text-left font-medium text-zinc-600 cursor-pointer select-none align-bottom ${c.key === NAME_KEY ? 'left-0 z-30 border-r' : 'z-20'}`}
                  style={{ minWidth: c.w, maxWidth: 'maxw' in c ? c.maxw : undefined }}
                  title="Bấm để sắp xếp"
                >
                  {c.key === NAME_KEY && (
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả dòng trên trang này"
                      title="Chọn / bỏ chọn cả trang này"
                      className="mr-2 align-middle accent-sky-600"
                      checked={allVisible}
                      ref={(el) => { if (el) el.indeterminate = someVisible && !allVisible; }}
                      onClick={(e) => e.stopPropagation()}
                      onChange={togglePage}
                    />
                  )}
                  {c.label}{sort?.key === c.key ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}{c.key === 'diem_tiem_nang' && <ScoreHelp />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={`${r.loai_dong}-${r.ref}`} className="group/row">
                {shownCols.map((c) => {
                  const text = fmt(c, r[c.key]);
                  const numeric = ['int', 'num1', 'num2', 'pct'].includes(c.type);
                  const isName = c.key === NAME_KEY;
                  let body: React.ReactNode;
                  if (isName) {
                    body = (
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          aria-label={`Chọn ${text}`}
                          className="mt-0.5 shrink-0 accent-sky-600"
                          checked={selected.has(keyOf(r))}
                          onChange={() => toggleRow(r)}
                        />
                        <Link
                          href={r.loai_dong === 'san_pham' ? `/market-research/p/${r.ref}` : `/market-research/discover/${r.ref}`}
                          className="text-blue-700 hover:underline underline-offset-2"
                          title="Mở chi tiết sản phẩm"
                        >
                          {text}
                          {isSeen(r) && (
                            <span className="ml-1.5 align-middle inline-block px-1 py-px rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-normal whitespace-nowrap" title={typeof r.review_note === 'string' && r.review_note ? r.review_note : 'Đã xem'}>
                              ✓ {dmShort(r.reviewed_on)}
                            </span>
                          )}
                        </Link>
                        {/* Copy lệnh để dán vào Claude: Phân tích (đánh giá chi tiết, chỉ đọc) và Seen (đánh dấu đã xem, gõ thêm ghi chú 1 dòng). Sản phẩm: mã slug; ứng viên: id.
                            Nằm đè ở góc dưới ô tên, chỉ hiện khi rê chuột vào dòng (không chiếm chỗ của tên). */}
                        <div className="absolute bottom-1 left-2 z-10 flex items-center gap-1 opacity-0 pointer-events-none group-hover/row:opacity-100 group-hover/row:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto">
                          <CopyCommand compact label="Phân tích" command={`/dropship-research analyze ${r.ref} `} className="shadow-sm" />
                          <CopyCommand compact label="Seen" command={`/dropship-research seen ${r.ref} `} className="shadow-sm" />
                        </div>
                      </div>
                    );
                  } else if (c.key === 'nhom') {
                    const t = tagOf(r);
                    body = t ? <span className={`inline-block px-1.5 py-0.5 rounded border text-[11px] ${TAG_CLS[t]}`}>{TAG_LABEL[t]}</span> : null;
                  } else if (c.key === 'meta_pages') {
                    body = <MetaPages pages={r.meta_pages_json as MetaPageRef[] | null | undefined} fallback={text} />;
                  } else if (c.key === 'local_brand_check') {
                    body = <LocalPages refs={r.local_json as LocalRef[] | null | undefined} />;
                  } else if (c.key === 'competitor_social') {
                    body = <SocialPages refs={r.social_json as SocialRef[] | null | undefined} />;
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
                        isName ? `sticky left-0 z-10 ${selected.has(keyOf(r)) ? 'bg-sky-50' : 'bg-white'} border-r font-medium` : ''
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

      {/* Hàng dưới: phân trang dồn hết về góc trái; cài đặt (bản dữ liệu, Cột, Làm mới, Xuất Excel, trợ giúp) ở góc phải. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-zinc-600">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={pageBtn} disabled={cur === 0} onClick={() => setPage(cur - 1)}>← Trước</button>
          <span className="tabular-nums">Trang {cur + 1} / {pages}</span>
          <button type="button" className={pageBtn} disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Sau →</button>
          <span className="tabular-nums text-zinc-500">{shown.length ? `${cur * PAGE_SIZE + 1}–${Math.min((cur + 1) * PAGE_SIZE, shown.length)} / ${shown.length} dòng` : '0 dòng'}</span>
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {settingsStart}
          <ColumnPicker hidden={hidden} onToggle={toggleColumn} onReset={() => saveHidden(new Set(DEFAULT_HIDDEN))} onShowAll={() => saveHidden(new Set())} />
          {settingsEnd}
        </div>
      </div>

      {/* Thanh chọn nhiều dòng nằm dưới cùng, sau hàng phân trang và cài đặt. */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs text-zinc-700">
          <span className="font-medium tabular-nums">Đã chọn {selected.size}{hiddenSelected > 0 ? ` (${hiddenSelected} đang bị lọc ẩn)` : ''}</span>
          <button type="button" onClick={copyNames} className="inline-flex items-center gap-1.5 rounded-md border border-sky-300 bg-white px-2.5 py-1 font-medium text-sky-800 hover:bg-sky-100">
            {copiedN != null ? `Đã sao chép ${copiedN} tên` : 'Sao chép tên sản phẩm'}
          </button>
          {shown.length > visible.length && selected.size < shown.length && (
            <button type="button" onClick={selectAllShown} className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 hover:bg-zinc-50">Chọn tất cả {shown.length} dòng đang lọc</button>
          )}
          <button type="button" onClick={() => setSelected(new Set())} className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 hover:bg-zinc-50">Bỏ chọn</button>
        </div>
      )}
    </div>
  );
}
