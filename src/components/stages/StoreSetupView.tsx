'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, CircleDashed, Hand, Loader2, Lock, RefreshCw, ExternalLink } from 'lucide-react';

type ItemStatus = 'done' | 'doing' | 'waiting' | 'todo';

interface Item {
  id: string;
  label: string;
  status: ItemStatus;
  note?: string;
}

interface Group {
  id: string;
  name: string;
  blockedBy: string[];
  items: Item[];
}

interface StoreStatus {
  updated: string;
  title: string;
  goal: string;
  jira: string;
  summary: string;
  store: { created: boolean; url: string | null; theme: string | null; connector: string };
  rules: string[];
  prerequisites: { id: string; label: string; status: ItemStatus; owner: string }[];
  groups: Group[];
  decisions: { q: string; recommend: string }[];
  artifacts: { label: string; path: string }[];
}

const STATUS: Record<ItemStatus, { label: string; chip: string; bar: string }> = {
  done: { label: 'Xong', chip: 'bg-emerald-50 text-emerald-800 border-emerald-200', bar: 'bg-emerald-500' },
  doing: { label: 'Đang làm', chip: 'bg-blue-50 text-blue-800 border-blue-200', bar: 'bg-blue-500' },
  waiting: { label: 'Chờ bạn', chip: 'bg-amber-50 text-amber-800 border-amber-200', bar: 'bg-amber-500' },
  todo: { label: 'Chưa làm', chip: 'bg-zinc-100 text-zinc-600 border-zinc-200', bar: 'bg-zinc-300' },
};

function StatusIcon({ status }: { status: ItemStatus }) {
  if (status === 'done') return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
  if (status === 'doing') return <Loader2 className="w-4 h-4 text-blue-600 shrink-0" />;
  if (status === 'waiting') return <Hand className="w-4 h-4 text-amber-600 shrink-0" />;
  return <CircleDashed className="w-4 h-4 text-zinc-400 shrink-0" />;
}

// Trạng thái nhóm suy ra từ các mục: tất cả xong = Xong; có mục đang làm hoặc đã xong một phần = Đang làm; còn lại Chưa làm.
function groupStatus(g: Group): ItemStatus {
  const n = g.items.length;
  const done = g.items.filter((i) => i.status === 'done').length;
  if (n > 0 && done === n) return 'done';
  if (g.items.some((i) => i.status === 'doing') || done > 0) return 'doing';
  if (g.items.some((i) => i.status === 'waiting')) return 'waiting';
  return 'todo';
}

function DusklyView() {
  const [data, setData] = useState<StoreStatus | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/store-flow?store=duskly', { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Lỗi tải trạng thái');
      setData(d.status);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải trạng thái');
    } finally {
      setLoading(false);
    }
  }, []);

  // Tải khi mở trang và tự làm mới mỗi 30 giây để thấy cập nhật của agent.
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  if (error && !data) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800">{error}</div>;
  if (!data) return <div className="p-6 text-xs text-zinc-500">Đang tải tiến độ store…</div>;

  const allItems = data.groups.flatMap((g) => g.items);
  const count = (s: ItemStatus) => allItems.filter((i) => i.status === s).length;
  const total = allItems.length;
  const pct = total ? Math.round(((count('done') + 0.5 * count('doing')) / total) * 100) : 0;
  const prereqOpen = data.prerequisites.filter((p) => p.status !== 'done');
  const prereqById = Object.fromEntries(data.prerequisites.map((p) => [p.id, p]));
  const groupById = Object.fromEntries(data.groups.map((g) => [g.id, g]));

  // Một mục chặn là điều kiện bắt đầu chưa xong (P…) hoặc nhóm khác chưa xong (A…).
  const blockers = (g: Group) =>
    g.blockedBy
      .filter((id) => (prereqById[id] ? prereqById[id].status !== 'done' : groupById[id] ? groupStatus(groupById[id]) !== 'done' : false))
      .map((id) => (prereqById[id] ? prereqById[id].label : `Nhóm ${id}: ${groupById[id].name}`));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-zinc-900">Store Setup · {data.title}</h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-800 font-medium">BẢN NHÁP</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">{data.goal}</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="shrink-0 inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-md border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
          title="Đọc lại store-status.json"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Làm mới
        </button>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4 space-y-2.5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
          <span className="font-semibold text-blue-900">{pct}%</span>
          <span className="text-zinc-700">
            Xong {count('done')} · Đang làm {count('doing')} · Chờ bạn {count('waiting')} · Chưa làm {count('todo')} (tổng {total} việc, {data.groups.length} nhóm)
          </span>
          <span className="text-zinc-300">|</span>
          <span className="text-zinc-500">Cập nhật {data.updated}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white border border-blue-100 overflow-hidden">
          <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-zinc-700 leading-relaxed">{data.summary}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-600">
          <span>Store: {data.store.created ? data.store.url ?? 'đã tạo' : 'chưa tạo'}</span>
          <span>Theme nháp: {data.store.theme ?? 'chưa có'}</span>
          <span>Connector Shopify: {data.store.connector}</span>
          <a href={`https://phamsworkspace-42448765.atlassian.net/browse/${data.jira}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-700 hover:underline">
            {data.jira} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {prereqOpen.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-zinc-800 mb-2">Điều kiện bắt đầu ({prereqOpen.length} chưa xong)</div>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {data.prerequisites.map((p) => (
              <li key={p.id} className="flex items-start gap-2 text-xs">
                <StatusIcon status={p.status} />
                <span className="text-zinc-700">
                  {p.label} <span className="text-zinc-400">· {p.owner}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        {data.groups.map((g) => {
          const gs = groupStatus(g);
          const st = STATUS[gs];
          const done = g.items.filter((i) => i.status === 'done').length;
          const open = openId === g.id;
          const b = blockers(g);
          return (
            <div key={g.id} className="bg-white border border-zinc-200 rounded-lg">
              <button type="button" onClick={() => setOpenId(open ? null : g.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white ${st.bar}`}>{g.id}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-semibold text-zinc-900">{g.name}</span>
                  {b.length > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-zinc-500 mt-0.5 truncate">
                      <Lock className="w-3 h-3 shrink-0" /> Chờ: {b.slice(0, 2).join('; ')}
                      {b.length > 2 ? ` và ${b.length - 2} mục khác` : ''}
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  {done}/{g.items.length}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${st.chip}`}>{st.label}</span>
              </button>
              {open && (
                <ul className="border-t border-zinc-100 px-4 py-3 space-y-1.5">
                  {g.items.map((i) => (
                    <li key={i.id} className="flex items-start gap-2 text-xs">
                      <StatusIcon status={i.status} />
                      <span className="font-mono text-[10px] text-zinc-400 pt-0.5 w-6 shrink-0">{i.id}</span>
                      <span className={i.status === 'done' ? 'text-zinc-400 line-through' : 'text-zinc-700'}>
                        {i.label}
                        {i.note && <span className="block text-[11px] text-zinc-400">{i.note}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-zinc-800 mb-2">Quyết định còn chờ</div>
          <ul className="space-y-2">
            {data.decisions.map((d) => (
              <li key={d.q} className="text-xs">
                <div className="text-zinc-800">{d.q}</div>
                <div className="text-[11px] text-zinc-500">{d.recommend}</div>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-3">
          <div>
            <div className="text-xs font-semibold text-zinc-800 mb-2">Quy tắc</div>
            <ul className="space-y-1 list-disc pl-4 text-[11px] text-zinc-600">
              {data.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-800 mb-1">Tài liệu</div>
            <ul className="space-y-0.5 text-[11px] text-zinc-600">
              {data.artifacts.map((a) => (
                <li key={a.path}>
                  {a.label}: <code className="text-zinc-500">{a.path}</code>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

type Obs = 'yes' | 'partial' | 'no' | 'unknown';

interface Benchmark {
  id: string;
  name: string;
  url: string;
  checked: string;
  method: string;
  theme: string;
  apps: string[];
  pages: string[];
  legend: Record<string, string>;
  items: Record<string, { s: Obs; n: string }>;
  extras: { label: string; note: string }[];
}

interface ChecklistGroup {
  id: string;
  name: string;
  items: { id: string; label: string }[];
}

const OBS: Record<Obs, { label: string; chip: string }> = {
  yes: { label: 'Có', chip: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  partial: { label: 'Một phần', chip: 'bg-amber-50 text-amber-800 border-amber-200' },
  no: { label: 'Không thấy', chip: 'bg-rose-50 text-rose-800 border-rose-200' },
  unknown: { label: 'Chưa rõ', chip: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
};

// Store tham khảo: chỉ so với checklist của mình, không có tiến độ.
function BenchmarkView({ store }: { store: string }) {
  const [data, setData] = useState<{ benchmark: Benchmark; checklist: ChecklistGroup[] } | null>(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>('A');

  useEffect(() => {
    setData(null);
    fetch(`/api/store-flow?store=${store}`, { cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Lỗi tải dữ liệu');
        setData(d);
        setError('');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu'));
  }, [store]);

  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800">{error}</div>;
  if (!data) return <div className="p-6 text-xs text-zinc-500">Đang tải…</div>;
  const { benchmark: b, checklist } = data;

  const all = checklist.flatMap((g) => g.items.map((i) => b.items[i.id]?.s ?? 'unknown'));
  const n = (o: Obs) => all.filter((x) => x === o).length;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-zinc-900">{b.name} · so sánh với checklist của mình</h1>
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 bg-zinc-100 text-zinc-600 font-medium">STORE THAM KHẢO</span>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          <a href={b.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline inline-flex items-center gap-1">
            {b.url} <ExternalLink className="w-3 h-3" />
          </a>{' '}
          · xem ngày {b.checked}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-2 text-xs">
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <span className="text-zinc-700">
            Có {n('yes')} · Một phần {n('partial')} · Không thấy {n('no')} · Chưa rõ {n('unknown')} (tổng {all.length} việc của checklist)
          </span>
        </div>
        <p className="text-zinc-700">
          <span className="font-semibold">Theme:</span> {b.theme}
        </p>
        <p className="text-zinc-700">
          <span className="font-semibold">Ứng dụng nhận ra:</span> {b.apps.join(' · ')}
        </p>
        <p className="text-[11px] text-zinc-500">{b.method}</p>
      </div>

      <div className="space-y-2">
        {checklist.map((g) => {
          const open = openId === g.id;
          const cnt = g.items.filter((i) => b.items[i.id]?.s === 'yes').length;
          return (
            <div key={g.id} className="bg-white border border-zinc-200 rounded-lg">
              <button type="button" onClick={() => setOpenId(open ? null : g.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white bg-zinc-400">{g.id}</span>
                <span className="flex-1 text-xs font-semibold text-zinc-900">{g.name}</span>
                <span className="text-[11px] font-mono text-zinc-500">
                  {cnt}/{g.items.length} có
                </span>
              </button>
              {open && (
                <ul className="border-t border-zinc-100 px-4 py-3 space-y-2">
                  {g.items.map((i) => {
                    const o = b.items[i.id] ?? { s: 'unknown' as Obs, n: '' };
                    return (
                      <li key={i.id} className="flex items-start gap-2 text-xs">
                        <span className="font-mono text-[10px] text-zinc-400 pt-0.5 w-6 shrink-0">{i.id}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-zinc-800">{i.label}</span>
                          {o.n && <span className="block text-[11px] text-zinc-500 mt-0.5">{o.n}</span>}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${OBS[o.s].chip}`}>{OBS[o.s].label}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-zinc-800 mb-2">Các trang họ có</div>
          <ul className="space-y-1 list-disc pl-4 text-[11px] text-zinc-600">
            {b.pages.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="text-xs font-semibold text-zinc-800 mb-2">Họ có mà checklist của mình chưa có</div>
          <ul className="space-y-2">
            {b.extras.map((x) => (
              <li key={x.label} className="text-xs">
                <div className="text-zinc-800">{x.label}</div>
                <div className="text-[11px] text-zinc-500">{x.note}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

const STORES = [
  { id: 'duskly', label: 'Duskly (store chính)' },
  { id: 'guard', label: 'Guard Blinds (tham khảo)' },
  { id: 'halo', label: 'Halo Blinds (tham khảo)' },
];

export function StoreSetupView() {
  const [store, setStore] = useState('duskly');

  // Store đang chọn nằm trên URL (?store=guard) để chia sẻ và tải lại không mất.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('store');
    if (q && STORES.some((s) => s.id === q)) setStore(q);
  }, []);

  const choose = (id: string) => {
    setStore(id);
    try {
      window.history.replaceState(null, '', id === 'duskly' ? '/store-setup' : `/store-setup?store=${id}`);
    } catch {
      /* không bắt buộc */
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label htmlFor="store-select" className="text-[11px] text-zinc-500">
          Store
        </label>
        <select
          id="store-select"
          value={store}
          onChange={(e) => choose(e.target.value)}
          className="text-xs border border-zinc-200 rounded-md px-2 py-1.5 bg-white font-medium"
        >
          {STORES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      {store === 'duskly' ? <DusklyView /> : <BenchmarkView store={store} />}
    </div>
  );
}
