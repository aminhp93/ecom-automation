import { advertiserCounts, latestPer } from '@/lib/research/display';
// Phân tích ads đối thủ (full width, cuối trang hồ sơ SP): thị trường, active/inactive, nhịp ad mới theo tuần,
// tuổi ad, mạng xã hội, 3 ad dài nhất + 3 video viral mỗi đối thủ, angle, đánh giá khả năng win.
import type { AdAngleReview, AdSample, AdvertiserAdStats, AdvertiserLink, BusinessCheck, ChurnAnalysis, CompetitorSocial, WinAssessment } from '@/lib/research/db';
import { ADVERTISER_KIND, MATCH_LABEL, fmtNum } from '@/lib/research/labels';
import { Markdown } from './Markdown';

const TH = 'text-left font-medium text-zinc-500 py-1.5 px-2 whitespace-nowrap';
const TD = 'py-2 px-2 border-t border-zinc-100 align-top';

const adsLibraryPage = (pageId: string) =>
  `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&view_all_page_id=${pageId}&media_type=all`;
const adsLibraryAd = (id: string) => `https://www.facebook.com/ads/library/?id=${id}`;

const COUNTRY_ORDER = ['AU', 'NZ', 'US', 'CA', 'GB', 'IE', 'DE', 'NL', 'SE', 'NO', 'DK', 'AT', 'BE', 'FR'];

/** 12 tuần gần nhất (thứ 2), tính từ ngày chụp. */
function lastWeeks(captured: string, n = 12): string[] {
  const d = new Date(`${captured}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return Array.from({ length: n }, (_, i) => {
    const x = new Date(d);
    x.setUTCDate(x.getUTCDate() - 7 * (n - 1 - i));
    return x.toISOString().slice(0, 10);
  });
}
const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const fmtK = (v: number | null | undefined) =>
  v === null || v === undefined ? '—' : v >= 1e6 ? `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 2)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(v >= 1e4 ? 0 : 1)}K` : String(v);

function heat(v: number, max: number) {
  if (!v) return 'bg-zinc-50 text-zinc-300';
  const r = Math.log(v + 1) / Math.log(max + 1);
  return r > 0.75 ? 'bg-emerald-600 text-white' : r > 0.5 ? 'bg-emerald-400 text-white' : r > 0.25 ? 'bg-emerald-200 text-emerald-900' : 'bg-emerald-50 text-emerald-800';
}

function Bars({ values, max }: { values: number[]; max: number }) {
  const w = 5, gap = 2, h = 22;
  return (
    <svg width={values.length * (w + gap)} height={h} role="img" aria-label="Ad mới theo tuần">
      {values.map((v, i) => {
        const bh = v ? Math.max(2, (Math.log(v + 1) / Math.log(max + 1)) * h) : 1;
        return <rect key={i} x={i * (w + gap)} y={h - bh} width={w} height={bh} rx={1} className={v ? 'fill-emerald-500' : 'fill-zinc-200'} />;
      })}
    </svg>
  );
}

function AdLine({ a }: { a: AdSample }) {
  return (
    <li className="text-[11px] leading-snug">
      <a href={adsLibraryAd(a.id)} target="_blank" rel="noreferrer" className="font-medium text-zinc-900 hover:underline tabular-nums">
        {a.days ?? '—'} ngày
      </a>
      <span className="text-zinc-400"> · {a.s ? shortDate(a.s) : '?'}{a.e ? `→${shortDate(a.e)}` : ' → nay'} · {a.video ? 'video' : 'ảnh'}{a.active ? '' : ' · đã tắt'}</span>
      <div className="text-zinc-600 line-clamp-2">{a.text}</div>
    </li>
  );
}

const EFFECT: Record<AdAngleReview['effectiveness'], { label: string; cls: string }> = {
  hieu_qua: { label: 'Hiệu quả', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  dang_test: { label: 'Đang test', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  yeu: { label: 'Yếu', cls: 'bg-zinc-50 text-zinc-600 border-zinc-200' },
  rui_ro: { label: 'Rủi ro', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  chua_ai_lam: { label: 'Chưa ai làm', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
};
const ACTION: Record<AdAngleReview['action'], { label: string; cls: string }> = {
  dung_lai: { label: 'Dùng lại', cls: 'bg-emerald-600 text-white' },
  lam_moi: { label: 'Làm mới', cls: 'bg-sky-600 text-white' },
  moi: { label: 'Angle mới', cls: 'bg-amber-500 text-white' },
  tranh: { label: 'Tránh', cls: 'bg-rose-600 text-white' },
};
const RATING: Record<string, string> = { tot: 'text-emerald-700', trung_binh: 'text-amber-700', xau: 'text-rose-700' };
const RATING_LABEL: Record<string, string> = { tot: 'Tốt', trung_binh: 'Trung bình', xau: 'Bất lợi' };
const VERDICT_CLS: Record<string, string> = {
  cao: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  kha: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  trung_binh: 'bg-amber-50 text-amber-800 border-amber-200',
  thap: 'bg-rose-50 text-rose-700 border-rose-200',
};
const VERDICT_LABEL: Record<string, string> = { cao: 'Cao', kha: 'Khá', trung_binh: 'Trung bình', thap: 'Thấp' };

function Section({ title, hint, children }: { title: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-zinc-200 rounded-lg">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5 border-b border-zinc-100">
        <h2 className="text-xs font-semibold text-zinc-900">{title}</h2>
        {hint && <div className="text-[11px] text-zinc-500">{hint}</div>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

const REASON_CLS: Record<string, string> = {
  test_thua: 'bg-rose-500', low_impression: 'bg-rose-300', het_vong_doi: 'bg-amber-400', thay_ban_moi: 'bg-sky-400',
  sale_het_dot: 'bg-violet-400', don_hang_loat: 'bg-zinc-400', khac: 'bg-zinc-200',
};
const BY_LABEL: Record<string, string> = {
  video: 'Video', image: 'Ảnh', partner: 'Partnership (page creator)', brand_page: 'Page brand',
  advertorial_lander: 'Dẫn về advertorial', product_lander: 'Dẫn về trang SP', sale_copy: 'Copy sale theo dịp', evergreen_copy: 'Copy evergreen',
  low_impression: 'Có nhãn "Low impression count"',
};

/** Vì sao ad bị tắt: phân loại từng ad đã tắt + so sánh sống sót + nhóm nội dung thua/thắng. */
function ChurnSection({ name, pageId, c, captured }: { name: string; pageId: string; c: ChurnAnalysis; captured: string }) {
  const total = c.reasons.reduce((s, r) => s + r.n, 0) || 1;
  const buckets = ['0–1', '2–3', '4–7', '8–14', '15–30', '31–60', '61+'];
  const bmax = Math.max(1, ...buckets.map((b) => c.life_buckets[b] ?? 0));
  return (
    <Section title={`Vì sao ${fmtNum(c.inactive)} ad của ${name} bị tắt?`} hint={`Phân tích ${fmtNum(c.parsed)} ad · ${captured}`}>
      <div className="space-y-4">
        <div>
          <div className="flex h-5 rounded overflow-hidden">
            {c.reasons.map((r) => (
              <div key={r.key} className={REASON_CLS[r.key] ?? 'bg-zinc-300'} style={{ width: `${(r.n / total) * 100}%` }} title={`${r.label}: ${r.n}`} />
            ))}
          </div>
          <table className="w-full text-xs mt-2">
            <tbody>
              {c.reasons.map((r) => (
                <tr key={r.key}>
                  <td className={`${TD} w-4`}><span className={`inline-block w-2.5 h-2.5 rounded-sm ${REASON_CLS[r.key] ?? 'bg-zinc-300'}`} /></td>
                  <td className={`${TD} font-medium text-zinc-900 whitespace-nowrap`}>{r.label}</td>
                  <td className={`${TD} text-right tabular-nums w-24`}>{fmtNum(r.n)} <span className="text-zinc-400">({Math.round((r.n / total) * 100)}%)</span></td>
                  <td className={`${TD} text-zinc-600`}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {c.summary_md && <div className="bg-zinc-50 border border-zinc-200 rounded-md p-3"><Markdown>{c.summary_md}</Markdown></div>}

        <div className="grid lg:grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 mb-1">Ad đã tắt sống được bao lâu</div>
            <div className="space-y-1">
              {buckets.map((b) => (
                <div key={b} className="flex items-center gap-2 text-[11px]">
                  <span className="w-14 text-right text-zinc-500 tabular-nums">{b} ngày</span>
                  <div className="flex-1 h-3 bg-zinc-100 rounded"><div className="h-3 rounded bg-zinc-500" style={{ width: `${((c.life_buckets[b] ?? 0) / bmax) * 100}%` }} /></div>
                  <span className="w-12 tabular-nums text-zinc-700">{fmtNum(c.life_buckets[b] ?? 0)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 mb-1">Loại ad nào sống lâu hơn</div>
            <table className="w-full text-[11px]">
              <thead><tr className="text-zinc-500"><th className="text-left font-medium py-1">Nhóm</th><th className="text-right font-medium">Ad</th><th className="text-right font-medium">Còn chạy</th><th className="text-right font-medium" title="Trong số ad đã tắt">Tắt ≤3 ngày</th><th className="text-right font-medium">Tuổi TV (đã tắt)</th></tr></thead>
              <tbody>
                {Object.entries(c.by).filter(([, v]) => v.n > 0).map(([k, v]) => (
                  <tr key={k} className="border-t border-zinc-100">
                    <td className="py-1 text-zinc-700">{BY_LABEL[k] ?? k}</td>
                    <td className="text-right tabular-nums">{fmtNum(v.n)}</td>
                    <td className="text-right tabular-nums">{Math.round((v.active / v.n) * 100)}%</td>
                    <td className="text-right tabular-nums">{v.dead ? `${Math.round((v.died_le3 / v.dead) * 100)}%` : '—'}</td>
                    <td className="text-right tabular-nums">{v.median_dead_life ?? '—'} ngày</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {c.mass_days.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 mb-1">Ngày tắt hàng loạt (≥25 ad cùng ngày)</div>
            <table className="w-full text-[11px]">
              <tbody>
                {c.mass_days.map((m) => (
                  <tr key={m.d} className="border-t border-zinc-100 align-top">
                    <td className="py-1 pr-3 whitespace-nowrap tabular-nums font-medium">{m.d}</td>
                    <td className="py-1 pr-3 whitespace-nowrap tabular-nums">{m.n} ad · sống TV {m.median_life} ngày{m.sale ? ` · ${m.sale} ad sale` : ''}</td>
                    <td className="py-1 text-zinc-600">{m.note ?? m.top.map(([t, n]) => `${t}… (${n})`).join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-700 mb-1">Nội dung thua (cả nhóm tắt nhanh, không còn bản nào chạy)</div>
            <ul className="space-y-1.5">
              {c.losers.map((l, i) => (
                <li key={i} className="text-[11px] leading-snug">
                  <span className="font-medium text-zinc-900">{l.angle ?? 'Không rõ angle'}</span>
                  <span className="text-zinc-500"> · {l.n} ad · sống TV {l.median} ngày · {l.died3} tắt ≤3 ngày · {l.first}{l.last_end ? `→${l.last_end}` : ''}</span>
                  <div className="text-zinc-600 line-clamp-2">“{l.text}”</div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 mb-1">Nội dung thắng (để so sánh)</div>
            <ul className="space-y-1.5">
              {c.winners.map((w, i) => (
                <li key={i} className="text-[11px] leading-snug">
                  <span className="font-medium text-zinc-900">{w.angle ?? 'Không rõ angle'}</span>
                  <span className="text-zinc-500"> · {w.n} ad · {w.active} đang chạy · dài nhất {w.max} ngày</span>
                  <div className="text-zinc-600 line-clamp-2">“{w.text}”</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-[10px] text-zinc-400">
          Phân loại dựa trên ngày bắt đầu/kết thúc và nội dung chữ của từng ad trong Ads Library (không có số chi tiêu).
          <a href={adsLibraryPage(pageId)} target="_blank" rel="noreferrer" className="underline ml-1">Mở Ads Library</a>
        </p>
      </div>
    </Section>
  );
}

export const MODEL: Record<BusinessCheck['model'], { label: string; short: string; cls: string }> = {
  global_dtc: { label: 'Brand toàn cầu, làm theo đơn ở nước ngoài', short: 'Global DTC', cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  dropship: { label: 'Dropship (ship từ nhà cung cấp, thường Trung Quốc)', short: 'Dropship', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  local_brand: { label: 'Brand Úc (chưa rõ SX ở đâu)', short: 'Local?', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  local_manufacturer: { label: 'Local — tự sản xuất ở Úc', short: 'Local SX', cls: 'bg-sky-50 text-sky-800 border-sky-300' },
  local_stockist: { label: 'Local — nhập hàng, kho ở Úc', short: 'Local kho', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  local_retailer: { label: 'Nhà bán lẻ Úc', short: 'Bán lẻ AU', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  local_service: { label: 'Dịch vụ đo & lắp tận nhà', short: 'Lắp tận nhà', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  marketplace: { label: 'Sàn', short: 'Sàn', cls: 'bg-zinc-50 text-zinc-600 border-zinc-200' },
  advertorial: { label: 'Page advertorial của brand khác', short: 'Advertorial', cls: 'bg-zinc-50 text-zinc-600 border-zinc-200' },
};
const POINT_CLS: Record<string, string> = { local: 'text-sky-700', dropship: 'text-amber-700', global: 'text-violet-700' };
const CONF_LABEL: Record<string, string> = { cao: 'chắc chắn', trung_binh: 'khá chắc', thap: 'chưa chắc' };
const latestCheck = (a: AdvertiserLink['advertisers']) =>
  [...(a.advertiser_business_checks ?? [])].sort((x, y) => y.checked_on.localeCompare(x.checked_on))[0];

/** Brand local hay dropship? — tiêu chí anh Thanh (thời gian ship) + dấu hiệu khác. */
function BusinessModelSection({ rows, names }: { rows: { a: AdvertiserLink['advertisers']; bc?: BusinessCheck }[]; names: Record<string, string> }) {
  const checked = rows.filter((r) => r.bc);
  if (!checked.length) return null;
  return (
    <Section title="Brand local hay dropship?" hint={`Kiểm tra ${checked[0].bc!.checked_on} · đọc chính sách ship/đổi trả, trang liên hệ, điều khoản`}>
      <div className="grid md:grid-cols-2 gap-3 text-[11px] text-zinc-600 mb-3">
        <div className="bg-zinc-50 border border-zinc-200 rounded-md p-2.5">
          <div className="font-semibold text-zinc-800 mb-1">Tiêu chí chính (anh Thanh): thời gian ship</div>
          Giao trong ~1–10 ngày làm việc từ kho/xưởng ở Úc → <b>local</b>. Làm theo đơn ở nước ngoài rồi ship quốc tế (2–5 tuần) → <b>dropship / global</b> — mô hình mình làm được.
        </div>
        <div className="bg-zinc-50 border border-zinc-200 rounded-md p-2.5">
          <div className="font-semibold text-zinc-800 mb-1">Dấu hiệu bổ sung</div>
          Ship từ đâu & ai trả thuế nhập khẩu · pháp nhân (Pty Ltd, ABN, địa chỉ đăng ký) · tên miền .com.au/.au (cần ABN/ACN) · kho/xưởng/showroom, địa chỉ trả hàng ở Úc · đo & lắp tận nhà · hotline 1300/1800 · giá AUD + GST hay USD · điều khoản ghi &quot;ship từ nhà cung cấp&quot; · chạy ads chỉ AU hay nhiều nước · (thủ công, cần đăng nhập FB) quốc gia người quản lý page.
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-zinc-50">
            <tr>
              <th className={TH}>Đối thủ</th><th className={TH}>Mô hình</th><th className={TH}>Thời gian ship</th><th className={TH}>Ship từ · pháp nhân</th>
              <th className={TH}>Dấu hiệu</th><th className={TH}>Mình làm được mô hình này?</th>
            </tr>
          </thead>
          <tbody>
            {checked.map(({ a, bc }) => (
              <tr key={a.page_id}>
                <td className={`${TD} font-medium text-zinc-900 whitespace-nowrap`}>{a.name}</td>
                <td className={`${TD} min-w-[150px]`}>
                  <span className={`px-1.5 py-0.5 rounded border whitespace-nowrap ${MODEL[bc!.model].cls}`}>{MODEL[bc!.model].short}</span>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{MODEL[bc!.model].label}{bc!.parent_page_id ? ` → ${names[bc!.parent_page_id] ?? ''}` : ''}</div>
                  <div className="text-[10px] text-zinc-400">{CONF_LABEL[bc!.confidence]}</div>
                </td>
                <td className={`${TD} min-w-[160px] text-zinc-700`}>{bc!.shipping_time ?? '—'}</td>
                <td className={`${TD} min-w-[160px] text-zinc-700`}>
                  {bc!.ships_from && <div>{bc!.ships_from}</div>}
                  {bc!.entity && <div className="text-[10px] text-zinc-500">{bc!.entity}</div>}
                </td>
                <td className={`${TD} min-w-[260px]`}>
                  <ul className="space-y-0.5 text-[11px]">
                    {(bc!.signals ?? []).map((g, i) => (
                      <li key={i}><span className="text-zinc-500">{g.signal}:</span> <span className={POINT_CLS[g.points_to]}>{g.value}</span></li>
                    ))}
                  </ul>
                </td>
                <td className={`${TD} min-w-[200px] text-[11px]`}>
                  {bc!.can_copy === true ? <span className="text-emerald-700 font-medium">Có. </span> : bc!.can_copy === false ? <span className="text-rose-700 font-medium">Không. </span> : null}
                  <span className="text-zinc-600">{bc!.note}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export type CompetitorPart = 'table' | 'model' | 'churn' | 'weekly' | 'cards' | 'angles' | 'win';

export function CompetitorAds({
  advertisers, adStats, social, angles, win, show = ['table', 'weekly', 'cards', 'angles', 'win'],
}: {
  advertisers: AdvertiserLink[];
  adStats: AdvertiserAdStats[];
  social: CompetitorSocial[];
  angles: AdAngleReview[];
  win: WinAssessment[];
  show?: CompetitorPart[];
}) {
  const latestStats = new Map<string, AdvertiserAdStats>();
  for (const s of adStats) if (!latestStats.has(s.page_id)) latestStats.set(s.page_id, s);
  const capturedOn = [...latestStats.values()].map((s) => s.captured_on).sort().pop();
  const weeks = capturedOn ? lastWeeks(capturedOn) : [];
  const socialDate = social[0]?.captured_on;
  const socialLatest = social.filter((s) => s.captured_on === socialDate);
  const angleDate = angles[0]?.captured_on;
  const angleLatest = angles.filter((a) => a.captured_on === angleDate);
  const winLatest = latestPer(win, (w) => w.market);

  const rows = advertisers
    .map((l) => {
      const snaps = [...l.advertisers.advertiser_snapshots].sort((a, b) => b.captured_on.localeCompare(a.captured_on));
      return { counts: advertiserCounts(adStats.filter((s) => s.page_id === l.advertisers.page_id), snaps), l, a: l.advertisers, st: latestStats.get(l.advertisers.page_id), snap: snaps.find((s) => s.active_all !== null), bc: latestCheck(l.advertisers) };
    })
    .sort((x, y) => {
      const rank = (m: string) => (m === 'yes' ? 0 : m === 'unverified' ? 1 : 2);
      return rank(x.l.matches_product) - rank(y.l.matches_product) || (y.counts.all ?? -1) - (x.counts.all ?? -1);
    });
  const weekMax = Math.max(1, ...rows.flatMap((r) => weeks.map((w) => r.st?.launched_by_week?.[w] ?? 0)));

  return (
    <div className="space-y-4">
      {show.includes('table') && <Section
        title={`Đối thủ đang quảng cáo (${advertisers.length}) — phân tích ads`}
        hint={capturedOn ? `Quét toàn bộ Meta Ads Library ${capturedOn} · bấm tên page để mở Ads Library` : 'Chưa quét toàn bộ ad'}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-zinc-50">
              <tr>
                <th className={TH}>Đối thủ</th>
                <th className={TH} title="Brand local hay dropship — theo thời gian ship + pháp nhân/kho/dịch vụ ở Úc">Mô hình · ship</th>
                <th className={TH} title="Ad đang chạy theo từng nước (Meta Ads Library, lọc theo nước)">Thị trường (ad đang chạy)</th>
                <th className={`${TH} text-right`}>Đang chạy</th>
                <th className={`${TH} text-right`} title="Ads Library chỉ hiện ad đã tắt nếu ad từng chạy ở EU/UK">Đã tắt · bị gỡ</th>
                <th className={`${TH} text-right`}>Tổng · từ</th>
                <th className={TH} title="Số ad mới theo tuần, 12 tuần gần nhất (thanh cuối = tuần này)">Ad mới / tuần (12 tuần)</th>
                <th className={`${TH} text-right`} title="Số ngày ad chạy: ngắn nhất (trong ad đã tắt, cần ≥5 ad đã tắt) · trung vị · dài nhất">Tuổi ad (ngày)<br />ngắn · TV · dài</th>
                <th className={`${TH} text-right`}>&gt;60 ngày</th>
                <th className={`${TH} text-right`}>Video</th>
                <th className={TH}>Mạng xã hội</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ l, a, st, snap, bc, counts }) => {
                const wk = weeks.map((w) => st?.launched_by_week?.[w] ?? 0);
                const last4 = wk.slice(-4);
                const avg4 = last4.reduce((s, v) => s + v, 0) / 4;
                const countries = Object.entries({ ...st?.countries, ...(counts.au !== null ? { AU: counts.au } : {}) })
                  .filter(([c]) => c !== 'ALL')
                  .sort((x, y) => y[1] - x[1] || COUNTRY_ORDER.indexOf(x[0]) - COUNTRY_ORDER.indexOf(y[0]));
                const soc = socialLatest
                  .filter((s) => s.page_id === a.page_id && s.platform !== 'meta')
                  .sort((x, y) => (y.top_videos?.[0]?.views ?? 0) - (x.top_videos?.[0]?.views ?? 0));
                const meta = socialLatest.find((s) => s.page_id === a.page_id && s.platform === 'meta');
                const partners = Object.entries(st?.partner_pages ?? {}).filter(([n]) => n !== a.name && / with /.test(n));
                const partnerAds = partners.reduce((s, [, v]) => s + v, 0);
                const life = st?.life;
                // "Ngắn nhất" chỉ có nghĩa khi thấy đủ ad đã tắt (ad mới chạy vài ngày chưa phải ad thua)
                const shortest = life?.inactive && life.inactive.n >= 5 ? life.inactive.min : null;
                return (
                  <tr key={a.page_id} className="hover:bg-zinc-50/60">
                    <td className={`${TD} min-w-[170px]`} title={st?.note ?? undefined}>
                      <a href={adsLibraryPage(a.page_id)} target="_blank" rel="noreferrer" className="font-medium text-sky-700 hover:underline">{a.name}</a>
                      <div className="text-[10px] text-zinc-500">
                        {ADVERTISER_KIND[a.kind] ?? a.kind}{l.landing_domain ? ` · ${l.landing_domain}` : ''}
                      </div>
                      <div className={`text-[10px] ${MATCH_LABEL[l.matches_product]?.cls}`} title={l.note ?? undefined}>
                        {MATCH_LABEL[l.matches_product]?.label}{l.note && l.matches_product !== 'yes' ? ` — ${l.note}` : ''}
                      </div>
                    </td>
                    <td className={`${TD} min-w-[130px]`} title={bc ? (bc.signals ?? []).map((g) => `${g.signal}: ${g.value}`).join('\n') : undefined}>
                      {bc ? (
                        <>
                          <span className={`px-1.5 py-0.5 rounded border whitespace-nowrap ${MODEL[bc.model].cls}`}>{MODEL[bc.model].short}</span>
                          {bc.shipping_time && <div className="text-[10px] text-zinc-500 mt-1 line-clamp-2">{bc.shipping_time}</div>}
                        </>
                      ) : <span className="text-zinc-400">chưa kiểm tra</span>}
                    </td>
                    <td className={`${TD} min-w-[170px]`}>
                      {countries.length ? (
                        <div className="flex flex-wrap gap-1">
                          {countries.slice(0, 8).map(([c, n]) => (
                            <span key={c} className={`px-1 rounded tabular-nums ${c === 'AU' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-700'}`}>{c} {n}</span>
                          ))}
                          {countries.length > 8 && <span className="text-zinc-400">+{countries.length - 8}</span>}
                        </div>
                      ) : snap?.active_au !== null && snap?.active_au !== undefined ? (
                        <span className="px-1 rounded bg-zinc-900 text-white">AU {snap.active_au}</span>
                      ) : <span className="text-zinc-400">—</span>}
                    </td>
                    <td className={`${TD} text-right tabular-nums font-semibold`}>{fmtNum(counts.all)}<div className="text-[10px] font-normal text-zinc-400">{counts.allDate}</div></td>
                    <td className={`${TD} text-right tabular-nums whitespace-nowrap`}>
                      {st ? (st.inactive_visible ? fmtNum(st.inactive) : <span className="text-zinc-400" title="Page chỉ chạy AU/US: Ads Library không hiện ad đã tắt">không hiện</span>) : '—'}
                      {st?.removed ? <div className="text-[10px] text-rose-700">{st.removed} bị gỡ</div> : null}
                    </td>
                    <td className={`${TD} text-right tabular-nums whitespace-nowrap`}>
                      {fmtNum(st?.total ?? snap?.total_all)}
                      {st?.first_start && <div className="text-[10px] text-zinc-400">từ {st.first_start}</div>}
                    </td>
                    <td className={`${TD} whitespace-nowrap`}>
                      {st ? (
                        <div className="flex items-end gap-2">
                          <Bars values={wk} max={weekMax} />
                          <div className="text-[10px] text-zinc-500 leading-tight">
                            <div className="tabular-nums">4 tuần: {avg4.toFixed(avg4 < 10 ? 1 : 0)}/tuần</div>
                            <div className="tabular-nums">tuần này: {wk[wk.length - 1]}</div>
                          </div>
                        </div>
                      ) : <span className="text-zinc-400">chưa quét</span>}
                    </td>
                    <td className={`${TD} text-right tabular-nums whitespace-nowrap`}>
                      {life?.all ? (
                        <>
                          <span className="text-zinc-500">{shortest ?? '—'}</span> · <span>{life.all.median}</span> · <span className="font-semibold">{life.all.max}</span>
                        </>
                      ) : snap?.longest_active_days ? `dài nhất ${snap.longest_active_days}` : '—'}
                    </td>
                    <td className={`${TD} text-right tabular-nums`}>{life?.all ? `${life.all.over60}` : '—'}</td>
                    <td className={`${TD} text-right tabular-nums`}>{st?.parsed ? `${Math.round(((st.video ?? 0) / st.parsed) * 100)}%` : '—'}</td>
                    <td className={`${TD} min-w-[150px]`}>
                      <div className="space-y-0.5 text-[11px] text-zinc-600">
                        {meta && <div title={String((meta.detail as { summary?: string } | null)?.summary ?? '')}>Meta: FB + IG (gồm Reels)</div>}
                        {partners.length > 0 && (
                          <div title={partners.map(([n, v]) => `${n}: ${v}`).join('\n')}>{partnerAds} partnership ad · {partners.length} page</div>
                        )}
                        {soc.length > 0 && (
                          <div title={soc.map((x) => `${x.platform} ${x.handle}: top ${fmtK(x.top_videos?.[0]?.views)} view`).join('\n')}>
                            TikTok: {soc.length} tài khoản · top <span className="font-medium text-zinc-900">{fmtK(soc[0].top_videos?.[0]?.views)}</span> view
                          </div>
                        )}
                        {!meta && !soc.length && !partners.length && <span className="text-zinc-400">—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">
          Tuổi ad = số ngày từ lúc bắt đầu tới lúc tắt (hoặc tới hôm nay nếu còn chạy); ad chạy lâu là tín hiệu gián tiếp ad có lãi.
          Page chỉ chạy AU/US: Ads Library không hiện ad đã tắt → số ad mới theo tuần chỉ tính ad còn sống (con số tối thiểu).
        </p>
      </Section>}

      {show.includes('model') && (
        <BusinessModelSection rows={rows.map((r) => ({ a: r.a, bc: r.bc }))} names={Object.fromEntries(rows.map((r) => [r.a.page_id, r.a.name]))} />
      )}

      {show.includes('churn') &&
        rows
          .filter((r) => r.st?.churn_analysis)
          .map((r) => <ChurnSection key={r.a.page_id} name={r.a.name} pageId={r.a.page_id} c={r.st!.churn_analysis!} captured={r.st!.captured_on} />)}

      {show.includes('weekly') && weeks.length > 0 && (
        <Section title="Số ad mới mỗi tuần (12 tuần)" hint="Ô = ad mới trong tuần (thứ 2 → CN) · rê chuột xem số ad đang chạy">
          <div className="overflow-x-auto">
            <table className="text-[11px]">
              <thead>
                <tr>
                  <th className={TH}>Đối thủ</th>
                  {weeks.map((w) => <th key={w} className="px-1 py-1.5 font-medium text-zinc-500 text-center whitespace-nowrap">{shortDate(w)}</th>)}
                  <th className={`${TH} text-right`}>Tổng 12 tuần</th>
                </tr>
              </thead>
              <tbody>
                {rows.filter((r) => r.st).map(({ a, st }) => {
                  const vals = weeks.map((w) => st!.launched_by_week?.[w] ?? 0);
                  return (
                    <tr key={a.page_id}>
                      <td className="py-0.5 pr-3 whitespace-nowrap text-zinc-700">{a.name}</td>
                      {weeks.map((w, i) => (
                        <td key={w} className="p-0.5">
                          <div
                            className={`w-10 h-6 rounded flex items-center justify-center tabular-nums ${heat(vals[i], weekMax)}`}
                            title={`${a.name} · tuần ${w}: ${vals[i]} ad mới · ${st!.active_by_week?.[w] ?? '—'} ad đang chạy`}
                          >
                            {vals[i] || ''}
                          </div>
                        </td>
                      ))}
                      <td className="pl-3 text-right tabular-nums font-semibold">{vals.reduce((s, v) => s + v, 0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {show.includes('cards') && <Section title="Ad chạy lâu nhất & video viral của từng đối thủ" hint="Bấm số ngày để mở ad trong Ads Library">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {rows.filter((r) => r.st && r.l.matches_product !== 'no').map(({ a, st }) => {
            const videos = socialLatest
              .filter((s) => s.page_id === a.page_id)
              .flatMap((s) => (s.top_videos ?? []).map((v) => ({ ...v, handle: s.handle, platform: s.platform })))
              .sort((x, y) => (y.views ?? 0) - (x.views ?? 0))
              .slice(0, 3);
            return (
              <div key={a.page_id} className="border border-zinc-200 rounded-md p-3 space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <a href={adsLibraryPage(a.page_id)} target="_blank" rel="noreferrer" className="text-xs font-semibold text-zinc-900 hover:underline">{a.name}</a>
                  <span className="text-[10px] text-zinc-400">{st!.active} đang chạy</span>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-1">3 ad chạy lâu nhất</div>
                  <ul className="space-y-1.5">{(st!.longest_ads ?? []).slice(0, 3).map((x) => <AdLine key={x.id} a={x} />)}</ul>
                </div>
                {(st!.shortest_ads?.length ?? 0) > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-1">Tắt nhanh nhất (thua)</div>
                    <ul className="space-y-1.5">{st!.shortest_ads!.slice(0, 2).map((x) => <AdLine key={x.id} a={x} />)}</ul>
                  </div>
                )}
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 mb-1">Video viral (organic)</div>
                  {videos.length ? (
                    <ul className="space-y-1">
                      {videos.map((v) => (
                        <li key={v.url} className="text-[11px] leading-snug">
                          <a href={v.url} target="_blank" rel="noreferrer" className="font-medium text-sky-700 hover:underline tabular-nums">{fmtK(v.views)} view</a>
                          <span className="text-zinc-400"> · {v.platform} {v.handle}{v.posted_on ? ` · ${v.posted_on}` : ''}{v.duration_s ? ` · ${v.duration_s}s` : ''}</span>
                          {v.caption && <div className="text-zinc-600 line-clamp-2">{v.caption}</div>}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-[11px] text-zinc-400">Chưa tìm thấy video organic nổi bật.</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Section>}

      {show.includes('angles') && angleLatest.length > 0 && (
        <Section title="Angle quảng cáo — cái nào hiệu quả, dùng lại hay làm mới" hint={`Phân tích ${angleDate}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-zinc-50">
                <tr>
                  <th className={TH}>Angle</th><th className={TH}>Ai đang dùng</th><th className={TH}>Bằng chứng</th>
                  <th className={TH}>Hiệu quả</th><th className={TH}>Mình làm</th><th className={TH}>Phiên bản của mình</th>
                </tr>
              </thead>
              <tbody>
                {angleLatest.map((g) => (
                  <tr key={g.angle_key}>
                    <td className={`${TD} min-w-[180px]`}>
                      <div className="font-medium text-zinc-900">{g.name_vi}</div>
                      {g.description && <div className="text-[11px] text-zinc-500">{g.description}</div>}
                    </td>
                    <td className={`${TD} min-w-[160px] text-[11px]`}>
                      {g.used_by?.length ? g.used_by.map((u, i) => (
                        <div key={`${u.brand}-${i}`}>
                          {u.brand}{u.ads ? <span className="text-zinc-500"> · {u.ads} ad</span> : null}{u.max_days ? <span className="text-zinc-500"> · {u.max_days} ngày</span> : null}
                          {u.example && <div className="text-[10px] text-zinc-400">{u.example}</div>}
                        </div>
                      )) : <span className="text-zinc-400">chưa ai</span>}
                    </td>
                    <td className={`${TD} min-w-[220px] text-[11px] text-zinc-700`}>{g.evidence}</td>
                    <td className={TD}><span className={`px-1.5 py-0.5 rounded border whitespace-nowrap ${EFFECT[g.effectiveness].cls}`}>{EFFECT[g.effectiveness].label}</span></td>
                    <td className={TD}><span className={`px-1.5 py-0.5 rounded whitespace-nowrap ${ACTION[g.action].cls}`}>{ACTION[g.action].label}</span></td>
                    <td className={`${TD} min-w-[240px] text-[11px] text-zinc-800`}>{g.our_take}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {show.includes('win') && winLatest.map((w) => (
        <Section key={w.market} title={`Đánh giá thực tế khả năng win — ${w.market}`} hint={`Đánh giá ${w.captured_on}`}>
          <div className="flex flex-wrap items-start gap-4">
            <div className="text-center">
              <span className={`inline-block px-2 py-1 rounded border text-sm font-semibold ${VERDICT_CLS[w.verdict] ?? 'border-zinc-200'}`}>{VERDICT_LABEL[w.verdict] ?? w.verdict}</span>
              <div className="text-[11px] text-zinc-500 mt-1">Nhận định nghiên cứu, chưa phải xác suất có lãi đã kiểm chứng.</div>
            </div>
            {w.summary && <p className="flex-1 min-w-[260px] text-sm text-zinc-800">{w.summary}</p>}
          </div>
          {w.factors?.length ? (
            <table className="w-full text-xs mt-3">
              <tbody>
                {w.factors.map((f) => (
                  <tr key={f.factor}>
                    <td className={`${TD} font-medium text-zinc-800 w-56`}>{f.factor}</td>
                    <td className={`${TD} w-24 ${RATING[f.rating]}`}>{RATING_LABEL[f.rating]}</td>
                    <td className={`${TD} text-zinc-700`}>{f.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {w.body_md && <div className="mt-3"><Markdown>{w.body_md}</Markdown></div>}
        </Section>
      ))}
    </div>
  );
}
