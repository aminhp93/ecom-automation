import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Hiển thị hồ sơ SP (markdown do Claude viết) với bảng, danh sách, tiêu đề. */
export function Markdown({ children }: { children: string }) {
  return (
    <div
      className="text-sm leading-relaxed text-zinc-800 space-y-3
        [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-zinc-900 [&_h2]:mt-5
        [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-4
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5
        [&_strong]:font-semibold [&_strong]:text-zinc-900
        [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse
        [&_th]:text-left [&_th]:font-medium [&_th]:text-zinc-500 [&_th]:border-b [&_th]:border-zinc-200 [&_th]:py-1.5 [&_th]:pr-3
        [&_td]:border-b [&_td]:border-zinc-100 [&_td]:py-1.5 [&_td]:pr-3 [&_td]:align-top
        [&_a]:text-sky-700 [&_a]:underline"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children: rows }) => (
            <div className="overflow-x-auto">
              <table>{rows}</table>
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
