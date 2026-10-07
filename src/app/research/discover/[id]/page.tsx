import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { getCandidate, type CandidateDetail, type CandidateStatus, type DiscoveryCandidate } from '@/lib/research/db';
import { fmtMoney, fmtNum, fmtPct } from '@/lib/research/labels';
import { CopyCommand } from '@/components/research/CopyCommand';
import { DossierTabs } from '@/components/research/DossierTabs';
import { Sparkline } from '@/components/research/Sparkline';

const STATUS: Record<CandidateStatus, { label: string; cls: string }> = {
  de_xuat: { label: 'Đề xuất nghiên cứu tiếp', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  da_them: { label: 'Đã thêm vào pipeline', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  moi: { label: 'Theo dõi', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  trung: { label: 'Trùng SP cũ', cls: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  rot_loc: { label: 'Rớt lọc', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  bo_qua: { label: 'Bỏ qua', cls: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
};
const FILTER_LABEL: Record<string, string> = { battery: 'Có pin', liquid: 'Chất lỏng', knife: 'Dao', heavy: 'Nặng', baby_pet: 'Baby/Pet', medical: 'Y tế' };
const TD = 'px-3 py-2 align-top';

const adsKeywordUrl = (k: string) =>
  `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=AU&q=${encodeURIComponent(`"${k}"`)}&search_type=keyword_exact_phrase&media_type=all`;
const adsPageUrl = (id: string) => `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&view_all_page_id=${id}&media_type=all`;
const amazonSearchUrl = (k: string) => `https://www.amazon.com.au/s?k=${encodeURIComponent(k)}`;
const trendsUrl = (k: string) => `https://trends.google.com/trends/explore?date=today%205-y&geo=AU&q=${encodeURIComponent(k)}`;

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

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-3">
      <div className="text-[11px] text-zinc-500">{label}</div>
      <div className="text-xl font-semibold tabular-nums text-zinc-900 mt-0.5">{value}</div>
      {sub && <div className="text-[11px] text-zinc-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky-700 hover:underline">
      {children}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

function Thumb({ src, alt, size = 'w-14 h-14' }: { src?: string; alt: string; size?: string }) {
  if (!src) return <div className={`${size} rounded bg-zinc-100 border border-zinc-200`} aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element -- ảnh tham khảo từ nguồn ngoài (Amazon, TikTok), không tối ưu qua next/image
  return <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" className={`${size} rounded border border-zinc-200 object-cover bg-white`} />;
}

function List({ items, tone }: { items?: string[]; tone: 'ok' | 'bad' | 'todo' }) {
  if (!items?.length) return <p className="text-xs text-zinc-400">Chưa có.</p>;
  const dot = tone === 'ok' ? 'bg-emerald-500' : tone === 'bad' ? 'bg-rose-500' : 'bg-amber-500';
  return (
    <ul className="space-y-1.5">
      {items.map((t) => (
        <li key={t} className="flex gap-2 text-xs text-zinc-700">
          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Overview({ c, d }: { c: DiscoveryCandidate; d: CandidateDetail }) {
  const kw = d.keywords?.[0];
  const sig = c.signals ?? {};
  const searches = kw?.searches ?? (typeof sig.au_searches === 'number' ? sig.au_searches : undefined);
  const price = kw?.avg_price;
  const meta = d.meta;
  const gallery = [
    ...(d.amazon_listings ?? []).filter((l) => l.image).map((l) => ({ src: l.image!, cap: `${l.brand ?? ''} · A$${l.price ?? '—'}`, href: `https://www.amazon.com.au/dp/${l.asin}`, tag: 'Amazon AU' })),
    ...(d.tiktok_us ?? []).filter((t) => t.image).map((t) => ({ src: t.image!, cap: `${t.name.slice(0, 48)} · ${t.price ?? ''}`, href: undefined as string | undefined, tag: 'TikTok US' })),
  ];
  const keywords = d.search_keywords?.length ? d.search_keywords : [c.keyword];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Search Amazon AU/tháng" value={fmtNum(searches)} sub={kw?.keyword ?? c.keyword} />
        <Stat label="Giá TB Amazon AU" value={price ? fmtMoney(price, 'A$') : '—'} sub={kw?.products ? `${fmtNum(kw.products)} listing` : undefined} />
        <Stat label="Ad đang chạy ở AU" value={meta?.active_ads !== undefined ? fmtNum(meta.active_ads) : fmtNum(sig.meta_active_ads_au as number | undefined)} sub="Meta Ads Library, cụm chính xác" />
        <Stat
          label="Ad chạy trên 60 ngày"
          value={meta?.sample ? `${meta.over60 ?? 0}/${meta.sample}` : '—'}
          sub={meta?.sample ? `${fmtPct((meta.over60 ?? 0) / meta.sample, 0)} của mẫu${meta.sample < 20 ? ' (mẫu nhỏ, chưa tính tỷ lệ)' : ''}` : 'chưa có mẫu'}
        />
      </div>

      {d.summary && (
        <Card title="Tóm tắt">
          <p className="text-sm text-zinc-700">{d.summary}</p>
          {c.note && <p className="text-xs text-zinc-500 mt-2">{c.note}</p>}
        </Card>
      )}

      <Card title="Hình ảnh tham khảo" right={<span className="text-[11px] text-zinc-400">Ảnh của người bán khác, chỉ để xem. Không dùng làm tư liệu quảng cáo.</span>}>
        {gallery.length === 0 ? (
          <p className="text-xs text-zinc-400">Chưa có ảnh: Amazon AU không có listing đúng sản phẩm và TikTok US không có mục khớp.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {gallery.map((g, i) => (
              <figure key={`${g.src}-${i}`} className="space-y-1">
                {g.href ? (
                  <a href={g.href} target="_blank" rel="noreferrer">
                    <Thumb src={g.src} alt={g.cap} size="w-full aspect-square" />
                  </a>
                ) : (
                  <Thumb src={g.src} alt={g.cap} size="w-full aspect-square" />
                )}
                <figcaption className="text-[11px] text-zinc-500 leading-snug">
                  <span className="px-1 py-0.5 rounded bg-zinc-100 text-zinc-600 mr-1">{g.tag}</span>
                  {g.cap}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Card>

      <Card title="Mở nguồn gốc">
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
          {keywords.map((k) => (
            <span key={k} className="flex flex-wrap gap-x-3">
              <Ext href={adsKeywordUrl(k)}>Ads Library AU: {k}</Ext>
              <Ext href={amazonSearchUrl(k)}>Amazon AU: {k}</Ext>
              <Ext href={trendsUrl(k)}>Google Trends AU: {k}</Ext>
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Competitors({ d }: { d: CandidateDetail }) {
  const comps = d.competitors ?? [];
  const listings = d.amazon_listings ?? [];
  const tiktok = d.tiktok_us ?? [];
  return (
    <div className="space-y-4">
      <Card title="Đối thủ quảng cáo trên Meta AU" right={<span className="text-[11px] text-zinc-400">Chưa xác nhận đúng sản phẩm: cần đọc ad và website</span>}>
        {comps.length === 0 ? (
          <p className="text-xs text-zinc-400">Chưa có.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-zinc-500 bg-zinc-50">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Page</th>
                  <th className="px-3 py-2 font-medium">Loại (ước tính)</th>
                  <th className="px-3 py-2 font-medium text-right">Ad trong mẫu</th>
                  <th className="px-3 py-2 font-medium text-right">Ad lâu nhất</th>
                  <th className="px-3 py-2 font-medium">Trang đích</th>
                  <th className="px-3 py-2 font-medium">Xem ad</th>
                </tr>
              </thead>
              <tbody>
                {comps.map((p) => (
                  <tr key={`${p.page_id}-${p.name}`} className="border-t border-zinc-100">
                    <td className={`${TD} font-medium text-zinc-900`}>{p.name}</td>
                    <td className={`${TD} text-zinc-600`}>{p.kind ?? '—'}</td>
                    <td className={`${TD} text-right tabular-nums`}>{fmtNum(p.ads)}</td>
                    <td className={`${TD} text-right tabular-nums`}>{p.longest_days !== undefined ? `${fmtNum(p.longest_days)} ngày` : '—'}</td>
                    <td className={`${TD} text-zinc-600`}>
                      {(p.domains ?? []).map((dom) => (
                        <div key={dom}>
                          <Ext href={`https://${dom}`}>{dom}</Ext>
                        </div>
                      ))}
                    </td>
                    <td className={TD}>{p.page_id ? <Ext href={adsPageUrl(p.page_id)}>Ads Library</Ext> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {d.meta?.method && <p className="text-[11px] text-zinc-400 mt-2">Mẫu: {d.meta.method}.</p>}
      </Card>

      <Card title="Đang bán trên Amazon AU" right={<span className="text-[11px] text-zinc-400">Topview, ước tính, {d.captured_on}</span>}>
        {listings.length === 0 ? (
          <p className="text-xs text-zinc-400">Topview không tìm thấy listing Amazon AU đúng sản phẩm này, nghĩa là kênh bán chính không phải Amazon.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-zinc-500 bg-zinc-50">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Sản phẩm</th>
                  <th className="px-3 py-2 font-medium text-right">Giá</th>
                  <th className="px-3 py-2 font-medium text-right">Đánh giá</th>
                  <th className="px-3 py-2 font-medium">Cân nặng</th>
                  <th className="px-3 py-2 font-medium">Người bán</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l.asin} className="border-t border-zinc-100">
                    <td className={TD}>
                      <div className="flex gap-2">
                        <Thumb src={l.image} alt={l.title} />
                        <div className="min-w-0 max-w-sm">
                          <Ext href={`https://www.amazon.com.au/dp/${l.asin}`}>{l.brand ?? l.asin}</Ext>
                          <div className="text-zinc-600 line-clamp-2">{l.title}</div>
                          {l.badge && <div className="text-[10px] text-amber-700">{l.badge}</div>}
                        </div>
                      </div>
                    </td>
                    <td className={`${TD} text-right tabular-nums`}>{fmtMoney(l.price, 'A$')}</td>
                    <td className={`${TD} text-right tabular-nums`}>{l.rating ?? '—'} <span className="text-zinc-400">({fmtNum(l.ratings)})</span></td>
                    <td className={`${TD} text-zinc-600`}>{l.weight ?? '—'}</td>
                    <td className={`${TD} text-zinc-600`}>{l.seller ?? '—'} {l.fulfillment ? <span className="text-zinc-400">· {l.fulfillment}</span> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="TikTok Shop US (30 ngày)" right={<span className="text-[11px] text-zinc-400">TikTok Shop chưa có AU; chỉ là tín hiệu hỗ trợ</span>}>
        {tiktok.length === 0 ? (
          <p className="text-xs text-zinc-400">Không có mục TikTok US đủ khớp.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-zinc-500 bg-zinc-50">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Sản phẩm</th>
                  <th className="px-3 py-2 font-medium">Giá</th>
                  <th className="px-3 py-2 font-medium text-right">Đã bán</th>
                  <th className="px-3 py-2 font-medium text-right">GMV</th>
                  <th className="px-3 py-2 font-medium text-right">Tăng trưởng</th>
                </tr>
              </thead>
              <tbody>
                {tiktok.map((t) => (
                  <tr key={t.name} className="border-t border-zinc-100">
                    <td className={TD}>
                      <div className="flex gap-2 items-center">
                        <Thumb src={t.image} alt={t.name} />
                        <span className="max-w-sm text-zinc-700">{t.name}</span>
                      </div>
                    </td>
                    <td className={TD}>{t.price ?? '—'}</td>
                    <td className={`${TD} text-right tabular-nums`}>{fmtNum(t.sold_30d)}</td>
                    <td className={`${TD} text-right tabular-nums`}>{t.gmv_30d ?? '—'}</td>
                    <td className={`${TD} text-right tabular-nums`}>{t.growth ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Market({ c, d }: { c: DiscoveryCandidate; d: CandidateDetail }) {
  const kws = d.keywords ?? [];
  const tr = d.trends;
  return (
    <div className="space-y-4">
      <Card title="Từ khóa Amazon AU (tháng 08/2026)" right={<span className="text-[11px] text-zinc-400">Topview, ước tính. Lượt mua là lượt mua từ đúng từ khóa, không phải doanh số</span>}>
        {kws.length === 0 ? (
          <p className="text-xs text-zinc-400">Chưa có.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-zinc-500 bg-zinc-50">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Từ khóa</th>
                  <th className="px-3 py-2 font-medium text-right">Search/tháng</th>
                  <th className="px-3 py-2 font-medium text-right">Lượt mua</th>
                  <th className="px-3 py-2 font-medium text-right">Tỷ lệ mua</th>
                  <th className="px-3 py-2 font-medium text-right">Giá TB</th>
                  <th className="px-3 py-2 font-medium text-right">Số listing</th>
                  <th className="px-3 py-2 font-medium text-right">Giá thầu</th>
                </tr>
              </thead>
              <tbody>
                {kws.map((k) => (
                  <tr key={k.keyword} className="border-t border-zinc-100">
                    <td className={`${TD} font-medium text-zinc-900`}>{k.keyword}</td>
                    <td className={`${TD} text-right tabular-nums`}>{fmtNum(k.searches)}</td>
                    <td className={`${TD} text-right tabular-nums`}>{fmtNum(k.purchases)}</td>
                    <td className={`${TD} text-right tabular-nums`}>{fmtPct(k.purchase_rate)}</td>
                    <td className={`${TD} text-right tabular-nums`}>{fmtMoney(k.avg_price, 'A$')}</td>
                    <td className={`${TD} text-right tabular-nums`}>{fmtNum(k.products)}</td>
                    <td className={`${TD} text-right tabular-nums`}>{fmtMoney(k.bid, 'A$')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title={`Google Trends AU${tr?.keyword ? `: ${tr.keyword}` : ''}`} right={tr?.keyword ? <Ext href={trendsUrl(tr.keyword)}>Mở Google Trends</Ext> : undefined}>
        {tr?.series?.length ? (
          <div className="space-y-2">
            <Sparkline values={tr.series} width={480} height={72} />
            <p className="text-[11px] text-zinc-400">Mỗi điểm là một tháng, từ tháng 8/2021 đến nay (tháng cuối chưa trọn).</p>
          </div>
        ) : (
          <p className="text-xs text-zinc-400">Dữ liệu quá thưa để vẽ.</p>
        )}
        {tr?.note && <p className="text-xs text-zinc-700 mt-2">{tr.note}</p>}
      </Card>

      <Card title="Tín hiệu đã ghi">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(c.signals ?? {}).map(([k, v]) => (
            <span key={k} className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-200 text-zinc-700">
              {k}: <b className="font-medium">{typeof v === 'number' ? fmtNum(v) : String(v)}</b>
            </span>
          ))}
          {Object.keys(c.signals ?? {}).length === 0 && <span className="text-xs text-zinc-400">Chưa có.</span>}
        </div>
      </Card>
    </div>
  );
}

function Checks({ c, d }: { c: DiscoveryCandidate; d: CandidateDetail }) {
  const failed = Object.entries(c.screen?.hard_filters ?? {}).filter(([, v]) => v === true).map(([k]) => FILTER_LABEL[k] ?? k);
  const unknown = Object.keys(FILTER_LABEL).filter((k) => typeof c.screen?.hard_filters?.[k] !== 'boolean');
  return (
    <div className="space-y-4">
      <Card title="Lọc cứng và rào cản sàn">
        <dl className="text-xs space-y-1.5">
          <div className="flex gap-2"><dt className="w-32 text-zinc-500">Rào cản sàn</dt><dd className="text-zinc-800">{c.screen?.marketplace_barrier ?? 'chưa đánh giá'}</dd></div>
          <div className="flex gap-2"><dt className="w-32 text-zinc-500">Rớt lọc cứng</dt><dd className={failed.length ? 'text-rose-700' : 'text-zinc-800'}>{failed.length ? failed.join(', ') : 'không'}</dd></div>
          <div className="flex gap-2"><dt className="w-32 text-zinc-500">Chưa xác minh</dt><dd className="text-amber-700">{unknown.map((k) => FILTER_LABEL[k]).join(', ') || '—'}</dd></div>
          {c.screen?.reason && <div className="flex gap-2"><dt className="w-32 text-zinc-500">Lý do</dt><dd className="text-zinc-800">{c.screen.reason}</dd></div>}
        </dl>
      </Card>
      <Card title="Nguồn và độ tin cậy">
        <ul className="text-xs text-zinc-700 space-y-1">
          <li>Phát hiện ngày {c.found_on}. Nguồn: {c.source}.</li>
          {d.captured_on && <li>Dữ liệu chi tiết chụp ngày {d.captured_on}: số Amazon, TikTok là ước tính của Topview; số Meta là mẫu trang đầu của Ads Library.</li>}
          <li>Chưa có: dossier, angle quảng cáo, giá vốn xưởng, landed cost, kiểm tra an toàn và pháp lý. Các mục này chỉ có sau khi thêm vào pipeline và chạy <code className="px-1 rounded bg-zinc-100">verify</code>.</li>
        </ul>
      </Card>
    </div>
  );
}

const TAB_KEYS = ['overview', 'competitors', 'risks', 'market', 'checks'];

export default async function CandidatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const tab = TAB_KEYS.includes(sp.tab as string) ? (sp.tab as string) : 'overview';
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0) notFound();
  const c = await getCandidate(num);
  if (!c) notFound();
  const d: CandidateDetail = c.detail ?? {};
  const s = STATUS[c.status];
  const hasDetail = !!c.detail;
  const add = `/dropship-research add ${c.name_vi ?? c.keyword} ${c.keyword}`;

  const tabs = [
    { key: 'overview', label: 'Tổng quan' },
    { key: 'competitors', label: 'Đối thủ & ads', count: d.competitors?.length },
    { key: 'risks', label: 'Cơ hội & rủi ro' },
    { key: 'market', label: 'Số liệu thị trường' },
    { key: 'checks', label: 'Kiểm tra & nguồn' },
  ];

  return (
    <>
      <div className="text-xs text-zinc-500">
        <Link href="/research/discover" className="hover:underline">Sản phẩm tiềm năng</Link> / {c.name_vi ?? c.keyword}
      </div>

      <section className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-wrap gap-4 items-start justify-between">
        <div className="space-y-1.5 max-w-3xl">
          <h1 className="text-lg font-semibold text-zinc-900">{c.name_vi ?? c.keyword}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`px-1.5 py-0.5 rounded border ${s.cls}`}>{s.label}</span>
            {c.priority !== null && <span className="text-zinc-500">Xếp thứ tự {c.priority} (không phải xác suất thắng)</span>}
            <span className="text-zinc-300">·</span>
            <span className="text-zinc-500">{c.category}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-zinc-900 text-white">{c.keyword}</span>
            {(d.search_keywords ?? []).filter((k) => k !== c.keyword).map((k) => (
              <span key={k} className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">{k}</span>
            ))}
          </div>
          {c.products && (
            <p className="text-xs text-zinc-600">
              Đã vào pipeline: <Link href={`/research/p/${c.products.slug}`} className="text-sky-700 hover:underline">{c.products.name_vi}</Link>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyCommand label="Thêm vào pipeline" command={add} />
          <CopyCommand label="Cập nhật số liệu" command={`/dropship-research collect ${c.keyword}`} />
        </div>
      </section>

      {!hasDetail && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          Ứng viên này chưa có dữ liệu chi tiết (ảnh, đối thủ, listing), chỉ có tín hiệu tóm tắt. Nhờ Claude bổ sung khi bạn cần xem.
        </p>
      )}

      <DossierTabs
        tabs={tabs}
        initial={tab}
        panels={{
          overview: <Overview c={c} d={d} />,
          competitors: <Competitors d={d} />,
          risks: (
            <div className="grid md:grid-cols-3 gap-4">
              <Card title="Cơ hội"><List items={d.opportunities} tone="ok" /></Card>
              <Card title="Rủi ro"><List items={d.risks} tone="bad" /></Card>
              <Card title="Cần xác minh trước khi chọn"><List items={d.to_verify} tone="todo" /></Card>
            </div>
          ),
          market: <Market c={c} d={d} />,
          checks: <Checks c={c} d={d} />,
        }}
      />
    </>
  );
}
