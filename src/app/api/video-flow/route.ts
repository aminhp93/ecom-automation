import { promises as fs } from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Mỗi video có 3 phần: 1-input, 2-instruction, 3-output, nằm trong ../video-drafts/<sản phẩm>/<video>/. Trạng thái quy trình ở .../2-instruction/flow-status.json (agent cập nhật mỗi phiên); trang Stage 06 chỉ đọc và hiển thị.
// Tư liệu đối thủ dùng chung cho mọi video của sản phẩm nằm ở .../<sản phẩm>/reference/. Quy trình dùng chung ở ../video-drafts/quy-trinh-chung/. Sản phẩm mặc định: blackout-curtains.
const ROOT = path.join(process.cwd(), '..', 'video-drafts');
const DEFAULT_PRODUCT = 'blackout-curtains';
const DEFAULT_VIDEO = 'video-1';

async function countFiles(dir: string, ext: string): Promise<number> {
  try {
    return (await fs.readdir(dir)).filter((f) => f.toLowerCase().endsWith(ext)).length;
  } catch {
    return 0;
  }
}

async function countDirs(dir: string, pattern: RegExp): Promise<number> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory() && pattern.test(e.name)).length;
  } catch {
    return 0;
  }
}

export async function GET(request: Request) {
  try {
    const product = new URL(request.url).searchParams.get('product') ?? DEFAULT_PRODUCT;
    if (!/^[a-z0-9-]+$/.test(product)) return Response.json({ error: 'Tên sản phẩm không hợp lệ.' }, { status: 400 });
    const video = new URL(request.url).searchParams.get('video') ?? DEFAULT_VIDEO;
    if (!/^[a-z0-9-]+$/.test(video)) return Response.json({ error: 'Tên video không hợp lệ.' }, { status: 400 });
    const VIDEO_DIR = path.join(ROOT, product, video);
    const raw = await fs.readFile(path.join(VIDEO_DIR, '2-instruction', 'flow-status.json'), 'utf8');
    const flow = JSON.parse(raw);
    const facts = {
      reelVideos: await countFiles(path.join(ROOT, product, 'reference', 'guard-blinds'), '.mp4'),
      adVideos: await countDirs(path.join(ROOT, product, 'reference'), /^guard-\d+$/),
      outputs: await countDirs(path.join(VIDEO_DIR, '3-output', 'videos'), /./),
    };
    return Response.json({ flow, facts });
  } catch (error) {
    console.error('video-flow status unreadable', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Không đọc được flow-status.json của video này.' }, { status: 500 });
  }
}
