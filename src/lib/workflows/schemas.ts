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

const awarenessLevel = z.enum([
  "unaware",
  "problem_aware",
  "solution_aware",
  "product_aware",
  "most_aware",
]);

export const angleHookSchema = z.object({
  variation: z.enum(["A", "B", "C"]),
  platform: z.enum(["tiktok", "meta", "both"]),
  spoken_hook: text,
  visual_first_frame: text,
  on_screen_text: text,
  why_it_stops_scroll: text,
  // English, render-ready prompts authored with the creative (feed straight to Imagen/Flux/Kling/Runway).
  image_prompt: text.optional(),
  video_prompt: text.optional(),
  generated_image_url: text.optional(),
  generated_video_url: text.optional(),
});

export const marketingAngleSchema = z.object({
  id: z.number().int().positive(),
  name: text,
  sub_audience: text,
  core_emotion: text,
  belief_to_shift: text,
  promise: text,
  proof_needed: text,
  awareness_level: awarenessLevel,
  recommended_format: text,
  hooks: z.array(angleHookSchema).min(1),
  source_evidence: text.optional(),
});

export const ugcScriptSchema = z.object({
  angle_id: z.number().int().nonnegative(),
  angle_name: text,
  creator_persona: text,
  framework: text,
  target_length: text,
  hook_line: text,
  scenes: z
    .array(
      z.object({
        time: text,
        visual: text,
        spoken: text,
        on_screen_text: text,
        video_prompt: text.optional(),
        generated_video_url: text.optional(),
      }),
    )
    .min(1),
  cta_line: text,
  b_roll_shot_list: z.array(text).min(1),
  compliance_flags: z.array(
    z.object({ claim: text, risk: text, compliant_rewrite: text }),
  ),
});

export const staticConceptSchema = z.object({
  angle_id: z.number().int().nonnegative(),
  format: z.enum(["single_image", "carousel", "before_after", "meme_ugc"]),
  concept: text,
  headline: text,
  primary_text: text,
  image_prompt: text.optional(),
  generated_image_url: text.optional(),
});

export const testPlanSchema = z.object({
  first_angle_id: z.number().int().nonnegative(),
  first_angle_rationale: text,
  daily_budget_per_ad_set: money.positive(),
  ad_set_count: z.number().int().positive(),
  test_window_days: z.number().int().positive(),
  kill_rules: z
    .array(z.object({ metric: text, threshold: text, action: text }))
    .min(1),
  scale_rule: text,
  iteration_note: text,
});

export const complianceSummarySchema = z.array(text).min(1);

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
  // Angle-driven creative system (optional — the reworked Stage 06 populates these)
  angle_briefs: z.array(marketingAngleSchema).optional(),
  ugc_scripts: z.array(ugcScriptSchema).optional(),
  static_concepts: z.array(staticConceptSchema).optional(),
  test_plan: testPlanSchema.optional(),
  compliance_summary: z.array(text).optional(),
});
