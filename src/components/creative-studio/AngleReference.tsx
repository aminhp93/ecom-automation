'use client';

import { useState } from 'react';
import { Angle, Data, PROD_STATUS, Reference, act } from './types';
import { Chip } from './ContentViews';

const ANGLE_STATUS: Record<string, string> = { idea: 'Ý tưởng', testing: 'Đang thử', keep: 'Tiếp tục', kill: 'Dừng' };

function AngleCard({ a, data, reload, open }: { a: Angle; data: Data; reload: () => void; open: (id: string) => void }) {
  const [note, setNote] = useState(a.decisionNote ?? '');
  const [msg, setMsg] = useState('');
  const set = async (decision: 'continue' | 'stop' | 'none') => { const e = await act({ action: 'angle-decision', angle: a.id, decision, note }); setMsg(e ?? ''); if (!e) reload(); };
  const items = data.contents.filter((c) => c.angle === a.id);
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-2 text-xs">
      <div className="flex items-center justify-between"><div className="text-sm font-semibold text-zinc-900">{a.name}</div><Chip cls="border-blue-200 bg-blue-50 text-blue-800">{ANGLE_STATUS[a.status] ?? a.status}</Chip></div>
      <p className="text-zinc-700"><b>Giả thuyết:</b> {a.summary}</p>
      <div className="font-medium text-zinc-900">Bằng chứng</div>
      {a.evidence.map((t) => <p key={t} className="text-zinc-600">• {t}</p>)}
      <div className="font-medium text-zinc-900">Nội dung đã tạo theo angle</div>
      {items.length === 0 && <p className="text-zinc-400">Chưa có.</p>}
      {items.map((c) => (
        <p key={c.folder}><button className="text-blue-700 hover:underline" onClick={() => open(c.folder)}>{c.title}</button> · {PROD_STATUS[c.status]?.label} · bản mới nhất {c.versions[0]?.version ?? '—'} · bản duyệt {c.approved ? c.approved.file.replace(/^video-\d+-/, '').replace('.mp4', '') : 'chưa có'}</p>
      ))}
      <div className="border-t border-zinc-100 pt-2 space-y-1.5">
        <div className="font-medium text-zinc-900">Quyết định: {a.decision === 'continue' ? 'tiếp tục' : a.decision === 'stop' ? 'dừng' : 'chưa quyết định'}</div>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lý do / ghi chú" className="w-full border border-zinc-200 rounded px-2 py-1" />
        <div className="flex gap-2"><button onClick={() => set('continue')} className="px-2 py-1 border border-emerald-300 rounded text-emerald-900">Tiếp tục</button><button onClick={() => set('stop')} className="px-2 py-1 border border-red-300 rounded text-red-800">Dừng</button><button onClick={() => set('none')} className="px-2 py-1 border border-zinc-300 rounded">Bỏ quyết định</button></div>
        {msg && <p className="text-red-700">{msg}</p>}
        <p className="text-[11px] text-zinc-400">Quyết định giữ/bỏ angle nên dựa trên kết quả organic sau khi đăng (chưa có số liệu).</p>
      </div>
    </div>
  );
}

export function AnglesView({ data, reload, open }: { data: Data; reload: () => void; open: (id: string) => void }) {
  return <div className="grid gap-3 md:grid-cols-2">{data.angles.map((a) => <AngleCard key={a.id + a.status} a={a} data={data} reload={reload} open={open} />)}</div>;
}

/** Tham khảo: tư liệu đối thủ (chỉ để học) */
export function ReferenceView({ reference }: { reference: Reference | null }) {
  if (!reference) return <p className="text-xs text-zinc-500">Chưa có reference.json.</p>;
  return (
    <div className="space-y-4 text-xs">
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-zinc-600"><b>{reference.competitor}</b>: {reference.note}</div>
      <div className="bg-white border border-zinc-200 rounded-lg p-4 overflow-x-auto">
        <div className="font-medium text-zinc-900 mb-2">10 Reel đã tải và phân tích</div>
        <table className="w-full min-w-[850px]"><thead><tr className="text-left text-zinc-500"><th className="pr-2">#</th><th className="pr-2">Hook</th><th className="pr-2">Angle</th><th className="pr-2">Âm thanh</th><th className="pr-2">Dài</th><th>Nguồn để kiểm tra</th></tr></thead>
          <tbody>{reference.reels.map((r) => <tr key={r.n} className="border-t border-zinc-100 align-top"><td className="pr-2">{r.n}</td><td className="pr-2">{r.hook}</td><td className="pr-2 text-zinc-600">{r.angle}</td><td className="pr-2">{r.audio}</td><td className="pr-2">{r.seconds} s</td><td className="space-x-2">{r.file && <a href={`/api/creative-studio/file?path=${encodeURIComponent(`reference/blackout/guard-blinds/${r.file}`)}`} target="_blank" rel="noreferrer" className="text-blue-700 underline">Xem bản lưu</a>}{r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-700 underline">Mở Reel gốc</a> : <span className="text-zinc-400">URL gốc chưa đối chiếu</span>}</td></tr>)}</tbody></table>
      </div>
      {!!reference.publicReels?.length && <div className="bg-white border border-zinc-200 rounded-lg p-4 overflow-x-auto">
        <div className="font-medium text-zinc-900 mb-1">Reel công khai đã ghi link</div>
        <p className="text-[11px] text-zinc-500 mb-2">Danh sách theo view ghi nhận 09/10/2026. Chưa xác nhận các link này trùng với 10 file đã tải ở bảng trên.</p>
        <table className="w-full min-w-[650px]"><thead><tr className="text-left text-zinc-500"><th className="pr-2">#</th><th className="pr-2">Caption</th><th className="pr-2">View khi ghi</th><th>Link</th></tr></thead>
          <tbody>{reference.publicReels.map((r) => <tr key={r.rank} className="border-t border-zinc-100"><td className="pr-2">{r.rank}</td><td className="pr-2">{r.caption}</td><td className="pr-2">{r.viewsLabel}</td><td><a href={r.url} target="_blank" rel="noreferrer" className="text-blue-700 underline">Mở Reel ↗</a></td></tr>)}</tbody></table>
      </div>}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 overflow-x-auto">
        <div className="font-medium text-zinc-900 mb-2">5 video quảng cáo (Ads Library)</div>
        <table className="w-full min-w-[600px]"><thead><tr className="text-left text-zinc-500"><th className="pr-2">Library ID</th><th className="pr-2">Chạy từ</th><th className="pr-2">Dài</th><th className="pr-2">Cảnh</th><th>Ghi chú</th></tr></thead>
          <tbody>{reference.ads.map((a) => <tr key={a.id} className="border-t border-zinc-100"><td className="pr-2 font-mono">{a.id}</td><td className="pr-2">{a.start}</td><td className="pr-2">{a.seconds} s</td><td className="pr-2">{a.scenes}</td><td>{a.note}</td></tr>)}</tbody></table>
      </div>
      <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-1"><div className="font-medium text-zinc-900 mb-1">Tài liệu phân tích</div>{reference.docs.map((d) => <p key={d.path} className="text-zinc-700">{d.label} <span className="font-mono text-[10px] text-zinc-400">{d.path}</span></p>)}</div>
    </div>
  );
}
