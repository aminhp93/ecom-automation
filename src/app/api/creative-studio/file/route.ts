import { mediaPath, WORKSPACE_ROOT, REFERENCE_ROOT } from '@/lib/workspace-paths';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Read-only project/reference media with Range support. Resolve real paths to reject symlink escapes.
const TYPES: Record<string, string> = { '.mp4': 'video/mp4', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.md': 'text/markdown; charset=utf-8', '.webp': 'image/webp' };

export async function GET(request: Request) {
  const rel = new URL(request.url).searchParams.get('path') ?? '';
  const full = mediaPath(rel);
  if (!full) return new Response('Không hợp lệ', { status: 400 });
  const type = TYPES[path.extname(full).toLowerCase()];
  if (!type) return new Response('Không hợp lệ', { status: 400 });
  let size: number;
  try {
    const real = await fs.realpath(full);
    const roots = await Promise.all([WORKSPACE_ROOT, REFERENCE_ROOT].map((root) => fs.realpath(root)));
    if (!roots.some((root) => real.startsWith(root + path.sep))) return new Response('Không hợp lệ', { status: 400 });
    const stat = await fs.stat(real);
    if (!stat.isFile()) return new Response('Không hợp lệ', { status: 400 });
    size = stat.size;
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
