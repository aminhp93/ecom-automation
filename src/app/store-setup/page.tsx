import type { Metadata } from 'next';
import { AppShell } from '@/components/dashboard/AppShell';
import { StoreSetupView } from '@/components/stages/StoreSetupView';

export const metadata: Metadata = {
  title: 'Store Setup — Ecom OS',
  description: 'Tiến độ setup base theme và các chức năng của store Shopify',
};

export default function StoreSetupPage() {
  return (
    <AppShell currentStage="store">
      <div className="min-h-full bg-[#fafafa] p-5">
        <div className="max-w-6xl mx-auto">
          <StoreSetupView />
        </div>
      </div>
    </AppShell>
  );
}
