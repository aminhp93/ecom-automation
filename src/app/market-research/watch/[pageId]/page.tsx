import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Download } from 'lucide-react';
import { getWatchDetail } from '@/lib/research/db';
import { adsLibraryPageUrl } from '@/lib/research/adsLibraryUrl';
import { buildDays, dm, n0, seriesOf, viewDeltas } from '@/lib/research/watch';
import { MiniChart } from '@/components/research/MiniChart';
import { CopyCommand } from '@/components/research/CopyCommand';

const TH = 'text-left font-medium text-zinc-500 py-1.5 pr-3 whitespace-nowrap align-bottom';
const TD = 'py-1.5 pr-3 border-t border-zinc-100 align-top';
const NUM = `${TD} tabular-nums text-right whitespace-nowrap`;
const CH_LABEL: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok' };
const KIND_LABEL: Record<string, string> = { reel: 'Reel', post: 'Bài feed', video: 'Video', ad_video: 'Video ad' };

export default async function WatchPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await params;
  const d = await getWatchDetail(pageId);
  if (!d.page) notFound();
  const { page, ads, social, content, snapshots, winning } = d;
  const days = buildDays(ads, social, content);
  const deltas = viewDeltas(snapshots);
  const lastDate = days.length ? days[days.length - 1].date : null;
  const link = (platform: string) => [...social].reverse().find((s) => s.platform === platform && s.url)?.url ?? null;

  const byChannel = ['facebook', 'instagram', 'tiktok'].map((ch) => {
    const rows = content.filter((c) => c.channel === ch);
    const sum = (k: 'views' | 'reactions' | 'comments') => rows.reduce((s, c) => s + (c[k] ?? 0), 0);
    const has = (k: 'views' | 'reactions' | 'comments') => rows.filter((c) => c[k] != null).length;
    return { ch, n: rows.length, views: sum('views'), reactions: sum('reactions'), comments: sum('comments'), hv: has('views'), hr: has('reactions'), hc: has('comments') };
  });

  return (
    <>
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-zinc-500"><Link href="/market-research/watch" className="hover:underline">Theo dõi đối thủ</Link> /</p>
          <h1 className="text-lg font-semibold text-zinc-900">{page.label}</h1>
          <p className="text-sm text-zinc-600 mt-1 max-w-2xl">{page.note ?? 'Page đối thủ đang theo dõi hằng ngày.'}{lastDate ? ` Dữ liệu mới nhất: ${dm(lastDate)}.` : ''}</p>
          <p className="text-xs text-zinc-500 mt-2 flex flex-wrap gap-x-3 gap-y-1">
            <a className="text-blue-700 hover:underline" href={adsLibraryPageUrl(page.page_id)} target="_blank" rel="noreferrer">Ads Library</a>
            {(['facebook', 'instagram', 'tiktok'] as const).map((p) => link(p) && <a key={p} className="text-blue-700 hover:underline" href={link(p)!} target="_blank" rel="noreferrer">{CH_LABEL[p]}</a>)}
            {page.advertisers?.website && <a className="text-blue-700 hover:underline" href={page.advertisers.website} target="_blank" rel="noreferrer">Website</a>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/market-research/watch/${page.page_id}/export`} download className="inline-flex items-center gap-1 text-xs border border-zinc-200 rounded-md px-2 py-1 bg-white hover:bg-zinc-50 text-zinc-700"><Download className="w-3.5 h-3.5" /> Xuất Excel</a>
          <CopyCommand label="Cập nhật hôm nay" command="/dropship-research watch" />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <MiniChart title="Ad đang chạy (mọi nước)" points={seriesOf(days, (x) => x.active_all)} hint="Số ad active trên Meta Ads Library, quét mỗi ngày" />
        <MiniChart title="Ad đang chạy ở AU" points={seriesOf(days, (x) => x.active_au)} />
        <MiniChart title="Tổng ad (kể cả đã tắt, mọi nước)" points={seriesOf(days, (x) => x.total_all)} />
        <MiniChart title="Facebook follower" points={seriesOf(days, (x) => x.fb_followers)} hint="Facebook làm tròn (ví dụ 1M); chưa đọc được số like riêng" />
        <MiniChart title="Instagram follower" points={seriesOf(days, (x) => x.ig_followers)} />
        <MiniChart title="TikTok follower" points={seriesOf(days, (x) => x.tt_followers)} />
        <MiniChart title="Instagram: tổng số bài" points={seriesOf(days, (x) => x.ig_posts)} hint="Tổng bài trên profile; hiệu hai ngày = số bài đăng trong ngày" />
        <MiniChart title="Facebook: tổng số reel/video" points={seriesOf(days, (x) => x.fb_posts)} />
        <MiniChart title="TikTok: tổng số video" points={seriesOf(days, (x) => x.tt_posts)} />
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-zinc-900">Bảng theo ngày</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Ô trống (—) là ngày đó chưa quét chỉ số này, không phải 0. “Mới đăng” đếm nội dung có ngày đăng đúng ngày đó trong bảng nội dung bên dưới.</p>
        <div className="mt-2 overflow-x-auto border border-zinc-200 rounded-lg bg-white px-3 py-2 max-h-[420px]">
          <table className="text-xs w-full">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th className={TH}>Ngày</th><th className={TH}>Ad active</th><th className={TH}>Tổng ad</th><th className={TH}>Ad AU</th>
                <th className={TH}>FB follower</th><th className={TH}>IG follower</th><th className={TH}>IG tổng bài</th><th className={TH}>TikTok follower</th>
                <th className={TH}>Mới đăng FB</th><th className={TH}>Mới đăng IG</th><th className={TH}>Mới đăng TikTok</th>
              </tr>
            </thead>
            <tbody>
              {[...days].reverse().slice(0, 60).map((x) => (
                <tr key={x.date}>
                  <td className={`${TD} whitespace-nowrap`}>{x.date}</td>
                  <td className={NUM}>{n0(x.active_all)}</td><td className={NUM}>{n0(x.total_all)}</td><td className={NUM}>{n0(x.active_au)}</td>
                  <td className={NUM}>{n0(x.fb_followers)}</td><td className={NUM}>{n0(x.ig_followers)}</td><td className={NUM}>{n0(x.ig_posts)}</td><td className={NUM}>{n0(x.tt_followers)}</td>
                  <td className={NUM}>{x.new_fb || ''}</td><td className={NUM}>{x.new_ig || ''}</td><td className={NUM}>{x.new_tt || ''}</td>
                </tr>
              ))}
              {!days.length && <tr><td className="py-3 text-zinc-400" colSpan={11}>Chưa có dữ liệu.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-zinc-900">Nội dung đã đăng ({content.length})</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Reel, bài feed và video ad của page, nguồn từ trang công khai và Ads Library. Lượt xem chỉ có khi trang hiển thị; mỗi lần cập nhật ghi thêm một điểm để thấy view tăng bao nhiêu. Chỉ để học góc và cấu trúc, không sao chép.</p>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {byChannel.map((c) => (
            <div key={c.ch} className="border border-zinc-200 rounded-lg bg-white p-3 text-xs">
              <div className="font-medium text-zinc-700">{CH_LABEL[c.ch]}</div>
              <div className="mt-1 text-zinc-600 tabular-nums">
                {c.n} nội dung · {c.hv ? `${n0(c.views)} view` : 'chưa ghi view'}{c.hv && c.hv < c.n ? ` (${c.hv}/${c.n} có số)` : ''} · {c.hr ? `${n0(c.reactions)} thích` : 'chưa ghi thích'} · {c.hc ? `${n0(c.comments)} bình luận` : 'chưa ghi bình luận'}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 overflow-x-auto border border-zinc-200 rounded-lg bg-white px-3 py-2">
          <table className="text-xs w-full">
            <thead>
              <tr>
                <th className={TH}>Ngày đăng</th><th className={TH}>Kênh</th><th className={TH}>Loại</th><th className={TH}>Nội dung</th>
                <th className={`${TH} text-right`}>View</th><th className={`${TH} text-right`}>Tăng</th><th className={`${TH} text-right`}>Thích</th><th className={`${TH} text-right`}>Bình luận</th><th className={`${TH} text-right`}>Giây</th><th className={TH}>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {content.map((c) => {
                const dl = deltas.get(c.id);
                return (
                  <tr key={c.id}>
                    <td className={`${TD} whitespace-nowrap`}>{c.posted_on ?? '—'}</td>
                    <td className={`${TD} whitespace-nowrap`}>{CH_LABEL[c.channel]}</td>
                    <td className={`${TD} whitespace-nowrap`}>{KIND_LABEL[c.kind ?? ''] ?? c.kind ?? '—'}</td>
                    <td className={`${TD} max-w-[420px]`}>
                      {c.url ? <a href={c.url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">{c.title ?? c.url}</a> : (c.title ?? '—')}
                      {c.ad_id && <span className="ml-1 text-[10px] text-zinc-400">ad {c.ad_id}</span>}
                    </td>
                    <td className={NUM}>{n0(c.views)}</td>
                    <td className={NUM} title={dl ? `So với ${dm(dl.since)}` : undefined}>{dl ? `${dl.delta > 0 ? '+' : ''}${n0(dl.delta)}` : ''}</td>
                    <td className={NUM}>{n0(c.reactions)}</td><td className={NUM}>{n0(c.comments)}</td><td className={NUM}>{n0(c.duration_s)}</td>
                    <td className={`${TD} max-w-[320px] text-zinc-500`}>{c.note ?? ''}</td>
                  </tr>
                );
              })}
              {!content.length && <tr><td className="py-3 text-zinc-400" colSpan={10}>Chưa có nội dung.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 mb-8">
        <h2 className="text-sm font-semibold text-zinc-900">Winning Reel ({winning.length})</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Reel Facebook có view trên 1 triệu: hook, góc, cấu trúc và cảnh theo thời gian, để học cách kể chuyện (không sao chép). Chưa có link/ID reel và số view cụ thể cho các dòng này.</p>
        <div className="mt-2 overflow-x-auto border border-zinc-200 rounded-lg bg-white px-3 py-2">
          <table className="text-xs w-full">
            <thead>
              <tr><th className={TH}>#</th><th className={TH}>Hook trên màn hình</th><th className={TH}>Góc (angle)</th><th className={TH}>Cấu trúc</th><th className={TH}>Âm thanh</th><th className={`${TH} text-right`}>Giây</th><th className={`${TH} text-right`}>Cảnh</th><th className={TH}>View</th></tr>
            </thead>
            <tbody>
              {winning.map((w) => (
                <tr key={w.id}>
                  <td className={`${TD} tabular-nums`}>{w.seq}</td>
                  <td className={`${TD} max-w-[240px]`}>
                    <div className="font-medium text-zinc-800">{w.hook}</div>
                    {w.timeline && <details className="mt-1 text-zinc-500"><summary className="cursor-pointer">Cảnh theo thời gian</summary><pre className="whitespace-pre-wrap font-sans mt-1">{w.timeline}</pre></details>}
                  </td>
                  <td className={`${TD} max-w-[260px]`}>{w.angle}</td>
                  <td className={`${TD} max-w-[260px]`}>{w.structure}</td>
                  <td className={TD}>{w.audio}</td>
                  <td className={NUM}>{w.duration_s ?? '—'}</td><td className={NUM}>{w.scenes ?? '—'}</td>
                  <td className={`${TD} whitespace-nowrap`}>{w.views ? n0(w.views) : <span className="text-zinc-400" title="Chưa ghi số view">&gt; 1 triệu</span>}</td>
                </tr>
              ))}
              {!winning.length && <tr><td className="py-3 text-zinc-400" colSpan={8}>Chưa có phân tích.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
