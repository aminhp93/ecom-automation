'use client';

import { useState, type MouseEvent, type ReactNode } from 'react';

export interface DossierTab {
  key: string;
  label: string;
  count?: number;
}

/**
 * Tab của hồ sơ SP. Mọi tab đã được server render sẵn trong một lần → đổi tab chỉ ẩn/hiện, không gọi lại server.
 * URL vẫn cập nhật ?tab= (replaceState) để tải lại/chia sẻ link mở đúng tab.
 * Link trong nội dung có data-tab="…" cũng chuyển tab tại chỗ.
 */
export function DossierTabs({ tabs, initial, panels }: { tabs: DossierTab[]; initial: string; panels: Record<string, ReactNode> }) {
  const [active, setActive] = useState(initial);

  const go = (key: string) => {
    setActive(key);
    const url = new URL(window.location.href);
    if (key === tabs[0]?.key) url.searchParams.delete('tab');
    else url.searchParams.set('tab', key);
    window.history.replaceState(null, '', url);
    window.scrollTo({ top: Math.min(window.scrollY, 280) });
  };

  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    const a = (e.target as HTMLElement).closest('a[data-tab]');
    if (!a || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    go(a.getAttribute('data-tab')!);
  };

  return (
    <div className="space-y-4" onClickCapture={onClickCapture}>
      <nav className="flex flex-wrap gap-1 border-b border-zinc-200" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            onClick={() => go(t.key)}
            className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px ${active === t.key ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
          >
            {t.label}{t.count !== undefined ? <span className="ml-1 text-zinc-400">{t.count}</span> : null}
          </button>
        ))}
      </nav>
      {tabs.map((t) => (
        <div key={t.key} role="tabpanel" hidden={active !== t.key}>
          {panels[t.key]}
        </div>
      ))}
    </div>
  );
}
