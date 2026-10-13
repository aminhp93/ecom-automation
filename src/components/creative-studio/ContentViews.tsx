'use client';

import { useMemo, useState } from 'react';
import { CHECK_LABEL, CHECK_STYLE, CHECK_TEXT, Content, Data, PROD_STATUS, act, fmtDate, fmtSize } from './types';
import { SceneFlow } from './SceneFlow';

const ORDER: Record<string, number> = { review: 0, assembled: 1, scenes: 2, idea: 3, approved: 4 };
const needsAction = (c: Content) => c.status === 'review' || (c.status !== 'idea' && c.status !== 'approved' && c.versions.length > 0) || (c.status === 'approved' && c.approved?.file !== c.latestFile);

export function Chip({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={`text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap ${cls}`}>{children}</span>;
}

/** Danh sách nội dung, mặc định đưa nội dung cần xử lý lên trước */
export function ContentList({ data, open }: { data: Data; open: (id: string) => void }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [angle, setAngle] = useState('');
  const [status, setStatus] = useState('');
  const rows = useMemo(
    () =>
      data.contents
        .filter((c) => (!type || c.type === type) && (!angle || c.angle === angle) && (!status || c.status === status) && (!q || `${c.title} ${c.hook ?? ''}`.toLowerCase().includes(q.toLowerCase())))
        .sort((a, b) => Number(needsAction(b)) - Number(needsAction(a)) || (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9)),
    [data.contents, q, type, angle, status],
  );
  const sel = 'border border-zinc-200 rounded px-2 py-1 text-xs bg-white';
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên, hook…" className={`${sel} w-56`} />
        <select value={type} onChange={(e) => setType(e.target.value)} className={sel}><option value="">Mọi loại</option><option value="video">Video</option><option value="image">Ảnh</option><option value="carousel">Carousel</option></select>
        <select value={angle} onChange={(e) => setAngle(e.target.value)} className={sel}><option value="">Mọi angle</option>{data.angles.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={sel}><option value="">Mọi trạng thái</option>{Object.entries(PROD_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
        <span className="text-[11px] text-zinc-400">{rows.length} nội dung · cần xử lý nằm trên cùng</span>
      </div>
      <div className="bg-white border border-zinc-200 rounded-lg overflow-x-auto">
        <table className="w-full text-xs min-w-[900px]">
          <thead><tr className="text-left text-zinc-500 border-b border-zinc-100">
            <th className="p-2 w-14"></th><th className="p-2">Nội dung</th><th className="p-2">Loại</th><th className="p-2">Angle</th><th className="p-2">Bản mới nhất</th><th className="p-2">Bản đã duyệt</th><th className="p-2">Trạng thái</th><th className="p-2">Cần duyệt</th><th className="p-2">Cập nhật</th><th className="p-2">Đăng được chưa</th>
          </tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.folder} onClick={() => open(c.folder)} className="border-b border-zinc-50 hover:bg-zinc-50 cursor-pointer">
                <td className="p-2">{c.versions[0] ? <video src={`${c.versions[0].url}#t=0.5`} preload="metadata" muted playsInline className="w-9 h-16 object-cover rounded bg-black" /> : <div className="w-9 h-16 bg-zinc-100 rounded" />}</td>
                <td className="p-2"><div className="font-medium text-zinc-900">{c.title}</div><div className="text-zinc-500">{c.hook ?? ''}</div></td>
                <td className="p-2">{c.type === 'video' ? 'Video' : c.type}</td>
                <td className="p-2 text-zinc-600">{data.angles.find((a) => a.id === c.angle)?.name ?? '—'}</td>
                <td className="p-2 font-mono">{c.versions[0]?.version ?? '—'}</td>
                <td className="p-2 font-mono">{c.approved ? c.approved.file.replace(/^video-\d+-/, '').replace('.mp4', '') : <span className="text-zinc-400">chưa có</span>}</td>
                <td className="p-2"><Chip cls={PROD_STATUS[c.status]?.chip ?? ''}>{PROD_STATUS[c.status]?.label ?? c.status}</Chip></td>
                <td className="p-2">{c.status === 'review' ? c.reviewer ?? '—' : '—'}</td>
                <td className="p-2 text-zinc-500">{c.updatedAt ?? '—'}</td>
                <td className="p-2">{c.eligibility.length === 0 ? <Chip cls="bg-emerald-50 text-emerald-800 border-emerald-200">Đủ điều kiện</Chip> : <Chip cls="bg-red-50 text-red-700 border-red-200">Chưa: {c.eligibility.length} lý do</Chip>}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={10} className="p-6 text-center text-zinc-400">Không có nội dung khớp bộ lọc.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChecksPanel({ c, edit, draft, setDraft }: { c: Content; edit?: boolean; draft?: Record<string, { status: string; note?: string }>; setDraft?: (d: Record<string, { status: string; note?: string }>) => void }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-2 text-xs">
      <div className="font-medium text-zinc-900">Điểm cần kiểm trước khi duyệt</div>
      {Object.keys(CHECK_LABEL).map((k) => {
        const cur = (edit ? draft?.[k] : c.checks?.[k]) ?? { status: 'pending' };
        return (
          <div key={k} className="flex gap-2 items-start">
            <span className="w-36 shrink-0 text-zinc-600">{CHECK_LABEL[k]}</span>
            {edit && setDraft ? (
              <>
                <select value={cur.status} onChange={(e) => setDraft({ ...draft!, [k]: { ...cur, status: e.target.value } })} className="border border-zinc-200 rounded px-1 py-0.5 bg-white">
                  <option value="ok">Đạt</option><option value="fail">Chưa đạt</option><option value="pending">Chưa kiểm</option>
                </select>
                <input value={cur.note ?? ''} onChange={(e) => setDraft({ ...draft!, [k]: { ...cur, note: e.target.value } })} placeholder="Ghi chú" className="flex-1 border border-zinc-200 rounded px-2 py-0.5" />
              </>
            ) : (
              <>
                <span className={`w-16 shrink-0 font-medium ${CHECK_STYLE[cur.status]}`}>{CHECK_TEXT[cur.status]}</span>
                <span className="text-zinc-600">{cur.note ?? ''}</span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Reasons({ c }: { c: Content }) {
  if (c.eligibility.length === 0) return <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">Đủ điều kiện chuẩn bị và đăng bài.</div>;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs space-y-1">
      <div className="font-medium text-red-900">Chưa đủ điều kiện đăng</div>
      {c.eligibility.map((t) => <p key={t} className="text-red-900">• {t}</p>)}
    </div>
  );
}

/** Phiên bản + review: dùng chung cho trang chi tiết và hàng chờ duyệt */
function Reviewer({ c, reload, big }: { c: Content; reload: () => void; big?: boolean }) {
  const [file, setFile] = useState(c.latestFile ?? '');
  const [note, setNote] = useState('');
  const [draft, setDraft] = useState<Record<string, { status: string; note?: string }>>(() => ({ ...(c.checks ?? {}) }));
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const v = c.versions.find((x) => x.file === file) ?? c.versions[0];
  const send = async (decision: string) => {
    setBusy(true);
    const e = await act({ action: 'review', content: c.folder, file, decision, note, checks: decision === 'comment' || decision === 'approve' || decision === 'reject' || decision === 'request' ? draft : undefined });
    setBusy(false);
    setMsg(e ?? 'Đã ghi nhận.');
    if (!e) { setNote(''); reload(); }
  };
  const btn = 'px-3 py-1.5 rounded border text-xs disabled:opacity-40';
  return (
    <div className={`grid gap-4 ${big ? 'md:grid-cols-[340px_1fr]' : 'md:grid-cols-[280px_1fr]'}`}>
      <div className="space-y-2">
        {v ? <video key={v.url} src={v.url} controls playsInline className="w-full rounded-lg bg-black aspect-[9/16] object-contain" /> : <div className="aspect-[9/16] bg-zinc-100 rounded-lg" />}
        <p className="text-[11px] text-zinc-500">Đang xem: {v?.file ?? '—'}</p>
      </div>
      <div className="space-y-3 text-xs">
        <div className="bg-white border border-zinc-200 rounded-lg p-4">
          <div className="font-medium text-zinc-900 mb-2">Các phiên bản</div>
          {c.versions.length === 0 && <p className="text-zinc-400">Chưa có file trong 3-output/videos/</p>}
          <ul className="space-y-1.5">
            {c.versions.map((x, i) => (
              <li key={x.file} className={`flex items-center gap-2 flex-wrap ${file === x.file ? 'font-medium' : ''}`}>
                <button type="button" onClick={() => setFile(x.file)} className="px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-50">▶</button>
                <span className="font-mono">{x.version}</span>
                {i === 0 && <Chip cls="bg-sky-50 text-sky-800 border-sky-200">mới nhất</Chip>}
                {c.approved?.file === x.file && <Chip cls="bg-emerald-50 text-emerald-800 border-emerald-200">đã duyệt</Chip>}
                <span className="text-zinc-400">{fmtDate(x.mtime)} · {fmtSize(x.size)}</span>
                <span className="text-zinc-600">{c.versionNotes?.[x.version] ?? ''}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-zinc-400 mt-2">Bản mới nhất là bản có số phiên bản cao nhất; <b>không</b> tự động là bản được duyệt.</p>
        </div>
        <ChecksPanel c={c} edit draft={draft} setDraft={setDraft} />
        <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-2">
          <div className="font-medium text-zinc-900">Quyết định cho {v?.file ?? '—'}</div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Nhận xét (bắt buộc khi từ chối)" className="w-full border border-zinc-200 rounded px-2 py-1" />
          <div className="flex flex-wrap gap-2">
            <button disabled={busy || !file} onClick={() => send('comment')} className={`${btn} border-zinc-300`}>Lưu nhận xét và kiểm tra</button>
            <button disabled={busy || !file} onClick={() => send('request')} className={`${btn} border-amber-300 text-amber-900`}>Gửi duyệt</button>
            <button disabled={busy || !file} onClick={() => send('reject')} className={`${btn} border-red-300 text-red-800`}>Từ chối</button>
            <button disabled={busy || !file} onClick={() => send('approve')} className={`${btn} border-emerald-400 bg-emerald-50 text-emerald-900`}>Duyệt bản này</button>
          </div>
          {msg && <p className={msg === 'Đã ghi nhận.' ? 'text-emerald-700' : 'text-red-700'}>{msg}</p>}
        </div>
        <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-1.5">
          <div className="font-medium text-zinc-900">Lịch sử nhận xét</div>
          {(c.reviews ?? []).length === 0 && <p className="text-zinc-400">Chưa có.</p>}
          {[...(c.reviews ?? [])].reverse().map((r, i) => (
            <p key={i} className="text-zinc-700"><span className="text-zinc-400">{fmtDate(r.at)} · {r.by} · {r.file.replace(/^video-\d+-/, '').replace('.mp4', '')} ·</span> <b>{{ comment: 'nhận xét', request: 'gửi duyệt', approve: 'duyệt', reject: 'từ chối' }[r.decision]}</b>{r.note ? `: ${r.note}` : ''}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Trang chi tiết nội dung */
export function ContentDetail({ c, data, back, reload, goPost }: { c: Content; data: Data; back: () => void; reload: () => void; goPost: (id: string) => void }) {
  const posts = data.posts.filter((p) => p.content === c.folder);
  return (
    <div className="space-y-4 text-xs">
      <button onClick={back} className="text-zinc-500 hover:text-zinc-900">← Danh sách nội dung</button>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-zinc-900">{c.title}</h2>
        <Chip cls={PROD_STATUS[c.status]?.chip ?? ''}>{PROD_STATUS[c.status]?.label ?? c.status}</Chip>
      </div>
      <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-1">
        <p><span className="text-zinc-500">Angle:</span> {data.angles.find((a) => a.id === c.angle)?.name ?? '—'}</p>
        <p><span className="text-zinc-500">Hook / caption trên hình:</span> {c.script?.caption ?? c.hook ?? '—'}</p>
        <p><span className="text-zinc-500">Độ dài:</span> {c.length ?? '—'} · <span className="text-zinc-500">Giọng:</span> {c.voice ?? '—'} · <span className="text-zinc-500">Nhạc:</span> {c.music ?? '—'}</p>
        <p><span className="text-zinc-500">Tư liệu:</span> {c.sourcesNote ?? c.scenes ?? '—'}</p>
        {c.promptDoc && <p><span className="text-zinc-500">Google Flow:</span> <a href={`/api/creative-studio/file?path=${encodeURIComponent(c.promptDoc)}`} target="_blank" rel="noreferrer" className="font-medium text-violet-700 underline">Mở workflow và 3 prompt tạo mới ↗</a></p>}
        {c.script?.beats && (
          <div className="pt-1"><div className="text-zinc-500">Kịch bản (nhịp):</div>{c.script.beats.map((b) => <p key={b.sec} className="pl-2">{b.sec} s: {b.desc}</p>)}</div>
        )}
      </div>
      <SceneFlow content={c} />
      <Reasons c={c} />
      <Reviewer key={`${c.folder}-${c.reviews?.length ?? 0}-${c.status}`} c={c} reload={reload} />
      <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-2">
        <div className="flex justify-between items-center"><div className="font-medium text-zinc-900">Bài đăng của nội dung này</div><button onClick={() => goPost(c.folder)} className="px-2 py-1 border border-zinc-300 rounded">Lập kế hoạch bài</button></div>
        {posts.length === 0 ? <p className="text-zinc-500">Chưa có bài nào. Bài chỉ tạo được từ phiên bản đã duyệt.</p> : posts.map((p) => <p key={p.id}>{p.channel} · {p.plannedDate || 'chưa có ngày'} · {p.status}</p>)}
      </div>
    </div>
  );
}

/** Cần duyệt: những phiên bản đang chờ quyết định, video lớn + điểm cần kiểm */
export function ReviewQueue({ data, reload }: { data: Data; reload: () => void }) {
  const list = data.contents.filter((c) => c.versions.length > 0 && c.status !== 'idea' && (c.status === 'review' || c.approved?.file !== c.latestFile));
  if (list.length === 0) return <p className="text-xs text-zinc-500">Không có phiên bản nào đang chờ duyệt.</p>;
  return (
    <div className="space-y-6">
      {list.map((c) => (
        <div key={c.folder} className="space-y-3">
          <div className="flex items-center gap-2 text-xs"><h2 className="text-sm font-semibold text-zinc-900">{c.title}</h2><Chip cls={PROD_STATUS[c.status]?.chip ?? ''}>{PROD_STATUS[c.status]?.label ?? c.status}</Chip><span className="text-zinc-500">chờ quyết định cho {c.latestFile}</span></div>
          <Reasons c={c} />
          <Reviewer key={`${c.folder}-${c.reviews?.length ?? 0}-${c.status}`} c={c} reload={reload} big />
        </div>
      ))}
    </div>
  );
}
