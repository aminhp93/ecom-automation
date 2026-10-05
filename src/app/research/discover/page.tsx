import { redirect } from 'next/navigation';

// "Tìm sản phẩm mới" nay là nhóm "Ứng viên mới" trong tab Sản phẩm.
export default function DiscoverPage() {
  redirect('/research/products#tim-sp-moi');
}
