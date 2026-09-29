import type { AdvertiserAdStats, AdvertiserLink } from './db';

export function latestPer<T extends { captured_on: string }>(rows: T[], key: (row: T) => string): T[] {
  const result = new Map<string, T>();
  for (const row of rows) {
    const old = result.get(key(row));
    if (!old || row.captured_on > old.captured_on) result.set(key(row), row);
  }
  return [...result.values()];
}

/** Select each observed value independently; zero is evidence, null is not. */
export function advertiserCounts(stats: AdvertiserAdStats[], snapshots: AdvertiserLink['advertisers']['advertiser_snapshots']) {
  const latest = (values: { captured_on: string; value: number | null | undefined }[]) =>
    values.filter((v) => v.value != null).sort((a, b) => b.captured_on.localeCompare(a.captured_on))[0];
  const au = latest([
    ...snapshots.map((s) => ({ captured_on: s.captured_on, value: s.active_au })),
    ...stats.map((s) => ({ captured_on: s.captured_on, value: s.countries?.AU })),
  ]);
  const all = latest([
    ...snapshots.map((s) => ({ captured_on: s.captured_on, value: s.active_all })),
    ...stats.map((s) => ({ captured_on: s.captured_on, value: s.countries?.ALL ?? s.active })),
  ]);
  return { au: au?.value ?? null, all: all?.value ?? null, auDate: au?.captured_on, allDate: all?.captured_on };
}
