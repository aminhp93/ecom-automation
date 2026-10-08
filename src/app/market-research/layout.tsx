import type { Metadata } from 'next';
import { AppShell } from '@/components/dashboard/AppShell';
import { ResearchNav } from '@/components/research/ResearchNav';
import { BasisTabs } from '@/components/research/BasisTabs';
import { ResearchMain } from '@/components/research/ResearchMain';

export const metadata: Metadata = {
  title: 'Market Research — Ecom OS',
  description: 'Bước 1: pipeline sản phẩm, bộ tiêu chí có phiên bản, hồ sơ đánh giá từng SP',
};

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell currentStage="01">
      <div className="min-h-full bg-[#fafafa]">
        <ResearchNav />
        <ResearchMain>
          <BasisTabs />
          {children}
        </ResearchMain>
      </div>
    </AppShell>
  );
}
