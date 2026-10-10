'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, CircleDashed, Hand, Loader2, ArrowRight, FileText, ExternalLink } from 'lucide-react';

type StepStatus = 'done' | 'doing' | 'waiting' | 'todo';

interface Step {
  id: string;
  name: string;
  status: StepStatus;
  owner: string;
  what: string;
  gate: string;
  done: string[];
  next: string[];
  blockers: string[];
}

interface Flow {
  updated: string;
  title: string;
  goal: string;
  currentStep: string;
  summary: string;
  steps: Step[];
  decisions: { q: string; recommend: string }[];
  artifacts: { label: string; path: string }[];
}

interface Facts {
  reelVideos: number;
  adVideos: number;
  outputs: number;
}

const STATUS: Record<StepStatus, { label: string; chip: string; dot: string }> = {
  done: { label: 'Xong', chip: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  doing: { label: 'Đang làm', chip: 'bg-blue-50 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
  waiting: { label: 'Chờ bạn', chip: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  todo: { label: 'Chưa làm', chip: 'bg-zinc-100 text-zinc-600 border-zinc-200', dot: 'bg-zinc-300' },
};

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === 'done') return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  if (status === 'doing') return <Loader2 className="w-4 h-4 text-blue-600" />;
  if (status === 'waiting') return <Hand className="w-4 h-4 text-amber-600" />;
  return <CircleDashed className="w-4 h-4 text-zinc-400" />;
}

export function Stage06CreativeView() {
  const [flow, setFlow] = useState<Flow | null>(null);
  const [facts, setFacts] = useState<Facts | null>(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/video-flow')
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Lỗi tải trạng thái');
        setFlow(d.flow);
        setFacts(d.facts);
        setOpenId((prev) => prev ?? d.flow.currentStep);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi tải trạng thái'));
  }, []);

  if (error) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800">{error}</div>;
  if (!flow) return <div className="p-6 text-xs text-zinc-500">Đang tải trạng thái quy trình video…</div>;

  const count = (s: StepStatus) => flow.steps.filter((x) => x.status === s).length;
  const current = flow.steps.find((s) => s.id === flow.currentStep);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-zinc-900">Stage 06 · {flow.title}</h1>
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-800 font-medium">BẢN NHÁP</span>
        </div>
        <p className="text-xs text-zinc-500 mt-1">{flow.goal}</p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4 space-y-2">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
          <span className="text-zinc-500">Đang ở</span>
          <span className="font-semibold text-blue-900">
            Bước {flow.currentStep} · {current?.name}
          </span>
          <span className="text-zinc-300">|</span>
          <span className="text-zinc-700">Xong {count('done')} · Đang làm {count('doing')} · Chờ bạn {count('waiting')} · Chưa làm {count('todo')} (tổng {flow.steps.length} bước)</span>
        </div>
        <p className="text-xs text-zinc-700 leading-relaxed">{flow.summary}</p>
        {facts && (
          <p className="text-[11px] text-zinc-500">
            Tư liệu hiện có: {facts.adVideos} video quảng cáo đối thủ đã cắt cảnh · {facts.reelVideos} Reel đã tải · {facts.outputs} bản dựng/script trong outputs
          </p>
        )}
      </div>

      {/* Dải bước */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 overflow-x-auto">
        <ol className="flex items-start min-w-[760px]">
          {flow.steps.map((s, i) => {
            const st = STATUS[s.status];
            const isCurrent = s.id === flow.currentStep;
            return (
              <li key={s.id} className="flex-1 flex items-start">
                <button type="button" onClick={() => setOpenId(s.id)} className="flex flex-col items-center text-center gap-1.5 w-full group">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white ${st.dot} ${isCurrent ? 'ring-4 ring-blue-200' : ''}`}
                  >
                    {s.id}
                  </span>
                  <span className={`text-[11px] leading-tight px-1 ${isCurrent ? 'font-semibold text-zinc-900' : 'text-zinc-600'} group-hover:text-zinc-900`}>{s.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${st.chip}`}>{st.label}</span>
                </button>
                {i < flow.steps.length - 1 && <div className={`h-px flex-1 mt-4 -mx-2 ${s.status === 'done' ? 'bg-emerald-300' : 'bg-zinc-200'}`} />}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Chi tiết từng bước */}
      <div className="space-y-2">
        {flow.steps.map((s) => {
          const st = STATUS[s.status];
          const open = openId === s.id;
          return (
            <div key={s.id} className={`bg-white border rounded-lg ${s.id === flow.currentStep ? 'border-blue-300' : 'border-zinc-200'}`}>
              <button type="button" onClick={() => setOpenId(open ? null : s.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                <StatusIcon status={s.status} />
                <span className="text-xs font-semibold text-zinc-900 w-44 shrink-0">
                  {s.id} · {s.name}
                </span>
                <span className="text-xs text-zinc-500 flex-1 min-w-0 truncate">{s.what}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${st.chip}`}>{st.label}</span>
              </button>
              {open && (
                <div className="px-4 pb-4 pt-1 border-t border-zinc-100 grid gap-4 md:grid-cols-3 text-xs">
                  <div className="space-y-1">
                    <div className="font-medium text-zinc-900">Đã có</div>
                    {s.done.length ? s.done.map((t) => <p key={t} className="text-zinc-700 leading-relaxed">• {t}</p>) : <p className="text-zinc-400">Chưa có</p>}
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-zinc-900">Việc tiếp theo</div>
                    {s.next.length ? s.next.map((t) => <p key={t} className="text-zinc-700 leading-relaxed">• {t}</p>) : <p className="text-zinc-400">—</p>}
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-zinc-900">Đang chặn / cổng duyệt</div>
                    {s.blockers.map((t) => <p key={t} className="text-red-700 leading-relaxed">• {t}</p>)}
                    {s.gate && <p className="text-amber-800">✋ Cổng: {s.gate}</p>}
                    <p className="text-zinc-400">Ai làm: {s.owner}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quyết định cần bạn */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-3">
        <div className="text-xs font-semibold text-zinc-900">Cần bạn quyết định</div>
        {flow.decisions.map((d, i) => (
          <div key={d.q} className="text-xs">
            <p className="text-zinc-900"><span className="font-medium">{i + 1}.</span> {d.q}</p>
            {d.recommend && (
              <p className="text-zinc-600 mt-0.5 flex gap-1.5"><ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-zinc-400" /><span>Đề xuất: {d.recommend}</span></p>
            )}
          </div>
        ))}
      </div>

      {/* Tài liệu */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 space-y-2">
        <div className="text-xs font-semibold text-zinc-900">Tài liệu và kết quả</div>
        <ul className="grid gap-1.5 md:grid-cols-2">
          {flow.artifacts.map((a) => (
            <li key={a.path} className="text-xs flex items-start gap-2 text-zinc-700">
              {a.path.startsWith('http') ? <ExternalLink className="w-3.5 h-3.5 mt-0.5 text-zinc-400 shrink-0" /> : <FileText className="w-3.5 h-3.5 mt-0.5 text-zinc-400 shrink-0" />}
              <span>
                {a.path.startsWith('http') ? (
                  <a href={a.path} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">{a.label}</a>
                ) : (
                  <>
                    {a.label} <span className="text-zinc-400 font-mono text-[10px]">{a.path}</span>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-zinc-400">Cập nhật {flow.updated}. Dữ liệu đọc từ video-drafts/blackout-curtains/video-1/2-instruction/flow-status.json, agent cập nhật cuối mỗi phiên làm video.</p>
    </div>
  );
}
