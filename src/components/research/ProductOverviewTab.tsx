// Tab "Tổng quan" của hồ sơ SP: vài con số chính + kết luận + việc nên làm + đối thủ chính + rủi ro.
// Chi tiết nằm ở các tab khác; mỗi khối có link sang tab tương ứng.
import Link from 'next/link';
import { advertiserCounts, latestPer } from '@/lib/research/display';
import type { ProductDetail, ScoreRow } from '@/lib/research/db';
import { DECISION_CLASS, DECISION_LABEL, READINESS_CLASS, READINESS_LABEL, fmtNum, fmtScore, scoreClass } from '@/lib/research/labels';

const ACTION_LABEL: Record<string, string> = { dung_lai: 'Dùng lại', lam_moi: 'Làm mới', moi: 'Angle mới', tranh: 'Tránh' };
const ACTION_CLS: Record<string, string> = {
  dung_lai: 'bg-emerald-600 text-white', lam_moi: 'bg-sky-600 text-white', moi: 'bg-amber-500 text-white', tranh: 'bg-rose-600 text-white',
};
const VERDICT_LABEL: Record<string, string> = { cao: 'Cao', kha: 'Khá', trung_binh: 'Trung bình', thap: 'Thấp' };
const VERDICT_CLS: Record<string, string> = {
  cao: 'text-emerald-700', kha: 'text-emerald-700', trung_binh: 'text-amber-700', thap: 'text-rose-700',
};

function Tile({ label, children, sub }: { label: string; children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg px-3 py-2.5 min-w-0">
      <div className="text-[11px] text-zinc-500">{label}</div>
      <div className="text-lg font-semibold text-zinc-900 tabular-nums leading-tight mt-0.5">{children}</div>
      {sub && <div className="text-[11px] text-zinc-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function Block({ title, href, tab, linkLabel, children }: { title: string; href?: string; tab?: string; linkLabel?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-zinc-200 rounded-lg">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100">
        <h2 className="text-xs font-semibold text-zinc-900">{title}</h2>
        {href && <Link href={href} data-tab={tab} scroll={false} className="text-[11px] text-sky-700 hover:underline">{linkLabel ?? 'Xem chi tiết'} →</Link>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ProductOverviewTab({ d, current, tabHref }: { d: ProductDetail; current?: ScoreRow; tabHref: (tab: string) => string }) {
  const o = d.overview;
  const winAU = latestPer(d.win, (w) => w.market).find((w) => w.market === 'AU');
  const angleDate = d.angles[0]?.captured_on;
  const angles = d.angles.filter((a) => a.captured_on === angleDate);
  const todo = angles.filter((a) => a.action !== 'tranh').slice(0, 6);
  const avoid = angles.filter((a) => a.action === 'tranh');

  const latest = new Map<string, (typeof d.adStats)[number]>();
  for (const s of d.adStats) if (!latest.has(s.page_id)) latest.set(s.page_id, s);
  const weekKeys = (s?: (typeof d.adStats)[number]) => Object.keys(s?.launched_by_week ?? {}).sort();
  const competitors = d.advertisers
    .filter((l) => l.matches_product === 'yes')
    .map((l) => {
      const st = latest.get(l.advertisers.page_id);
      const counts = advertiserCounts(d.adStats.filter((s) => s.page_id === l.advertisers.page_id), l.advertisers.advertiser_snapshots);
      const cap = st?.captured_on;
      // TB ad mới/tuần trong 4 tuần gần nhất tính tới ngày chụp
      let per4 = null as number | null;
      if (st && cap) {
        const end = new Date(`${cap}T12:00:00Z`);
        const from = new Date(end); from.setUTCDate(from.getUTCDate() - 28);
        per4 = weekKeys(st).filter((w) => new Date(`${w}T12:00:00Z`) > from).reduce((s, w) => s + (st.launched_by_week?.[w] ?? 0), 0) / 4;
      }
      return {
        name: l.advertisers.name,
        ...counts,
        per4,
        longest: st?.life?.all?.max ?? null,
      };
    })
    .sort((a, b) => (b.au ?? -1) - (a.au ?? -1));
  const risks = (winAU?.factors ?? []).filter((f) => f.rating === 'xau');
  const pluses = (winAU?.factors ?? []).filter((f) => f.rating === 'tot');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Tile label="Quyết định" sub={o.readiness ? <span className={`px-1 rounded border ${READINESS_CLASS[o.readiness]}`}>{READINESS_LABEL[o.readiness]}</span> : null}>
          {o.decision ? <span className={`text-sm px-1.5 py-0.5 rounded border ${DECISION_CLASS[o.decision]}`}>{DECISION_LABEL[o.decision]}</span> : 'Chưa quyết'}
        </Tile>
        <Tile label={`Điểm ${current?.version ?? ''}`} sub={current ? `dữ liệu ${Math.round((current.completeness ?? 0) * 100)}%` : null}>
          <span className={scoreClass(current?.total)}>{fmtScore(current?.total)}</span>
        </Tile>
        <Tile label="Khả năng win (AU)" sub={winAU?.win_probability !== null && winAU?.win_probability !== undefined ? `~${Math.round(winAU.win_probability * 100)}% ra lãi` : null}>
          {winAU ? <span className={VERDICT_CLS[winAU.verdict]}>{VERDICT_LABEL[winAU.verdict] ?? winAU.verdict}</span> : '—'}
        </Tile>
        <Tile label="Search Amazon AU/tháng" sub={o.keyword ?? undefined}>{fmtNum(o.au_searches)}</Tile>
        <Tile label="Brand AU đã xác minh" sub="Gộp theo website · ≥5 ad ở AU">{o.ad_signal_brands ?? 'Chưa kiểm tra'}</Tile>
        <Tile label="Angle nên làm" sub={`${avoid.length} angle nên tránh`}>{todo.length}</Tile>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Block title="Kết luận" href={tabHref('win')} tab="win" linkLabel="Đánh giá khả năng win">
          {o.headline && <p className="text-sm text-zinc-800">{o.headline}</p>}
          {winAU?.summary && <p className="text-sm text-zinc-700 mt-2">{winAU.summary}</p>}
          {(pluses.length > 0 || risks.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-3 mt-3 text-xs">
              <div>
                <div className="font-semibold text-emerald-700 mb-1">Thuận lợi</div>
                <ul className="space-y-1 list-disc pl-4 text-zinc-700">{pluses.map((f) => <li key={f.factor}>{f.factor}</li>)}</ul>
              </div>
              <div>
                <div className="font-semibold text-rose-700 mb-1">Rủi ro chính</div>
                <ul className="space-y-1 list-disc pl-4 text-zinc-700">{risks.map((f) => <li key={f.factor}>{f.factor}</li>)}</ul>
              </div>
            </div>
          )}
        </Block>

        <Block title="Angle nên làm trước" href={tabHref('angles')} tab="angles" linkLabel={`Cả ${angles.length} angle`}>
          {todo.length ? (
            <ol className="space-y-2 text-xs">
              {todo.map((a, i) => (
                <li key={a.angle_key} className="flex gap-2">
                  <span className="text-zinc-400 tabular-nums w-4 shrink-0">{i + 1}.</span>
                  <div className="min-w-0">
                    <span className="font-medium text-zinc-900">{a.name_vi}</span>{' '}
                    <span className={`px-1 py-px rounded text-[10px] ${ACTION_CLS[a.action]}`}>{ACTION_LABEL[a.action]}</span>
                    {a.our_take && <div className="text-zinc-600 line-clamp-2">{a.our_take}</div>}
                  </div>
                </li>
              ))}
            </ol>
          ) : <p className="text-xs text-zinc-500">Chưa phân tích angle.</p>}
          {avoid.length > 0 && <p className="text-[11px] text-rose-700 mt-3">Tránh: {avoid.map((a) => a.name_vi).join(' · ')}</p>}
        </Block>
      </div>

      <Block title="Đối thủ chính (bán đúng SP)" href={tabHref('competitors')} tab="competitors" linkLabel="Phân tích ads đầy đủ">
        {competitors.length ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="font-medium py-1 pr-3">Đối thủ</th>
                <th className="font-medium py-1 pr-3 text-right">Ad đang chạy AU</th>
                <th className="font-medium py-1 pr-3 text-right">Tổng đang chạy</th>
                <th className="font-medium py-1 pr-3 text-right">Ad mới/tuần (4 tuần)</th>
                <th className="font-medium py-1 text-right">Ad lâu nhất</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((c) => (
                <tr key={c.name} className="border-t border-zinc-100">
                  <td className="py-1.5 pr-3 text-zinc-800">{c.name}</td>
                  <td className="py-1.5 pr-3 text-right tabular-nums font-semibold">{fmtNum(c.au)}<div className="text-[10px] text-zinc-400 font-normal">{c.auDate}</div></td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-zinc-600">{fmtNum(c.all)}<div className="text-[10px] text-zinc-400">{c.allDate}</div></td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-zinc-600">{c.per4 === null ? '—' : c.per4.toFixed(c.per4 < 10 ? 1 : 0)}</td>
                  <td className="py-1.5 text-right tabular-nums text-zinc-600">{c.longest === null ? '—' : `${c.longest} ngày`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-xs text-zinc-500">Chưa có đối thủ đã xác nhận.</p>}
      </Block>
    </div>
  );
}
