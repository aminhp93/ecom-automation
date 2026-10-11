'use client';

import { useState } from 'react';
import { CHANNEL_LABEL, Channel, Content, Data, POST_STATUS, Post, act, fmtDate } from './types';
import { Chip } from './ContentViews';

const CHANNELS: Post['channel'][] = ['instagram', 'tiktok', 'facebook'];
const todayStr = () => new Date().toISOString().slice(0, 10);

function Planner({ data, preset, reload }: { data: Data; preset: string; reload: () => void }) {
  const approved = data.contents.filter((c) => c.approved);
  const [content, setContent] = useState(preset && approved.find((c) => c.folder === preset) ? preset : approved[0]?.folder ?? '');
  const [sel, setSel] = useState<Record<string, boolean>>({ instagram: true, tiktok: true, facebook: false });
  const [caps, setCaps] = useState<Record<string, string>>({ instagram: '', tiktok: '', facebook: '' });
  const [date, setDate] = useState(todayStr());
  const [msg, setMsg] = useState('');
  const c = data.contents.find((x) => x.folder === content);
  if (approved.length === 0) {
    const first = data.contents[0];
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs space-y-1">
        <div className="font-medium text-amber-900">Chưa có nội dung nào đủ điều kiện để lập bài</div>
        <p className="text-amber-900">Chỉ phiên bản đã duyệt mới được chuyển sang chuẩn bị đăng. Lý do hiện tại{first ? ` (${first.title})` : ''}:</p>
        {(first?.eligibility ?? ['Chưa có nội dung.']).map((t) => <p key={t} className="text-amber-900">• {t}</p>)}
      </div>
    );
  }
  const create = async () => {
    const chosen = CHANNELS.filter((k) => sel[k]);
    if (!c || chosen.length === 0) return setMsg('Chọn ít nhất một kênh.');
    for (const ch of chosen) {
      const e = await act({ action: 'post-save', content, channel: ch, caption: caps[ch], plannedDate: date, status: 'planned' });
      if (e) return setMsg(`${CHANNEL_LABEL[ch]}: ${e}`);
    }
    setMsg(`Đã tạo ${chosen.length} bài (mỗi kênh một bài).`);
    reload();
  };
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-3 text-xs">
      <div className="font-medium text-zinc-900">Lập kế hoạch bài từ một nội dung đã duyệt</div>
      <div className="flex flex-wrap gap-3 items-center">
        <select value={content} onChange={(e) => setContent(e.target.value)} className="border border-zinc-200 rounded px-2 py-1 bg-white">{approved.map((x) => <option key={x.folder} value={x.folder}>{x.title}</option>)}</select>
        <span className="text-zinc-500">Bản duyệt: <b className="font-mono">{c?.approved?.file}</b></span>
        <label>Ngày dự kiến <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-zinc-200 rounded px-2 py-1 ml-1" /></label>
      </div>
      {c && c.eligibility.length > 0 && <p className="text-amber-800">Bài chỉ ở trạng thái "đã lên kế hoạch"; muốn chuyển "sẵn sàng/đã đăng" cần giải quyết: {c.eligibility[0]}</p>}
      <div className="grid gap-3 md:grid-cols-3">
        {CHANNELS.map((k) => (
          <div key={k} className="border border-zinc-200 rounded-lg p-3 space-y-1.5">
            <label className="flex items-center gap-2 font-medium"><input type="checkbox" checked={sel[k]} onChange={(e) => setSel({ ...sel, [k]: e.target.checked })} />{CHANNEL_LABEL[k]} <span className="text-zinc-400 font-normal">9:16</span></label>
            <textarea value={caps[k]} onChange={(e) => setCaps({ ...caps, [k]: e.target.value })} rows={3} placeholder="Caption riêng cho kênh" className="w-full border border-zinc-200 rounded px-2 py-1" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3"><button onClick={create} className="px-3 py-1.5 rounded border border-zinc-800 bg-zinc-900 text-white">Tạo bài theo kênh</button>{msg && <span className="text-zinc-600">{msg}</span>}</div>
    </div>
  );
}

function PostRow({ p, c, reload }: { p: Post; c?: Content; reload: () => void }) {
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ caption: p.caption, plannedDate: p.plannedDate, status: p.status, url: p.url, postedBy: p.postedBy, postedAt: p.postedAt });
  const [msg, setMsg] = useState('');
  const save = async () => {
    const e = await act({ action: 'post-save', id: p.id, content: p.content, channel: p.channel, ...f });
    if (e) setMsg(e);
    else { setEdit(false); setMsg(''); reload(); }
  };
  const del = async () => { if (confirm('Xoá bài này khỏi kế hoạch?')) { await act({ action: 'post-delete', id: p.id }); reload(); } };
  const inp = 'border border-zinc-200 rounded px-2 py-1 w-full';
  return (
    <div className="border-b border-zinc-100 p-3 text-xs space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium w-20">{CHANNEL_LABEL[p.channel]}</span>
        <span>{c?.title ?? p.content}</span>
        <span className="font-mono text-zinc-500">{p.file.replace(/^video-\d+-/, '').replace('.mp4', '')}</span>
        <span className="text-zinc-500">{p.plannedDate || 'chưa có ngày'}</span>
        <Chip cls={POST_STATUS[p.status].chip}>{POST_STATUS[p.status].label}</Chip>
        {p.status === 'posted' && <span className="text-zinc-500">{p.postedBy} · {p.postedAt && fmtDate(p.postedAt)} · <a href={p.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">link bài</a></span>}
        <span className="text-zinc-400">Organic: chưa kết nối</span>
        <span className="ml-auto flex gap-2"><button onClick={() => setEdit(!edit)} className="text-blue-700 hover:underline">{edit ? 'Đóng' : 'Sửa / ghi nhận đăng'}</button><button onClick={del} className="text-red-700 hover:underline">Xoá</button></span>
      </div>
      {edit && (
        <div className="grid gap-2 md:grid-cols-2 bg-zinc-50 rounded p-3">
          <textarea value={f.caption} onChange={(e) => setF({ ...f, caption: e.target.value })} rows={3} placeholder="Caption" className={`${inp} md:col-span-2`} />
          <label>Ngày dự kiến<input type="date" value={f.plannedDate} onChange={(e) => setF({ ...f, plannedDate: e.target.value })} className={inp} /></label>
          <label>Trạng thái<select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Post['status'] })} className={inp}>{Object.entries(POST_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
          {f.status === 'posted' && (<>
            <label>Link bài sau khi đăng<input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} className={inp} /></label>
            <label>Người đăng<input value={f.postedBy} onChange={(e) => setF({ ...f, postedBy: e.target.value })} className={inp} /></label>
            <label>Thời điểm đăng thực tế<input type="datetime-local" value={f.postedAt} onChange={(e) => setF({ ...f, postedAt: e.target.value })} className={inp} /></label>
          </>)}
          <div className="md:col-span-2 flex items-center gap-3"><button onClick={save} className="px-3 py-1.5 rounded border border-zinc-800 bg-zinc-900 text-white">Lưu</button>{msg && <span className="text-red-700">{msg}</span>}</div>
        </div>
      )}
    </div>
  );
}

/** Bài đăng & lịch */
export function PostsView({ data, reload, preset }: { data: Data; reload: () => void; preset: string }) {
  const [ch, setCh] = useState('');
  const [st, setSt] = useState('');
  const posts = [...data.posts].filter((p) => (!ch || p.channel === ch) && (!st || p.status === st)).sort((a, b) => (a.plannedDate || '9').localeCompare(b.plannedDate || '9'));
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10); });
  const sel = 'border border-zinc-200 rounded px-2 py-1 text-xs bg-white';
  return (
    <div className="space-y-4">
      <p className="text-[11px] text-zinc-500">Bản đầu: lập kế hoạch và ghi nhận đăng thủ công. Không tự đăng, tự comment hay DM. Trạng thái bài độc lập với trạng thái sản xuất của nội dung.</p>
      <Planner data={data} preset={preset} reload={reload} />
      <div className="bg-white border border-zinc-200 rounded-lg p-3">
        <div className="text-xs font-medium text-zinc-900 mb-2">14 ngày tới</div>
        <div className="grid grid-cols-7 md:grid-cols-14 gap-1" style={{ gridTemplateColumns: 'repeat(14, minmax(0,1fr))' }}>
          {days.map((d) => {
            const n = data.posts.filter((p) => p.plannedDate === d);
            return <div key={d} className={`border rounded p-1 text-[10px] min-h-[44px] ${n.length ? 'border-blue-200 bg-blue-50' : 'border-zinc-100'}`}><div className="text-zinc-500">{d.slice(5)}</div>{n.map((p) => <div key={p.id} className="truncate">{CHANNEL_LABEL[p.channel][0]}{p.status === 'posted' ? ' ✓' : ''}</div>)}</div>;
          })}
        </div>
      </div>
      <div className="flex gap-2">
        <select value={ch} onChange={(e) => setCh(e.target.value)} className={sel}><option value="">Mọi kênh</option>{CHANNELS.map((k) => <option key={k} value={k}>{CHANNEL_LABEL[k]}</option>)}</select>
        <select value={st} onChange={(e) => setSt(e.target.value)} className={sel}><option value="">Mọi trạng thái</option>{Object.entries(POST_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
      </div>
      <div className="bg-white border border-zinc-200 rounded-lg">
        {posts.length === 0 ? <p className="p-6 text-xs text-zinc-400 text-center">Chưa có bài nào.</p> : posts.map((p) => <PostRow key={p.id + p.updatedAt} p={p} c={data.contents.find((x) => x.folder === p.content)} reload={reload} />)}
      </div>
    </div>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return <span className={`text-[11px] px-2 py-0.5 rounded border ${ok ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-zinc-50 text-zinc-500 border-zinc-200'}`}>{ok ? '✓' : '✗'} {label}</span>;
}

/** Kết nối kênh: 3 thẻ của brand Noctanest */
export function ChannelsView({ channels }: { channels: { brand: string; channels: Channel[] } | null }) {
  if (!channels) return <p className="text-xs text-zinc-500">Chưa có brand-noctanest/channels.json.</p>;
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-zinc-500">Kênh thuộc brand {channels.brand}, không gắn riêng với sản phẩm hay video. "Đã tạo kênh", "đã kết nối đọc dữ liệu" và "có quyền đăng" là ba trạng thái khác nhau. Chưa có nút đăng tự động vì chưa kết nối và chưa có quyền.</p>
      <div className="grid gap-3 md:grid-cols-3">
        {channels.channels.map((c) => (
          <div key={c.id} className="bg-white border border-zinc-200 rounded-lg p-4 space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-semibold">{c.avatar ? '' : 'N'}</div>
              <div><div className="text-sm font-semibold text-zinc-900">{c.name}</div><div className="text-zinc-600">{c.handle}</div></div>
              <a href={c.url} target="_blank" rel="noreferrer" className="ml-auto px-2 py-1 border border-zinc-300 rounded hover:bg-zinc-50">Mở kênh ↗</a>
            </div>
            <div className="flex flex-wrap gap-1.5"><Badge ok={c.created} label="Đã tạo" /><Badge ok={c.dataConnected} label="Kết nối đọc dữ liệu" /><Badge ok={c.canPost} label="Có quyền đăng" /></div>
            <div className="space-y-0.5 text-zinc-700">
              <p><span className="text-zinc-500">Ảnh đại diện:</span> {c.avatar ?? 'chưa có / chưa xác nhận'}</p>
              <p><span className="text-zinc-500">Bio:</span> {c.bio ?? 'chưa có / chưa xác nhận'}</p>
              <p><span className="text-zinc-500">Link công khai / email:</span> {c.link ?? 'chưa có'}</p>
              <p><span className="text-zinc-500">Danh mục:</span> {c.category ?? 'chưa đặt'}</p>
              <p className="break-all"><span className="text-zinc-500">URL:</span> {c.url}</p>
              <p><span className="text-zinc-500">Kiểm tra gần nhất:</span> {c.lastChecked}. {c.checkNote}</p>
            </div>
            <div><div className="font-medium text-zinc-900 mb-1">Việc cần hoàn thiện</div>{c.todo.map((t) => <p key={t} className="text-zinc-700">• {t}</p>)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
