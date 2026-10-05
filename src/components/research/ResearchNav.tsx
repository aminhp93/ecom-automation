'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Compass } from 'lucide-react';

// 3 tab chính: Tổng quan để định hướng → Sản phẩm để làm việc → Cơ sở đánh giá để tra cứu.
const TABS = [
  { href: '/research', label: 'Tổng quan', match: (p: string) => p === '/research' },
  {
    href: '/research/products',
    label: 'Sản phẩm',
    match: (p: string) => p.startsWith('/research/products') || p.startsWith('/research/p/') || p.startsWith('/research/discover'),
  },
  { href: '/research/criteria', label: 'Cơ sở đánh giá', match: (p: string) => BASIS_TABS.some((t) => p.startsWith(t.href)) },
];

// Tab con của "Cơ sở đánh giá" — dùng ở src/app/research/(co-so)/layout.tsx.
export const BASIS_TABS = [
  { href: '/research/criteria', label: 'Bộ tiêu chí', hint: 'Quy tắc đánh giá' },
  { href: '/research/data', label: 'Bằng chứng & dữ liệu', hint: 'Nguồn, ngày cập nhật, phần thiếu' },
  { href: '/research/sessions', label: 'Phiên với anh Thanh', hint: 'Kiến thức và lý do điều chỉnh cách đánh giá' },
];

export function ResearchNav() {
  const pathname = usePathname();
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
              aria-current={t.match(pathname) ? 'page' : undefined}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                t.match(pathname) ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
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
