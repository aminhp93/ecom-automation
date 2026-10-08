import Link from 'next/link';
import { getPipelineSnapshots, getSnapshotRows, type PipelineSnapshotMeta } from '@/lib/research/db';
import { diffSnapshots, toMap } from '@/lib/research/pipelineDiff';

const dmy = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '—');
const dm = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '—');
const SRC_LABEL: Record<string, string> = { amazon: 'Amazon', trends: 'Trends', tiktok: 'TikTok', meta_keyword: 'Meta ads', meta_pages: 'Page đối thủ', discover: 'Ý tưởng' };
const STATUS: Record<string, { label: string; cls: string }> = {
  published: { label: 'Đang dùng', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  draft: { label: 'Nháp chờ duyệt', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  rejected: { label: 'Đã từ chối', cls: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
  superseded: { label: 'Đã có bản mới hơn', cls: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
};
const MAX_CHANGED = 200;

export default async function PipelineHistoryPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const { from, to } = await searchParams;
  const snaps = await getPipelineSnapshots(); // mới nhất trước
  const byId = new Map(snaps.map((s) => [s.id, s]));
  const published = snaps.find((s) => s.status === 'published');
  const draft = published ? snaps.find((s) => s.status === 'draft' && s.id > published.id) : undefined;

  // Mặc định: bản đang dùng so với bản nháp mới; nếu không có nháp thì hai bản đang dùng gần nhất.
  let a: PipelineSnapshotMeta | undefined = from ? byId.get(Number(from)) : undefined;
  let b: PipelineSnapshotMeta | undefined = to ? byId.get(Number(to)) : undefined;
  if (!a || !b) {
    if (published && draft) { a = published; b = draft; }
    else {
      const pubs = snaps.filter((s) => s.status === 'published');
      if (pubs.length >= 2) { b = pubs[0]; a = pubs[1]; } else { a = undefined; b = undefined; }
    }
  }
  const diff = a && b ? diffSnapshots(toMap(await getSnapshotRows(a.id)), toMap(await getSnapshotRows(b.id))) : null;

  return (
    <>
      <section>
        <Link href="/market-research/pipeline" className="text-xs text-sky-700 hover:underline">← Bảng tổng hợp</Link>
        <h1 className="text-lg font-semibold text-zinc-900 mt-1">Lịch sử bản chụp và so sánh</h1>
        <p className="text-xs text-zinc-500 mt-1 max-w-3xl">
          Mỗi lần fetch dữ liệu được lưu thành một bản chụp độc lập, không sửa, không xoá. Bản mới ở trạng thái nháp cho đến khi bạn duyệt; web chỉ dùng bản “Đang dùng”.
          Muốn dùng bản nháp, nhắn Claude “dùng bản #N”; muốn bỏ, nhắn “từ chối bản #N”.
        </p>
      </section>

      <section className="bg-white border border-zinc-200 rounded-lg overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-zinc-500">
              <th className="px-3 py-2 font-medium">Bản</th>
              <th className="px-3 py-2 font-medium">Chụp lúc</th>
              <th className="px-3 py-2 font-medium">Trạng thái</th>
              <th className="px-3 py-2 font-medium text-right">Dòng</th>
              <th className="px-3 py-2 font-medium">Dữ liệu lấy từ</th>
              <th className="px-3 py-2 font-medium">Ghi chú</th>
              <th className="px-3 py-2 font-medium">Xem</th>
            </tr>
          </thead>
          <tbody>
            {snaps.map((s, i) => {
              const prev = snaps.slice(i + 1).find((x) => x.status !== 'rejected') ?? snaps[i + 1];
              const st = STATUS[s.status];
              return (
                <tr key={s.id} className="border-t border-zinc-100 align-top">
                  <td className="px-3 py-2 font-medium">#{s.id}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{dmy(s.taken_on)} <span className="text-zinc-400">{s.taken_at.slice(11, 16)} UTC</span></td>
                  <td className="px-3 py-2"><span className={`inline-block px-1.5 py-0.5 rounded border text-[11px] ${st.cls}`}>{st.label}</span></td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.row_count}</td>
                  <td className="px-3 py-2 text-zinc-600">
                    {Object.entries(s.sources).map(([k, v]) => `${SRC_LABEL[k] ?? k} ${dm(v.captured_on)}`).join(' · ')}
                  </td>
                  <td className="px-3 py-2 text-zinc-600 min-w-[200px]">{s.note ?? ''}</td>
                  <td className="px-3 py-2 whitespace-nowrap space-x-2">
                    <Link href={`/market-research/pipeline?v=${s.id}`} className="text-sky-700 hover:underline">Xem bảng</Link>
                    {prev && <Link href={`/market-research/pipeline/history?from=${prev.id}&to=${s.id}`} className="text-sky-700 hover:underline">So với #{prev.id}</Link>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="space-y-3">
        {!diff || !a || !b ? (
          <p className="text-xs text-zinc-500">Chưa có hai bản để so sánh. Từ lần fetch sau, bản mới sẽ hiện thay đổi ở đây trước khi bạn duyệt.</p>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-zinc-900">
              So sánh #{a.id} ({dmy(a.taken_on)}) → #{b.id} ({dmy(b.taken_on)}{b.status === 'draft' ? ', nháp chờ duyệt' : ''})
            </h2>
            <p className="text-xs text-zinc-600">
              Thêm <b>{diff.added.length}</b> · Bỏ <b>{diff.removed.length}</b> · Đổi <b>{diff.changed.length}</b> dòng ({diff.cellCount} ô). Tag và số ô trống không tính.
              {diff.added.length + diff.removed.length + diff.changed.length === 0 && ' Không có thay đổi.'}
            </p>
            {diff.added.length > 0 && (
              <div className="bg-white border border-emerald-200 rounded-lg p-3 text-xs">
                <b className="text-emerald-700">Thêm ({diff.added.length})</b>
                <p className="mt-1 text-zinc-700">{diff.added.map((r) => r.name).join(' · ')}</p>
              </div>
            )}
            {diff.removed.length > 0 && (
              <div className="bg-white border border-rose-200 rounded-lg p-3 text-xs">
                <b className="text-rose-700">Bỏ ({diff.removed.length})</b>
                <p className="mt-1 text-zinc-700">{diff.removed.map((r) => r.name).join(' · ')}</p>
              </div>
            )}
            {diff.changed.length > 0 && (
              <div className="bg-white border border-zinc-200 rounded-lg overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-zinc-500"><th className="px-3 py-2 font-medium">Sản phẩm</th><th className="px-3 py-2 font-medium">Cột</th><th className="px-3 py-2 font-medium">Trước</th><th className="px-3 py-2 font-medium">Sau</th></tr>
                  </thead>
                  <tbody>
                    {diff.changed.slice(0, MAX_CHANGED).flatMap((r) =>
                      r.cells.map((c, i) => (
                        <tr key={`${r.key}-${i}`} className="border-t border-zinc-100 align-top">
                          <td className="px-3 py-1.5 font-medium">{i === 0 ? r.name : ''}</td>
                          <td className="px-3 py-1.5 text-zinc-600">{c.label}</td>
                          <td className="px-3 py-1.5 text-rose-700 whitespace-pre-line">{c.old}</td>
                          <td className="px-3 py-1.5 text-emerald-700 whitespace-pre-line">{c.new}</td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
                {diff.changed.length > MAX_CHANGED && <p className="px-3 py-2 text-[11px] text-zinc-500">Chỉ hiện {MAX_CHANGED} sản phẩm đầu; xem đủ bằng SQL: select * from pipeline_diff({a.id}, {b.id}).</p>}
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
