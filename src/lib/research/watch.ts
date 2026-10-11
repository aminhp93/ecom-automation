import type { AdDaily, SocialDaily, WatchContent, WatchContentSnapshot } from '@/lib/research/db';

/** Một dòng theo ngày: số ad (Meta Ads Library), follower/like/tổng bài từng nền tảng, nội dung mới đăng trong ngày. */
export interface DayRow {
  date: string;
  active_all: number | null; total_all: number | null; active_au: number | null;
  fb_followers: number | null; fb_likes: number | null; fb_posts: number | null;
  ig_followers: number | null; ig_posts: number | null;
  tt_followers: number | null; tt_posts: number | null;
  new_fb: number; new_ig: number; new_tt: number;
}

/** Gộp theo ngày. Mỗi ngày một nền tảng có thể có nhiều dòng quét: lấy dòng cuối (id lớn nhất) và bỏ dòng not_found. */
export function buildDays(ads: AdDaily[], social: SocialDaily[], content: WatchContent[]): DayRow[] {
  const days = new Map<string, DayRow>();
  const row = (date: string): DayRow => {
    let r = days.get(date);
    if (!r) { r = { date, active_all: null, total_all: null, active_au: null, fb_followers: null, fb_likes: null, fb_posts: null, ig_followers: null, ig_posts: null, tt_followers: null, tt_posts: null, new_fb: 0, new_ig: 0, new_tt: 0 }; days.set(date, r); }
    return r;
  };
  for (const a of ads) { const r = row(a.captured_on); r.active_all = a.active_all; r.total_all = a.total_all; r.active_au = a.active_au; }
  for (const s of social) {
    if (s.detail?.status === 'not_found') continue;
    const r = row(s.captured_on);
    if (s.platform === 'facebook') { r.fb_followers = s.followers ?? r.fb_followers; r.fb_likes = s.likes ?? r.fb_likes; r.fb_posts = s.posts ?? r.fb_posts; }
    if (s.platform === 'instagram') { r.ig_followers = s.followers ?? r.ig_followers; r.ig_posts = s.posts ?? r.ig_posts; }
    if (s.platform === 'tiktok') { r.tt_followers = s.followers ?? r.tt_followers; r.tt_posts = s.posts ?? r.tt_posts; }
  }
  for (const c of content) {
    if (!c.posted_on) continue;
    const r = days.get(c.posted_on) ?? row(c.posted_on);
    if (c.channel === 'facebook') r.new_fb++; else if (c.channel === 'instagram') r.new_ig++; else r.new_tt++;
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export interface Point { date: string; value: number }
export const seriesOf = (days: DayRow[], pick: (d: DayRow) => number | null): Point[] =>
  days.flatMap((d) => { const v = pick(d); return v == null ? [] : [{ date: d.date, value: v }]; });

/** Lượt xem tăng so với lần ghi trước của cùng nội dung (null nếu mới có 1 điểm). */
export function viewDeltas(snaps: WatchContentSnapshot[]): Map<number, { delta: number; since: string } | null> {
  const by = new Map<number, WatchContentSnapshot[]>();
  for (const s of snaps) by.set(s.content_id, [...(by.get(s.content_id) ?? []), s]);
  const out = new Map<number, { delta: number; since: string } | null>();
  for (const [id, list] of by) {
    const withViews = list.filter((s) => s.views != null).sort((a, b) => a.captured_on.localeCompare(b.captured_on));
    if (withViews.length < 2) { out.set(id, null); continue; }
    const last = withViews[withViews.length - 1]; const prev = withViews[withViews.length - 2];
    out.set(id, { delta: (last.views ?? 0) - (prev.views ?? 0), since: prev.captured_on });
  }
  return out;
}

export const dm = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '—');
export const n0 = (v: number | null | undefined) => (v == null ? '—' : v.toLocaleString('en-US'));
export const delta = (cur: number | null | undefined, prev: number | null | undefined) => (cur == null || prev == null ? null : cur - prev);
