import { redirect } from 'next/navigation';

// Tab Tổng quan đã bỏ (10/10): vào Market Research là mở thẳng Bảng tổng hợp.
export default function ResearchIndexPage() {
  redirect('/market-research/pipeline');
}
