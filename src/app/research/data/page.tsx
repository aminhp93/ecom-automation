import Link from 'next/link';
import { getFreshness, getOverview } from '@/lib/research/db';

const TH = 'text-left font-medium text-zinc-500 py-1.5 pr-3';
const TD = 'py-1.5 pr-3 border-t border-zinc-100';

export default async function DataQualityPage() {
  const [fresh, rows] = await Promise.all([getFreshness(), getOverview()]);
  const missing = [
    { label: 'Thiếu search Amazon AU', list: rows.filter((r) => r.au_searches === null) },
    { label: 'Thiếu số liệu Meta AU', list: rows.filter((r) => r.meta_active_ads === null) },
    { label: 'Chưa có đối thủ quảng cáo nào được gắn', list: rows.filter((r) => r.adswin_pages === 0 && r.marketplace_pages === 0) },
    { label: 'Chưa có giá vốn về AU (landed cost)', list: rows.filter((r) => r.decision && r.decision !== 'khong_chon' && r.landed_cost === null) },
  ];
  return (
    <>
      <section>
        <h1 className="text-lg font-semibold text-zinc-900">Chất lượng & độ mới của dữ liệu</h1>
        <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
          Mỗi lần Claude kéo số là một bản chụp theo ngày — không ghi đè. Số của Topview là <b>ước tính</b> (Amazon không công khai
          search/đơn tuyệt đối); “mua từ keyword” chỉ là lượt mua từ đúng keyword đó, không phải tổng doanh số.
        </p>
      </section>

      <section className="bg-white border border-zinc-200 rounded-lg p-4">
        <h2 className="text-xs font-semibold mb-2">Các lần chụp số liệu</h2>
        <table className="w-full text-xs">
          <thead>
            <tr><th className={TH}>Ngày chụp</th><th className={TH}>Nguồn</th><th className={TH}>Phạm vi</th><th className={`${TH} text-right`}>Số dòng</th></tr>
          </thead>
          <tbody>
            {fresh.map((f, i) => (
              <tr key={i}>
                <td className={TD}>{f.captured_on}</td><td className={TD}>{f.source}</td><td className={TD}>{f.scope}</td>
                <td className={`${TD} text-right tabular-nums`}>{f.rows}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        {missing.map((m) => (
          <div key={m.label} className="bg-white border border-zinc-200 rounded-lg p-4">
            <h2 className="text-xs font-semibold mb-2">{m.label} ({m.list.length})</h2>
            <div className="flex flex-wrap gap-1.5">
              {m.list.slice(0, 40).map((r) => (
                <Link key={r.product_id} href={`/research/p/${r.slug}`} className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200">
                  {r.name_vi}
                </Link>
              ))}
              {m.list.length > 40 && <span className="text-[11px] text-zinc-500">+{m.list.length - 40}</span>}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
