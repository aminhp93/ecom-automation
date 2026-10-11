import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Phát file video/ảnh từ ../video-drafts (chỉ đọc, có Range để tua video). Chặn đường dẫn ra ngoài thư mục.
const ROOT = path.resolve(process.cwd(), '..', 'video-drafts');
const TYPES: Record<string, string> = { '.mp4': 'video/mp4', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

export async function GET(request: Request) {
  const rel = new URL(request.url).searchParams.get('path') ?? '';
  const full = path.resolve(ROOT, rel);
  const type = TYPES[path.extname(full).toLowerCase()];
  if (!full.startsWith(ROOT + path.sep) || !type) return new Response('Không hợp lệ', { status: 400 });
  let size: number;
  try {
    size = (await fs.stat(full)).size;
  } catch {
    return new Response('Không thấy file', { status: 404 });
  }
  const range = request.headers.get('range')?.match(/bytes=(\d*)-(\d*)/);
  let start = 0;
  let end = size - 1;
  let status = 200;
  if (range) {
    if (range[1]) start = Number(range[1]);
    if (range[2]) end = Math.min(Number(range[2]), size - 1);
    if (!range[1] && range[2]) {
      start = size - Number(range[2]);
      end = size - 1;
    }
    if (start > end || start >= size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    status = 206;
  }
  const stream = Readable.toWeb(createReadStream(full, { start, end })) as ReadableStream;
  const headers: Record<string, string> = {
    'Content-Type': type,
    'Content-Length': String(end - start + 1),
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
  };
  if (status === 206) headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
  return new Response(stream, { status, headers });
}
