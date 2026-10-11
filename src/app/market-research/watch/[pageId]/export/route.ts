import ExcelJS from 'exceljs';
import { getWatchDetail } from '@/lib/research/db';
import { buildDays } from '@/lib/research/watch';

// Xuất 3 sheet cho một page theo dõi: theo ngày, nội dung, Winning Reel. Không lưu file ở đâu cả.
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ pageId: string }> }) {
  const { pageId } = await ctx.params;
  const d = await getWatchDetail(pageId);
  if (!d.page) return new Response('Không có page này trong danh sách theo dõi.', { status: 404 });
  const days = buildDays(d.ads, d.social, d.content);
  const wb = new ExcelJS.Workbook();

  const s1 = wb.addWorksheet('Theo ngày', { views: [{ state: 'frozen', ySplit: 1 }] });
  s1.addRow(['Ngày', 'Ad active (mọi nước)', 'Tổng ad', 'Ad AU', 'FB follower', 'FB like', 'FB tổng reel/video', 'IG follower', 'IG tổng bài', 'TikTok follower', 'TikTok tổng video', 'Mới đăng FB', 'Mới đăng IG', 'Mới đăng TikTok']);
  for (const x of [...days].reverse()) s1.addRow([x.date, x.active_all, x.total_all, x.active_au, x.fb_followers, x.fb_likes, x.fb_posts, x.ig_followers, x.ig_posts, x.tt_followers, x.tt_posts, x.new_fb || null, x.new_ig || null, x.new_tt || null]);

  const s2 = wb.addWorksheet('Nội dung', { views: [{ state: 'frozen', ySplit: 1 }] });
  s2.addRow(['Ngày đăng', 'Kênh', 'Loại', 'Nội dung', 'View', 'Thích', 'Bình luận', 'Giây', 'Link', 'Ad ID', 'Ngày kiểm tra', 'Ghi chú']);
  for (const c of d.content) s2.addRow([c.posted_on, c.channel, c.kind, c.title, c.views, c.reactions, c.comments, c.duration_s, c.url, c.ad_id, c.last_checked_on, c.note]);

  const s3 = wb.addWorksheet('Winning Reel', { views: [{ state: 'frozen', ySplit: 1 }] });
  s3.addRow(['#', 'File', 'Link reel', 'View', 'Giây', 'Hook', 'Góc', 'Cấu trúc', 'Âm thanh', 'Số cảnh', 'Cảnh theo thời gian']);
  for (const w of d.winning) s3.addRow([w.seq, w.file, w.reel_url, w.views, w.duration_s, w.hook, w.angle, w.structure, w.audio, w.scenes, w.timeline]);

  for (const ws of [s1, s2, s3]) { ws.getRow(1).font = { bold: true }; ws.columns.forEach((c) => { c.width = 18; }); }
  s2.getColumn(4).width = 60; s2.getColumn(12).width = 50; s3.getColumn(11).width = 80;
  const buf = await wb.xlsx.writeBuffer();
  const name = `theo-doi-${d.page.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new Response(buf as ArrayBuffer, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${name}"` } });
}
