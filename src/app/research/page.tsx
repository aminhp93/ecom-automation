import Link from 'next/link';
import { ClipboardList, Play, Search, Sparkles } from 'lucide-react';
import { getCriteria, getCriteriaVersions, getDiscovery, getOverview, type ProductOverview } from '@/lib/research/db';
import { PIPELINE, pipelineGroup } from '@/lib/research/labels';
import { CopyCommand } from '@/components/research/CopyCommand';

function TodoGroup({ icon, title, hint, items, collapsed = false }: {
  icon: React.ReactNode; title: string; hint: string; collapsed?: boolean;
  items: { r: ProductOverview; detail: string; command: string }[];
}) {
  if (!items.length) return null;
  const heading = <>
    {icon}
    <h3 className="text-xs font-semibold text-zinc-900">{title} ({items.length})</h3>
    <span className="text-[11px] text-zinc-500">{hint}</span>
  </>;
  const list = <ul className="divide-y divide-zinc-100">
    {items.map(({ r, detail, command }) => (
      <li key={r.product_id} className="flex flex-wrap items-center gap-2 px-3 py-3 text-xs">
        <Link href={`/research/p/${r.slug}`} className="font-medium text-zinc-900 hover:underline">{r.name_vi}</Link>
        <span className="text-zinc-500 flex-1 min-w-[200px]">{detail}</span>
        <Link href={`/research/p/${r.slug}`} className="text-emerald-700 font-medium hover:underline">Mở hồ sơ →</Link>
        <CopyCommand label="Copy lệnh" command={command} />
      </li>
    ))}
  </ul>;
  if (collapsed) return <details className="bg-white border border-zinc-200 rounded-lg">
    <summary className="flex flex-wrap items-center gap-2 px-3 py-3 cursor-pointer">{heading}<span className="ml-auto text-[11px] text-zinc-500">Mở danh sách</span></summary>
    {list}
  </details>;
  return <div className="bg-white border border-zinc-200 rounded-lg">
    <div className="flex flex-wrap items-center gap-2 px-3 py-3 border-b border-zinc-100">{heading}</div>
    {list}
  </div>;
}

export default async function ResearchOverviewPage() {
  const [rows, versions, discovery] = await Promise.all([getOverview(), getCriteriaVersions(), getDiscovery()]);
  const current = versions.find((v) => v.is_current);
  const criteria = current ? await getCriteria(current.version) : [];
  const names = Object.fromEntries(criteria.map((c) => [c.key, c.name_vi]));
  const gapText = (r: ProductOverview) =>
    [...(r.unknown_filters ?? []), ...(r.missing_required ?? [])].map((k) => names[k] ?? k).join(' · ');

  const priority = (r: ProductOverview) => (r.score ?? 0) * (r.completeness ?? 0);
  const action = (r: ProductOverview) => {
    const gaps = gapText(r);
    if (r.decision_conflict || r.readiness !== 'san_sang' || gaps) return {
      r, detail: `Xác minh: ${gaps || (r.failed_filters ?? []).map(k => names[k] ?? k).join(' · ') || 'bằng chứng bắt buộc'}`,
      command: `/dropship-research verify ${r.slug}`,
    };
    if (r.landed_cost === null) return {
      r, detail: 'Lấy báo giá xưởng và tính giá vốn về AU', command: `/dropship-research quote ${r.slug}`,
    };
    if (!r.decision) return {
      r, detail: 'Đối chiếu hồ sơ với bộ tiêu chí để quyết định chọn hoặc loại', command: `/dropship-research dossier ${r.slug}`,
    };
    return { r, detail: 'Rà lại offer, chi phí và kế hoạch thử bán', command: `/dropship-research dossier ${r.slug}` };
  };
  // Each product gets one next action; active work precedes readiness/score rankings.
  const activeRows = rows.filter(r => pipelineGroup(r) !== 'loai' && (r.stage === 'monitoring' || pipelineGroup(r) === 'chon'))
    .sort((a, b) => {
      const latest = (r: ProductOverview) => [r.competitors_checked_on, r.meta_au_captured_on, r.dossier_on].filter(Boolean).sort().at(-1) ?? '';
      return latest(b).localeCompare(latest(a)) || priority(b) - priority(a);
    });
  const activeIds = new Set(activeRows.map(r => r.product_id));
  const nextRows = rows.filter(r => !activeIds.has(r.product_id) && pipelineGroup(r) !== 'loai' && r.stage === 'deep_dive')
    .sort((a, b) => priority(b) - priority(a));
  const laterRows = rows.filter(r => !activeIds.has(r.product_id) && (pipelineGroup(r) === 'theo_doi' || r.decision_conflict))
    .filter(r => !nextRows.some(n => n.product_id === r.product_id))
    .sort((a, b) => Number(!!b.decision_conflict) - Number(!!a.decision_conflict) || priority(b) - priority(a));
  const active = activeRows.map(action);
  const next = nextRows.map(action);
  const later = laterRows.map(action);

  const candidates = discovery.runs
    .flatMap((run) => run.discovery_candidates)
    .filter((c) => c.status === 'de_xuat' || c.status === 'da_them')
    .sort((a, b) => b.found_on.localeCompare(a.found_on) || (b.priority ?? -1) - (a.priority ?? -1))
    .slice(0, 5);
  const nextCategories = discovery.categories.filter((c) => c.active).slice(0, 2).map((c) => c.category).join(' + ');

  const tiles = PIPELINE.map((g) => ({ ...g, n: rows.filter((r) => pipelineGroup(r) === g.key).length }));

  return <>
    <section>
      <h1 className="text-xl font-semibold text-zinc-900">Tổng quan nghiên cứu thị trường</h1>
      <p className="text-sm text-zinc-600 mt-2"><b>Dùng để:</b> Chọn sản phẩm đáng thử tại AU, với bằng chứng, offer và bài toán chi phí rõ ràng.</p>
      <p className="text-sm text-zinc-600 mt-1"><b>Bắt đầu:</b> Làm “Việc cần làm tiếp” bên dưới; cần thêm ý tưởng thì xem “Ứng viên đáng xem”.</p>
    </section>

    <section className="grid grid-cols-3 gap-2" aria-label="Nhóm sản phẩm">
      {tiles.map((t) => (
        <Link key={t.key} href={`/research/products#${t.key}`} title={t.hint} className={`border rounded-lg p-3 hover:opacity-80 ${t.cls}`}>
          <div className="text-xs">{t.label}</div>
          <div className="text-2xl font-semibold tabular-nums mt-0.5">{t.n}</div>
          <p className="text-[11px] mt-2">{t.hint}</p>
        </Link>
      ))}
    </section>

    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900"><ClipboardList className="w-4 h-4" /> Việc cần làm tiếp</h2>
      <p className="text-xs text-zinc-500">Ưu tiên sản phẩm đã chọn hoặc đang theo dõi, hồ sơ có dữ liệu mới nhất lên trước. Mỗi sản phẩm chỉ xuất hiện một lần, kèm việc cần làm ngay.</p>
      <TodoGroup icon={<Play className="w-4 h-4 text-emerald-600" />} title="Đang làm — tiếp tục ở đây" hint="Sản phẩm đã chọn hoặc đang theo dõi" items={active} />
      <TodoGroup icon={<ClipboardList className="w-4 h-4 text-sky-600" />} title="Làm tiếp sau đó" hint="Hồ sơ phân tích sâu cần xác minh thêm" items={next} collapsed />
      <TodoGroup icon={<Search className="w-4 h-4 text-amber-600" />} title="Chờ xử lý" hint="Bổ sung bằng chứng hoặc rà lại quyết định" items={later} collapsed />
      {!active.length && !next.length && !later.length && <p className="text-sm text-zinc-500">Chưa có việc cần xử lý. Xem ứng viên mới bên dưới để bắt đầu.</p>}
    </section>

    <section className="bg-white border border-zinc-200 rounded-lg">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-zinc-100">
        <Sparkles className="w-4 h-4 text-violet-600" />
        <h2 className="text-xs font-semibold text-zinc-900">Ứng viên đáng xem</h2>
        <span className="text-[11px] text-zinc-500">Từ lần tìm SP mới gần nhất · lần tới: {nextCategories || '—'}</span>
        <Link href="/research/products#tim-sp-moi" className="ml-auto text-xs text-sky-700 underline">Xem tất cả ứng viên →</Link>
      </div>
      {candidates.length === 0 ? (
        <p className="px-3 py-2.5 text-xs text-zinc-500">Chưa có ứng viên — lần quét đầu tự chạy sáng thứ 2.</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {candidates.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
              {c.products ? (
                <Link href={`/research/p/${c.products.slug}`} className="font-medium text-zinc-900 hover:underline">{c.products.name_vi}</Link>
              ) : (
                <span className="font-medium text-zinc-900">{c.name_vi ?? c.keyword}</span>
              )}
              <span className="text-zinc-500 flex-1 min-w-[200px]">{c.category} · {c.screen?.reason ?? c.keyword}</span>
            </li>
          ))}
        </ul>
      )}
    </section>

    <section className="bg-white border border-zinc-200 rounded-lg p-4">
      <h2 className="text-sm font-semibold">Đầu ra cần có trước khi thử bán</h2>
      <ul className="list-disc pl-5 mt-2 text-sm text-zinc-600 space-y-1">
        <li>Khách hàng AU, vấn đề cụ thể và bằng chứng nhu cầu.</li>
        <li>Offer: bán gì, giá nào, giao bao lâu, vì sao khách chọn mình.</li>
        <li>Báo giá sơ bộ và chi phí thu hút khách tối đa có thể chịu.</li>
        <li>Kế hoạch thử có ngân sách, chỉ số và điều kiện dừng.</li>
      </ul>
      <p className="text-xs text-zinc-500 mt-3">Theo dõi hiệu quả bằng thời gian từ ý tưởng đến đủ điều kiện thử, lý do loại và kết quả thử bán. Chưa có kết quả thử thì chưa kết luận điểm cao dự báo bán tốt.</p>
    </section>

    <p className="text-xs text-zinc-500">
      <b>Tổng quan</b> để định hướng → <Link href="/research/products" className="underline">Sản phẩm</Link> để làm việc →{' '}
      <Link href="/research/criteria" className="underline">Cơ sở đánh giá</Link> để tra cứu. Điểm cao không thay thế bằng chứng; “đã thêm vào danh sách” chưa có nghĩa là “đã chọn để bán”.
    </p>
  </>;
}
