'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { AiTokenAuditModal } from '@/components/modals/AiTokenAuditModal';

/** Khung có thanh điều hướng trái (pipeline) dùng cho các trang riêng của từng stage, ví dụ /market-research. */
export function AppShell({ currentStage, children }: { currentStage: string; children: React.ReactNode }) {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [providers, setProviders] = useState<any>(null);
  const [auditOpen, setAuditOpen] = useState(false);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setStats(d.stats);
          setProviders(d.providers);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-screen bg-[#fafafa] text-zinc-900 overflow-hidden">
      <Sidebar
        currentStage={currentStage}
        // Stage 01 và 06 là trang riêng; các stage còn lại hiển thị trong khung chính của trang chủ.
        onSelectStage={(stage) => router.push(stage === '01' ? '/market-research' : stage === '06' ? '/creative-studio' : `/?stage=${stage}`)}
        stats={stats}
        providers={providers}
        onOpenTokenAudit={() => setAuditOpen(true)}
      />
      <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
      <AiTokenAuditModal isOpen={auditOpen} onClose={() => setAuditOpen(false)} stats={stats} />
    </div>
  );
}
