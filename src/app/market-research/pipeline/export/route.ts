import ExcelJS from 'exceljs';
import columns from '@/lib/research/pipeline-columns.json';
import { adsLibraryPageUrl } from '@/lib/research/adsLibraryUrl';
import { textToneOf, toneOf, TONE_ARGB } from '@/lib/research/pipeline-rules';
import { getPipelineLocal, getPipelineSnapshots, getPipelineSocial, getPipelineTags, getSnapshotRows, type MetaPageRef, type PipelineRow } from '@/lib/research/db';
import { attachSocial } from '@/lib/research/social';
import { attachLocal } from '@/lib/research/local';
import { attachGate } from '@/lib/research/gate';
import { pageLine, pageTone, PAGE_TONE_ARGB } from '@/lib/research/metaPages';

// Xuất bảng tổng hợp ra Excel: bản dữ liệu đang chọn (?v=<id>, mặc định bản mới nhất), gắn tag hiện tại. Không lưu file ở đâu cả.
export const dynamic = 'force-dynamic';

const TAG_LABEL: Record<string, string> = { theo_doi: 'Theo dõi', loai: 'Loại' };
const TAG_RANK: Record<string, number> = { theo_doi: 0, loai: 2 };
const TINT_HEAD: Record<string, string> = { amazon: 'FFDCFCE7', meta: 'FFFEF9C3' };
const TINT_CELL: Record<string, string> = { amazon: 'FFF0FDF4', meta: 'FFFEFCE8' };
const NUMFMT: Record<string, string> = { int: '#,##0', num1: '0.0', num2: '0.00', pct: '0.0%' };
const WRAP = new Set(['meta_pages', 'competitor_social', 'local_brand_check', 'reason', 'meta_au_top', 'meta_au_top2', 'meta_us_top2', 'tt_top_item', 'cluster']);
const adsLibrary = adsLibraryPageUrl;

export async function GET(request: Request) {
  const v = new URL(request.url).searchParams.get('v');
  const [snaps, tags, social, local] = await Promise.all([getPipelineSnapshots(), getPipelineTags(), getPipelineSocial(), getPipelineLocal()]);
  const latest = snaps[0]; // getPipelineSnapshots sắp theo id giảm dần: bản mới nhất là mặc định
  const chosen = (v ? snaps.find((s) => s.id === Number(v)) : undefined) ?? latest;
  if (!chosen) return new Response('Chưa có bản dữ liệu nào để xuất.', { status: 404 });

  const rows: PipelineRow[] = attachGate(attachLocal(attachSocial((await getSnapshotRows(chosen.id)).map((r) => ({ ...r.row, nhom: tags.get(r.key) ?? null })), social), local));
  const num = (x: unknown) => (typeof x === 'number' ? x : -1);
  rows.sort((a, b) => (TAG_RANK[String(a.nhom)] ?? 1) - (TAG_RANK[String(b.nhom)] ?? 1) || num(b.au_searches) - num(a.au_searches) || String(a.name_vi).localeCompare(String(b.name_vi), 'vi'));
  const nProd = rows.filter((r) => r.loai_dong === 'san_pham').length;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Pipeline', { views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }] });
  ws.addRow([...columns.map((c) => c.label.replace(', bấm để mở Ads Library)', "; link ở sheet 'Meta pages (link)')"))]);
  const head = ws.getRow(1);
  head.height = 62;
  head.eachCell((c, n) => {
    c.font = { bold: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TINT_HEAD[(columns[n - 1] as { tint?: string }).tint ?? ''] ?? 'FFE4E4E7' } };
    c.alignment = { wrapText: true, vertical: 'bottom' };
  });
  rows.forEach((r) => {
    const row = ws.addRow([
      ...columns.map((c) => {
        const x = r[c.key];
        if (c.type === 'group') return TAG_LABEL[String(x)] ?? null;
        if (x === null || x === undefined || x === '') return null;
        return c.type in NUMFMT ? Number(x) : (x as string | number);
      }),
    ]);
    columns.forEach((c, j) => {
      const cell = row.getCell(j + 1);
      if (c.type in NUMFMT) cell.numFmt = NUMFMT[c.type];
      const tc = TINT_CELL[(c as { tint?: string }).tint ?? ''];
      if (tc) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: tc } };
      cell.alignment = { wrapText: WRAP.has(c.key), vertical: 'top' };
      const tone = c.type in NUMFMT ? toneOf(c.key, r[c.key]) : textToneOf(c.key, r[c.key]);
      if (tone) cell.font = { bold: true, color: { argb: TONE_ARGB[tone] } };
    });
    // Cột Meta pages: mỗi dòng page một màu (mặc định đen, đỏ nếu active/tổng < 30%, xanh nếu > 80%).
    const pages = (r.meta_pages_json as MetaPageRef[] | null | undefined) ?? [];
    const mj = columns.findIndex((c) => c.key === 'meta_pages');
    if (pages.length && mj >= 0) {
      row.getCell(mj + 1).value = { richText: pages.map((p, i) => ({ text: pageLine(p) + (i < pages.length - 1 ? '\n' : ''), font: { color: { argb: PAGE_TONE_ARGB[pageTone(p) ?? 'none'] } } })) };
    }
  });
  columns.forEach((c, j) => { ws.getColumn(j + 1).width = Math.max(8, Math.round(c.w / 7)); });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  // Excel chỉ cho một link mỗi ô nên mỗi page đối thủ có một dòng riêng ở sheet này.
  const mp = wb.addWorksheet('Meta pages (link)', { views: [{ state: 'frozen', ySplit: 1 }] });
  mp.addRow(['Sản phẩm', 'Tag', 'Page đối thủ', 'Ad đang chạy', 'Tổng ad', 'Năm tạo page', 'Ad trong mẫu keyword', 'Mở Ads Library']).eachCell((c) => {
    c.font = { bold: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE4E4E7' } };
  });
  for (const r of rows) {
    for (const p of (r.meta_pages_json as MetaPageRef[] | null | undefined) ?? []) {
      const row = mp.addRow([String(r.name_vi), TAG_LABEL[String(r.nhom)] ?? null, p.n, p.a, p.t, p.y, p.s ?? null, /^\d+$/.test(p.id) ? 'Mở' : null]);
      if (/^\d+$/.test(p.id)) row.getCell(8).value = { text: 'Mở', hyperlink: adsLibrary(p.id) };
      row.getCell(8).font = { color: { argb: 'FF0563C1' }, underline: true };
    }
  }
  [44, 11, 34, 13, 10, 12, 18, 14].forEach((w, i) => { mp.getColumn(i + 1).width = w; });
  mp.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 8 } };

  const note = wb.addWorksheet('Ghi chú');
  const src = Object.entries(chosen.sources).map(([k, s]) => `${k} ${s.captured_on ?? '—'}${s.data_month ? ` (tháng ${s.data_month})` : ''}`).join('; ');
  [
    ['Ngày chụp bản dữ liệu', chosen.taken_on],
    ['Bản dữ liệu', `#${chosen.id} (${chosen.status}); nguồn lấy lúc chụp: ${src}`],
    ['Số dòng', `${nProd} sản phẩm + ${rows.length - nProd} ứng viên từ lần quét ý tưởng`],
    ['Ô trống', 'Chưa kiểm tra / chưa có dữ liệu, không phải 0. Số Topview (Amazon, TikTok, Trends) là ước tính.'],
    ['Meta Ads AU', 'Số advertiser và ad >60 ngày tính trong mẫu ad đọc được, không phải toàn bộ ad.'],
    ['Tag', 'Theo dõi / Loại do người dùng đặt, chưa tag thì để trống; lấy theo thời điểm xuất file.'],
    ['Quy tắc', 'File xuất từ web để xem. Sửa dữ liệu ở Supabase (qua Claude), không sửa tay ở đây.'],
  ].forEach((r) => note.addRow(r));
  note.getColumn(1).width = 22;
  note.getColumn(2).width = 120;
  note.getColumn(1).font = { bold: true };

  const buf = await wb.xlsx.writeBuffer();
  const name = `pipeline-san-pham-${chosen.taken_on}${chosen.id !== latest?.id ? `-ban${chosen.id}` : ''}.xlsx`;
  return new Response(new Uint8Array(buf as ArrayBuffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'no-store',
    },
  });
}
