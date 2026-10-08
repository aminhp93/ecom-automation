'use client';

import { useRouter } from 'next/navigation';

export interface VersionOption { id: number; label: string }

/** Ô chọn bản dữ liệu (mỗi lần fetch một bản). Chọn bản đang dùng thì về URL gốc. */
export function VersionSelect({ options, current, publishedId }: { options: VersionOption[]; current: number | null; publishedId: number | null }) {
  const router = useRouter();
  return (
    <label className="inline-flex items-center" title="Bản dữ liệu (mỗi lần fetch một bản)">
      <select
        aria-label="Bản dữ liệu"
        value={current ?? ''}
        onChange={(e) => {
          const id = Number(e.target.value);
          router.push(id === publishedId ? '/market-research/pipeline' : `/market-research/pipeline?v=${id}`, { scroll: false });
        }}
        className="text-[11px] border border-zinc-200 rounded-md px-1.5 py-0.5 bg-white text-zinc-700"
      >
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </label>
  );
}
