import path from 'node:path';
import { promises as fs } from 'node:fs';
import { z } from 'zod';
import { CHECK_KEYS, ID_RE, eligibilityReasons, productDir, readJson, videoDir, writeJson, versionOf } from '@/lib/creative-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Ghi nhận thủ công (không tự đăng, không DM/comment): review/duyệt phiên bản, kế hoạch và ghi nhận bài đăng, quyết định angle.
const checkSchema = z.object({ status: z.enum(['ok', 'fail', 'pending']), note: z.string().max(500).optional() });
const base = { product: z.string().regex(ID_RE).default('blackout-curtains') };
const schema = z.discriminatedUnion('action', [
  z.object({
    ...base, action: z.literal('review'), content: z.string().regex(/^video-\d+$/), file: z.string().max(200),
    decision: z.enum(['comment', 'request', 'approve', 'reject']), note: z.string().max(2000).default(''), by: z.string().max(60).default('Minh'),
    checks: z.record(z.string(), checkSchema).optional(),
  }),
  z.object({
    ...base, action: z.literal('post-save'), id: z.string().max(60).optional(), content: z.string().regex(/^video-\d+$/),
    channel: z.enum(['instagram', 'tiktok', 'facebook']), caption: z.string().max(2200).default(''), aspect: z.string().max(10).default('9:16'),
    plannedDate: z.string().max(10).default(''), status: z.enum(['planned', 'ready', 'posted', 'skipped']).default('planned'),
    url: z.string().max(500).default(''), postedBy: z.string().max(60).default(''), postedAt: z.string().max(30).default(''),
  }),
  z.object({ ...base, action: z.literal('post-delete'), id: z.string().max(60) }),
  z.object({ ...base, action: z.literal('angle-decision'), angle: z.string().regex(ID_RE), decision: z.enum(['continue', 'stop', 'none']), note: z.string().max(1000).default('') }),
]);

const err = (msg: string, status = 400) => Response.json({ error: msg }, { status });

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return err('Nguồn yêu cầu không hợp lệ.', 403);
  let input;
  try {
    input = schema.parse(await request.json());
  } catch (e) {
    return err(e instanceof z.ZodError ? e.issues[0]?.message || 'Dữ liệu không hợp lệ.' : 'Dữ liệu không hợp lệ.');
  }
  const now = new Date().toISOString();
  try {
    if (input.action === 'review') {
      const vdir = videoDir(input.product, input.content);
      const file = path.join(vdir, 'video.json');
      const c = await readJson(file);
      if (!c) return err('Không thấy nội dung.', 404);
      const vfiles = (await fs.readdir(path.join(vdir, '3-output', 'videos'))).filter((f) => f.endsWith('.mp4'));
      if (!vfiles.includes(input.file)) return err('Không thấy phiên bản này.', 404);
      if (input.checks) for (const [k, v] of Object.entries(input.checks)) if ((CHECK_KEYS as readonly string[]).includes(k)) (c.checks ??= {})[k] = v;
      if (input.decision === 'approve') {
        const fails = CHECK_KEYS.filter((k) => c.checks?.[k]?.status !== 'ok');
        if (fails.length) return err(`Chưa thể duyệt: còn mục chưa đạt hoặc chưa kiểm (${fails.join(', ')}).`);
        c.approved = { file: input.file, by: input.by, at: now };
        c.status = 'approved';
      } else if (input.decision === 'reject') {
        if (!input.note.trim()) return err('Từ chối cần ghi lý do.');
        if (c.approved?.file === input.file) c.approved = null;
        c.status = 'assembled';
      } else if (input.decision === 'request') {
        c.status = 'review';
      }
      (c.reviews ??= []).push({ at: now, by: input.by, file: input.file, decision: input.decision, note: input.note });
      c.updatedAt = now.slice(0, 10);
      await writeJson(file, c);
      return Response.json({ ok: true });
    }
    if (input.action === 'post-save' || input.action === 'post-delete') {
      const file = path.join(productDir(input.product), 'posts.json');
      const data = (await readJson(file)) ?? { posts: [] };
      if (input.action === 'post-delete') {
        data.posts = data.posts.filter((p: any) => p.id !== input.id);
        await writeJson(file, data);
        return Response.json({ ok: true });
      }
      const c = await readJson(path.join(videoDir(input.product, input.content), 'video.json'));
      if (!c) return err('Không thấy nội dung.', 404);
      if (!c.approved) return err('Chỉ phiên bản đã duyệt mới được chuẩn bị bài đăng.');
      if (input.status === 'ready' || input.status === 'posted') {
        const vdir = path.join(videoDir(input.product, input.content), '3-output', 'videos');
        const vfiles = (await fs.readdir(vdir)).filter((f) => f.endsWith('.mp4')).sort((a, b) => (versionOf(b)?.n ?? 0) - (versionOf(a)?.n ?? 0));
        const reasons = eligibilityReasons(c, vfiles[0] ?? null);
        if (reasons.length) return err(`Chưa đủ điều kiện: ${reasons[0]}`);
      }
      if (input.status === 'posted' && (!input.url.trim() || !input.postedBy.trim() || !input.postedAt.trim())) return err('Ghi nhận đã đăng cần link bài, người đăng và thời điểm đăng.');
      const post = {
        id: input.id ?? `p-${Date.now().toString(36)}`, content: input.content, file: c.approved.file, channel: input.channel, caption: input.caption,
        aspect: input.aspect, plannedDate: input.plannedDate, status: input.status, url: input.url, postedBy: input.postedBy, postedAt: input.postedAt,
        metrics: null, updatedAt: now,
      };
      const i = data.posts.findIndex((p: any) => p.id === post.id);
      if (i >= 0) data.posts[i] = { ...data.posts[i], ...post, metrics: data.posts[i].metrics ?? null };
      else data.posts.push(post);
      await writeJson(file, data);
      return Response.json({ ok: true, id: post.id });
    }
    const file = path.join(productDir(input.product), 'angles.json');
    const data = await readJson(file);
    const a = data?.angles?.find((x: any) => x.id === input.angle);
    if (!a) return err('Không thấy angle.', 404);
    a.decision = input.decision === 'none' ? null : input.decision;
    a.decisionNote = input.note || null;
    a.status = input.decision === 'continue' ? 'keep' : input.decision === 'stop' ? 'kill' : 'testing';
    data.updated = now.slice(0, 10);
    await writeJson(file, data);
    return Response.json({ ok: true });
  } catch (e) {
    console.error('creative-studio action failed', e instanceof Error ? e.message : e);
    return err('Không ghi được dữ liệu.', 500);
  }
}
