import Link from 'next/link';
import type { ProductOverview } from '@/lib/research/db';
import { pipelineGroup } from '@/lib/research/labels';

export type ProductTabKey = 'chon' | 'theo_doi' | 'candidates' | 'loai';
export interface ProductCounts {
  chon: number;
  theo_doi: number;
  loai: number;
  candidates: number;
}

/** Đếm sản phẩm theo nhóm pipeline; `candidates` là số ứng viên mới còn chờ xem (truyền từ discovery). */
export function groupCounts(rows: ProductOverview[], candidates: number): ProductCounts {
  const c: ProductCounts = { chon: 0, theo_doi: 0, loai: 0, candidates };
  for (const r of rows) c[pipelineGroup(r)]++;
  return c;
}

/** 3 tab của "Sản phẩm": Sản phẩm chọn · Sản phẩm theo dõi · Sản phẩm tiềm năng. Sản phẩm đã loại là link nhỏ bên phải, không phải tab. */
export function ProductTabs({ active, counts }: { active: ProductTabKey; counts: ProductCounts }) {
  const tabs = [
    { key: 'chon', href: '/research/products', label: 'Sản phẩm chọn', n: counts.chon, hint: 'Đã chọn, qua lọc cứng và đủ bằng chứng bắt buộc' },
    { key: 'theo_doi', href: '/research/products?nhom=theo-doi', label: 'Sản phẩm theo dõi', n: counts.theo_doi, hint: 'Đang nghiên cứu hoặc chờ quyết định. Số liệu được cập nhật mỗi lần quét' },
    { key: 'candidates', href: '/research/discover', label: 'Sản phẩm tiềm năng', n: counts.candidates, hint: 'Ý tưởng mới tìm được, chưa vào pipeline. Bấm vào để xem ảnh, đối thủ, số liệu' },
  ] as const;
  return (
    <nav className="flex items-end gap-1 border-b border-zinc-200 overflow-x-auto" aria-label="Sản phẩm">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            title={t.hint}
            aria-current={on ? 'page' : undefined}
            className={`px-3 py-2 -mb-px text-xs font-medium whitespace-nowrap border-b-2 ${
              on ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {t.label} <span className="tabular-nums text-zinc-400">{t.n}</span>
          </Link>
        );
      })}
      <Link
        href="/research/products?nhom=loai"
        title="Sản phẩm đã quyết định không chọn hoặc rớt lọc cứng. Ẩn khỏi các tab chính"
        aria-current={active === 'loai' ? 'page' : undefined}
        className={`ml-auto px-2 py-2 -mb-px text-[11px] whitespace-nowrap border-b-2 ${
          active === 'loai' ? 'border-zinc-500 text-zinc-700' : 'border-transparent text-zinc-400 hover:text-zinc-600'
        }`}
      >
        Đã loại <span className="tabular-nums">{counts.loai}</span>
      </Link>
    </nav>
  );
}
