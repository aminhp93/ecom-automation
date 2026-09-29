import Link from 'next/link';
import { getOverview } from '@/lib/research/db';

const sections = [
  { href: '/research/discover', title: '1. Tìm sản phẩm mới', purpose: 'Tìm ý tưởng từ các ngành theo dõi, xem tín hiệu và kết quả lọc sơ bộ.', action: 'Xem ứng viên mới' },
  { href: '/research/products', title: '2. Đánh giá sản phẩm', purpose: 'So sánh các sản phẩm trong danh sách, kiểm tra bằng chứng và quyết định chọn hoặc bỏ.', action: 'Mở danh sách sản phẩm' },
  { href: '/research/data', title: '3. Kiểm tra dữ liệu', purpose: 'Xem ngày cập nhật, phát hiện bằng chứng thiếu trước khi ra quyết định.', action: 'Xem dữ liệu cần bổ sung' },
  { href: '/research/criteria', title: 'Bộ tiêu chí', purpose: 'Tra điều kiện loại, bằng chứng bắt buộc và cách tính điểm đang áp dụng.', action: 'Hiểu cách đánh giá' },
  { href: '/research/sessions', title: 'Phiên với anh Thanh', purpose: 'Xem lại sản phẩm đã trao đổi, kết luận và lý do trong từng buổi nghiên cứu.', action: 'Xem các phiên nghiên cứu' },
];

export default async function ResearchOverviewPage() {
  const rows = await getOverview();
  const chosen = rows.filter(r => r.decision && r.decision !== 'khong_chon');
  const conflicts = chosen.filter(r => r.decision_conflict);
  const missingCost = chosen.filter(r => r.readiness === 'san_sang' && r.landed_cost === null);
  return <>
    <section>
      <h1 className="text-xl font-semibold text-zinc-900">Tổng quan nghiên cứu thị trường</h1>
      <p className="text-sm text-zinc-600 mt-2"><b>Dùng để:</b> Nắm tình trạng nghiên cứu và chọn việc cần làm tiếp, ưu tiên thị trường AU.</p>
      <p className="text-sm text-zinc-600 mt-1"><b>Bắt đầu:</b> Xử lý sản phẩm đang chọn nhưng thiếu bằng chứng; nếu cần thêm ý tưởng, mở “Tìm sản phẩm mới”.</p>
    </section>
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3" aria-label="Tình trạng nghiên cứu">
      {[['Trong danh sách', rows.length], ['Đang chọn / dự phòng', chosen.length], ['Sẵn sàng quyết định', rows.filter(r => r.readiness === 'san_sang').length], ['Đang theo dõi', rows.filter(r => r.stage === 'monitoring').length]].map(([label, count]) =>
        <div key={label} className="bg-white border border-zinc-200 rounded-lg p-4"><div className="text-xs text-zinc-500">{label}</div><div className="text-2xl font-semibold mt-1">{count}</div></div>)}
    </section>
    <section className="bg-white border border-zinc-200 rounded-lg p-4">
      <h2 className="text-sm font-semibold">Ưu tiên tiếp theo</h2>
      <p className="text-sm text-zinc-600 mt-2">{conflicts.length} sản phẩm đang chọn có quyết định mâu thuẫn với bằng chứng; {missingCost.length} sản phẩm đã đủ bằng chứng nhưng chưa có giá vốn về AU.</p>
      <Link href="/research/products" className="inline-block mt-3 text-sm text-sky-700 underline">Xem việc cần làm theo sản phẩm →</Link>
    </section>
    <section>
      <h2 className="text-sm font-semibold mb-3">Các phần bên trong</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{sections.map(s =>
        <Link key={s.href} href={s.href} className="block bg-white border border-zinc-200 rounded-lg p-4 hover:border-zinc-500 focus-visible:outline-2 focus-visible:outline-sky-600">
          <h3 className="text-sm font-semibold">{s.title}</h3><p className="text-sm text-zinc-600 mt-2">{s.purpose}</p><div className="text-xs text-sky-700 mt-4">{s.action} →</div>
        </Link>)}</div>
    </section>
    <p className="text-xs text-zinc-500">Ứng viên mới → lọc sơ bộ → thu thập bằng chứng → đánh giá → quyết định → theo dõi. Điểm cao không thay thế bằng chứng; “đã thêm vào danh sách” chưa có nghĩa là “đã chọn để bán”.</p>
  </>;
}
