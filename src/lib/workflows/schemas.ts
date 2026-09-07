import { z } from "zod";

const text = z.string().trim().min(1);
const score = z.number().min(0).max(100);
const money = z.number().nonnegative();
const url = z.url({ protocol: /^https?$/ });

export const validationSchema = z.object({
  trend_status: z.enum(["surging", "steady", "declining"]),
  review_sentiment_score: score,
  negative_reviews_mined: z
    .array(z.object({ issue: text, frequency: text, workaround: text }))
    .min(1),
  validation_score: score,
  verdict: z.enum(["GO", "CONDITIONAL_GO", "NO_GO"]),
  verdict_reason: text,
});

export const competitorSchema = z.object({
  competitors: z
    .array(
      z.object({
        name: text,
        url,
        selling_price: money,
        shipping_days: text,
        rating: z.number().min(0).max(5),
        offer_type: text,
        hook_score: score,
        weakness: text,
        platform: text.optional(),
        shopify_detected: z.boolean().optional(),
        shopify_theme: text.optional(),
        shopify_apps: z.array(text).optional(),
        bestseller_item: text.optional(),
        bestseller_url: url.optional(),
        products_json_url: url.optional(),
        ad_library_url: url.optional(),
        tiktok_url: url.optional(),
      }),
    )
    .min(1),
  outpositioning_strategy: text,
  price_opportunity: text,
  gap_identified: text,
});

export const supplierSchema = z.object({
  suppliers: z
    .array(
      z.object({
        source: text,
        unit_cost: money,
        moq: z.number().int().positive(),
        shipping_method: text,
        shipping_cost: money,
        delivery_days: text,
        reliability_rating: score,
        url: url.optional(),
        verification_url: url.optional(),
        badge: text.optional(),
        notes: text.optional(),
      }),
    )
    .min(1),
  break_even_roas: money.positive(),
  target_roas: money.positive(),
  profit_projection_100_orders: z.number(),
  profit_projection_500_orders: z.number(),
  gross_margin_pool_100: z.number().optional(),
  ad_spend_projection_100: money.optional(),
  net_profit_projection_100_orders: z.number().optional(),
  gross_margin_pool_500: z.number().optional(),
  ad_spend_projection_500: money.optional(),
  net_profit_projection_500_orders: z.number().optional(),
});

export const offerSchema = z.object({
  positioning_statement: text,
  target_desire: text,
  packages: z
    .array(
      z.object({
        tier: z.enum(["A", "B", "C"]),
        name: text,
        badge: text.optional(),
        price: money.positive(),
        value: money.positive(),
        savings: text,
        description: text,
        items: z.array(text).min(1),
        quantity: z.number().int().positive().optional(),
        estimated_cost: money.optional(),
        contribution: money.optional(),
        break_even_roas: money.positive().optional(),
      }),
    )
    .length(3)
    .refine(
      (items) => new Set(items.map((item) => item.tier)).size === 3,
      "Unique A/B/C tiers required",
    ),
  risk_reversal_guarantee: text,
  urgency_hook: text,
});

export const creativeSchema = z.object({
  viral_hooks: z
    .array(
      z.object({
        id: z.number().int().positive(),
        angle: text,
        hook_text: text,
        category: text,
      }),
    )
    .min(1),
  video_scripts: z
    .array(
      z.object({
        title: text,
        framework: text,
        target_length: text,
        scenes: z
          .array(
            z.object({
              time: text,
              visual: text,
              audio: text,
              text_overlay: text,
            }),
          )
          .min(1),
      }),
    )
    .min(1),
  shopify_page: z.object({
    headline: text,
    subheadline: text,
    benefits: z.array(z.object({ title: text, desc: text })).min(1),
    faqs: z.array(z.object({ q: text, a: text })).min(1),
    html_description: text,
  }),
});
