import { getCriteria, getCriteriaVersions } from '@/lib/research/db';
import { CopyCommand } from '@/components/research/CopyCommand';

const TH = 'text-left font-medium text-zinc-500 py-1.5 pr-3 whitespace-nowrap';
const TD = 'py-1.5 pr-3 border-t border-zinc-100 align-top';

export default async function CriteriaPage() {
  const [versions, criteria] = await Promise.all([getCriteriaVersions(), getCriteria()]);
  return (
    <>
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">Bộ tiêu chí đánh giá</h1>
          <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
            Mỗi lần đổi tiêu chí là một phiên bản mới; điểm luôn ghi kèm phiên bản đã dùng. Điểm từng tiêu chí ={' '}
            <code className="bg-zinc-100 px-1 rounded">(giá trị − ngưỡng xấu) / (ngưỡng tốt − ngưỡng xấu)</code>, kẹp 0–100, rồi lấy
            trung bình có trọng số trên các tiêu chí có dữ liệu. SP rớt bất kỳ lọc cứng nào bị đánh dấu “Rớt”.
          </p>
        </div>
        <CopyCommand label="Đề xuất phiên bản tiêu chí mới" command="/dropship-research criteria review" />
      </section>

      {versions.map((v) => {
        const rows = criteria.filter((c) => c.version === v.version);
        const active = rows.filter((c) => c.status !== 'retired');
        const retired = rows.filter((c) => c.status === 'retired');
        const totalWeight = active.filter((c) => c.kind === 'score').reduce((s, c) => s + Number(c.weight), 0);
        return (
          <section key={v.version} className={`bg-white border rounded-lg ${v.is_current ? 'border-zinc-900' : 'border-zinc-200'}`}>
            <div className="px-4 py-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">{v.version}</h2>
                {v.is_current && <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-white">đang dùng</span>}
                <span className="text-xs text-zinc-500">{v.created_on}</span>
              </div>
              <p className="text-xs text-zinc-600 mt-1">{v.summary}</p>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className={TH}>Nhóm</th><th className={TH}>Tiêu chí</th><th className={TH}>Loại</th>
                    <th className={`${TH} text-right`}>Ngưỡng tốt</th><th className={`${TH} text-right`}>Ngưỡng xấu</th>
                    <th className={`${TH} text-right`}>Trọng số</th><th className={TH}>Lý do / nguồn</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((c) => (
                    <tr key={c.key}>
                      <td className={`${TD} text-zinc-500 whitespace-nowrap`}>{c.group_name}</td>
                      <td className={TD}>
                        <div className="text-zinc-900">{c.name_vi}</div>
                        <code className="text-[10px] text-zinc-400 break-all">{c.expr}</code>
                      </td>
                      <td className={`${TD} whitespace-nowrap`}>{c.kind === 'hard_filter' ? <span className="text-rose-700">Lọc cứng</span> : 'Chấm điểm'}</td>
                      <td className={`${TD} text-right tabular-nums`}>{c.good ?? '—'}</td>
                      <td className={`${TD} text-right tabular-nums`}>{c.bad ?? '—'}</td>
                      <td className={`${TD} text-right tabular-nums`}>
                        {c.kind === 'score' ? `${c.weight} (${Math.round((Number(c.weight) / totalWeight) * 100)}%)` : '—'}
                      </td>
                      <td className={`${TD} text-zinc-600`}>{c.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {retired.length > 0 && (
                <div className="mt-4">
                  <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">Đã bỏ trong phiên bản này</div>
                  <ul className="text-xs space-y-1">
                    {retired.map((c) => (
                      <li key={c.key}>
                        <span className="line-through text-zinc-500">{c.name_vi}</span> — <span className="text-zinc-700">{c.rationale}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}
