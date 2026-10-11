import Link from 'next/link';
import { getWatchedPages, getWatchDetail } from '@/lib/research/db';
import { buildDays, delta, dm, n0 } from '@/lib/research/watch';
import { CopyCommand } from '@/components/research/CopyCommand';

export const metadata = { title: 'Theo dõi đối thủ — Market Research' };

const TH = 'text-left font-medium text-zinc-500 py-1.5 pr-4 whitespace-nowrap';
const TD = 'py-2 pr-4 border-t border-zinc-100 tabular-nums whitespace-nowrap';

export default async function WatchListPage() {
  const pages = await getWatchedPages();
  const rows = await Promise.all(
    pages.map(async (p) => {
      const d = await getWatchDetail(p.page_id);
      const days = buildDays(d.ads, d.social, d.content);
      const last = [...days].reverse().find((x) => x.active_all != null);
      const prev = last ? [...days].reverse().find((x) => x.active_all != null && x.date < last.date) : undefined;
      const lastSocial = (pick: (x: (typeof days)[number]) => number | null) => [...days].reverse().find((x) => pick(x) != null);
      const fb = lastSocial((x) => x.fb_followers);
      const ig = lastSocial((x) => x.ig_followers);
      const tt = lastSocial((x) => x.tt_followers);
      return { p, last, prev, fb, ig, tt, nContent: d.content.length };
    }),
  );
  return (
    <>
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Theo dõi đối thủ</h1>
          <p className="text-sm text-zinc-600 mt-1 max-w-2xl">
            Số ad, follower và nội dung đăng của các page đối thủ chuẩn, cập nhật mỗi ngày. Thay cho file Google Sheet. Bấm vào một page để xem biểu đồ theo ngày, bảng nội dung 90 ngày và phân tích Winning Reel.
          </p>
        </div>
        <CopyCommand label="Cập nhật hôm nay" command="/dropship-research watch" />
      </section>
      <div className="mt-4 overflow-x-auto border border-zinc-200 rounded-lg bg-white px-4 py-2">
        <table className="text-xs w-full">
          <thead>
            <tr>
              <th className={TH}>Page</th>
              <th className={TH}>Ad active (mọi nước)</th>
              <th className={TH}>Ad ở AU</th>
              <th className={TH}>FB follower</th>
              <th className={TH}>IG follower</th>
              <th className={TH}>TikTok follower</th>
              <th className={TH}>Nội dung đã ghi</th>
              <th className={TH}>Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, last, prev, fb, ig, tt, nContent }) => {
              const ch = delta(last?.active_all, prev?.active_all);
              return (
                <tr key={p.page_id}>
                  <td className={`${TD} font-medium`}><Link href={`/market-research/watch/${p.page_id}`} className="text-blue-700 hover:underline">{p.label}</Link></td>
                  <td className={TD}>{n0(last?.active_all)}{ch != null && ch !== 0 && <span className={`ml-1 ${ch > 0 ? 'text-emerald-700' : 'text-red-600'}`}>{ch > 0 ? '+' : ''}{n0(ch)}</span>}</td>
                  <td className={TD}>{n0(last?.active_au)}</td>
                  <td className={TD}>{n0(fb?.fb_followers)}</td>
                  <td className={TD}>{n0(ig?.ig_followers)}</td>
                  <td className={TD}>{n0(tt?.tt_followers)}</td>
                  <td className={TD}>{nContent}</td>
                  <td className={TD}>{dm(last?.date)}</td>
                </tr>
              );
            })}
            {!rows.length && <tr><td className="py-3 text-zinc-400" colSpan={8}>Chưa có page nào đang theo dõi.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
