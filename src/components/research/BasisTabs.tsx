'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BASIS_TABS } from './ResearchNav';

/** Tab con của "Cơ sở đánh giá": Bộ tiêu chí · Bằng chứng & dữ liệu · Phiên với anh Thanh. Chỉ hiện ở 3 trang đó. */
export function BasisTabs() {
  const pathname = usePathname();
  if (!BASIS_TABS.some((t) => pathname.startsWith(t.href))) return null;
  return (
    <nav className="flex gap-1 border-b border-zinc-200 overflow-x-auto" aria-label="Cơ sở đánh giá">
      {BASIS_TABS.map((t) => {
        const on = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            title={t.hint}
            aria-current={on ? 'page' : undefined}
            className={`px-3 py-2 -mb-px text-xs font-medium whitespace-nowrap border-b-2 ${
              on ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
