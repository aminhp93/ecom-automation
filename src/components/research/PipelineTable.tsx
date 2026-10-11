'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import columns from '@/lib/research/pipeline-columns.json';
import type { LocalRef, MetaPageRef, PipelineRow, QuoteRef, SocialRef } from '@/lib/research/db';
import { pageLine, pageTone, PAGE_TONE_CLASS } from '@/lib/research/metaPages';
import { socialLine, socialTitle, postsIn, socialState, followersText } from '@/lib/research/social';
import { localLine, localTitle, MODEL_LABEL } from '@/lib/research/local';
import { ScoreHelp } from '@/components/research/ScoreHelp';
import { CopyCommand } from '@/components/research/CopyCommand';
import { adsLibraryPageUrl } from '@/lib/research/adsLibraryUrl';
import { textToneOf, toneOf, TONE_CLASS } from '@/lib/research/pipeline-rules';

type Col = (typeof columns)[number];
const NAME_KEY = 'name_vi';
const PAGE_SIZE = 10;
// Cột ẩn mặc định (người dùng bật lại ở nút "Cột"; lựa chọn được nhớ trong trình duyệt). Cột tên sản phẩm luôn hiện.
const DEFAULT_HIDDEN = ['keyword', 'ref', 'cluster', 'landed_cost', 'nhom', 'diem_chua_ro'];
const HIDDEN_STORAGE_KEY = 'pipeline.hiddenColumns.v3';
const shortLabel = (label: string) => {
  const t = label.replace(/\s*\([^)]*\)\s*$/, ''); // chỉ bỏ phần giải thích trong ngoặc ở cuối nhãn
  return t.length > 56 ? `${t.slice(0, 55)}…` : t;
};
// Nền theo nhóm cột (khóa `tint` trong pipeline-columns.json): Amazon xanh lá, Meta Ads vàng.
const TINT_HEAD: Record<string, string> = { amazon: 'bg-green-100', meta: 'bg-yellow-100' };
const TINT_CELL: Record<string, string> = { amazon: 'bg-green-50', meta: 'bg-yellow-50' };

export type GroupTab = 'tat-ca' | 'theo-doi' | 'loai' | 'chua-tag';
// Ba nhóm tag ngang hàng: Theo dõi, Loại, Chưa tag (chưa có tag).
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

/** Cột đối thủ: nhóm 7 cột con, mỗi page đối thủ một dòng con trong dòng sản phẩm (các cột còn lại gộp dòng). Thay cho 3 cột text dài cũ. */
const COMP_KEY = 'meta_pages';
const COMP_FOLDED = ['competitor_social', 'local_brand_check'];
/** Cột báo giá nhà cung cấp: nhóm cột con (màu cam), mỗi báo giá một dòng con cạnh các page đối thủ. */
const QUOTE_KEY = 'quotes';
const QUOTE_HEADS: { label: string; title?: string }[] = [
  { label: 'Nhà cung cấp' },
  { label: 'Size' },
  { label: 'Giá hàng (US$)' },
  { label: 'Ship tới' },
  { label: 'Phí ship (US$)' },
  { label: 'Tổng về tới (US$)', title: 'Giá hàng + phí ship, chưa gồm thuế nhập khẩu/GST' },
  { label: 'Xử lý (ngày)' },
  { label: 'Giao (ngày)' },
  { label: 'Ngày báo' },
];
const usd = (n: number | null) => (n == null ? null : n.toFixed(2));
const PLAT_COLS = ['Link', 'follower', 'bài 90d'];
const COMP_HEADS: { label: string; title?: string }[] = [
  { label: 'Page đối thủ', title: 'Meta pages tìm được; ✓ = đã xác nhận đúng sản phẩm. Bấm tên để mở Ads Library' },
  { label: 'Ad active / tổng' },
  { label: 'Năm tạo page' },
  { label: 'Local check', title: '◌ = chưa kiểm' },
  ...(['FB', 'IG', 'TT'] as const).flatMap((pf) => PLAT_COLS.map((c) => ({
    label: `${pf} ${c}`,
    title: c === 'Link' ? 'Link tài khoản tìm được (cần verify). ◌ chưa quét · ∅ đã quét, không có tài khoản' : c === 'bài 90d' ? 'Số bài trong khoảng ngày, tính tại lúc quét; ≥ là cận dưới (mẫu chưa chạm tới bài cũ hơn)' : undefined,
  }))),
];

const UNSCANNED = <span className="text-zinc-400" title="Chưa quét">◌</span>;
const NOACCOUNT = <span className="text-zinc-500" title="Đã quét: không có tài khoản">∅</span>;

function PlatformCells({ p, cls }: { p?: Parameters<typeof socialState>[0]; cls: string }) {
  const td = `bg-violet-50 px-2 py-1 align-top whitespace-nowrap tabular-nums ${cls}`;
  const st = socialState(p);
  if (st !== 'ok' || !p) {
    const icon = st === 'none' ? NOACCOUNT : UNSCANNED;
    return <>{PLAT_COLS.map((c) => <td key={c} className={`${td} text-center`}>{icon}</td>)}</>;
  }
  const cnt = (n: 90) => {
    const v = postsIn(p, n);
    return v ? `${v.lb ? '≥' : ''}${v.n}` : <span className="text-zinc-300" title="Chưa có số">?</span>;
  };
  return (
    <>
      <td className={td}>{p.u ? <a href={p.u} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline" title={p.u}>{p.h ? `@${p.h}` : 'mở'}</a> : <span className="text-zinc-300">?</span>}</td>
      <td className={td} title={p.likes != null ? `${p.likes.toLocaleString('en-US')} like` : undefined}>{p.f != null ? followersText(p.f) : <span className="text-zinc-300">?</span>}</td>
      <td className={td}>{cnt(90)}</td>
    </>
  );
}

function QuoteCells({ q, cls }: { q: QuoteRef; cls: string }) {
  const td = `bg-orange-50 px-2 py-1 align-top whitespace-nowrap tabular-nums ${cls}`;
  const dash = <span className="text-zinc-300">—</span>;
  return (
    <>
      <td className={`${td} font-medium`}>{q.url ? <a href={q.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline" title={q.item ?? undefined}>{q.supplier}</a> : q.supplier}</td>
      <td className={td} title={q.note ?? undefined}>{q.size ?? dash}</td>
      <td className={td}>{usd(q.unit) ?? dash}</td>
      <td className={td}>{q.to ?? dash}</td>
      <td className={td}>{usd(q.ship) ?? dash}</td>
      <td className={`${td} font-semibold`}>{usd(q.total) ?? dash}</td>
      <td className={td}>{q.proc ?? dash}</td>
      <td className={td}>{q.days ?? dash}</td>
      <td className={td}>{dmShort(q.on)}</td>
    </>
  );
}

function CompetitorCells({ p, s, l, cls }: { p: MetaPageRef; s?: SocialRef; l?: LocalRef; cls: string }) {
  const td = `bg-violet-50 px-2 py-1 align-top whitespace-nowrap ${cls}`;
  const dash = <span className="text-zinc-300">—</span>;
  const tone = PAGE_TONE_CLASS[pageTone(p) ?? 'none'];
  return (
    <>
      <td className={`${td} font-medium max-w-[120px] overflow-hidden text-ellipsis`} title={p.n}>
        {/^\d+$/.test(p.id) ? <a href={adsLibrary(p.id)} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline" title={`${p.n} · mở Ads Library`}>{p.n}</a> : p.n}
        {p.m === 'yes' ? <span className="ml-1 text-emerald-700" title="Đã xác nhận đúng sản phẩm">✓</span> : null}
      </td>
      <td className={`${td} tabular-nums ${tone}`}>{p.a != null || p.t != null ? `${p.a ?? '?'} / ${p.t ?? '?'}` : p.s != null ? `${p.s} ad (mẫu)` : dash}</td>
      <td className={`${td} tabular-nums`}>{p.y ?? dash}</td>
      <td className={td} title={l ? localTitle(l) : 'Chưa kiểm local'}>{l?.model ? <>{MODEL_LABEL[l.model] ?? l.model}{l.celeb ? ' ★' : ''}</> : UNSCANNED}</td>
      <PlatformCells p={s?.fb} cls={cls} />
      <PlatformCells p={s?.ig} cls={cls} />
      <PlatformCells p={s?.tt} cls={cls} />
    </>
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
  const toggleable = columns.filter((c) => c.key !== NAME_KEY && !COMP_FOLDED.includes(c.key));
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
  const shownCols = useMemo(() => columns.filter((c) => !COMP_FOLDED.includes(c.key) && (c.key === NAME_KEY || !hidden.has(c.key))), [hidden]);

  const counts = useMemo(() => {
    const c2 = { theo_doi: 0, loai: 0, none: 0 };
    for (const r of rows) c2[tagOf(r) ?? 'none']++;
    return c2;
  }, [rows]);
  const categories = useMemo(() => [...new Set(rows.map((r) => r.category).filter(Boolean) as string[])].sort(), [rows]);

  const switchTab = (t: GroupTab) => {
    setTab(t);
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
        <Fragment>{toolbarLeft}</Fragment>
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
              {shownCols.map((c) => c.key === COMP_KEY ? COMP_HEADS.map((h, i) => (
                <th key={`${c.key}-${i}`} title={h.title} className="sticky top-0 z-20 bg-violet-100 border-b border-zinc-200 px-2 py-2 text-left font-medium text-zinc-600 align-bottom whitespace-nowrap">{h.label}</th>
              )) : c.key === QUOTE_KEY ? QUOTE_HEADS.map((h, i) => (
                <th key={`${c.key}-${i}`} title={h.title} className="sticky top-0 z-20 bg-orange-100 border-b border-zinc-200 px-2 py-2 text-left font-medium text-zinc-600 align-bottom whitespace-nowrap">{h.label}</th>
              )) : (
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
            {visible.map((r) => {
              const pages = (r.meta_pages_json as MetaPageRef[] | null | undefined) ?? [];
              const soc = new Map(((r.social_json as SocialRef[] | null | undefined) ?? []).map((x) => [x.id, x]));
              const loc = new Map(((r.local_json as LocalRef[] | null | undefined) ?? []).map((x) => [x.id, x]));
              const quotes = (r.quotes_json as QuoteRef[] | null | undefined) ?? [];
              const span = Math.max(1, pages.length, quotes.length);
              return (
                <Fragment key={`${r.loai_dong}-${r.ref}`}>
                  {Array.from({ length: span }, (_, i) => {
                    const last = i === span - 1;
                    const bd = last ? 'border-b border-zinc-200' : 'border-b border-zinc-100';
                    return (
                      <tr key={i} className={i === 0 ? 'group/row' : undefined}>
                        {shownCols.map((c) => {
                          if (c.key === COMP_KEY) {
                            const pg = pages[i];
                            if (!pg && i > 0 && pages.length > 0) return <td key={c.key} colSpan={COMP_HEADS.length} className={`${bd} bg-violet-50`} />; // dòng con thừa do báo giá nhiều hơn page
                            if (!pg) {
                              return (
                                <td key={c.key} colSpan={COMP_HEADS.length} className={`${bd} bg-violet-50 px-2 py-1 align-top text-zinc-400 whitespace-pre-line`}>
                                  {fmt(c, r[c.key]) || '—'}
                                </td>
                              );
                            }
                            return <CompetitorCells key={c.key} p={pg} s={soc.get(pg.id)} l={loc.get(pg.id)} cls={bd} />;
                          }
                          if (c.key === QUOTE_KEY) {
                            const qt = quotes[i];
                            if (qt) return <QuoteCells key={c.key} q={qt} cls={bd} />;
                            return <td key={c.key} colSpan={QUOTE_HEADS.length} className={`${bd} bg-orange-50 px-2 py-1 align-top ${i === 0 ? 'text-zinc-400' : ''}`}>{i === 0 ? 'Chưa có báo giá' : null}</td>;
                          }
                          if (i > 0) return null; // các cột sản phẩm gộp dòng (rowSpan) ở dòng con đầu tiên
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
                                </Link>
                                {/* Copy lệnh để dán vào Claude: Phân tích (đánh giá chi tiết, chỉ đọc) và Seen (đánh dấu đã xem, gõ thêm ghi chú 1 dòng). Sản phẩm: mã slug; ứng viên: id.
                                    Nằm đè ở góc dưới ô tên, chỉ hiện khi rê chuột vào dòng (không chiếm chỗ của tên). */}
                                <div className="absolute bottom-1 left-2 z-10 flex items-center gap-1 opacity-0 pointer-events-none group-hover/row:opacity-100 group-hover/row:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto">
                                  <CopyCommand compact label="Phân tích" command={`/dropship-research analyze ${r.ref} `} className="shadow-sm" />
                                </div>
                              </div>
                            );
                          } else if (c.key === 'nhom') {
                            const t = tagOf(r);
                            body = t ? <span className={`inline-block px-1.5 py-0.5 rounded border text-[11px] ${TAG_CLS[t]}`}>{TAG_LABEL[t]}</span> : null;
                          } else if (c.key === 'reason' && text) {
                            // Lý do: mỗi ý một gạch đầu dòng (tách theo xuống dòng; không có thì tách theo "; " và ". ")
                            const items = (text.includes('\n') ? text.split('\n') : text.split(/(?<=[.;])\s+/)).map((x) => x.replace(/^[-•\s]+/, '').replace(/[;]\s*$/, '').trim()).filter(Boolean);
                            body = (
                              <ul className="list-disc pl-4 space-y-0.5 whitespace-normal">
                                {items.map((it, i) => <li key={i}>{it}</li>)}
                              </ul>
                            );
                          } else if (c.type === 'url' && text) {
                            body = <a href={text} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">Mở video</a>;
                          } else {
                            const tone = numeric ? toneOf(c.key, r[c.key]) : textToneOf(c.key, r[c.key]);
                            body = text ? <span className={tone ? TONE_CLASS[tone] : ''}>{text}</span> : <span className="text-zinc-300">—</span>;
                          }
                          return (
                            <td
                              key={c.key}
                              rowSpan={span}
                              style={'maxw' in c ? { maxWidth: c.maxw } : undefined}
                              className={`border-b border-zinc-200 px-2 py-1.5 align-top ${TINT_CELL[(c as { tint?: string }).tint ?? ''] ?? ''} ${numeric ? 'text-right tabular-nums' : 'whitespace-pre-line'} ${
                                isName ? `sticky left-0 z-10 ${selected.has(keyOf(r)) ? 'bg-sky-50' : 'bg-white'} border-r font-medium` : ''
                              }`}
                            >
                              {body}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
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
          <Fragment>{settingsStart}</Fragment>
          <ColumnPicker hidden={hidden} onToggle={toggleColumn} onReset={() => saveHidden(new Set(DEFAULT_HIDDEN))} onShowAll={() => saveHidden(new Set())} />
          <Fragment>{settingsEnd}</Fragment>
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
