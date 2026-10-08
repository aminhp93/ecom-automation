import { redirect } from 'next/navigation';

// Danh sách ứng viên đã gộp vào "Bảng tổng hợp" (/market-research/pipeline). Trang chi tiết /research/discover/[id] vẫn dùng.
export default function DiscoverRedirect() {
  redirect('/market-research/pipeline?nhom=tiem-nang');
}
