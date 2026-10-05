import Link from 'next/link';
import type { CandidateStatus, DiscoveryCandidate, DiscoveryCategory, DiscoveryRun } from '@/lib/research/db';
import { CopyCommand } from '@/components/research/CopyCommand';

const STATUS: Record<CandidateStatus, { label: string; cls: string }> = {
  de_xuat: { label: 'Đề xuất', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  da_them: { label: 'Đã thêm vào pipeline', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  moi: { label: 'Mới', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  trung: { label: 'Trùng SP cũ', cls: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  rot_loc: { label: 'Rớt lọc', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  bo_qua: { label: 'Bỏ qua', cls: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
};
const STATUS_ORDER: CandidateStatus[] = ['de_xuat', 'da_them', 'moi', 'trung', 'rot_loc', 'bo_qua'];

// Tên hiển thị cho các tín hiệu hay gặp; khoá lạ vẫn hiện nguyên tên.
const SIGNAL_LABEL: Record<string, string> = {
  us_searches: 'Tìm kiếm US/tháng',
  au_searches: 'Tìm kiếm AU/tháng',
  growth: 'Tăng trưởng',
  tiktok_gmv_7d: 'TikTok GMV 7 ngày',
  meta_active_ads_au: 'Ads đang chạy AU',
  ads_over_60d: 'Ads >60 ngày',
  example_brand: 'Brand ví dụ',
  price: 'Giá',
};

const FILTER_LABEL: Record<string, string> = { battery: 'Có pin', liquid: 'Chất lỏng', knife: 'Dao', heavy: 'Nặng', baby_pet: 'Baby/Pet', medical: 'Y tế' };

const fmt = (v: unknown) =>
  typeof v === 'number' ? v.toLocaleString('vi-VN') : typeof v === 'string' ? v : JSON.stringify(v);

const daysAgo = (d: string | null) => (d ? Math.round((Date.now() - new Date(d).getTime()) / 86_400_000) : null);

function CandidateRow({ c }: { c: DiscoveryCandidate }) {
  const s = STATUS[c.status];
  const failed = Object.entries(c.screen?.hard_filters ?? {})
    .filter(([, v]) => v === true)
    .map(([k]) => FILTER_LABEL[k] ?? k);
  const unknown = Object.keys(FILTER_LABEL).filter(k => typeof c.screen?.hard_filters?.[k] !== 'boolean');
  return (
    <tr className="border-t border-zinc-100 align-top">
      <td className="px-3 py-2">
        <div className="font-medium text-zinc-900">{c.name_vi ?? c.keyword}</div>
        <div className="text-[11px] text-zinc-500">
          {c.keyword}
          {c.category ? ` · ${c.category}` : ''}
        </div>
      </td>
      <td className="px-3 py-2">
        <span className={`inline-block text-[11px] px-1.5 py-0.5 rounded border whitespace-nowrap ${s.cls}`}>{s.label}</span>
        {c.products && (
          <Link href={`/research/p/${c.products.slug}`} className="block text-[11px] text-sky-700 underline mt-1">
            {c.products.name_vi}
          </Link>
        )}
      </td>
      <td className="px-3 py-2 text-right tabular-nums">{c.priority ?? '—'}</td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {Object.entries(c.signals ?? {}).map(([k, v]) => (
            <span key={k} className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-200 text-zinc-700">
              {SIGNAL_LABEL[k] ?? k}: <b className="font-medium">{fmt(v)}</b>
            </span>
          ))}
        </div>
        <div className="text-[10px] text-zinc-400 mt-1">Ngày phát hiện: {c.found_on} · Nguồn: {c.source}</div>
      </td>
      <td className="px-3 py-2 text-xs text-zinc-600 max-w-xs">
        {c.screen?.marketplace_barrier && <div>Rào cản sàn: {c.screen.marketplace_barrier}</div>}
        {failed.length > 0 && <div className="text-rose-700">Lọc cứng: {failed.join(', ')}</div>}
        {unknown.length > 0 && <div className="text-amber-700">Chưa xác minh: {unknown.map(k => FILTER_LABEL[k]).join(', ')}</div>}
        {c.screen?.reason && <div>{c.screen.reason}</div>}
        {c.note && <div className="text-zinc-500 mt-0.5">{c.note}</div>}
      </td>
    </tr>
  );
}

function RunBlock({ r }: { r: DiscoveryRun }) {
  const cands = [...r.discovery_candidates].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || (b.priority ?? -1) - (a.priority ?? -1),
  );
  return (
    <div className="border-t border-zinc-100">
      <div className="px-4 py-2.5">
        <div className="text-[11px] text-zinc-500">
          {r.run_on} · {r.categories.join(' + ')} · nguồn: {r.sources.join(', ')}
        </div>
        <div className="text-xs font-semibold text-zinc-900 mt-0.5">
          Tìm thấy {r.n_found ?? cands.length} · mới {r.n_new ?? '—'} · rớt lọc {r.n_screened_out ?? '—'} · đề xuất {r.n_proposed ?? '—'}
        </div>
        {r.summary && <p className="text-xs text-zinc-600 mt-1">{r.summary}</p>}
        {r.errors && <p className="text-xs text-rose-700 mt-1">Lỗi nguồn: {r.errors}</p>}
      </div>
      {cands.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] text-zinc-500 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Ứng viên</th>
                <th className="px-3 py-2 font-medium">Trạng thái</th>
                <th className="px-3 py-2 font-medium text-right">Ưu tiên sơ bộ</th>
                <th className="px-3 py-2 font-medium">Tín hiệu</th>
                <th className="px-3 py-2 font-medium">Lọc</th>
              </tr>
            </thead>
            <tbody>
              {cands.map((c) => (
                <CandidateRow key={c.id} c={c} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Khối "Tìm sản phẩm mới" trong trang Sản phẩm: lần quét mới nhất + ngành xoay vòng + các lần trước. */
export function DiscoverySection({ runs, categories, icon }: { runs: DiscoveryRun[]; categories: DiscoveryCategory[]; icon: React.ReactNode }) {
  const next = categories.filter((c) => c.active).slice(0, 2);
  const nextText = next.map((c) => c.category).join(' + ') || '—';
  const [latest, ...older] = runs;

  return (
    <section id="tim-sp-moi" className="bg-white border border-zinc-200 rounded-lg scroll-mt-16">
      <div className="px-4 py-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            {icon} Ứng viên mới
          </h2>
          <p className="text-xs text-zinc-600 mt-1 max-w-2xl">
            Mỗi thứ 2 quét 2 ngành (xoay vòng), loại SP trùng hoặc dính lọc cứng (pin, chất lỏng, dao, nặng, baby/pet, y tế), đề xuất tối đa 5 ứng viên có bằng chứng phù hợp, có thể không đề xuất ứng viên nào. Lần
            tới: <b className="text-zinc-900">{nextText}</b>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyCommand label="Tìm SP mới" command="/dropship-research discover" />
          <CopyCommand label="Tìm theo ngành" command="/dropship-research discover <ngành>" />
        </div>
      </div>

      <p className="px-4 pb-3 text-xs text-zinc-500">Ưu tiên sơ bộ chỉ dùng sắp xếp ứng viên, không phải điểm theo bộ tiêu chí. Ứng viên còn cần xác minh trước khi chọn bán.</p>

      {latest ? (
        <RunBlock r={latest} />
      ) : (
        <p className="px-4 py-2.5 border-t border-zinc-100 text-xs text-zinc-500">
          Chưa quét lần nào — lần đầu sẽ quét <b>{nextText}</b> (tự chạy sáng thứ 2, hoặc copy lệnh ở trên dán vào Claude).
        </p>
      )}

      {older.length > 0 && (
        <details className="border-t border-zinc-100">
          <summary className="px-4 py-2 text-xs text-zinc-600 cursor-pointer">Các lần quét trước trong {runs.length} lần gần nhất ({older.length})</summary>
          {older.map((r) => (
            <RunBlock key={r.id} r={r} />
          ))}
        </details>
      )}

      <details className="border-t border-zinc-100">
        <summary className="px-4 py-2 text-xs text-zinc-600 cursor-pointer">Ngành theo dõi ({categories.filter((c) => c.active).length})</summary>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] text-zinc-500 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Ngành</th>
                <th className="px-3 py-2 font-medium">Quét gần nhất</th>
                <th className="px-3 py-2 font-medium">Keyword gốc</th>
                <th className="px-3 py-2 font-medium">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.category} className={`border-t border-zinc-100 align-top ${c.active ? '' : 'text-zinc-400'}`}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="font-medium">{c.category}</span>
                    {next.some((n) => n.category === c.category) && (
                      <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-zinc-900 text-white">lần tới</span>
                    )}
                    {!c.active && <span className="ml-1.5 text-[10px]">(không làm)</span>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">{c.last_run_on ? `${c.last_run_on} · ${daysAgo(c.last_run_on)} ngày trước` : 'Chưa quét'}</td>
                  <td className="px-3 py-2 text-xs text-zinc-600">{c.seed_keywords.join(', ')}</td>
                  <td className="px-3 py-2 text-xs text-zinc-500">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
