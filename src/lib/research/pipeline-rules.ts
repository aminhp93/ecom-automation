// Quy tắc tô màu số trong Bảng tổng hợp (web và file Excel dùng chung). Ngưỡng là đề xuất, sửa ở đây.
// dir 'high': càng cao càng tốt (>= good → xanh, < bad → đỏ). dir 'low': càng thấp càng tốt (<= good → xanh, > bad → đỏ).
// Giữa hai ngưỡng thì không tô màu. Ô trống (chưa có dữ liệu) không tô màu.
export type Rule = { dir: 'high' | 'low'; good: number; bad: number };

export const RULES: Record<string, Rule> = {
  us_searches: { dir: 'high', good: 500_000, bad: 100_000 },
  us_purchases: { dir: 'high', good: 5_000, bad: 1_000 },
  us_purchase_rate: { dir: 'high', good: 0.05, bad: 0.02 },
  au_searches: { dir: 'high', good: 5_000, bad: 1_000 },
  uk_searches: { dir: 'high', good: 30_000, bad: 3_000 },
  au_price: { dir: 'high', good: 40, bad: 20 },
  us_price: { dir: 'high', good: 25, bad: 10 },
  us_click_conc: { dir: 'low', good: 0.25, bad: 0.4 },
  tt_units_30d: { dir: 'high', good: 5_000, bad: 1_000 },
  tt_views: { dir: 'high', good: 5_000_000, bad: 500_000 },
  trend_floor: { dir: 'high', good: 0.8, bad: 0.6 },
  trend_season: { dir: 'low', good: 1.5, bad: 2.5 },
  trend_growth: { dir: 'high', good: 1.2, bad: 1.0 },
  meta_au_active_ads: { dir: 'high', good: 1_500, bad: 100 },
  meta_au_over60: { dir: 'high', good: 15, bad: 3 },
  meta_au_ads_n: { dir: 'high', good: 100, bad: 10 },
  meta_us_ads_n: { dir: 'high', good: 700, bad: 50 },
  n_empty: { dir: 'low', good: 3, bad: 8 },
};

export type Tone = 'good' | 'bad' | null;

export function toneOf(key: string, value: unknown): Tone {
  const r = RULES[key];
  if (!r || value === null || value === undefined || value === '') return null;
  const v = Number(value);
  if (!Number.isFinite(v)) return null;
  if (r.dir === 'high') return v >= r.good ? 'good' : v < r.bad ? 'bad' : null;
  return v <= r.good ? 'good' : v > r.bad ? 'bad' : null;
}

export const TONE_CLASS: Record<Exclude<Tone, null>, string> = { good: 'text-emerald-700 font-medium', bad: 'text-red-600 font-medium' };
export const TONE_ARGB: Record<Exclude<Tone, null>, string> = { good: 'FF15803D', bad: 'FFDC2626' };

// Cột chữ (không phải số): tô theo giá trị. Rủi ro siêu thị Cao nghĩa là mua sẵn được ở Kmart/Big W/Coles nên khó bán dropship.
// Giá bán DTC mục tiêu là chuỗi như "$29–39", "US$100–155/cửa sổ": lấy số lớn nhất trong chuỗi; < 50 đỏ, >= 100 xanh (bỏ qua đơn vị tiền).
export const DTC_PRICE_BAD_BELOW = 50;
export const DTC_PRICE_GOOD_FROM = 100;

type Mark = Exclude<Tone, null>;
const LEVEL = (low: Mark | null, high: Mark | null) => ({ Thấp: low, TB: null, Cao: high } as Record<string, Mark | null>);

export const TEXT_RULES: Record<string, { rule: (v: string) => Tone; legend: string }> = {
  weight_class: { rule: (v) => ({ nhẹ: 'good', TB: null, nặng: 'bad' } as Record<string, Tone>)[v] ?? null, legend: 'xanh = nhẹ, đỏ = nặng' },
  hazmat: { rule: (v) => (v === 'Không' ? 'good' : 'bad'), legend: 'xanh = Không, đỏ = có pin / lỏng / dễ vỡ / dao' },
  policy_risk: { rule: (v) => LEVEL('good', 'bad')[v] ?? null, legend: 'xanh = Thấp, đỏ = Cao' },
  retail_risk: { rule: (v) => LEVEL('good', 'bad')[v] ?? null, legend: 'xanh = Thấp, đỏ = Cao' },
  bundle_potential: { rule: (v) => LEVEL('bad', 'good')[v] ?? null, legend: 'xanh = Cao, đỏ = Thấp' },
  target_dtc_price: {
    rule: (v) => {
      const nums = (v.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => Number(n.replace(',', '.')));
      if (!nums.length) return null;
      const top = Math.max(...nums);
      return top < DTC_PRICE_BAD_BELOW ? 'bad' : top >= DTC_PRICE_GOOD_FROM ? 'good' : null;
    },
    legend: `đỏ = giá thấp (< ${DTC_PRICE_BAD_BELOW}), xanh = từ ${DTC_PRICE_GOOD_FROM}`,
  },
};

export function textToneOf(key: string, value: unknown): Tone {
  const r = TEXT_RULES[key];
  return r && typeof value === 'string' && value.trim() ? r.rule(value.trim()) : null;
}
