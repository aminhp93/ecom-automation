'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Download, Film, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { MAX_BYTES, roles, makeScene, sceneIssue, storyboardSchema, templateScenes, type Scene, type Storyboard } from '@/lib/creative/storyboard';

type Clip = { id: string; name: string; file: File; url: string; duration: number };
const button = 'inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed';
const input = 'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm';
const fingerprint = (f: File) => `${f.name}:${f.size}:${f.lastModified}`;
const seconds = (n: number) => `${n.toFixed(1)}s`;
function download(url: string, filename: string) {
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
}
function readClip(file: File): Promise<Clip> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video'); video.preload = 'metadata';
    const timeout = setTimeout(() => fail(), 15000);
    const clean = () => { clearTimeout(timeout); video.onerror = null; video.onloadedmetadata = null; video.removeAttribute('src'); video.load(); };
    const fail = () => { clean(); URL.revokeObjectURL(url); reject(new Error(`Không đọc được ${file.name}. Hãy dùng MP4, MOV hoặc WebM có định dạng trình duyệt hỗ trợ.`)); };
    video.onerror = fail;
    video.onloadedmetadata = () => {
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) { fail(); return; }
      clean(); resolve({ id: fingerprint(file), name: file.name, file, url, duration });
    };
    video.src = url;
  });
}

export function SceneBuilder({ productName }: { productName?: string }) {
  const [board, setBoard] = useState<Storyboard>(() => ({ version: 1, name: productName ? `${productName} - bản 01`.slice(0, 100) : 'Video mới - bản 01', ratio: '9:16', fit: 'contain', scenes: templateScenes('short') }));
  const [clips, setClips] = useState<Clip[]>([]);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingClips, setLoadingClips] = useState(false);
  const [result, setResult] = useState<{ url: string; name: string } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const urls = useRef(new Set<string>());
  const scene = board.scenes[selected];
  const clip = clips.find(c => c.id === scene?.clipId);
  const total = board.scenes.reduce((n, s) => n + s.duration, 0);
  const issues = board.scenes.map(s => sceneIssue(s, clips.find(c => c.id === s.clipId)?.duration));
  const ready = issues.every(i => !i) && storyboardSchema.safeParse(board).success;

  useEffect(() => {
    const owned = urls.current;
    return () => { owned.forEach(url => URL.revokeObjectURL(url)); };
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function edit(next: Storyboard) {
    setBoard(next); setDirty(true); setPlaying(false); videoRef.current?.pause(); setError(''); setNotice('');
    if (result) { URL.revokeObjectURL(result.url); urls.current.delete(result.url); setResult(null); }
  }
  function updateScene(index: number, patch: Partial<Scene>) {
    edit({ ...board, scenes: board.scenes.map((s, i) => i === index ? { ...s, ...patch } : s) });
  }
  async function addClips(files: FileList | null, replace = false) {
    if (!files?.length) return;
    setLoadingClips(true); setError('');
    const added: Clip[] = [];
    try {
      const incoming = Array.from(files);
      if (incoming.reduce((n, f) => n + f.size, clips.reduce((n, c) => n + c.file.size, 0)) > MAX_BYTES) throw new Error('Kho video tối đa 300 MB trong mỗi phiên dựng.');
      for (const file of incoming) {
        const existing = clips.find(c => c.id === fingerprint(file)) || added.find(c => c.id === fingerprint(file));
        const item = existing || await readClip(file);
        if (!existing) { urls.current.add(item.url); added.push(item); }
        if (replace) updateScene(selected, { clipId: item.id, start: 0 });
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được video.'); }
    finally { setClips(current => [...current, ...added]); setLoadingClips(false); }
  }
  function move(index: number, direction: number) {
    const next = [...board.scenes]; [next[index], next[index + direction]] = [next[index + direction], next[index]];
    edit({ ...board, scenes: next }); setSelected(index + direction);
  }
  function save() {
    if (!storyboardSchema.safeParse(board).success) { setError('Kiểm tra tên video, đoạn cắt và tổng thời lượng trước khi lưu khung.'); return; }
    const url = URL.createObjectURL(new Blob([JSON.stringify(board, null, 2)], { type: 'application/json' }));
    download(url, `${board.name || 'storyboard'}.json`); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDirty(false); setNotice('Đã tải khung dựng. Giữ các video gốc để mở lại và gắn đúng file.');
  }
  async function restore(file?: File) {
    if (!file) return;
    try {
      const next = storyboardSchema.parse(JSON.parse(await file.text()));
      edit(next); setSelected(0); setNotice('Đã mở khung dựng. Tải lại các video gốc: file trùng tên, kích thước và ngày sửa sẽ tự gắn vào scene.');
    } catch { setError('File khung dựng không hợp lệ hoặc vượt quá 180 giây / 60 scene.'); }
  }
  async function render() {
    if (!ready) return;
    setBusy(true); setError(''); setPlaying(false); videoRef.current?.pause();
    try {
      const data = new FormData(); data.set('storyboard', JSON.stringify(board));
      for (const id of new Set(board.scenes.map(s => s.clipId))) {
        const source = clips.find(c => c.id === id)!; data.set(id!, source.file);
      }
      const response = await fetch('/api/creative/render', { method: 'POST', body: data });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})); throw new Error(body.error || 'Không xuất được video.');
      }
      const url = URL.createObjectURL(await response.blob()); urls.current.add(url);
      if (result) { URL.revokeObjectURL(result.url); urls.current.delete(result.url); }
      setResult({ url, name: board.name });
    } catch (e) { setError(e instanceof Error ? e.message : 'Không kết nối được máy chủ.'); }
    finally { setBusy(false); }
  }
  function nextScene() {
    if (playing && selected < board.scenes.length - 1) {
      setSelected(selected + 1);
    } else { videoRef.current?.pause(); setPlaying(false); }
  }

  return <div className="space-y-5">
    <header className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Bước 6 · Creative Studio</div><h1 className="mt-1 text-2xl font-semibold text-zinc-900">Ghép video theo scene</h1><p className="mt-2 max-w-2xl text-sm text-zinc-600">Tạo một khung dựng, gắn video vào từng scene rồi thay clip để tạo phiên bản mới. Giữ phần thân, đổi mở đầu để thử góc tiếp cận khác.</p></div>
        <div className="flex gap-2"><button className={button} onClick={() => importRef.current?.click()} disabled={busy}>Mở khung</button><button className={button} onClick={save} disabled={busy}><Download size={15}/>Lưu khung</button></div>
      </div>
      <p className="mt-4 text-xs text-zinc-500">1. Thêm video → 2. Gắn và cắt từng scene → 3. Xem thử → 4. Xuất MP4. Khung dựng tải về dạng JSON; video gốc chưa được lưu vào cơ sở dữ liệu. Lưu khung trước khi rời trang.</p>
    </header>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
    {notice && <div role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
    <input ref={uploadRef} type="file" accept="video/*,.mp4,.mov,.webm" multiple className="hidden" onChange={e => { void addClips(e.target.files); e.target.value = ''; }}/>
    <input ref={replaceRef} type="file" accept="video/*,.mp4,.mov,.webm" className="hidden" onChange={e => { void addClips(e.target.files, true); e.target.value = ''; }}/>
    <input ref={importRef} type="file" accept=".json" className="hidden" onChange={e => { void restore(e.target.files?.[0]); e.target.value = ''; }}/>
    <fieldset disabled={busy || loadingClips} className="grid min-w-0 gap-5 xl:grid-cols-[270px_minmax(0,1fr)_320px] disabled:opacity-70">
      <aside className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Kho video <span className="text-zinc-400">{clips.length}</span></h2><button className={button} onClick={() => uploadRef.current?.click()}><Upload size={15}/>Thêm</button></div>
        <p className="text-xs text-zinc-500">Bấm “Gắn” để dùng clip cho scene đang chọn. Có thể lấy nhiều đoạn khác nhau từ cùng một video.</p>
        {loadingClips && <p className="text-sm">Đang đọc video…</p>}
        {!clips.length && <button onClick={() => uploadRef.current?.click()} className="w-full rounded-xl border-2 border-dashed border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500"><Film className="mx-auto mb-3"/>Thêm video từ máy<br/><span className="text-xs">MP4, MOV, WebM · tổng tối đa 300 MB</span></button>}
        <div className="space-y-3">{clips.map(c => <div key={c.id} className="overflow-hidden rounded-lg border border-zinc-200">
          <video src={c.url} controls preload="metadata" className="aspect-video w-full bg-black"/>
          <div className="p-3"><p className="truncate text-xs font-medium" title={c.name}>{c.name}</p><div className="mt-2 flex items-center justify-between"><span className="text-xs text-zinc-500">{seconds(c.duration)}</span><button className={button} onClick={() => updateScene(selected, { clipId: c.id, start: 0 })}>Gắn vào scene {selected + 1}</button></div>
          <button className="mt-2 text-xs text-zinc-500 hover:text-red-600" onClick={() => { edit({ ...board, scenes: board.scenes.map(s => s.clipId === c.id ? { ...s, clipId: null } : s) }); setClips(clips.filter(item => item.id !== c.id)); URL.revokeObjectURL(c.url); urls.current.delete(c.url); }}>Bỏ khỏi kho</button></div>
        </div>)}</div>
      </aside>
      <section className="min-w-0 space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Khung dựng</h2><span className="text-sm text-zinc-500">{board.scenes.length} scene · {seconds(total)}</span></div>
        <label className="block text-xs text-zinc-600">Tên phiên bản<input aria-label="Tên phiên bản" className={`${input} mt-1`} maxLength={100} value={board.name} onChange={e => edit({ ...board, name: e.target.value })}/></label>
        <div className="flex flex-wrap gap-2">{([['short', 'Khung 19s'], ['story', 'Khung 30s'], ['free', 'Tự do']] as const).map(([type, label]) => <button key={type} className={button} onClick={() => { if (dirty && !window.confirm('Thay khung sẽ bỏ các scene đang dựng. Tiếp tục?')) return; edit({ ...board, scenes: templateScenes(type) }); setSelected(0); }}>{label}</button>)}</div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-zinc-600">Tỉ lệ<select aria-label="Tỉ lệ" className={`${input} mt-1`} value={board.ratio} onChange={e => edit({ ...board, ratio: e.target.value as Storyboard['ratio'] })}><option>9:16</option><option>1:1</option><option>16:9</option></select></label>
          <label className="text-xs text-zinc-600">Khung hình<select aria-label="Khung hình" className={`${input} mt-1`} value={board.fit} onChange={e => edit({ ...board, fit: e.target.value as Storyboard['fit'] })}><option value="contain">Giữ trọn hình</option><option value="cover">Lấp đầy · cắt mép</option></select></label>
        </div>
        <div className="space-y-2">{board.scenes.map((s, i) => {
          const source = clips.find(c => c.id === s.clipId);
          const from = board.scenes.slice(0, i).reduce((n, item) => n + item.duration, 0);
          return <div key={s.id} className={`rounded-xl border p-3 ${selected === i ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600' : 'border-zinc-200'}`}>
            <div className="flex items-start gap-3"><button className="min-w-0 flex-1 text-left" onClick={() => { setSelected(i); setPlaying(false); }} aria-label={`Chọn scene ${i + 1}`}><div className="flex items-center gap-2"><span className="text-xs font-bold text-emerald-700">{String(i + 1).padStart(2, '0')}</span><span className="text-sm font-semibold">{s.role}</span>{!issues[i] && <Check size={14} className="text-emerald-600"/>}</div><p className="mt-1 truncate text-xs text-zinc-500">{source?.name || 'Chọn video từ kho để điền scene'}</p><p className="mt-2 text-xs text-zinc-500">{seconds(from)} → {seconds(from + s.duration)} · dài {seconds(s.duration)}</p></button>
              <div className="flex gap-1"><button className="p-1 disabled:opacity-20" aria-label={`Đưa scene ${i + 1} lên`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={16}/></button><button className="p-1 disabled:opacity-20" aria-label={`Đưa scene ${i + 1} xuống`} disabled={i === board.scenes.length - 1} onClick={() => move(i, 1)}><ArrowDown size={16}/></button><button className="p-1 text-zinc-400 hover:text-red-600 disabled:opacity-20" aria-label={`Xóa scene ${i + 1}`} disabled={board.scenes.length === 1} onClick={() => { edit({ ...board, scenes: board.scenes.filter((_, index) => index !== i) }); setSelected(Math.max(0, selected >= i ? selected - 1 : selected)); }}><Trash2 size={16}/></button></div>
            </div>
            {issues[i] && <p className="mt-2 text-xs text-amber-700">{issues[i]}</p>}
          </div>;
        })}</div>
        <button className={`${button} w-full`} disabled={board.scenes.length >= 60} onClick={() => { edit({ ...board, scenes: [...board.scenes, makeScene()] }); setSelected(board.scenes.length); }}><Plus size={15}/>Thêm scene</button>
        <p className="text-xs text-zinc-500">Thay clip giữ nguyên thời lượng scene. Nếu clip ngắn hơn khung, chỉnh đoạn cắt hoặc chọn clip khác. Tối đa 60 scene / 180 giây.</p>
      </section>
      <aside className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="font-semibold">Scene {selected + 1} · {scene.role}</h2>
        <div className="mx-auto flex w-full items-center justify-center overflow-hidden rounded-lg bg-black" style={{ aspectRatio: board.ratio.replace(':', '/'), maxWidth: board.ratio === '9:16' ? 236 : '100%' }}>
          {clip ? <video key={`${scene.id}-${clip.id}-${scene.start}-${scene.duration}`} ref={videoRef} src={clip.url} muted={scene.muted} controls playsInline className={`h-full w-full ${board.fit === 'contain' ? 'object-contain' : 'object-cover'}`} onLoadedMetadata={e => { e.currentTarget.currentTime = scene.start; if (playing) void e.currentTarget.play().catch(() => setPlaying(false)); }} onTimeUpdate={e => { if (e.currentTarget.currentTime >= scene.start + scene.duration) { e.currentTarget.pause(); nextScene(); } }} onSeeking={e => { if (e.currentTarget.currentTime < scene.start - 0.05) e.currentTarget.currentTime = scene.start; }} onPlay={e => { if (e.currentTarget.currentTime >= scene.start + scene.duration) e.currentTarget.currentTime = scene.start; }} onEnded={nextScene}/> : <p className="p-6 text-center text-sm text-zinc-400">Gắn một video để xem đoạn cắt</p>}
        </div>
        <button className={`${button} w-full`} disabled={!ready} onClick={() => { if (playing) { setPlaying(false); videoRef.current?.pause(); } else { setPlaying(true); if (selected === 0 && videoRef.current) { videoRef.current.currentTime = board.scenes[0].start; void videoRef.current.play().catch(() => setPlaying(false)); } else setSelected(0); } }}>{playing ? 'Dừng xem thử' : 'Xem thử toàn bộ'}</button>
        <p className="text-xs text-zinc-500">Xem thử có thể dừng nhẹ khi chuyển clip. MP4 xuất ra được nối liền.</p>
        <label className="block text-xs text-zinc-600">Vai trò<select aria-label="Vai trò scene" className={`${input} mt-1`} value={scene.role} onChange={e => updateScene(selected, { role: e.target.value as Scene['role'] })}>{roles.map(r => <option key={r}>{r}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-3"><label className="text-xs text-zinc-600">Bắt đầu trong clip (s)<input aria-label="Bắt đầu trong clip" type="number" min={0} step={0.1} className={`${input} mt-1`} value={scene.start} onChange={e => updateScene(selected, { start: Number(e.target.value) })}/></label><label className="text-xs text-zinc-600">Thời lượng (s)<input aria-label="Thời lượng scene" type="number" min={0.2} max={120} step={0.1} className={`${input} mt-1`} value={scene.duration} onChange={e => updateScene(selected, { duration: Number(e.target.value) })}/></label></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={scene.muted} onChange={e => updateScene(selected, { muted: e.target.checked })}/>Tắt âm thanh scene này</label>
        <button className={`${button} w-full`} onClick={() => replaceRef.current?.click()}><Upload size={15}/>Thay bằng video khác</button>
        {clip && <button className={`${button} w-full`} onClick={() => updateScene(selected, { start: 0, duration: Math.min(clip.duration, 120) })}>Dùng toàn bộ clip (tối đa 120s)</button>}
      </aside>
    </fieldset>
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-semibold">Video hoàn chỉnh</h2><p className="mt-1 text-sm text-zinc-500">MP4 · 720p · 30fps · {seconds(total)} · âm thanh theo từng scene</p>{!ready && <p className="mt-1 text-xs text-amber-700">Điền đủ video, kiểm tra đoạn cắt và tổng thời lượng trước khi xuất.</p>}</div><button className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-40" disabled={!ready || busy || loadingClips} onClick={() => void render()}>{busy ? <Loader2 size={17} className="animate-spin"/> : <Film size={17}/>} {busy ? 'Đang ghép video…' : 'Xuất MP4'}</button></div>
      {busy && <p role="status" className="mt-3 text-sm text-zinc-500">Đang cắt, chuẩn hóa và nối các scene. Giữ trang mở; có thể mất vài phút.</p>}
      {result && <div className="mt-5 flex flex-wrap items-start gap-5"><video src={result.url} controls className="max-h-[500px] max-w-full rounded-lg bg-black"/><div><p className="mb-3 text-sm text-emerald-700">Video đã sẵn sàng.</p><button className={button} onClick={() => download(result.url, `${result.name}.mp4`)}><Download size={16}/>Tải MP4</button></div></div>}
    </section>
  </div>;
}
