'use client';

export default function ResearchError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="bg-white border border-rose-200 rounded-lg p-5 space-y-2">
      <h1 className="text-sm font-semibold text-rose-700">Không tải được dữ liệu Market Research</h1>
      <p className="text-xs text-zinc-600">
        Kiểm tra biến môi trường <code className="bg-zinc-100 px-1 rounded">SUPABASE_URL</code> và{' '}
        <code className="bg-zinc-100 px-1 rounded">SUPABASE_PUBLISHABLE_KEY</code>, và project Supabase{' '}
        <code className="bg-zinc-100 px-1 rounded">dropship</code> có đang chạy (gói free tự tạm dừng nếu lâu không dùng).
      </p>
      {error.digest && <p className="text-[11px] text-zinc-400">Mã lỗi: {error.digest}</p>}
      <button
        type="button"
        onClick={reset}
        className="px-2.5 py-1.5 rounded-md border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
      >
        Thử lại
      </button>
    </section>
  );
}
