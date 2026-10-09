import type { MetaPageRef, PipelineRow, SocialPlatform, SocialRef } from '@/lib/research/db';

/** Bản đồ page_id → số liệu social mới nhất theo nền tảng (đọc từ competitor_social). */
export type SocialMap = Map<string, { fb?: SocialPlatform; ig?: SocialPlatform; tt?: SocialPlatform }>;

// Số ngày từ bài gần nhất tính theo hôm nay: số lúc quét (last) cộng số ngày đã trôi qua từ ngày quét.
const sinceScan = (on: string) => Math.max(0, Math.round((Date.now() - new Date(on + 'T00:00:00').getTime()) / 864e5));
const ageOf = (p: SocialPlatform) => (p.last == null ? null : p.last + sinceScan(p.on));
const age = (d: number | null) => (d == null ? '?' : d === 0 ? 'hôm nay' : `${d}d`);
const cnt = (p: SocialPlatform) => (p.n30 == null ? '' : ` (${p.lb ? '≥' : ''}${p.n30})`);
const cell = (label: string, p?: SocialPlatform) => `${label} ${p ? (p.last == null && p.n30 === 0 ? 'không có' : age(ageOf(p)) + (label === 'FB' ? '' : cnt(p))) : '—'}`;

/** Một dòng cho mỗi page Meta, cùng thứ tự với cột Meta pages: "Nobl: FB hôm nay · IG 8d (10) · TT hôm nay (9)". */
export function socialLine(r: SocialRef): string {
  if (!r.fb && !r.ig && !r.tt) return `${r.n}: —`;
  return `${r.n}: ${cell('FB', r.fb)} · ${cell('IG', r.ig)} · ${cell('TT', r.tt)}`;
}

export const socialTitle = (r: SocialRef) => {
  const f = (label: string, p?: SocialPlatform) => (p ? `${label}: ${p.f != null ? p.f.toLocaleString('en-US') + ' follower' : 'không rõ follower'}${p.h ? ` (@${p.h})` : ''}, bài gần nhất ${age(ageOf(p))}${p.n30 != null ? `, ${p.lb ? '≥' : ''}${p.n30} bài trong 30 ngày (tính lúc quét ${p.on.slice(8, 10)}/${p.on.slice(5, 7)})` : ''}` : '');
  return [f('Facebook', r.fb), f('Instagram', r.ig), f('TikTok', r.tt)].filter(Boolean).join('\n') || 'Chưa quét social cho page này';
};

/** Gắn social vào từng dòng: social_json (để web vẽ) và competitor_social (chữ, cho Excel và tìm kiếm). */
export function attachSocial(rows: PipelineRow[], social: SocialMap): PipelineRow[] {
  return rows.map((r) => {
    const pages = (r.meta_pages_json as MetaPageRef[] | null | undefined) ?? [];
    const refs: SocialRef[] = pages.map((p) => ({ id: p.id, n: p.n, ...(social.get(p.id) ?? {}) }));
    const any = refs.some((x) => x.fb || x.ig || x.tt);
    return { ...r, social_json: any ? refs : null, competitor_social: any ? refs.map(socialLine).join('\n') : null };
  });
}
