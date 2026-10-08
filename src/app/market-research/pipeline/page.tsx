import { getPipelineSheet, getPipelineSnapshots, getPipelineTags, getSnapshotRows, type PipelineRow } from '@/lib/research/db';
import { PipelineTable, type GroupTab } from '@/components/research/PipelineTable';
import { HelpPopover } from '@/components/research/HelpPopover';
import { VersionSelect } from '@/components/research/VersionSelect';
import { Download } from 'lucide-react';
import columns from '@/lib/research/pipeline-columns.json';
import { RULES, SCORE_CRITERIA, SCORE_INTRO, TEXT_RULES } from '@/lib/research/pipeline-rules';

// Link cũ (chọn / tiềm năng) không còn nhóm tương ứng nên mở tab Tất cả.
const TAB_FROM_PARAM: Record<string, GroupTab> = { 'theo-doi': 'theo-doi', loai: 'loai', 'chua-tag': 'chua-tag' };

const dm = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '—');
const dmy = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '—');
const STATUS_LABEL: Record<string, string> = { published: 'đang dùng', draft: 'nháp', rejected: 'từ chối', superseded: 'bản cũ' };
const SRC_LABEL: Record<string, string> = { amazon: 'Amazon', trends: 'Trends', tiktok: 'TikTok', meta_keyword: 'Meta ads', meta_au: 'Meta AU', meta_us: 'Meta US', meta_pages: 'Page đối thủ', discover: 'Quét ý tưởng' };

export default async function PipelineSheetPage({ searchParams }: { searchParams: Promise<{ nhom?: string; v?: string }> }) {
  const { nhom, v } = await searchParams;
  const [snaps, tags] = await Promise.all([getPipelineSnapshots(), getPipelineTags()]);
  const published = snaps.find((s) => s.status === 'published');
  const chosen = (v ? snaps.find((s) => s.id === Number(v)) : undefined) ?? published;

  // Bảng hiển thị = bản chụp đang dùng (hoặc bản được chọn xem), gắn tag hiện tại. Chưa có bản chụp thì đọc trực tiếp.
  let rows: PipelineRow[];
  if (chosen) {
    const snapRows = await getSnapshotRows(chosen.id);
    rows = snapRows.map((r) => ({ ...r.row, nhom: tags.get(r.key) ?? null }));
  } else {
    rows = await getPipelineSheet();
  }
  const products = rows.filter((r) => r.loai_dong === 'san_pham').length;

  const toolbarLeft = (
    <>
      <h1 className="text-base font-semibold text-zinc-900">Bảng tổng hợp</h1>
      {snaps.length > 0 && (
        <VersionSelect
          options={snaps.map((x) => ({ id: x.id, label: `${dmy(x.taken_on)} · #${x.id} · ${STATUS_LABEL[x.status] ?? x.status}` }))}
          current={chosen?.id ?? null}
          publishedId={published?.id ?? null}
        />
      )}
    </>
  );

  const toolbarRight = (
    <>
      {chosen && (
        <a
          href={`/market-research/pipeline/export${chosen.id !== published?.id ? `?v=${chosen.id}` : ''}`}
          download
          title="Tải bản dữ liệu đang chọn (kèm tag hiện tại) ra file Excel"
          className="inline-flex items-center gap-1 text-xs border border-zinc-200 rounded-md px-2 py-1 bg-white hover:bg-zinc-50 text-zinc-700"
        >
          <Download className="w-3.5 h-3.5" /> Xuất Excel
        </a>
      )}
      <HelpPopover label="Cách đọc và tổng hợp bảng này">
        <p className="font-medium text-zinc-800">Dữ liệu của bản đang chọn</p>
        {chosen ? (
          <p>
            Bản #{chosen.id}, chụp {dmy(chosen.taken_on)}. Lần kéo mới nhất của từng nguồn:{' '}
            {Object.entries(chosen.sources).map(([k, s]) => `${SRC_LABEL[k] ?? k}${k === 'meta_keyword' ? ` (${s.country === 'ALL' ? 'tất cả quốc gia' : 'chỉ AU'})` : ''} ${dm(s.captured_on)}${s.data_month ? ` (số liệu tháng ${s.data_month.slice(5)})` : ''}`).join(' · ')}.
          </p>
        ) : (
          <p>Chưa có bản chụp, đang đọc trực tiếp dữ liệu hiện tại.</p>
        )}
        <p className="font-medium text-zinc-800 pt-1">Các bước tổng hợp</p>
        <ol className="list-decimal pl-4 space-y-1">
          <li><b>Danh sách:</b> {products} sản phẩm cộng ứng viên từ lần quét ý tưởng hằng tuần.</li>
          <li><b>Kéo số liệu thô</b> (mỗi lần một bản chụp có ngày, không ghi đè): Amazon AU/US/UK, Google Trends US, TikTok Shop US, Meta Ads Library theo keyword (tất cả quốc gia, cộng riêng AU và US), page đối thủ. Bản #1–#5 chỉ có AU.</li>
          <li><b>Ghép bảng:</b> mỗi cột lấy số mới nhất của keyword chính. Ô trống (—) là chưa kiểm tra, không phải 0.</li>
          <li><b>Chụp bảng</b> thành bản độc lập mỗi lần fetch. Bản mới là nháp; “đang dùng” là bản mặc định của web và nút Xuất Excel. Muốn dùng bản nháp, nhắn Claude “dùng bản #N”.</li>
          <li><b>Tag</b> Theo dõi / Loại do bạn đặt, hiện ngay, không đi theo bản chụp.</li>
        </ol>
        <p className="font-medium text-zinc-800 pt-1">Màu số (ngưỡng đề xuất, sửa ở pipeline-rules.ts)</p>
        <ul className="space-y-0.5">
          {columns.filter((c) => RULES[c.key]).map((c) => {
            const r = RULES[c.key];
            const f = (n: number) => (c.type === 'pct' ? `${n * 100}%` : n.toLocaleString('en-US'));
            return (
              <li key={c.key}>
                {c.label}: <span className="text-emerald-700">xanh {r.dir === 'high' ? '≥' : '≤'} {f(r.good)}</span>, <span className="text-red-600">đỏ {r.dir === 'high' ? '<' : '>'} {f(r.bad)}</span>
              </li>
            );
          })}
          {columns.filter((c) => TEXT_RULES[c.key]).map((c) => (
            <li key={c.key}>
              {c.label}: {TEXT_RULES[c.key].legend}
            </li>
          ))}
        </ul>
        <p className="font-medium text-zinc-800 pt-1">Điểm tiềm năng (0–9)</p>
        <p>{SCORE_INTRO}</p>
        <ol className="list-decimal pl-4 space-y-0.5">
          {SCORE_CRITERIA.map((t) => <li key={t}>{t}</li>)}
        </ol>
        <p>Số Topview là ước tính. Số ad Meta “mọi nước” là số ad đang chạy ở mọi quốc gia, cột AU/US ở cuối bảng chỉ tính từng nước; số advertiser và ad &gt;60 ngày tính trong mẫu ~30 ad đầu, không phải toàn bộ.</p>
      </HelpPopover>
    </>
  );

  return <PipelineTable rows={rows} initialTab={TAB_FROM_PARAM[nhom ?? ''] ?? 'tat-ca'} toolbarLeft={toolbarLeft} toolbarRight={toolbarRight} />;
}
