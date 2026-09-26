/** Biểu đồ đường nhỏ cho chuỗi Google Trends theo tháng (SVG thuần, render phía server). */
export function Sparkline({ values, width = 240, height = 48 }: { values: number[]; width?: number; height?: number }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const step = width / Math.max(values.length - 1, 1);
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(height - (v / max) * (height - 4) - 2).toFixed(1)}`);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="text-zinc-700" role="img" aria-label="Xu hướng theo tháng">
      <polyline points={pts.join(' ')} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}
