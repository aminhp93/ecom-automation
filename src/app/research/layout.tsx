import type { Metadata } from 'next';
import { ResearchNav } from '@/components/research/ResearchNav';

export const metadata: Metadata = {
  title: 'Market Research — Ecom OS',
  description: 'Bước 1: pipeline sản phẩm, bộ tiêu chí có phiên bản, hồ sơ đánh giá từng SP',
};

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <ResearchNav />
      <main className="max-w-6xl mx-auto px-5 py-5 space-y-4">{children}</main>
    </div>
  );
}
