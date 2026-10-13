import Link from 'next/link';
import { connection } from 'next/server';
import { createStore } from '@/lib/research/automation/store.mjs';
import { evaluate } from '@/lib/research/automation/engine.mjs';

export const metadata = { title: 'Vận hành nghiên cứu — Noctanest' };
const stateLabels: Record<string, string> = { fresh: 'Còn mới', stale: 'Cần cập nhật', missing: 'Chưa có', invalid: 'Cần kiểm tra' };
type Run = { id: string; run_day: string; status: string; attempt: number; error: string | null; result: { summary?: string } | null };
type Task = { task_key: string; title: string; detail: string; kind: string };

export default async function OperationsPage() {
  await connection();
  let report: ReturnType<typeof evaluate>;
  let runs: Run[] = [];
  let tasks: Task[] = [];
  let historyAvailable = false;
  try {
    const store = createStore();
    report = evaluate(await store.load('blackout-curtains'));
    try {
      [runs, tasks] = await Promise.all([
        store.request(`research_monitor_runs?select=id,run_day,status,attempt,error,result&product_id=eq.${report.product_id}&order=started_at.desc&limit=10`),
        store.request(`research_monitor_tasks?select=task_key,title,detail,kind&product_id=eq.${report.product_id}&status=eq.open&order=updated_at.desc`),
      ]);
      historyAvailable = true;
    } catch { /* Preview is explicitly separate from persisted worker output. */ }
  } catch {
    return <section className="rounded-xl border bg-white p-6"><h1 className="text-xl font-semibold">Vận hành nghiên cứu</h1><p className="mt-3">Chưa đọc được dữ liệu Supabase. Không có báo cáo mới được tạo. Kiểm tra kết nối rồi tải lại trang.</p></section>;
  }
  const previewTasks = report.tasks.map(t => ({ ...t, task_key: t.key }));
  return <div className="space-y-6">
    <header><p className="text-xs uppercase tracking-widest text-zinc-500">Noctanest · Market Research</p><h1 className="mt-2 text-2xl font-semibold">Vận hành nghiên cứu</h1><p className="mt-2 text-sm text-zinc-600">Blackout curtains · Theo dõi bằng chứng, thay đổi và việc cần xử lý.</p></header>
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm">
      <h2 className="font-semibold">Bản đầu: kiểm tra dữ liệu đã có</h2>
      <p className="mt-2">Chưa kết nối bộ thu thập Topview/Meta cho worker. Báo cáo dưới đây được tính khi mở trang, chưa phải kết quả thu thập thị trường mới.</p>
      <p className="mt-2">{historyAvailable ? 'Kho nhật ký đã kết nối. Xem lần chạy thực tế bên dưới.' : 'Chưa truy cập được kho nhật ký. Cần migration và kết nối worker trước khi chạy theo lịch.'}</p>
    </section>
    <section className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Kiểm tra hiện tại · {report.evaluated_on}</h2><p className="mt-2 text-sm">{report.summary}</p><p className="mt-2 text-sm text-zinc-500">Cổng A chưa được xác nhận. <Link className="underline" href="/market-research/p/blackout-curtains">Mở hồ sơ sản phẩm</Link></p></section>
    <section className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Độ mới của bằng chứng</h2><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-2">Nguồn</th><th>Lần chụp</th><th>Trạng thái</th></tr></thead><tbody>{report.freshness.map(f => <tr key={f.key} className="border-b last:border-0"><td className="py-3">{f.title}</td><td>{f.captured_on ?? '—'}</td><td className={f.status === 'fresh' ? 'text-emerald-700' : 'text-amber-800'}>{stateLabels[f.status]}</td></tr>)}</tbody></table></div></section>
    <section className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Thay đổi trong các snapshot gần nhất</h2><p className="mt-1 text-xs text-zinc-500">Số ads không cho biết doanh thu hay lợi nhuận.</p>{report.changes.length ? <ul className="mt-3 space-y-2 text-sm">{report.changes.map(c => <li key={c.name}>{c.name}: {c.before} → {c.after} ads AU <span className="text-zinc-500">({c.from} → {c.to})</span></li>)}</ul> : <p className="mt-3 text-sm">Chưa có biến động so sánh được.</p>}</section>
    <section><h2 className="font-semibold">{historyAvailable && runs.length ? 'Hàng chờ đã lưu' : 'Việc cần xử lý · bản xem trước'}</h2><div className="mt-3 grid gap-3 md:grid-cols-2">{(historyAvailable && runs.length ? tasks : previewTasks).map(t => <article key={t.task_key} className="rounded-xl border bg-white p-4"><p className="text-xs text-zinc-500">{t.kind === 'human' ? 'Cần bạn bổ sung / duyệt' : 'Cần nghiên cứu tiếp'}</p><h3 className="mt-1 font-medium">{t.title}</h3><p className="mt-2 text-sm text-zinc-600">{t.detail}</p></article>)}</div></section>
    <section className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Lịch sử worker</h2>{runs.length ? <ul className="mt-3 space-y-3 text-sm">{runs.map(r => <li key={r.id}>{r.run_day} · {r.status} · lần thử {r.attempt}<p className="text-zinc-500">{r.error ?? r.result?.summary}</p></li>)}</ul> : <p className="mt-3 text-sm text-zinc-500">Chưa có lần chạy được lưu. Lịch dự kiến: 06:00 giờ Việt Nam, chạy bù khi worker hoạt động lại trong ngày.</p>}</section>
  </div>;
}
