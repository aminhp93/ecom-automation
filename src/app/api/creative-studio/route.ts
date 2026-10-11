import { promises as fs } from 'node:fs';
import path from 'node:path';
import { BRAND_DIR, ID_RE, eligibilityReasons, productDir, readJson, versionOf } from '@/lib/creative-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Kho creative: nội dung (video-N/video.json), angle, bài đăng theo kênh, kênh của brand, tư liệu đối thủ. GET chỉ đọc; ghi qua /api/creative-studio/action.
export async function GET(request: Request) {
  const product = new URL(request.url).searchParams.get('product') ?? 'blackout-curtains';
  if (!ID_RE.test(product)) return Response.json({ error: 'Tên sản phẩm không hợp lệ.' }, { status: 400 });
  const base = productDir(product);
  try {
    const angles = (await readJson(path.join(base, 'angles.json'))) ?? { angles: [] };
    const reference = await readJson(path.join(base, 'reference', 'reference.json'));
    const posts = (await readJson(path.join(base, 'posts.json')))?.posts ?? [];
    const channels = await readJson(path.join(BRAND_DIR, 'channels.json'));
    const entries = await fs.readdir(base, { withFileTypes: true });
    const contents = [];
    for (const e of entries) {
      if (!e.isDirectory() || !/^video-\d+$/.test(e.name)) continue;
      const meta = (await readJson(path.join(base, e.name, 'video.json'))) ?? { id: e.name, title: e.name, status: 'idea' };
      const vdir = path.join(base, e.name, '3-output', 'videos');
      let files: string[] = [];
      try {
        files = (await fs.readdir(vdir)).filter((f) => f.toLowerCase().endsWith('.mp4'));
      } catch {}
      const versions = await Promise.all(
        files.map(async (f) => {
          const st = await fs.stat(path.join(vdir, f));
          const v = versionOf(f);
          return {
            file: f,
            version: v ? `v${v.n}${v.suffix ? '-' + v.suffix : ''}` : f,
            n: v?.n ?? 0,
            variant: v?.suffix ?? '',
            mtime: st.mtimeMs,
            size: st.size,
            url: `/api/creative-studio/file?path=${encodeURIComponent(`${product}/${e.name}/3-output/videos/${f}`)}`,
          };
        }),
      );
      // Bản mới nhất = số cao nhất (cùng số: bản không hậu tố, rồi bản sửa gần nhất). KHÔNG mặc định là bản được duyệt.
      versions.sort((a, b) => b.n - a.n || Number(a.variant !== '') - Number(b.variant !== '') || b.mtime - a.mtime);
      const latest = versions[0]?.file ?? null;
      contents.push({ ...meta, type: meta.type ?? 'video', folder: e.name, versions, latestFile: latest, eligibility: eligibilityReasons(meta, latest) });
    }
    contents.sort((a, b) => String(a.folder).localeCompare(String(b.folder), undefined, { numeric: true }));
    return Response.json({ product, angles: angles.angles ?? [], contents, posts, channels, reference });
  } catch (error) {
    console.error('creative-studio unreadable', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Không đọc được dữ liệu creative của sản phẩm này.' }, { status: 500 });
  }
}
