import Link from 'next/link';
import { AlertTriangle, ClipboardList, Receipt, Search } from 'lucide-react';
import { getCriteria, getCriteriaVersions, getOverview, type ProductOverview } from '@/lib/research/db';
import { DECISION_LABEL, READINESS, STAGES } from '@/lib/research/labels';
import { ProductRankingTable } from '@/components/research/ProductRankingTable';
import { CopyCommand } from '@/components/research/CopyCommand';

const chosen = (r: ProductOverview) => r.decision !== null && r.decision !== 'khong_chon';

function TodoGroup({ icon, title, hint, items }: {
  icon: React.ReactNode; title: string; hint: string;
  items: { r: ProductOverview; detail: string; command: string }[];
}) {
  if (!items.length) return null;
  return (
    <div className="bg-white border border-zinc-200 rounded-lg">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100">
        {icon}
        <h3 className="text-xs font-semibold text-zinc-900">{title} ({items.length})</h3>
        <span className="text-[11px] text-zinc-500">{hint}</span>
      </div>
      <ul className="divide-y divide-zinc-100">
        {items.map(({ r, detail, command }) => (
          <li key={r.product_id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
            <Link href={`/research/p/${r.slug}`} className="font-medium text-zinc-900 hover:underline">{r.name_vi}</Link>
            <span className="text-zinc-500 flex-1 min-w-[200px]">{detail}</span>
            <CopyCommand label="Copy lệnh" command={command} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ResearchOverviewPage() {
  const [rows, versions] = await Promise.all([getOverview(), getCriteriaVersions()]);
  const current = versions.find((v) => v.is_current);
  const criteria = current ? await getCriteria(current.version) : [];
  const names = Object.fromEntries(criteria.map((c) => [c.key, c.name_vi]));
  const byStage = Object.fromEntries(STAGES.map((s) => [s.key, rows.filter((r) => r.stage === s.key).length]));
  const byReady = Object.fromEntries(READINESS.map((g) => [g.key, rows.filter((r) => (r.readiness ?? 'can_xac_minh') === g.key).length]));
  const gapText = (r: ProductOverview) =>
    [...(r.unknown_filters ?? []), ...(r.missing_required ?? [])].map((k) => names[k] ?? k).join(' · ');

  const conflicts = rows.filter((r) => r.decision_conflict).map((r) => ({
    r, detail: `${DECISION_LABEL[r.decision!]} nhưng còn thiếu: ${gapText(r) || 'bằng chứng'} → bổ sung, hoặc ghi lý do ngoại lệ`,
    command: `/dropship-research verify ${r.slug}`,
  }));
  const quotes = rows.filter((r) => chosen(r) && r.readiness === 'san_sang' && r.landed_cost === null).map((r) => ({
    r, detail: 'Đủ bằng chứng nghiên cứu — cổng tiếp theo: báo giá xưởng + giá vốn về AU',
    command: `/dropship-research quote ${r.slug}`,
  }));
  const verify = rows
    .filter((r) => !chosen(r) && r.readiness === 'can_xac_minh' && r.decision !== 'khong_chon')
    .sort((a, b) => (b.score ?? 0) * (b.completeness ?? 0) - (a.score ?? 0) * (a.completeness ?? 0))
    .slice(0, 6)
    .map((r) => ({ r, detail: `Thiếu: ${gapText(r)}`, command: `/dropship-research collect ${r.slug}` }));
  const monitoring = rows.filter((r) => r.stage === 'monitoring').map((r) => ({
    r, detail: 'Đang theo dõi — số liệu tự chụp mỗi thứ 2 lúc 8:00', command: `/dropship-research collect ${r.slug}`,
  }));

  return (
    <>
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Pipeline sản phẩm</h1>
          <p className="text-sm font-medium text-zinc-800 mt-2">Chọn sản phẩm nên nghiên cứu tiếp</p>
          <p className="text-sm text-zinc-600 mt-1 max-w-2xl">So sánh sản phẩm đang chọn, cần xác minh và đã loại. Bắt đầu từ “Việc cần làm tiếp”, rồi mở từng sản phẩm để xem bằng chứng.</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
            Điểm tiềm năng tính bằng công thức theo <Link href="/research/criteria" className="underline">bộ tiêu chí {current?.version}</Link>.
            Mức sẵn sàng cho biết đã đủ bằng chứng để quyết định chưa — SP điểm cao nhưng thiếu bằng chứng vẫn ở nhóm “Cần xác minh”.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyCommand label="Thêm ý tưởng SP" command="/dropship-research add <tên SP> <keyword EN>" />
          <CopyCommand label="Chấm lại điểm" command="/dropship-research score" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900"><ClipboardList className="w-4 h-4" /> Việc cần làm tiếp</h2>
        <TodoGroup icon={<AlertTriangle className="w-4 h-4 text-rose-600" />} title="Quyết định mâu thuẫn" hint="Đang chọn nhưng chưa đủ bằng chứng" items={conflicts} />
        <TodoGroup icon={<Receipt className="w-4 h-4 text-emerald-600" />} title="Cần báo giá" hint="Đã đủ bằng chứng, chưa có giá vốn" items={quotes} />
        <TodoGroup icon={<Search className="w-4 h-4 text-amber-600" />} title="Nên xác minh tiếp" hint="Chưa quyết, điểm × độ đầy đủ cao nhất" items={verify} />
        <TodoGroup icon={<ClipboardList className="w-4 h-4 text-sky-600" />} title="Đang theo dõi" hint="Theo cách anh Thanh: theo dõi đều 2–4 tuần" items={monitoring} />
      </section>


      <section className="grid grid-cols-3 gap-2">
        {READINESS.map((g) => (
          <div key={g.key} className={`border rounded-lg p-2.5 ${g.cls}`} title={g.hint}>
            <div className="text-[11px] leading-tight">{g.label}</div>
            <div className="text-lg font-semibold tabular-nums">{byReady[g.key]}</div>
          </div>
        ))}
      </section>
      <details className="text-xs text-zinc-600">
        <summary className="cursor-pointer">Xem số sản phẩm theo giai đoạn</summary>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-2">
        {STAGES.map((s) => (
          <div key={s.key} className="bg-white border border-zinc-200 rounded-lg p-2.5" title={s.hint}>
            <div className="text-[11px] text-zinc-500 leading-tight">{s.label}</div>
            <div className="text-lg font-semibold tabular-nums">{byStage[s.key]}</div>
          </div>
        ))}
        </div>
      </details>

      <ProductRankingTable rows={rows} names={names} />
    </>
  );
}
