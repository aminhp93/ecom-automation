export interface FinancialInputs {
  supplier_price: number;
  shipping_cost: number;
  selling_price?: number;
}

export interface FinancialOutputs {
  supplier_price: number;
  shipping_cost: number;
  selling_price: number;
  payment_fee: number;
  refund_reserve: number;
  landed_cost: number;
  gross_margin: number;
  margin_percentage: number;
}

export interface ScoreFactors {
  demand: number;       // 0-100: Trend volume, search queries, video views
  competition: number;  // 0-100: Saturation (lower competitors running = higher score, or inverted)
  margin: number;       // 0-100: Margin percentage mapped
  creative: number;     // 0-100: UGC viability, before/after, demonstration
  problem: number;      // 0-100: Pain point severity
  shipping: number;     // 0-100: Weight, fragility, size
}

export interface ScoreResult {
  demand_score: number;
  competition_score: number;
  margin_score: number;
  creative_score: number;
  problem_score: number;
  shipping_score: number;
  product_score: number;
  recommendation: 'TEST' | 'CONSIDER' | 'KILL';
  recommendation_reason: string;
}

/**
 * Deterministic Financial Calculations
 * Landed Cost = Supplier + Shipping + Payment fee (2.9% + $0.30) + Refund reserve (3%)
 */
export function calculateFinancials(inputs: FinancialInputs): FinancialOutputs {
  const supplier_price = Math.max(0.1, inputs.supplier_price);
  const shipping_cost = Math.max(0, inputs.shipping_cost);

  // If no selling price provided, apply standard 3.5x markup rule of thumb
  let selling_price = inputs.selling_price;
  if (!selling_price || selling_price <= 0) {
    const rawTarget = (supplier_price + shipping_cost) * 3.4;
    // End with .99
    selling_price = Math.ceil(rawTarget) - 0.01;
    if (selling_price < 19.99) selling_price = 19.99;
  }

  const payment_fee = Number((selling_price * 0.029 + 0.3).toFixed(2));
  const refund_reserve = Number((selling_price * 0.03).toFixed(2));
  const landed_cost = Number((supplier_price + shipping_cost + payment_fee + refund_reserve).toFixed(2));
  const gross_margin = Number((selling_price - landed_cost).toFixed(2));
  const margin_percentage = Number(((gross_margin / selling_price) * 100).toFixed(1));

  return {
    supplier_price,
    shipping_cost,
    selling_price,
    payment_fee,
    refund_reserve,
    landed_cost,
    gross_margin,
    margin_percentage,
  };
}

/**
 * 6-Factor Weighted Ecom Scoring Formula
 * 30% Demand + 20% Competition + 15% Margin + 15% Creative + 10% Problem + 10% Shipping
 */
export function calculateProductScore(factors: ScoreFactors): ScoreResult {
  const demand = Math.min(100, Math.max(0, factors.demand));
  const competition = Math.min(100, Math.max(0, factors.competition));
  const margin = Math.min(100, Math.max(0, factors.margin));
  const creative = Math.min(100, Math.max(0, factors.creative));
  const problem = Math.min(100, Math.max(0, factors.problem));
  const shipping = Math.min(100, Math.max(0, factors.shipping));

  const weighted =
    0.30 * demand +
    0.20 * competition +
    0.15 * margin +
    0.15 * creative +
    0.10 * problem +
    0.10 * shipping;

  const product_score = Number(weighted.toFixed(1));

  let recommendation: 'TEST' | 'CONSIDER' | 'KILL' = 'CONSIDER';
  let recommendation_reason = '';

  if (product_score >= 82) {
    recommendation = 'TEST';
    recommendation_reason = `High potential score (${product_score}). Strong demand and high visual creative angles with solid margins.`;
  } else if (product_score >= 68) {
    recommendation = 'CONSIDER';
    recommendation_reason = `Moderate potential score (${product_score}). Test only if unique bundle offer or low-competition ad angle is validated.`;
  } else {
    recommendation = 'KILL';
    recommendation_reason = `Low score (${product_score}). Margins too thin, high shipping friction, or saturated ad competition.`;
  }

  return {
    demand_score: demand,
    competition_score: competition,
    margin_score: margin,
    creative_score: creative,
    problem_score: problem,
    shipping_score: shipping,
    product_score,
    recommendation,
    recommendation_reason,
  };
}
