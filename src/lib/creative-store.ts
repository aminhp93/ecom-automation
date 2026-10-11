import { promises as fs } from 'node:fs';
import path from 'node:path';

// Kho creative lưu bằng file JSON trong ../video-drafts (không dùng DB). Chỉ ghi qua các hàm ở đây.
export const ROOT = path.join(process.cwd(), '..', 'video-drafts');
export const BRAND_DIR = path.join(ROOT, 'brand-noctanest');
export const ID_RE = /^[a-z0-9-]+$/;

export async function readJson<T = any>(p: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(p, 'utf8')) as T;
  } catch {
    return null;
  }
}

export async function writeJson(p: string, data: unknown) {
  const tmp = `${p}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await fs.rename(tmp, p);
}

export const productDir = (product: string) => path.join(ROOT, product);
export const videoDir = (product: string, video: string) => path.join(ROOT, product, video);

export const CHECK_KEYS = ['character', 'room', 'product', 'claim', 'audio', 'rights'] as const;
export type CheckKey = (typeof CHECK_KEYS)[number];
export type CheckStatus = 'ok' | 'fail' | 'pending';

export function versionOf(name: string): { n: number; suffix: string } | null {
  const m = name.match(/-v(\d+)(?:-(.+))?\.mp4$/i);
  return m ? { n: Number(m[1]), suffix: m[2] ?? '' } : null;
}

/** Lý do một nội dung chưa đủ điều kiện chuẩn bị/đăng bài. Rỗng = đủ điều kiện. */
export function eligibilityReasons(c: any, latestFile: string | null): string[] {
  const out: string[] = [];
  if (!c.approved) out.push('Chưa có phiên bản nào được duyệt.');
  else if (latestFile && c.approved.file !== latestFile) out.push(`Bản mới nhất (${latestFile}) chưa được duyệt; bản duyệt hiện là ${c.approved.file}.`);
  const labels: Record<string, string> = { character: 'Nhân vật', room: 'Phòng', product: 'Sản phẩm', claim: 'Claim', audio: 'Âm thanh', rights: 'Nguồn/quyền sử dụng tư liệu' };
  for (const k of CHECK_KEYS) {
    const s = c.checks?.[k]?.status ?? 'pending';
    if (s !== 'ok') out.push(`${labels[k]}: ${s === 'fail' ? 'chưa đạt' : 'chưa kiểm'}${c.checks?.[k]?.note ? ` (${c.checks[k].note})` : ''}`);
  }
  for (const b of c.publishBlockers ?? []) out.push(b);
  return out;
}
