import { storyboardSchema, MAX_BYTES } from '@/lib/creative/storyboard';
import { InputError, renderStoryboard } from '@/lib/creative/render';

export const runtime = 'nodejs';
export const maxDuration = 300;
let rendering = false;

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: 'Nguồn yêu cầu không hợp lệ.' }, { status: 403 });
  if (rendering) return Response.json({ error: 'Đang xuất một video khác. Thử lại sau ít phút.' }, { status: 429 });
  if (Number(request.headers.get('content-length')) > MAX_BYTES + 1024 * 1024) return Response.json({ error: 'Tổng video tối đa 300 MB.' }, { status: 413 });
  rendering = true;
  try {
    const form = await request.formData();
    let json;
    try { json = JSON.parse(String(form.get('storyboard'))); }
    catch { throw new InputError('Storyboard không hợp lệ.'); }
    const parsed = storyboardSchema.safeParse(json);
    if (!parsed.success) throw new InputError(parsed.error.issues[0]?.message || 'Storyboard không hợp lệ.');
    const files = new Map<string, File>();
    let bytes = 0;
    for (const [key, value] of form) {
      if (value instanceof File) { files.set(key, value); bytes += value.size; }
    }
    if (bytes > MAX_BYTES) throw new InputError('Tổng video tối đa 300 MB.');
    const output = await renderStoryboard(parsed.data, files);
    return new Response(new Uint8Array(output), { headers: { 'Content-Type': 'video/mp4', 'Content-Disposition': 'attachment; filename="creative.mp4"', 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof InputError) return Response.json({ error: error.message }, { status: 400 });
    console.error('Scene render failed', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Không xuất được video. Kiểm tra định dạng video và FFmpeg trên máy chủ.' }, { status: 500 });
  } finally { rendering = false; }
}
