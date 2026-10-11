import type { Point } from '@/lib/research/watch';
import { dm, n0 } from '@/lib/research/watch';

/** Biểu đồ đường theo ngày (SVG thuần, render phía server). Mỗi điểm có tooltip ngày + giá trị. */
export function MiniChart({ title, points, hint, width = 300, height = 84 }: { title: string; points: Point[]; hint?: string; width?: number; height?: number }) {
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const change = last && prev ? last.value - prev.value : null;
  const min = Math.min(...points.map((p) => p.value));
  const max = Math.max(...points.map((p) => p.value));
  const span = max - min || 1;
  const padX = 4, padY = 8;
  const x = (i: number) => padX + (points.length <= 1 ? (width - 2 * padX) / 2 : (i * (width - 2 * padX)) / (points.length - 1));
  const y = (v: number) => padY + (height - 2 * padY) * (1 - (v - min) / span);
  return (
    <div className="border border-zinc-200 rounded-lg bg-white p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-medium text-zinc-600" title={hint}>{title}</h3>
        {last && <span className="text-[11px] text-zinc-400">{dm(last.date)}</span>}
      </div>
      <div className="mt-0.5 flex items-baseline gap-2">
        <span className="text-xl font-semibold text-zinc-900 tabular-nums">{last ? n0(last.value) : '—'}</span>
        {change != null && (
          <span className={`text-xs tabular-nums ${change > 0 ? 'text-emerald-700' : change < 0 ? 'text-red-600' : 'text-zinc-400'}`} title={`So với ${dm(prev?.date)}`}>
            {change > 0 ? '+' : ''}{n0(change)}
          </span>
        )}
      </div>
      {points.length >= 2 ? (
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="mt-1 text-zinc-700" role="img" aria-label={title}>
          <polyline points={points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
          {points.map((p, i) => (
            <circle key={p.date} cx={x(i)} cy={y(p.value)} r={2.2} fill="currentColor"><title>{`${dm(p.date)}: ${n0(p.value)}`}</title></circle>
          ))}
        </svg>
      ) : (
        <p className="text-[11px] text-zinc-400 mt-2">Mới có {points.length} điểm, cần ít nhất 2 ngày để vẽ đường.</p>
      )}
      {points.length >= 2 && <div className="flex justify-between text-[10px] text-zinc-400 tabular-nums"><span>{dm(points[0].date)} · {n0(points[0].value)}</span><span>{points.length} điểm</span></div>}
    </div>
  );
}
