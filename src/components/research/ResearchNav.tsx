'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Compass } from 'lucide-react';

const TABS = [
  { href: '/research', label: 'Tổng quan' },
  { href: '/research/discover', label: 'Tìm sản phẩm mới' },
  { href: '/research/products', label: 'Đánh giá sản phẩm' },
  { href: '/research/data', label: 'Chất lượng dữ liệu' },
  { href: '/research/criteria', label: 'Bộ tiêu chí' },
  { href: '/research/sessions', label: 'Phiên với anh Thanh' },
];

export function ResearchNav() {
  const pathname = usePathname();
  const active = (href: string) =>
    href === '/research' ? pathname === '/research'
      : href === '/research/products' ? pathname.startsWith(href) || pathname.startsWith('/research/p/')
      : pathname.startsWith(href);
  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-5 py-3 flex flex-wrap items-center gap-3">
        <Link href="/" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="w-3.5 h-3.5" /> Ecom OS
        </Link>
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <Compass className="w-4 h-4" /> 01 Market Research
        </div>
        <nav className="flex items-center gap-1 w-full sm:w-auto sm:ml-auto overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active(t.href) ? 'page' : undefined}
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
