'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Compass } from 'lucide-react';

const TABS = [
  { href: '/research', label: 'Pipeline & xếp hạng' },
  { href: '/research/criteria', label: 'Bộ tiêu chí' },
  { href: '/research/data', label: 'Dữ liệu' },
];

export function ResearchNav() {
  const pathname = usePathname();
  const active = (href: string) =>
    href === '/research' ? pathname === '/research' || /^\/research\/p\//.test(pathname) : pathname.startsWith(href);
  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-5 h-12 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="w-3.5 h-3.5" /> Ecom OS
        </Link>
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <Compass className="w-4 h-4" /> 01 Market Research
        </div>
        <nav className="flex items-center gap-1 ml-auto overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                active(t.href) ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
