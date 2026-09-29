import { Sparkles } from 'lucide-react';
import { getDiscovery } from '@/lib/research/db';
import { DiscoverySection } from '@/components/research/DiscoverySection';

export default async function DiscoverPage() {
  const discovery = await getDiscovery();
  return <>
    <section>
      <h1 className="text-lg font-semibold">Tìm sản phẩm mới</h1>
      <p className="text-sm text-zinc-600 mt-2"><b>Dùng để:</b> Tìm thêm ứng viên trước khi nghiên cứu sâu và ra quyết định.</p>
      <p className="text-sm text-zinc-600 mt-1"><b>Bắt đầu:</b> Xem ứng viên “Đề xuất” trong lần quét mới nhất; bấm tên sản phẩm đã thêm để xem hồ sơ. Muốn quét thêm, sao chép lệnh bên dưới vào trợ lý.</p>
    </section>
    <DiscoverySection runs={discovery.runs} categories={discovery.categories} icon={<Sparkles className="w-4 h-4 text-violet-600" />} />
  </>;
}
