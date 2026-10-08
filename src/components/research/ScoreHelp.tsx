'use client';

import { useEffect, useRef, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { SCORE_CRITERIA, SCORE_INTRO } from '@/lib/research/pipeline-rules';

/** Icon "?" trong tiêu đề cột điểm: bấm để xem cách tính. Popover cố định theo vị trí nút vì bảng có overflow nên không dùng absolute. */
export function ScoreHelp() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!pos) return;
    const close = (e?: Event) => { if (e && ref.current?.contains(e.target as Node)) return; setPos(null); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPos(null); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', () => setPos(null), { capture: true, once: true });
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', onKey); };
  }, [pos]);

  return (
    <span ref={ref} className="inline-block align-middle ml-1">
      <button
        type="button"
        aria-label="Cách tính điểm tiềm năng"
        title="Cách tính điểm"
        onClick={(e) => {
          e.stopPropagation(); // không kích hoạt sắp xếp cột
          const b = e.currentTarget.getBoundingClientRect();
          setPos(pos ? null : { x: Math.min(b.left, window.innerWidth - 360), y: b.bottom + 6 });
        }}
        className="rounded-full text-zinc-400 hover:text-zinc-700"
      >
        <CircleHelp className="w-3.5 h-3.5" />
      </button>
      {pos && (
        <div
          role="dialog"
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'fixed', left: Math.max(8, pos.x), top: pos.y, width: 340 }}
          className="z-50 max-h-[70vh] overflow-auto bg-white border border-zinc-200 rounded-lg shadow-lg p-3 text-xs font-normal text-zinc-600 space-y-1.5 whitespace-normal cursor-default"
        >
          <p className="font-medium text-zinc-800">Cách tính Điểm tiềm năng (0–9)</p>
          <p>{SCORE_INTRO}</p>
          <ol className="list-decimal pl-4 space-y-0.5">
            {SCORE_CRITERIA.map((t) => <li key={t}>{t}</li>)}
          </ol>
          <p>Màu: ≥ 6 xanh, ≤ 3 đỏ.</p>
        </div>
      )}
    </span>
  );
}
