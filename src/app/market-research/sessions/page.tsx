import Link from 'next/link';
import { getSessions } from '@/lib/research/db';
import { Markdown } from '@/components/research/Markdown';
import { CopyCommand } from '@/components/research/CopyCommand';

const outcomeClass = (o: string) =>
  o.startsWith('Chọn') ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : o.startsWith('Bỏ') ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-amber-50 text-amber-800 border-amber-200';

export default async function SessionsPage() {
  const sessions = await getSessions();
  return (
    <>
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Phiên nghiên cứu với anh Thanh</h1>
          <p className="text-sm font-medium text-zinc-800 mt-2">Xem lại kết luận của từng buổi nghiên cứu</p>
          <p className="text-sm text-zinc-600 mt-1 max-w-2xl">Lưu sản phẩm đã xem, ý kiến của anh Thanh và quyết định trong từng buổi. Dùng để nhớ vì sao đã chọn, bỏ hoặc cần kiểm tra thêm.</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
            Mỗi buổi học/chọn sản phẩm: tiêu chí anh Thanh dùng, sản phẩm đã xem và kết quả. Tiêu chí ở đây được đưa vào bộ tiêu chí
            chấm điểm (<Link href="/market-research/criteria" className="underline">xem v3</Link>).
          </p>
        </div>
        <CopyCommand label="Ghi phiên mới từ transcript" command="/dropship-research session <đường dẫn file .srt/.txt>" />
      </section>

      {sessions.map((s) => (
        <section key={s.id} className="bg-white border border-zinc-200 rounded-lg">
          <div className="px-4 py-3 border-b border-zinc-100">
            <div className="text-[11px] text-zinc-500">{s.held_on}{s.mentor ? ` · ${s.mentor}` : ''}</div>
            <h2 className="text-sm font-semibold text-zinc-900 mt-0.5">{s.title}</h2>
            {s.summary && <p className="text-xs text-zinc-600 mt-1">{s.summary}</p>}
          </div>
          {s.session_products.length > 0 && (
            <div className="px-4 py-3 border-b border-zinc-100 flex flex-wrap gap-2">
              {s.session_products.map((sp) => (
                <Link
                  key={sp.products.slug}
                  href={`/market-research/p/${sp.products.slug}`}
                  title={sp.note ?? undefined}
                  className={`text-xs px-2 py-1 rounded-md border hover:opacity-80 ${outcomeClass(sp.outcome)}`}
                >
                  {sp.products.name_vi} <span className="opacity-70">· {sp.outcome}</span>
                </Link>
              ))}
            </div>
          )}
          <div className="p-4">
            <Markdown>{s.body_md}</Markdown>
            {s.source && <p className="text-[10px] text-zinc-400 mt-4">Nguồn: {s.source}</p>}
          </div>
        </section>
      ))}
      {sessions.length === 0 && <p className="text-xs text-zinc-500">Chưa có phiên nào.</p>}
    </>
  );
}
