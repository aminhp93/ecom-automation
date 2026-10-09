import { getPipelineReviews, getPipelineSheet, getPipelineSnapshots, getPipelineLocal, getPipelineSocial, getPipelineTags, getSnapshotRows, type PipelineRow } from '@/lib/research/db';
import { attachSocial } from '@/lib/research/social';
import { attachLocal } from '@/lib/research/local';
import { attachGate } from '@/lib/research/gate';
import { PipelineTable, type GroupTab } from '@/components/research/PipelineTable';
import { HelpPopover } from '@/components/research/HelpPopover';
import { VersionSelect } from '@/components/research/VersionSelect';
import { RefreshDataButton } from '@/components/research/RefreshDataButton';
import { Download } from 'lucide-react';
import columns from '@/lib/research/pipeline-columns.json';
import { RULES, SCORE_CRITERIA, SCORE_INTRO, TEXT_RULES } from '@/lib/research/pipeline-rules';

// Link cũ (chọn / tiềm năng) không còn nhóm tương ứng nên mở tab Tất cả.
const TAB_FROM_PARAM: Record<string, GroupTab> = { 'theo-doi': 'theo-doi', loai: 'loai', 'chua-tag': 'chua-tag' };

const dm = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '—');
const dmy = (iso?: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '—');
const SRC_LABEL: Record<string, string> = { amazon: 'Amazon', trends: 'Trends', tiktok: 'TikTok', meta_keyword: 'Meta ads', meta_au: 'Meta AU', meta_us: 'Meta US', meta_pages: 'Page đối thủ', discover: 'Quét ý tưởng' };

export default async function PipelineSheetPage({ searchParams }: { searchParams: Promise<{ nhom?: string; v?: string }> }) {
  const { nhom, v } = await searchParams;
  const [snaps, tags, reviews, social, local] = await Promise.all([getPipelineSnapshots(), getPipelineTags(), getPipelineReviews(), getPipelineSocial(), getPipelineLocal()]);
  const latest = snaps[0]; // getPipelineSnapshots sắp theo id giảm dần; DB chỉ giữ 10 bản mới nhất
  const chosen = (v ? snaps.find((s) => s.id === Number(v)) : undefined) ?? latest;

  // Bảng hiển thị = bản chụp mới nhất (hoặc bản được chọn xem), gắn tag hiện tại. Chưa có bản chụp thì đọc trực tiếp.
  let rows: PipelineRow[];
  if (chosen) {
    const snapRows = await getSnapshotRows(chosen.id);
    rows = snapRows.map((r) => ({ ...r.row, nhom: tags.get(r.key) ?? null, reviewed_on: reviews.get(r.key)?.reviewed_on ?? null, review_note: reviews.get(r.key)?.review_note ?? null }));
  } else {
    rows = (await getPipelineSheet()).map((r) => ({ ...r, reviewed_on: reviews.get(`${r.loai_dong}:${r.ref}`)?.reviewed_on ?? null, review_note: reviews.get(`${r.loai_dong}:${r.ref}`)?.review_note ?? null }));
  }
  rows = attachGate(attachLocal(attachSocial(rows, social), local)); // social và kiểm local đọc trực tiếp (không nằm trong bản chụp), ghép theo page_id Meta
  const products = rows.filter((r) => r.loai_dong === 'san_pham').length;

  // Tiêu đề ở thanh trên; bản dữ liệu, Cột, Làm mới, Xuất Excel, trợ giúp nằm ở góc dưới bên phải của bảng.
  const toolbarLeft = <h1 className="text-base font-semibold text-zinc-900">Bảng tổng hợp</h1>;

  const settingsStart = (
    <div className="contents">
      {snaps.length > 0 && (
        <VersionSelect
          options={snaps.map((x, i) => ({ id: x.id, label: `${dmy(x.taken_on)} · #${x.id}${i === 0 ? ' · mới nhất' : ''}` }))}
          current={chosen?.id ?? null}
          latestId={latest?.id ?? null}
        />
      )}
      {chosen && latest && chosen.id !== latest.id && (
        <span
          className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-1.5 py-0.5"
          title="Số liệu các cột Amazon, Trends, TikTok, Meta, Điểm lấy theo bản chụp. Tag, Đã xem, Social đối thủ và Local brand check luôn là dữ liệu hiện tại."
        >
          Bản cũ · Tag, Đã xem, Social, Local là dữ liệu hiện tại
        </span>
      )}
    </div>
  );

  const settingsEnd = (
    <div className="contents">
      <RefreshDataButton />
      {chosen && (
        <a
          href={`/market-research/pipeline/export${chosen.id !== latest?.id ? `?v=${chosen.id}` : ''}`}
          download
          title="Tải bản dữ liệu đang chọn (kèm tag hiện tại) ra file Excel"
          className="inline-flex items-center gap-1 text-xs border border-zinc-200 rounded-md px-2 py-1 bg-white hover:bg-zinc-50 text-zinc-700"
        >
          <Download className="w-3.5 h-3.5" /> Xuất Excel
        </a>
      )}
      <HelpPopover label="Cách đọc và tổng hợp bảng này" placement="up">
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
          <li><b>Chụp bảng</b> thành bản độc lập mỗi lần fetch. Bản mới nhất là bản mặc định của web và nút Xuất Excel; chỉ giữ 10 bản gần nhất, bản cũ hơn tự xoá.</li>
          <li><b>Tag</b> Theo dõi / Loại do bạn đặt, hiện ngay, không đi theo bản chụp. Cũng vậy với dấu Đã xem, cột Social đối thủ và Local brand check: khi xem bản cũ, các cột này vẫn là dữ liệu hiện tại.</li>
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
    </div>
  );

  return <PipelineTable rows={rows} initialTab={TAB_FROM_PARAM[nhom ?? ''] ?? 'tat-ca'} toolbarLeft={toolbarLeft} settingsStart={settingsStart} settingsEnd={settingsEnd} />;
}
