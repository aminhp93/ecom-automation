'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export interface VersionOption { id: number; label: string }

/** Ô chọn bản dữ liệu (mỗi lần fetch một bản, giữ 10 bản mới nhất). Chọn bản mới nhất thì bỏ tham số v; giữ nguyên tab (nhom) đang xem. */
export function VersionSelect({ options, current, latestId }: { options: VersionOption[]; current: number | null; latestId: number | null }) {
  const router = useRouter();
  const search = useSearchParams();
  return (
    <label className="inline-flex items-center" title="Bản dữ liệu (mỗi lần fetch một bản)">
      <select
        aria-label="Bản dữ liệu"
        value={current ?? ''}
        onChange={(e) => {
          const id = Number(e.target.value);
          const params = new URLSearchParams(search.toString());
          if (id === latestId) params.delete('v'); else params.set('v', String(id));
          const qs = params.toString();
          router.push(`/market-research/pipeline${qs ? `?${qs}` : ''}`, { scroll: false });
        }}
        className="text-[11px] border border-zinc-200 rounded-md px-1.5 py-0.5 bg-white text-zinc-700"
      >
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </label>
  );
}
