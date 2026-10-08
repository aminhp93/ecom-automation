import { Suspense } from 'react';
import { EcomOSDashboard } from '@/components/dashboard/EcomOSDashboard';

// Trang chủ chỉ có thanh điều hướng pipeline bên trái; khung chính để trống cho tới khi chọn một stage.
export default function Home() {
  return (
    <Suspense>
      <EcomOSDashboard />
    </Suspense>
  );
}
