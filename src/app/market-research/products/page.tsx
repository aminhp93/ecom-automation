import { redirect } from 'next/navigation';

// Tab "Sản phẩm" đã gộp vào "Bảng tổng hợp" (/market-research/pipeline). Giữ route này để link cũ vẫn chạy.
export default async function ProductsRedirect({ searchParams }: { searchParams: Promise<{ nhom?: string }> }) {
  const { nhom } = await searchParams;
  redirect(`/market-research/pipeline?nhom=${nhom === 'theo-doi' || nhom === 'loai' ? nhom : 'chon'}`);
}
