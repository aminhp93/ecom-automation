'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { refreshResearchData } from '@/app/market-research/actions';

/** Dữ liệu research được cache 10 phút; bấm để lấy số mới ngay sau khi Claude ghi dữ liệu. */
export function RefreshDataButton() {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() =>
        start(async () => {
          await refreshResearchData();
          router.refresh();
        })
      }
      disabled={pending}
      title="Dữ liệu được lưu tạm 10 phút. Bấm để đọc lại Supabase ngay."
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-zinc-200 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${pending ? 'animate-spin' : ''}`} /> {pending ? 'Đang làm mới…' : 'Làm mới dữ liệu'}
    </button>
  );
}
