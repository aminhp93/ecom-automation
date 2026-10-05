import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { getCriteria, getCriteriaVersions, getProductDetail, type Criterion, type ScoreRow } from '@/lib/research/db';
import {
  CHECK_LABEL,
  READINESS_CLASS,
  READINESS_LABEL,
  DECISION_CLASS,
  DECISION_LABEL,
  PRICE_PREFIX,
  STAGE_LABEL,
  fmtMoney,
  fmtNum,
  fmtPct,
  fmtScore,
  scoreClass,
} from '@/lib/research/labels';
import { Markdown } from '@/components/research/Markdown';
import { Sparkline } from '@/components/research/Sparkline';
import { CopyCommand } from '@/components/research/CopyCommand';
import { CompetitorAds } from '@/components/research/CompetitorAds';
import { ProductOverviewTab } from '@/components/research/ProductOverviewTab';
import { DossierTabs } from '@/components/research/DossierTabs';
import { RefreshDataButton } from '@/components/research/RefreshDataButton';

function Card({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="bg-white border border-zinc-200 rounded-lg">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100">
        <h2 className="text-xs font-semibold text-zinc-900">{title}</h2>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

const TH = 'text-left font-medium text-zinc-500 py-1.5 pr-3 whitespace-nowrap';
const TD = 'py-1.5 pr-3 border-t border-zinc-100 align-top';

function ScoreBreakdown({ score, criteria }: { score: ScoreRow; criteria: Criterion[] }) {
  const crit = criteria.filter((c) => c.version === score.version && c.status !== 'retired');
  const groups = Array.from(new Set(crit.map((c) => c.group_name ?? 'Khác')));
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g}>
          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">{g}</div>
          <table className="w-full text-xs">
            <tbody>
              {crit
                .filter((c) => (c.group_name ?? 'Khác') === g)
                .map((c) => {
                  const b = score.breakdown[c.key];
                  if (c.kind === 'hard_filter' || c.kind === 'required') {
                    return (
                      <tr key={c.key}>
                        <td className={TD} title={c.rationale ?? undefined}>
                          {c.name_vi}
                        </td>
                        <td className={`${TD} text-right`} colSpan={3}>
                          {b?.pass === false ? (
                            <span className="text-rose-700 font-medium">{c.kind === 'required' ? 'Thiếu' : 'Rớt'}</span>
                          ) : b?.pass ? (
                            <span className="text-emerald-700">{c.kind === 'required' ? 'Có' : 'Qua'}</span>
                          ) : (
                            <span className="text-amber-700">Chưa xác minh</span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                  const s = b?.score ?? null;
                  return (
                    <tr key={c.key}>
                      <td className={TD} title={c.rationale ?? undefined}>
                        {c.name_vi}
                      </td>
                      <td className={`${TD} text-right tabular-nums text-zinc-500`}>
                        {b?.value === null || b?.value === undefined
                          ? '—'
                          : Number(b.value).toLocaleString('en-US', {
                              maximumFractionDigits: 3,
                            })}
                      </td>
                      <td className={`${TD} w-32`}>
                        {s === null ? (
                          <span className="text-zinc-400">thiếu</span>
                        ) : (
                          <div className="h-1.5 bg-zinc-100 rounded">
                            <div
                              className={`h-1.5 rounded ${s >= 75 ? 'bg-emerald-500' : s >= 40 ? 'bg-amber-400' : 'bg-rose-400'}`}
                              style={{ width: `${s}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td className={`${TD} text-right tabular-nums w-20`}>{s === null ? '' : `${s.toFixed(0)} × ${c.weight}`}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

const TAB_KEYS = ['overview', 'competitors', 'angles', 'win', 'dossier', 'market', 'score'] as const;
type TabKey = (typeof TAB_KEYS)[number];

export default async function ProductDossierPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const tab: TabKey = TAB_KEYS.includes(sp.tab as TabKey) ? (sp.tab as TabKey) : 'overview';
  const tabHref = (t: string) => (t === 'overview' ? `/research/p/${slug}` : `/research/p/${slug}?tab=${t}`);
  const [d, criteria, versions] = await Promise.all([getProductDetail(slug), getCriteria(), getCriteriaVersions()]);
  if (!d) notFound();
  const o = d.overview;
  const currentVersion = versions.find((v) => v.is_current)?.version;
  const latestByVersion = versions.map((v) => d.scores.find((s) => s.version === v.version)).filter(Boolean) as ScoreRow[];
  const current = latestByVersion.find((s) => s.version === currentVersion) ?? latestByVersion[0];
  const dossier = d.dossiers[0];
  const markets = ['AU', 'US', 'UK'];
  const angleCount = d.angles.filter((a) => a.captured_on === d.angles[0]?.captured_on).length;
  const TABS: { key: TabKey; label: string; count?: number }[] = [
    { key: 'overview', label: 'Tổng quan' },
    { key: 'competitors', label: 'Đối thủ & ads', count: d.advertisers.length },
    { key: 'angles', label: 'Angle', count: angleCount || undefined },
    { key: 'win', label: 'Cơ hội & rủi ro' },
    { key: 'dossier', label: dossier ? `Hồ sơ v${dossier.version}` : 'Hồ sơ' },
    { key: 'market', label: 'Số liệu thị trường' },
    { key: 'score', label: 'Điểm & kiểm tra' },
  ];
  const latestAz = markets.flatMap((m) =>
    d.keywords.map((k) => d.amazon.find((a) => a.market === m && a.keyword === k.keyword)).filter(Boolean),
  ) as typeof d.amazon;

  return (
    <>
      <div className="text-xs text-zinc-500">
        <Link href="/research/products" className="hover:underline">
          Pipeline
        </Link>{' '}
        / {o.name_vi}
      </div>

      <section className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-wrap gap-4 items-start justify-between">
        <div className="space-y-1.5 max-w-3xl">
          <h1 className="text-lg font-semibold text-zinc-900">{o.name_vi}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {o.decision ? (
              <span className={`px-1.5 py-0.5 rounded border ${DECISION_CLASS[o.decision]}`}>{DECISION_LABEL[o.decision]}</span>
            ) : (
              <span className="px-1.5 py-0.5 rounded border border-zinc-200 text-zinc-500">Chưa quyết</span>
            )}
            {o.readiness && <span className={`px-1.5 py-0.5 rounded border ${READINESS_CLASS[o.readiness]}`}>{READINESS_LABEL[o.readiness]}</span>}
            <span className="text-zinc-500">{STAGE_LABEL[o.stage]}</span>
            <span className="text-zinc-300">·</span>
            <span className="text-zinc-500">
              {o.category}
              {o.cluster ? ` · ${o.cluster}` : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {d.keywords.map((k) => (
              <span key={k.keyword} className={`px-1.5 py-0.5 rounded ${k.is_primary ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700'}`}>
                {k.keyword}
              </span>
            ))}
          </div>
          {d.product.variant_note && (
            <p className="text-xs text-sky-800 bg-sky-50 border border-sky-200 rounded px-2 py-1">Phiên bản: {d.product.variant_note}</p>
          )}
          {d.variants.length > 0 && (
            <p className="text-xs text-zinc-600">
              Phiên bản khác:{' '}
              {d.variants.map((v) => (
                <Link key={v.slug} href={`/research/p/${v.slug}`} title={v.variant_note ?? undefined} className="text-sky-700 hover:underline mr-2">
                  {v.name_vi}
                </Link>
              ))}
            </p>
          )}
          {o.decision_conflict && (
            <p className="flex items-start gap-1.5 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded px-2 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Quyết định “{DECISION_LABEL[o.decision!]}” chưa đủ bằng chứng (
              {[...(o.unknown_filters ?? []), ...(o.missing_required ?? [])].join(', ') || 'mức sẵn sàng'}) và chưa có lý do ngoại lệ. Bổ sung bằng chứng, hoặc
              ghi lý do bằng lệnh “Ghi quyết định”.
            </p>
          )}
          {d.sessions.length > 0 && (
            <p className="text-[11px] text-zinc-500">
              Phiên nghiên cứu:{' '}
              {d.sessions.map((x) => (
                <Link key={x.research_sessions.id} href="/research/sessions" className="underline mr-2">
                  {x.research_sessions.held_on} — {x.outcome}
                </Link>
              ))}
            </p>
          )}
        </div>
        <div className="flex gap-4 text-right">
          {latestByVersion
            .filter((s) => s === current)
            .map((s) => (
              <div
                key={s.version}
                title={latestByVersion
                  .filter((x) => x !== current)
                  .map((x) => `${x.version}: ${fmtScore(x.total)}`)
                  .join(' · ')}
              >
                <div className="text-[11px] text-zinc-500">
                  Điểm {s.version}
                  {s.version === currentVersion ? ' (hiện hành)' : ''}
                </div>
                <div className={`text-2xl font-semibold tabular-nums ${scoreClass(s.total)}`}>{fmtScore(s.total)}</div>
                <div className="text-[10px] text-zinc-400">
                  dữ liệu {Math.round((s.completeness ?? 0) * 100)}% · {s.computed_on}
                </div>
              </div>
            ))}
        </div>
        <div className="w-full flex flex-wrap gap-2 pt-1">
          <CopyCommand label="Cập nhật số liệu SP này" command={`/dropship-research collect ${o.slug}`} />
          <CopyCommand label="Viết lại hồ sơ" command={`/dropship-research dossier ${o.slug}`} />
          <CopyCommand label="Ghi quyết định" command={`/dropship-research decide ${o.slug} <chon_chinh|chon_phu|du_phong|khong_chon> <lý do>`} />
          <a
            href={`https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=AU&q=${encodeURIComponent(`"${o.keyword ?? ''}"`)}&search_type=keyword_exact_phrase&media_type=all`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Meta Ads Library AU
          </a>
          <RefreshDataButton />
        </div>
      </section>

      <DossierTabs
        tabs={TABS}
        initial={tab}
        panels={{
          overview: <><ProductOverviewTab d={d} current={current} tabHref={tabHref} />
            <Card title="Trước khi chọn để thử">
              <p className="text-xs text-zinc-500 mb-3">Checklist bắt buộc khi viết hồ sơ mới. Điểm và mức sẵn sàng hiện hành chưa xác nhận các mục này đã hoàn tất.</p>
              <ol className="list-decimal pl-4 space-y-2 text-sm text-zinc-700">
                <li><b>Khách hàng & vấn đề:</b> Ai ở AU cần sản phẩm, dùng khi nào, bằng chứng từ review/phản hồi nào?</li>
                <li><b>Offer khác biệt:</b> Sản phẩm, giá, bundle, thời gian giao và lý do mua của mình thay vì sàn hoặc đối thủ.</li>
                <li><b>Kinh tế đơn hàng:</b> Doanh thu thuần trừ hàng, ship, phí và dự phòng hoàn trả; phần còn lại là trần chi phí thu hút khách hòa vốn.</li>
                <li><b>Kế hoạch thử:</b> Giả thuyết, ngân sách giới hạn, chỉ số đánh giá và điều kiện dừng. Chưa có dữ liệu thì ghi rõ chưa xác minh.</li>
              </ol>
              <div className="mt-3"><CopyCommand label="Bổ sung hồ sơ trước khi thử" command={`/dropship-research dossier ${o.slug}`} /></div>
            </Card></>,
          competitors: (
            <CompetitorAds
              advertisers={d.advertisers}
              adStats={d.adStats}
              social={d.social}
              angles={d.angles}
              win={d.win}
              show={['table', 'model', 'churn', 'weekly', 'cards']}
            />
          ),
          angles: <CompetitorAds advertisers={d.advertisers} adStats={d.adStats} social={d.social} angles={d.angles} win={d.win} show={['angles']} />,
          win: <CompetitorAds advertisers={d.advertisers} adStats={d.adStats} social={d.social} angles={d.angles} win={d.win} show={['win']} />,
          dossier: (
            <div className="max-w-4xl">
              <Card
                title={dossier ? `Hồ sơ đánh giá · v${dossier.version} · ${dossier.written_on}` : 'Hồ sơ đánh giá'}
                right={dossier && <span className="text-[11px] text-zinc-500">{dossier.verdict}</span>}
              >
                {dossier ? (
                  <Markdown>{dossier.body_md}</Markdown>
                ) : (
                  <p className="text-xs text-zinc-500">Chưa có hồ sơ. Bấm “Viết lại hồ sơ” để nhờ Claude viết.</p>
                )}
              </Card>
            </div>
          ),
          market: (
            <div className="grid lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3 space-y-4 min-w-0">
                <Card title="Amazon — số liệu keyword (mới nhất)">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className={TH}>Thị trường</th>
                          <th className={TH}>Keyword</th>
                          <th className={`${TH} text-right`}>Search/tháng</th>
                          <th className={`${TH} text-right`} title="Lượt mua từ đúng keyword này, không phải tổng doanh số">
                            Mua từ keyword
                          </th>
                          <th className={`${TH} text-right`}>Tỷ lệ mua</th>
                          <th className={`${TH} text-right`}>Giá TB</th>
                          <th className={`${TH} text-right`}>Tập trung click</th>
                          <th className={TH}>Chụp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestAz.map((a) => (
                          <tr key={`${a.market}-${a.keyword}`}>
                            <td className={TD}>{a.market}</td>
                            <td className={TD}>{a.keyword}</td>
                            <td className={`${TD} text-right tabular-nums`}>{fmtNum(a.searches)}</td>
                            <td className={`${TD} text-right tabular-nums`}>{fmtNum(a.purchases)}</td>
                            <td className={`${TD} text-right tabular-nums`}>{fmtPct(a.purchase_rate)}</td>
                            <td className={`${TD} text-right tabular-nums`}>{fmtMoney(a.avg_price, PRICE_PREFIX[a.market])}</td>
                            <td className={`${TD} text-right tabular-nums`}>{fmtPct(a.click_concentration, 0)}</td>
                            <td className={`${TD} text-zinc-500 whitespace-nowrap`}>
                              {a.captured_on} (data {a.data_month})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {d.amazon.length > latestAz.length && (
                    <details className="mt-3 text-xs">
                      <summary className="cursor-pointer text-zinc-500">Lịch sử ({d.amazon.length} lần chụp)</summary>
                      <table className="w-full mt-2">
                        <tbody>
                          {d.amazon.map((a, i) => (
                            <tr key={i}>
                              <td className={TD}>{a.captured_on}</td>
                              <td className={TD}>{a.market}</td>
                              <td className={TD}>{a.keyword}</td>
                              <td className={`${TD} text-right tabular-nums`}>{fmtNum(a.searches)}</td>
                              <td className={`${TD} text-right tabular-nums`}>{fmtPct(a.purchase_rate)}</td>
                              <td className={`${TD} text-right tabular-nums`}>{fmtMoney(a.avg_price, PRICE_PREFIX[a.market])}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </details>
                  )}
                  {d.listings.length > 0 && (
                    <div className="mt-4">
                      <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">Mẫu bán chạy (quy mô thật)</div>
                      <table className="w-full text-xs">
                        <tbody>
                          {d.listings.map((l) => (
                            <tr key={l.asin}>
                              <td className={TD}>
                                <a className="text-sky-700 hover:underline" href={`https://www.amazon.com/dp/${l.asin}`} target="_blank" rel="noreferrer">
                                  {l.brand} · {l.asin}
                                </a>
                              </td>
                              <td className={`${TD} text-right tabular-nums`}>{fmtMoney(l.price)}</td>
                              <td className={`${TD} text-right tabular-nums`} title="Ước tính Topview">
                                ~{fmtNum(l.est_units)}/tháng
                              </td>
                              <td className={`${TD} text-emerald-700`}>{l.amazon_badge ?? ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
                <Card title="Meta Ads Library (AU)">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className={TH}>Chụp</th>
                        <th className={TH}>Keyword</th>
                        <th className={TH}>Kiểu tìm</th>
                        <th className={`${TH} text-right`}>Ad đang chạy</th>
                        <th className={`${TH} text-right`}>&gt;60 ngày / mẫu</th>
                        <th className={TH}>Page nổi bật</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.meta.map((m, i) => (
                        <tr key={i}>
                          <td className={`${TD} whitespace-nowrap`}>{m.captured_on}</td>
                          <td className={TD}>{m.keyword}</td>
                          <td className={TD}>{m.search_type === 'exact' ? 'đúng cụm' : 'không thứ tự'}</td>
                          <td className={`${TD} text-right tabular-nums`}>
                            {m.active_ads_approx ? '~' : ''}
                            {fmtNum(m.active_ads)}
                          </td>
                          <td className={`${TD} text-right tabular-nums`} title={m.sample_method ?? undefined}>
                            {m.ads_over_60d_in_sample ?? '—'}/{m.sample_size ?? '—'}
                            {m.sample_size && m.ads_over_60d_in_sample !== null ? (
                              <div className={`text-[10px] ${m.sample_size < 20 ? 'text-amber-700' : 'text-zinc-400'}`}>
                                {m.sample_size < 20 ? 'mẫu < 20 — không chấm' : fmtPct(m.ads_over_60d_in_sample / m.sample_size, 0)}
                              </div>
                            ) : null}
                          </td>
                          <td className={`${TD} text-zinc-600`}>{(m.top_pages ?? []).join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {d.meta.length === 0 && <p className="text-xs text-zinc-500">Chưa có số liệu Meta.</p>}
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-4 min-w-0"></div>
              <div className="lg:col-span-2 space-y-4 min-w-0">
                {d.trends.length > 0 && (
                  <Card title="Google Trends">
                    {d.trends.map((t) => (
                      <div key={`${t.keyword}-${t.captured_on}`} className="space-y-1">
                        <div className="text-xs text-zinc-600">
                          {t.keyword} · {t.market} · chụp {t.captured_on}
                        </div>
                        {t.series && <Sparkline values={t.series} />}
                        <div className="text-[11px] text-zinc-500">
                          Sàn P10/median {t.floor_ratio ?? '—'} · mùa vụ {t.seasonality ?? '—'} · tăng 2025/2022 {t.growth_25_22 ?? '—'}
                        </div>
                        {t.note && <div className="text-[10px] text-zinc-400">{t.note}</div>}
                      </div>
                    ))}
                  </Card>
                )}
                {d.tiktok.length > 0 && (
                  <Card title="TikTok Shop US (30 ngày)">
                    {d.tiktok.map((t) => (
                      <div key={`${t.keyword}-${t.captured_on}`} className="text-xs space-y-1">
                        <div className="text-zinc-800">{t.top_item}</div>
                        <div className="text-zinc-500">
                          {fmtNum(t.top_units_30d)} bán · {fmtMoney(t.top_price)} · chụp {t.captured_on}
                        </div>
                        {t.best_video_url && (
                          <a href={t.best_video_url} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                            Video nổi bật ({fmtNum(t.best_video_views)} view)
                          </a>
                        )}
                      </div>
                    ))}
                  </Card>
                )}
              </div>
            </div>
          ),
          score: (
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="space-y-4 min-w-0">
                {current && (
                  <Card
                    title={`Điểm theo tiêu chí ${current.version}`}
                    right={
                      <Link href="/research/criteria" className="text-[11px] text-zinc-500 underline">
                        xem bộ tiêu chí
                      </Link>
                    }
                  >
                    <ScoreBreakdown score={current} criteria={criteria} />
                  </Card>
                )}
                <Card title="Đánh giá vận hành (ước tính)">
                  {d.assessments[0] ? (
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                      {[
                        ['Cân nặng', d.assessments[0].weight_class],
                        ['Pin/lỏng/dễ vỡ/dao', d.assessments[0].hazmat],
                        ['Rủi ro chính sách', d.assessments[0].policy_risk],
                        ['Rủi ro siêu thị', d.assessments[0].retail_risk],
                        ['Bundle/AOV', d.assessments[0].bundle_potential],
                        ['Giá bán DTC mục tiêu', d.assessments[0].target_dtc_price],
                        ['Giá vốn về AU', d.assessments[0].landed_cost !== null ? `A$${d.assessments[0].landed_cost}` : d.assessments[0].landed_cost_note],
                      ].map(([k, v]) => (
                        <div key={k as string} className="contents">
                          <dt className="text-zinc-500">{k}</dt>
                          <dd className="text-zinc-800">{v ?? '—'}</dd>
                        </div>
                      ))}
                      <dt className="text-zinc-400 col-span-2 text-[10px] pt-1">
                        {d.assessments[0].source} · {d.assessments[0].confidence} · {d.assessments[0].assessed_on}
                      </dt>
                    </dl>
                  ) : (
                    <p className="text-xs text-zinc-500">Chưa đánh giá.</p>
                  )}
                </Card>
              </div>
              <div className="space-y-4 min-w-0">
                <Card title="Nhật ký kiểm tra" right={<span className="text-[11px] text-zinc-500">không có dòng = chưa kiểm tra</span>}>
                  {d.checks.length === 0 ? (
                    <p className="text-xs text-zinc-500">Chưa có lần kiểm tra nào (đối thủ AU, sàn, mô hình đối thủ…).</p>
                  ) : (
                    <ul className="space-y-2 text-xs">
                      {d.checks.map((c, i) => (
                        <li key={i}>
                          <div className="flex justify-between gap-2">
                            <span className="font-medium text-zinc-800">{CHECK_LABEL[c.check_type] ?? c.check_type}</span>
                            <span className="text-zinc-400 whitespace-nowrap">{c.checked_on}</span>
                          </div>
                          <div className="text-zinc-700">{c.result}</div>
                          {(c.scope || c.method) && <div className="text-[10px] text-zinc-400">{[c.scope, c.method].filter(Boolean).join(' · ')}</div>}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
                <Card title="Lịch sử quyết định">
                  <ul className="space-y-2 text-xs">
                    {d.decisions.map((x, i) => (
                      <li key={i}>
                        <span className={`px-1.5 py-0.5 rounded border ${DECISION_CLASS[x.decision]}`}>{DECISION_LABEL[x.decision]}</span>{' '}
                        <span className="text-zinc-500">
                          {x.decided_on} · tiêu chí {x.criteria_version ?? '—'}
                        </span>
                        {x.reason && <div className="text-zinc-700 mt-0.5">{x.reason}</div>}
                        {x.revisit_trigger && <div className="text-zinc-500 mt-0.5">Xem lại khi: {x.revisit_trigger}</div>}
                        {x.exception_reason && <div className="text-amber-800 mt-0.5">Ngoại lệ: {x.exception_reason}</div>}
                      </li>
                    ))}
                    {d.decisions.length === 0 && <li className="text-zinc-500">Chưa có quyết định.</li>}
                  </ul>
                  {d.product.legacy_status && (
                    <p className="text-[11px] text-zinc-400 mt-3">
                      Sheet 23/09: #{d.product.legacy_no} · {d.product.legacy_status} · điểm cũ {d.product.legacy_score}
                    </p>
                  )}
                  {d.product.idea_source && <p className="text-[11px] text-zinc-400">Nguồn ý tưởng: {d.product.idea_source}</p>}
                </Card>
              </div>
            </div>
          ),
        }}
      />
    </>
  );
}
