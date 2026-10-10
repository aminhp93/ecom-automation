import type { Metadata } from 'next';
import { AppShell } from '@/components/dashboard/AppShell';
import { Stage06CreativeView } from '@/components/stages/Stage06CreativeView';

export const metadata: Metadata = {
  title: 'Creative Studio — Ecom OS',
  description: 'Stage 06: tiến độ quy trình làm video hằng ngày',
};

export default function CreativeStudioPage() {
  return (
    <AppShell currentStage="06">
      <div className="min-h-full bg-[#fafafa] p-5">
        <div className="max-w-6xl mx-auto">
          <Stage06CreativeView />
        </div>
      </div>
    </AppShell>
  );
}
