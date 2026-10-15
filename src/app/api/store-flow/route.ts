import { promises as fs } from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROOT = path.join(process.cwd(), '..', 'workspace', 'noctanest', 'store');
const MAIN = path.join(ROOT, 'store-status.json');
const BENCHMARK_ROOT = path.join(process.cwd(), '..', 'reference', 'blackout', 'store-benchmarks');
const BENCHMARKS = ['guard', 'halo'];

export async function GET(request: Request) {
  try {
    const store = new URL(request.url).searchParams.get('store') ?? 'duskly';
    const main = JSON.parse(await fs.readFile(MAIN, 'utf8'));
    if (store === 'duskly') return Response.json({ store, status: main });
    if (!BENCHMARKS.includes(store)) return Response.json({ error: 'Store không hợp lệ.' }, { status: 400 });
    const benchmark = JSON.parse(await fs.readFile(path.join(BENCHMARK_ROOT, `${store}.json`), 'utf8'));
    // Checklist của mình làm khung để so sánh (chỉ lấy tên nhóm và việc, không lấy tiến độ).
    const checklist = main.groups.map((g: { id: string; name: string; items: { id: string; label: string }[] }) => ({
      id: g.id,
      name: g.name,
      items: g.items.map((i) => ({ id: i.id, label: i.label })),
    }));
    return Response.json({ store, benchmark, checklist });
  } catch (error) {
    console.error('store-flow status unreadable', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Không đọc được dữ liệu store.' }, { status: 500 });
  }
}
