import Link from 'next/link';
import { getCriteria, getCriteriaVersions, getOverview } from '@/lib/research/db';
import { STAGES } from '@/lib/research/labels';
import { ProductRankingTable } from '@/components/research/ProductRankingTable';
import { CopyCommand } from '@/components/research/CopyCommand';

export default async function ResearchOverviewPage() {
  const [rows, versions] = await Promise.all([getOverview(), getCriteriaVersions()]);
  const current = versions.find((v) => v.is_current);
  const criteria = current ? await getCriteria(current.version) : [];
  const filterNames = Object.fromEntries(criteria.filter((c) => c.kind === 'hard_filter').map((c) => [c.key, c.name_vi]));
  const byStage = Object.fromEntries(STAGES.map((s) => [s.key, rows.filter((r) => r.stage === s.key).length]));
  const chosen = rows.filter((r) => r.decision && r.decision !== 'khong_chon');

  return (
    <>
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Pipeline sản phẩm</h1>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
            Số liệu thô nằm trong Supabase (chụp theo ngày, không ghi đè). Điểm tính bằng công thức từ{' '}
            <Link href="/research/criteria" className="underline">bộ tiêu chí {current?.version}</Link> — không để AI tự chấm.
            Kết luận cuối cùng nằm trong hồ sơ từng SP.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyCommand label="Thêm ý tưởng SP" command="/dropship-research add <tên SP> <keyword EN>" />
          <CopyCommand label="Chụp số liệu tuần" command="/dropship-research weekly" />
          <CopyCommand label="Chấm lại điểm" command="/dropship-research score" />
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {STAGES.map((s) => (
          <div key={s.key} className="bg-white border border-zinc-200 rounded-lg p-2.5" title={s.hint}>
            <div className="text-[11px] text-zinc-500 leading-tight">{s.label}</div>
            <div className="text-lg font-semibold tabular-nums">{byStage[s.key]}</div>
          </div>
        ))}
      </section>

      {chosen.length > 0 && (
        <section className="bg-white border border-zinc-200 rounded-lg p-3">
          <h2 className="text-xs font-semibold text-zinc-900 mb-2">Đang chọn ({chosen.length})</h2>
          <div className="flex flex-wrap gap-2">
            {chosen.map((r) => (
              <Link
                key={r.product_id}
                href={`/research/p/${r.slug}`}
                className="px-2 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 hover:bg-emerald-100"
              >
                {r.name_vi} <span className="text-emerald-600">· {r.score ?? '—'}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ProductRankingTable rows={rows} filterNames={filterNames} />
    </>
  );
}
