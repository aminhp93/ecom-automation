import type { Metadata } from 'next';
import { AppShell } from '@/components/dashboard/AppShell';
import { MindsetView } from '@/components/stages/MindsetView';

export const metadata: Metadata = {
  title: 'Mindset — Ecom OS',
  description: 'Step 0: mindset adapted from Leon, read daily',
};

export default function MindsetPage() {
  return (
    <AppShell currentStage="00">
      <div className="min-h-full bg-[#fafafa] p-5">
        <div className="max-w-5xl mx-auto">
          <MindsetView />
        </div>
      </div>
    </AppShell>
  );
}
