'use client';

import { usePathname } from 'next/navigation';

// Bảng tổng hợp cần hết bề ngang khung chính; các trang còn lại giữ cột giới hạn cho dễ đọc.
export function ResearchMain({ children }: { children: React.ReactNode }) {
  const wide = usePathname().startsWith('/market-research/pipeline');
  return <main className={`${wide ? 'w-full px-3' : 'max-w-6xl mx-auto px-5'} py-5 space-y-4`}>{children}</main>;
}
