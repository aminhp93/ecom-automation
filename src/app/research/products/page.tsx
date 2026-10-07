import Link from 'next/link';
import { getCriteria, getCriteriaVersions, getDiscovery, getOverview } from '@/lib/research/db';
import { SHOW_COMPUTED_SCORE, pipelineGroup, type PipelineGroup } from '@/lib/research/labels';
import { ProductRankingTable } from '@/components/research/ProductRankingTable';
import { CopyCommand } from '@/components/research/CopyCommand';
import { ProductTabs, groupCounts } from '@/components/research/ProductTabs';

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const group: PipelineGroup = sp.nhom === 'theo-doi' ? 'theo_doi' : sp.nhom === 'loai' ? 'loai' : 'chon';
  const [rows, versions, discovery] = await Promise.all([getOverview(), getCriteriaVersions(), getDiscovery()]);
  const current = versions.find((v) => v.is_current);
  const criteria = current ? await getCriteria(current.version) : [];
  const names = Object.fromEntries(criteria.map((c) => [c.key, c.name_vi]));

  // Ứng viên còn chờ xem (chưa thêm vào pipeline, chưa bị loại).
  const openCandidates = discovery.runs.flatMap((r) => r.discovery_candidates).filter((c) => c.status === 'de_xuat' || c.status === 'moi').length;

  return (
    <>
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Sản phẩm</h1>
          <p className="text-sm text-zinc-600 mt-1 max-w-2xl">
            Đi từ ý tưởng đến quyết định thử. Mở tên sản phẩm để xem hồ sơ, bằng chứng và phần còn thiếu.
          </p>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
            {SHOW_COMPUTED_SCORE ? (
              <>Điểm tiềm năng tính theo <Link href="/research/criteria" className="underline">bộ tiêu chí {current?.version}</Link> — điểm cao nhưng thiếu bằng chứng vẫn ở “Theo dõi”.</>
            ) : (
              <>Điểm tiềm năng và độ phủ dữ liệu tạm ẩn vì công thức chưa được kiểm chứng. Sản phẩm xếp theo mức sẵn sàng theo <Link href="/research/criteria" className="underline">bộ tiêu chí {current?.version}</Link>, rồi số brand AU đã xác minh, rồi lượt search AU.</>
            )}{' '}
            “Đang nghiên cứu” là công việc trong nhóm Theo dõi, không phải nhóm riêng.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyCommand label="Thêm ý tưởng SP" command="/dropship-research add <tên SP> <keyword EN>" />
          <CopyCommand label="Chấm lại điểm" command="/dropship-research score" />
        </div>
      </section>

      <ProductTabs active={group} counts={groupCounts(rows, openCandidates)} />

      <ProductRankingTable rows={rows.filter((r) => pipelineGroup(r) === group)} names={names} group={group} />
    </>
  );
}
