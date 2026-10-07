import { Sparkles } from 'lucide-react';
import { getDiscovery, getOverview } from '@/lib/research/db';
import { ProductTabs, groupCounts } from '@/components/research/ProductTabs';
import { DiscoverySection } from '@/components/research/DiscoverySection';

export default async function DiscoverPage() {
  const [rows, discovery] = await Promise.all([getOverview(), getDiscovery()]);
  // Ứng viên còn chờ xem (chưa thêm vào pipeline, chưa bị loại).
  const openCandidates = discovery.runs.flatMap((r) => r.discovery_candidates).filter((c) => c.status === 'de_xuat' || c.status === 'moi').length;

  return (
    <>
      <section>
        <h1 className="text-lg font-semibold text-zinc-900">Sản phẩm</h1>
        <p className="text-sm text-zinc-600 mt-1 max-w-2xl">Ý tưởng mới được quét hằng tuần. Sản phẩm tiềm năng nào được chọn để nghiên cứu sẽ vào tab “Sản phẩm theo dõi”.</p>
      </section>

      <ProductTabs active="candidates" counts={groupCounts(rows, openCandidates)} />

      <DiscoverySection runs={discovery.runs} categories={discovery.categories} icon={<Sparkles className="w-4 h-4 text-violet-600" />} />
    </>
  );
}
