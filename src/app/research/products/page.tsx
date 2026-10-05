import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { getCriteria, getCriteriaVersions, getDiscovery, getOverview } from '@/lib/research/db';
import { PIPELINE, pipelineGroup } from '@/lib/research/labels';
import { ProductRankingTable } from '@/components/research/ProductRankingTable';
import { CopyCommand } from '@/components/research/CopyCommand';
import { DiscoverySection } from '@/components/research/DiscoverySection';

export default async function ProductsPage() {
  const [rows, versions, discovery] = await Promise.all([getOverview(), getCriteriaVersions(), getDiscovery()]);
  const current = versions.find((v) => v.is_current);
  const criteria = current ? await getCriteria(current.version) : [];
  const names = Object.fromEntries(criteria.map((c) => [c.key, c.name_vi]));

  // Ứng viên còn chờ xem (chưa thêm vào pipeline, chưa bị loại).
  const openCandidates = discovery.runs.flatMap((r) => r.discovery_candidates).filter((c) => c.status === 'de_xuat' || c.status === 'moi').length;
  const flow = [
    ...PIPELINE.map((g) => ({ href: `#${g.key}`, label: g.label, n: rows.filter((r) => pipelineGroup(r) === g.key).length })),
  ];

  return (
    <>
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Sản phẩm</h1>
          <p className="text-sm text-zinc-600 mt-1 max-w-2xl">
            Đi từ ý tưởng đến quyết định thử. Mở tên sản phẩm để xem hồ sơ, bằng chứng và phần còn thiếu.
          </p>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
            Điểm tiềm năng tính theo <Link href="/research/criteria" className="underline">bộ tiêu chí {current?.version}</Link> — điểm cao nhưng thiếu bằng
            chứng vẫn ở “Theo dõi”. “Đang nghiên cứu” là công việc trong nhóm Theo dõi, không phải nhóm riêng.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyCommand label="Thêm ý tưởng SP" command="/dropship-research add <tên SP> <keyword EN>" />
          <CopyCommand label="Chấm lại điểm" command="/dropship-research score" />
        </div>
      </section>

      <nav className="flex flex-wrap items-center gap-1 text-xs" aria-label="Nhóm sản phẩm">
        {flow.map((f) => (
          <span key={f.href} className="flex items-center gap-1">
            <a href={f.href} className="px-2 py-1 rounded-md bg-white border border-zinc-200 hover:border-zinc-400 text-zinc-700">
              {f.label} <b className="tabular-nums text-zinc-900">{f.n}</b>
            </a>
          </span>
        ))}
        <a href="#tim-sp-moi" className="ml-auto px-2 py-1 text-violet-700 underline">Tìm sản phẩm mới ({openCandidates} ứng viên)</a>
      </nav>

      <DiscoverySection runs={discovery.runs} categories={discovery.categories} icon={<Sparkles className="w-4 h-4 text-violet-600" />} />

      <ProductRankingTable rows={rows} names={names} />
    </>
  );
}
