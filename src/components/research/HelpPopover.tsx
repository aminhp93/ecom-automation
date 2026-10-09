'use client';

import { useEffect, useRef, useState } from 'react';
import { CircleHelp } from 'lucide-react';

/** Icon "?" ở góc: bấm để xem giải thích, bấm ra ngoài hoặc Esc để đóng. Dùng thay đoạn mô tả dài để tiết kiệm chỗ. */
export function HelpPopover({ children, label = 'Giải thích', placement = 'down' }: { children: React.ReactNode; label?: string; placement?: 'down' | 'up' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={label}
        title={label}
        className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
      >
        <CircleHelp className="w-4.5 h-4.5" />
      </button>
      {open && (
        <div role="dialog" className={`absolute right-0 ${placement === 'up' ? 'bottom-8' : 'top-8'} z-40 w-[26rem] max-w-[90vw] max-h-[80vh] overflow-auto bg-white border border-zinc-200 rounded-lg shadow-lg p-3 text-xs text-zinc-600 space-y-1.5`}>
          {children}
        </div>
      )}
    </div>
  );
}
