import fs from "fs";
import path from "path";

export interface EvidenceMetadata {
  data_quality?: "unverified" | "estimated" | "mock";
  requires_review?: boolean;
}

export interface ProductValidation extends EvidenceMetadata {
  trend_status: "surging" | "steady" | "declining";
  trend_growth_pct: number | null;
  active_competitor_ads: number | null;
  ads_longevity_days: number | null;
  review_sentiment_score: number;
  negative_reviews_mined: Array<{
    issue: string;
    frequency: string;
    workaround: string;
  }>;
  validation_score: number;
  verdict: "GO" | "CONDITIONAL_GO" | "NO_GO";
  verdict_reason: string;
}

export interface CompetitorItem {
  name: string;
  url: string;
  selling_price: number;
  shipping_days: string;
  rating: number;
  offer_type: string;
  hook_score: number;
  weakness: string;
  platform?: string;
  shopify_detected?: boolean;
  shopify_theme?: string;
  shopify_apps?: string[];
  bestseller_item?: string;
  bestseller_url?: string;
  products_json_url?: string;
  ad_library_url?: string;
  tiktok_url?: string;
}

export interface CompetitorAnalysis extends EvidenceMetadata {
  competitors: CompetitorItem[];
  outpositioning_strategy: string;
  price_opportunity: string;
  gap_identified: string;
}

export interface SupplierOption {
  source: string;
  unit_cost: number;
  moq: number;
  shipping_method: string;
  shipping_cost: number;
  delivery_days: string;
  reliability_rating: number;
  url?: string;
  verification_url?: string;
  badge?: string;
  notes?: string;
}

export interface SupplierEconomics extends EvidenceMetadata {
  suppliers: SupplierOption[];
  break_even_roas: number;
  target_roas: number;
  gross_margin_pool_100?: number;
  ad_spend_projection_100?: number;
  net_profit_projection_100_orders?: number;
  gross_margin_pool_500?: number;
  ad_spend_projection_500?: number;
  net_profit_projection_500_orders?: number;
  profit_projection_100_orders: number;
  profit_projection_500_orders: number;
}

export interface OfferPackageItem {
  quantity?: number;
  estimated_cost?: number;
  contribution?: number;
  break_even_roas?: number;
  tier: "A" | "B" | "C";
  name: string;
  badge?: string;
  price: number;
  value: number;
  savings: string;
  description: string;
  items: string[];
}

export interface OfferPackage extends EvidenceMetadata {
  positioning_statement: string;
  target_desire: string;
  packages: OfferPackageItem[];
  risk_reversal_guarantee: string;
  urgency_hook: string;
}

export interface SceneItem {
  time: string;
  visual: string;
  audio: string;
  text_overlay: string;
}

export interface VideoScript {
  title: string;
  framework: string;
  target_length: string;
  scenes: SceneItem[];
}

/**
 * Awareness stage of the sub-audience an angle targets (Eugene Schwartz).
 * Drives how much problem education the creative must do before the pitch.
 */
export type AwarenessLevel =
  | "unaware"
  | "problem_aware"
  | "solution_aware"
  | "product_aware"
  | "most_aware";

export interface AngleHook {
  variation: "A" | "B" | "C";
  platform: "tiktok" | "meta" | "both";
  spoken_hook: string; // first spoken line, conversational
  visual_first_frame: string; // what fills frame 1 (the pattern interrupt)
  on_screen_text: string;
  why_it_stops_scroll: string;
  // English render-ready prompts (authored with the creative, fed straight to image/video models)
  image_prompt?: string;
  video_prompt?: string;
  generated_image_url?: string;
  generated_video_url?: string;
}

/**
 * A distinct reason-to-buy tied to ONE sub-audience — the unit you A/B test.
 * NOT a format (Problem / Before-After / Testimonial are formats, not angles).
 */
export interface MarketingAngle {
  id: number;
  name: string; // "Mất ngủ 2h sáng"
  sub_audience: string; // who exactly this speaks to
  core_emotion: string; // the feeling the hook must land on
  belief_to_shift: string; // the old belief the ad has to break
  promise: string; // what this angle promises the buyer
  proof_needed: string; // evidence the creative MUST show for this angle
  awareness_level: AwarenessLevel;
  recommended_format: string; // "UGC talking-head + b-roll", "Founder story"...
  hooks: AngleHook[]; // 3 variations tested within the angle
  source_evidence?: string; // verbatim review / comment this angle came from
}

export interface UGCScriptScene {
  time: string;
  visual: string; // shot direction, phone-shot / unpolished feel
  spoken: string; // creator voiceover, conversational
  on_screen_text: string;
  video_prompt?: string; // English render-ready prompt for this scene
  generated_video_url?: string;
}

export interface UGCScript {
  angle_id: number;
  angle_name: string;
  creator_persona: string; // who films it and in what setting
  framework: string; // PAS / Before-After / Founder story / 3 reasons
  target_length: string;
  hook_line: string; // opening line (one of the angle's hooks)
  scenes: UGCScriptScene[];
  cta_line: string;
  b_roll_shot_list: string[]; // clips the creator must capture
  compliance_flags: Array<{
    claim: string;
    risk: string;
    compliant_rewrite: string;
  }>;
}

export interface StaticAdConcept {
  angle_id: number;
  format: "single_image" | "carousel" | "before_after" | "meme_ugc";
  concept: string; // the visual idea
  headline: string;
  primary_text: string; // Meta primary text
  image_prompt?: string; // English render-ready prompt
  generated_image_url?: string;
}

export interface CreativeTestPlan {
  first_angle_id: number;
  first_angle_rationale: string;
  daily_budget_per_ad_set: number;
  ad_set_count: number;
  test_window_days: number;
  kill_rules: Array<{ metric: string; threshold: string; action: string }>;
  scale_rule: string;
  iteration_note: string; // what to do with a winning angle
}

export interface CreativePack extends EvidenceMetadata {
  viral_hooks: Array<{
    id: number;
    angle: string;
    hook_text: string;
    category: string;
  }>;
  video_scripts: VideoScript[];
  shopify_page: {
    headline: string;
    subheadline: string;
    benefits: Array<{ title: string; desc: string }>;
    faqs: Array<{ q: string; a: string }>;
    html_description: string;
  };
  // Angle-driven creative system (optional; populated by the reworked Stage 06)
  angle_briefs?: MarketingAngle[];
  ugc_scripts?: UGCScript[];
  static_concepts?: StaticAdConcept[];
  test_plan?: CreativeTestPlan;
  compliance_summary?: string[];
}

export interface Product {
  revision?: number;
  no_go_override?: boolean;
  id: string;
  name: string;
  source: "tiktok" | "meta_ads" | "amazon" | "aliexpress" | "kalodata" | "manual";
  url: string;
  image_url: string;
  niche: string;
  category: string;

  // Financials & Economics
  supplier_price: number;
  selling_price: number;
  shipping_cost: number;
  payment_fee: number;
  refund_reserve: number;
  landed_cost: number;
  gross_margin: number;
  margin_percentage: number;

  // AI 6-factor Scoring (0-100)
  demand_score: number;
  competition_score: number;
  margin_score: number;
  creative_score: number;
  problem_score: number;
  shipping_score: number;
  product_score: number;

  status: "discovered" | "approved_for_validation" | "rejected" | "testing";
  recommendation: "TEST" | "CONSIDER" | "KILL";
  recommendation_reason: string;

  // Marketing Hooks & Insights
  wow_factor: string;
  target_audience: string;
  pain_points: string[];
  angles: string[]; // flat angle names, kept for back-compat; source of truth is marketing_angles
  marketing_angles?: MarketingAngle[]; // structured angles from the reworked Stage 01

  // Deep Pipeline Stages (Stages 02 -> 06/07)
  validation?: ProductValidation;
  competitor_analysis?: CompetitorAnalysis;
  supplier_economics?: SupplierEconomics;
  offer_package?: OfferPackage;
  creative_pack?: CreativePack;

  // Pipeline Progress Tracking
  pipeline_stage?:
    | "01_DISCOVERY"
    | "02_VALIDATION"
    | "03_COMPETITOR"
    | "04_SUPPLIER"
    | "05_OFFER"
    | "06_CREATIVE"
    | "LAUNCH_READY"
    | "REJECTED";
  stage_status?: {
    "01": "pending" | "ready" | "running" | "completed" | "failed" | "locked";
    "02": "pending" | "ready" | "running" | "completed" | "failed" | "locked";
    "03": "pending" | "ready" | "running" | "completed" | "failed" | "locked";
    "04": "pending" | "ready" | "running" | "completed" | "failed" | "locked";
    "05": "pending" | "ready" | "running" | "completed" | "failed" | "locked";
    "06": "pending" | "ready" | "running" | "completed" | "failed" | "locked";
  };

  created_at: string;
  updated_at: string;
}

export interface WorkflowEvent {
  id: string;
  timestamp: string;
  type:
    | "info"
    | "search"
    | "found"
    | "ai_analyze"
    | "score"
    | "approval"
    | "done"
    | "error";
  stage: string;
  message: string;
  data?: any;
}

export interface WorkflowRun {
  id: string;
  workflow: string;
  niche: string;
  status: "running" | "completed" | "failed";
  progress: number;
  started_at: string;
  completed_at?: string;
  logs: WorkflowEvent[];
  discovered_count: number;
}

export interface AgentRun {
  id: string;
  workflow_run_id?: string;
  agent: string;
  provider: string;
  model: string;
  task: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  latency_ms: number;
  created_at: string;
}

interface EcomStoreData {
  products: Product[];
  workflow_runs: WorkflowRun[];
  agent_runs: AgentRun[];
}

export type StageKey = "01" | "02" | "03" | "04" | "05" | "06";
export type StageStatusMap = NonNullable<Product["stage_status"]>;

const STAGE_ORDER: StageKey[] = ["01", "02", "03", "04", "05", "06"];

const DEFAULT_STAGE_STATUS: StageStatusMap = {
  "01": "completed",
  "02": "pending",
  "03": "locked",
  "04": "locked",
  "05": "locked",
  "06": "locked",
};

/**
 * Marks `completed` as done and unlocks the immediately following stage.
 * Pure & idempotent — used by every stage workflow so the transition rule lives in one place.
 */
export function advanceStageStatus(
  current: Product["stage_status"] | undefined,
  completed: StageKey,
): StageStatusMap {
  const next: StageStatusMap = current
    ? { ...current }
    : { ...DEFAULT_STAGE_STATUS };
  next[completed] = "completed";
  const followingIdx = STAGE_ORDER.indexOf(completed) + 1;
  for (let i = followingIdx; i < STAGE_ORDER.length; i++) {
    next[STAGE_ORDER[i]] = i === followingIdx ? "pending" : "locked";
  }
  return next;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "ecom_store.json");

// Initial seed products with rich sample data for immediate exploration
const SEED_PRODUCTS: Product[] = [
  {
    id: "prod_snuglet_roller",
    name: "Snuglet™ Natural Teething Comfort Roller (10ml)",
    source: "manual",
    url: "https://snuglet.com/products/snuglet-natural-teething-comfort-roller",
    image_url: "/images/snuglet/roller_01_hero_lifestyle.jpg",
    niche: "Baby Products",
    category: "Infant Teething & Natural Sleep Soothing",
    supplier_price: 3.8,
    selling_price: 24.99,
    shipping_cost: 2.9,
    payment_fee: 1.02,
    refund_reserve: 0.75,
    landed_cost: 8.47,
    gross_margin: 16.52,
    margin_percentage: 66.1,
    demand_score: 94,
    competition_score: 72,
    margin_score: 92,
    creative_score: 96,
    problem_score: 95,
    shipping_score: 97,
    product_score: 91.2,
    status: "approved_for_validation",
    recommendation: "TEST",
    recommendation_reason:
      "Bi lăn thép làm mát 360° kết hợp 100% thảo mộc hữu cơ bôi ngoài quai hàm (không nhét tay bẩn vào miệng). Margin 66.1%, lãi gộp $16.52/đơn, giải quyết dứt điểm cơn khóc lúc 2h sáng.",
    wow_factor:
      "Đầu bi lăn thép y tế 360° lướt êm dọc xương hàm dưới, thẩm thấu nhanh trong 30 giây không nhờn rít, hạ nhiệt nướu sưng đau ngay trước giờ ngủ.",
    target_audience:
      "Bố mẹ có con 3-18 tháng đang quấy khóc vì mọc răng nứt nướu, mất ngủ về đêm, mẹ bỉm sữa tìm giải pháp hữu cơ an toàn thay thế gel bôi hóa học.",
    pain_points: [
      "Bé đau nhức nướu gào khóc lúc 2h sáng khiến cả gia đình kiệt sức vì mất ngủ liên miên",
      "Gel tra nướu phải thọc ngón tay người lớn vào miệng bé rất mất vệ sinh và dễ bị bé cắn đau",
      "Thuốc giảm đau hóa học hoặc gel tê nhân tạo tiềm ẩn nguy cơ tác dụng phụ đáng lo ngại",
      "Đồ cắn răng bằng nhựa thường xuyên rơi xuống sàn bụi bẩn, phải đun sôi tiệt trùng hàng chục lần mỗi ngày",
    ],
    angles: [
      "Mất ngủ 2h sáng",
      "Không chạm tay vào miệng con",
      "Không muốn dùng gel gây tê hoá chất",
    ],
    marketing_angles: [
      {
        id: 1,
        name: "Mất ngủ 2h sáng",
        sub_audience:
          "Bố mẹ con 4-12 tháng, bị đánh thức 3-4 lần mỗi đêm nhiều tuần liền, kiệt sức",
        core_emotion: "Tuyệt vọng, kiệt sức, thấy có lỗi vì mất kiên nhẫn với con",
        belief_to_shift: "Con mọc răng thì cả nhà phải chịu mất ngủ, rồi cũng qua",
        promise: "Một cách dỗ con lúc nửa đêm nhẹ nhàng hơn để cả nhà ngủ tiếp",
        proof_needed:
          "Quay cảnh dùng thật lúc tối theo hướng dẫn; KHÔNG hứa 'ngủ ngay', không nói số phút cụ thể",
        awareness_level: "problem_aware",
        recommended_format: "UGC talking-head mẹ quay trong phòng bé lúc tối + b-roll",
        source_evidence:
          "Review 1-3 sao đối thủ: 'thức dậy 3-4 lần mỗi đêm', 'cả nhà kiệt sức'",
        hooks: [
          {
            variation: "A",
            platform: "tiktok",
            spoken_hook:
              "Đêm qua con mình lại thức lúc 2 giờ sáng — và đây là thứ duy nhất mình kịp làm mà không phải bật đèn.",
            visual_first_frame:
              "Phòng tối, đồng hồ 2:14, mẹ bơ phờ ngồi bên nôi, tay cầm chai lăn nhỏ.",
            on_screen_text: "2:14 sáng · đêm thứ 5 liên tiếp",
            why_it_stops_scroll:
              "Đồng cảm tức thì: bố mẹ mất ngủ thấy đúng hoàn cảnh của mình trong 2 giây đầu.",
            image_prompt:
              "Editorial lifestyle advertising photograph, a tired mother in her early 30s sitting calmly beside a crib in a dimly lit nursery late at night, warm bedside lamp glow, she is holding a small 10ml rollerball bottle and looking at it thoughtfully, cozy neutral-toned nursery, the product is the hero and softly lit, mood is quiet and reassuring, 50mm lens, shallow depth of field, warm premium colour grade, generous negative space top-right for a headline, photorealistic, 8k, no text, no logos. No crying child, no clinical setting.",
            video_prompt:
              "Vertical 9:16 UGC ad opening, ~3 seconds. A tired but calm mother in her early 30s speaks softly straight to camera in a dim cozy nursery lit by a warm bedside lamp, then glances down and gently picks up a small rollerball bottle from the nightstand. Slow subtle push-in on the bottle on the last beat. Handheld phone feel, natural low light, lifelike micro-expressions, 4k 30fps, no baked-in captions. Warm, quiet, product-forward. No crying baby, no clinical imagery.",
          },
          {
            variation: "B",
            platform: "meta",
            spoken_hook:
              "Vợ mình không ngủ trọn một giấc suốt gần 2 tuần con mọc răng. Mình lặng lẽ đặt mua cái này.",
            visual_first_frame:
              "Ông bố quay selfie trong bếp lúc rạng sáng, sau lưng là bình sữa và khăn sữa.",
            on_screen_text: "Góc nhìn của một ông chồng",
            why_it_stops_scroll:
              "POV người bạn đời hiếm gặp trong ngách này — lạ tai nên người xem dừng lại.",
            image_prompt:
              "Editorial lifestyle advertising photograph, a caring father in his 30s standing in a softly lit kitchen at early dawn, holding a small 10ml rollerball bottle and looking at it, blurred baby bottle and burp cloth on the counter behind him, calm warm morning light through the window, the product hero-lit and in sharp focus, reassuring understated mood, 50mm lens, shallow depth of field, warm premium colour grade, negative space for a headline, photorealistic, 8k, no text. No child in frame, no clinical setting.",
            video_prompt:
              "Vertical 9:16 UGC selfie video opening, ~3 seconds. A father in his 30s films himself talking to camera in a softly lit kitchen at dawn, tired but warm, then holds up a small rollerball bottle toward the lens. Handheld, natural morning light, authentic and unpolished, 4k 30fps, no captions baked in. Calm and sincere. No baby on screen, no medical imagery.",
          },
          {
            variation: "C",
            platform: "both",
            spoken_hook:
              "3 đêm liền mình chỉ ngủ được 4 tiếng. Nếu bạn cũng đang đếm từng giờ, để mình cho bạn xem mình đổi cái gì.",
            visual_first_frame:
              "Cận mặt mẹ quầng thâm mắt nhìn thẳng camera, ánh sáng cửa sổ sớm mai.",
            on_screen_text: "Đang đếm từng giờ ngủ?",
            why_it_stops_scroll:
              "Con số cụ thể ('4 tiếng', '3 đêm') + câu hỏi trực diện kéo đúng người đang trải qua.",
            image_prompt:
              "Editorial lifestyle advertising photograph, close-up portrait of a tired mother in her early 30s with visible under-eye shadows looking directly into the lens with a calm, honest expression, soft early-morning window light, neutral bedroom background gently blurred, she holds a small rollerball bottle near her chest, the product in sharp focus, intimate and sincere mood, 50mm lens, shallow depth of field, warm muted colour grade, photorealistic, 8k, no text. No child, no clinical setting.",
            video_prompt:
              "Vertical 9:16 UGC ad opening, ~3 seconds. Close, honest talking-head of a tired mother in her early 30s speaking directly to camera in soft morning window light, then she lifts a small rollerball bottle into frame. Handheld phone feel, natural light, real skin texture, 4k 30fps, no baked-in text. Sincere, calm, product-forward. No baby in distress, no medical setting.",
          },
        ],
      },
      {
        id: 2,
        name: "Không chạm tay vào miệng con",
        sub_audience:
          "Bố mẹ kỹ tính về vệ sinh, thấy gợn khi phải thọc ngón tay bôi gel vào nướu con",
        core_emotion: "Gợn, lo vi khuẩn từ tay người lớn",
        belief_to_shift: "Bôi gel bằng ngón tay vào nướu con là chuyện bình thường",
        promise:
          "Dùng bên ngoài viền hàm — không đưa ngón tay hay sản phẩm vào miệng con",
        proof_needed:
          "Demo thao tác lăn ngoài viền hàm; KHÔNG dùng từ 'diệt khuẩn' / 'kháng khuẩn'",
        awareness_level: "solution_aware",
        recommended_format: "Demo cận cảnh thao tác + voiceover ngắn",
        source_evidence:
          "Comment TikTok đối thủ: 'mỗi lần bôi lại phải rửa tay', 'bé cắn ngón tay'",
        hooks: [
          {
            variation: "A",
            platform: "tiktok",
            spoken_hook:
              "Mỗi tối mình rửa tay 5 lần chỉ để bôi gel cho con — tới khi mình nhận ra không nhất thiết phải cho ngón tay vào miệng bé.",
            visual_first_frame:
              "Cận tay mẹ vừa vặn nắp một tuýp gel thì khựng lại, đặt xuống, cầm chai lăn lên.",
            on_screen_text: "Khoan đã — có cách khác không?",
            why_it_stops_scroll:
              "Chi tiết cụ thể ('rửa tay 5 lần') làm người có cùng thói quen thấy 'đúng mình'.",
            image_prompt:
              "Editorial product photograph, adult hands over a clean bright bathroom counter, one hand setting down a generic ointment tube and the other picking up a small stainless-steel rollerball bottle, crisp daylight, water droplets on the counter, the rollerball bottle in sharp hero focus, minimal calm composition, 50mm macro, shallow depth of field, cool-neutral premium colour grade, photorealistic, 8k, no text, no logos, no faces, no mouths.",
            video_prompt:
              "Vertical 9:16 close-up UGC video, ~3 seconds. Adult hands at a bright bathroom counter start to open a generic gel tube, pause, set it down, and pick up a small stainless-steel rollerball bottle instead. Natural daylight, handheld phone feel, macro detail on the hands and product, 4k 30fps, no captions. Calm and matter-of-fact. No mouth, no child, no clinical setting.",
          },
          {
            variation: "B",
            platform: "meta",
            spoken_hook:
              "Ngón tay người lớn không sạch như mình tưởng, nhất là khi chạm vào nướu đang nứt của con. Đây là cách mình làm khác đi.",
            visual_first_frame:
              "Split đơn giản: bên trái tuýp gel + khăn giấy, bên phải chai lăn thép trên viền hàm (mô hình, không phải bé thật).",
            on_screen_text: "Cách cũ vs cách mình đang dùng",
            why_it_stops_scroll:
              "Đặt vấn đề vệ sinh thẳng thắn + hình so sánh rõ khiến người lo vệ sinh dừng lại.",
            image_prompt:
              "Editorial split-composition product photograph on a clean neutral surface: left side a generic ointment tube with a crumpled tissue, right side a sleek stainless-steel rollerball bottle standing upright and hero-lit; soft studio light, crisp focus, minimal premium styling, clear visual contrast between messy-left and clean-right, 50mm, shallow depth of field, neutral colour grade, photorealistic, 8k, no text, no people.",
            video_prompt:
              "Vertical 9:16 product video, ~3 seconds. Camera pushes slowly across a clean neutral surface from a generic gel tube with a tissue on the left to a sleek stainless-steel rollerball bottle standing upright on the right, which is hero-lit. Soft studio light, smooth slider move, 4k 30fps, no captions. Minimal, premium, calm. No people, no mouths, no clinical setting.",
          },
          {
            variation: "C",
            platform: "both",
            spoken_hook:
              "Nếu bạn cũng thấy gợn mỗi lần phải thọc tay vào miệng con để bôi gel, video này dành cho bạn.",
            visual_first_frame:
              "Mẹ nhìn tuýp gel trên tay với vẻ ngần ngừ, rồi đặt xuống bàn.",
            on_screen_text: "Thấy gợn mỗi lần bôi gel?",
            why_it_stops_scroll:
              "Gọi tên đúng cảm giác 'gợn' mà tệp này chưa ai nói ra giúp họ.",
            image_prompt:
              "Editorial lifestyle photograph, a mother in her early 30s at a tidy kitchen table looking with mild hesitation at a generic gel tube in her hand, a small rollerball bottle also on the table, soft daylight, calm neutral tones, product in sharp focus, thoughtful understated mood, 50mm, shallow depth of field, warm-neutral colour grade, photorealistic, 8k, no text. No child, no mouth, no clinical setting.",
            video_prompt:
              "Vertical 9:16 UGC video, ~3 seconds. A mother in her early 30s sits at a tidy kitchen table, looks at a generic gel tube in her hand with slight hesitation, then sets it down and picks up a small rollerball bottle. Natural daylight, handheld feel, 4k 30fps, no captions. Thoughtful, calm. No child, no mouth, no clinical setting.",
          },
        ],
      },
      {
        id: 3,
        name: "Không muốn dùng gel gây tê hoá chất",
        sub_audience:
          "Bố mẹ ưu tiên tự nhiên, đọc kỹ thành phần, dè chừng hoạt chất gây tê bôi cho trẻ",
        core_emotion: "Lo lắng, muốn kiểm soát chính xác cái gì chạm vào con",
        belief_to_shift: "Gel gây tê là lựa chọn mặc định và đủ an toàn cho bé",
        promise: "Một lựa chọn không bôi hoạt chất gây tê vào miệng con",
        proof_needed:
          "Đọc thành phần trên nhãn thật; dẫn khuyến cáo của cơ quan y tế về gel gây tê cho trẻ; KHÔNG tự khẳng định 'an toàn tuyệt đối'",
        awareness_level: "solution_aware",
        recommended_format:
          "So sánh nhãn thành phần cách cũ vs cách mới (không dàn dựng kết quả)",
        source_evidence:
          "FDA từng cảnh báo về benzocaine cho trẻ dưới 2 tuổi — dùng làm bối cảnh, dẫn nguồn rõ",
        hooks: [
          {
            variation: "A",
            platform: "tiktok",
            spoken_hook:
              "Trước khi bôi bất kỳ gel mọc răng nào cho con, lật mặt sau tuýp và đọc dòng hoạt chất đầu tiên đã.",
            visual_first_frame:
              "Cận cảnh ngón tay lật một tuýp gel, camera lia vào dòng 'Active ingredient'.",
            on_screen_text: "Đọc dòng này trước đã",
            why_it_stops_scroll:
              "Ra lệnh hành động cụ thể ('lật mặt sau, đọc dòng đầu') tạo tò mò muốn xem có gì.",
            image_prompt:
              "Editorial macro photograph, a hand turning over a generic teething gel tube to reveal the ingredients panel on the back, crisp daylight, extreme detail on the label text area (kept illegible/blurred), a small rollerball bottle resting nearby in soft focus, clean neutral surface, investigative calm mood, 100mm macro lens, shallow depth of field, neutral colour grade, photorealistic, 8k, no readable text, no logos, no faces.",
            video_prompt:
              "Vertical 9:16 macro UGC video, ~3 seconds. A hand picks up a generic teething gel tube and slowly turns it over to show the back ingredients panel, then a small rollerball bottle slides into frame beside it. Crisp daylight, handheld macro, slow deliberate motion, 4k 30fps, no captions. Investigative, calm. No faces, no mouths, no clinical setting.",
          },
          {
            variation: "B",
            platform: "meta",
            spoken_hook:
              "Mình đọc thành phần tuýp gel quen thuộc, tra tên hoạt chất đó — rồi quyết định tìm lựa chọn khác cho con.",
            visual_first_frame:
              "Màn hình điện thoại đang tra một tên hoạt chất, tuýp gel để bên cạnh.",
            on_screen_text: "Mình đã tra thử tên này",
            why_it_stops_scroll:
              "Câu chuyện 'tự đi tìm hiểu rồi đổi ý' đáng tin hơn quảng cáo trực tiếp.",
            image_prompt:
              "Editorial lifestyle photograph, a phone lying on a wooden table showing a search results page (screen content kept blurred), a generic gel tube beside it and a small rollerball bottle in sharp focus, warm indoor light, calm considered mood, 50mm, shallow depth of field, warm-neutral colour grade, photorealistic, 8k, no readable text, no logos, no faces.",
            video_prompt:
              "Vertical 9:16 UGC video, ~3 seconds. Overhead shot of a hand typing a search on a phone resting on a wooden table (screen blurred), then the hand puts the phone down and picks up a small rollerball bottle sitting next to a generic gel tube. Warm indoor light, handheld feel, 4k 30fps, no captions. Considered, calm. No faces in close-up, no mouths, no clinical setting.",
          },
          {
            variation: "C",
            platform: "both",
            spoken_hook:
              "Thành phần chỉ có dầu hoa trà, cúc La Mã và Vitamin E. Không cồn, không chất gây tê. Đây là lý do mình chọn nó.",
            visual_first_frame:
              "Nhỏ một giọt dầu trong vắt lên đầu ngón tay dưới ánh sáng tự nhiên.",
            on_screen_text: "Đọc được hết thành phần trên nhãn",
            why_it_stops_scroll:
              "Liệt kê thành phần ngắn gọn, dễ đọc — tệp 'đọc nhãn' thấy nhẹ nhõm.",
            image_prompt:
              "Editorial macro photograph, a single clear drop of botanical oil on a fingertip catching soft natural window light, a small amber-and-steel rollerball bottle in sharp focus just behind, a few dried chamomile flowers and camellia leaves styled minimally on a pale stone surface, clean natural mood, 100mm macro, shallow depth of field, warm natural colour grade, photorealistic, 8k, no text, no logos.",
            video_prompt:
              "Vertical 9:16 macro UGC video, ~3 seconds. A single clear drop of botanical oil forms on a fingertip in soft window light, then the hand tilts toward a small rollerball bottle in focus behind it, with dried chamomile flowers styled on a pale stone surface. Natural light, slow macro motion, 4k 30fps, no captions. Clean, calm, natural. No mouths, no children, no clinical setting.",
          },
        ],
      },
    ],
    validation: {
      trend_status: "surging",
      trend_growth_pct: 185,
      active_competitor_ads: 34,
      ads_longevity_days: 28,
      review_sentiment_score: 89,
      negative_reviews_mined: [
        {
          issue:
            "Bi lăn kim loại đôi khi bị kẹt rít hoặc chảy quá nhiều dầu khi dốc ngược",
          frequency: "22%",
          workaround:
            "Gia công đầu bi thép không gỉ 360° kiểm soát vi áp lực, test 100% độ trơn tru chống rò rỉ trước khi xuất xưởng",
        },
        {
          issue: "Mùi thảo mộc nhân tạo quá nồng làm bé cay mắt hoặc hắt xì",
          frequency: "17%",
          workaround:
            "Cân bằng tỷ lệ dầu hạt hoa trà hữu cơ (Camellia seed oil) và cúc La Mã dịu nhẹ tuyệt đối, 0% hương liệu tổng hợp",
        },
        {
          issue: "Nắp vặn dễ tuột làm chảy dầu ra túi bỉm sữa đựng đồ",
          frequency: "14%",
          workaround:
            "Nâng cấp nắp vặn ren kép Double-Seal Lock chuyên dụng chống sốc và chống tràn khi di chuyển",
        },
      ],
      validation_score: 93,
      verdict: "GO",
      verdict_reason:
        "Nhu cầu tìm kiếm tăng +185% YoY. CopaCalmer và 3 đối thủ duy trì ads sinh lời > 28 ngày trên TikTok/Meta. Nhu cầu mọc răng của trẻ sơ sinh là evergreen quanh năm.",
    },
    competitor_analysis: {
      competitors: [
        {
          name: "CopaCalmer™ Official",
          url: "https://www.copacalmer.com",
          platform: "Shopify DTC",
          shopify_detected: true,
          shopify_theme: "Dawn (Customized High-Converting)",
          shopify_apps: [
            "Loox Photo Reviews",
            "Klaviyo Email",
            "Rebuy Upsell",
            "Lucky Orange Heatmap",
          ],
          bestseller_item: "CopaCalmer™ Natural Teething Roller (10ml)",
          bestseller_url:
            "https://www.copacalmer.com/collections/all?sort_by=best-selling",
          products_json_url: "https://www.copacalmer.com/products.json",
          ad_library_url:
            "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=copacalmer",
          tiktok_url: "https://www.tiktok.com/tag/copacalmer",
          selling_price: 29.99,
          shipping_days: "5-9d",
          rating: 4.3,
          offer_type: "Single Unit + Fake Countdown Timer",
          hook_score: 84,
          weakness:
            "Giá bán đơn lẻ đắt ($29.99), ship $4.99, dùng countdown timer giả làm giảm lòng tin, không có combo bundle kèm dụng cụ gặm nướu.",
        },
        {
          name: "Plenny / Little Teethers™",
          url: "https://plenny.co",
          platform: "Shopify DTC",
          shopify_detected: true,
          shopify_theme: "Sense Theme v12",
          shopify_apps: [
            "Judge.me Reviews",
            "Klaviyo",
            "Videeo Mobile Commerce",
          ],
          bestseller_item: "Organic Baby Teething Roller (10ml)",
          bestseller_url:
            "https://plenny.co/collections/all?sort_by=best-selling",
          products_json_url: "https://plenny.co/products.json",
          ad_library_url:
            "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=plenny+teething",
          tiktok_url: "https://www.tiktok.com/search?q=plenny+teething+roller",
          selling_price: 24.0,
          shipping_days: "6-10d",
          rating: 4.4,
          offer_type: "Single bottle + 10% Email popup",
          hook_score: 78,
          weakness:
            "Bao bì chai nhãn giấy dễ rách khi dính dầu, không có phụ kiện gặm nướu kèm theo, thời gian giao hàng 6-10 ngày khá chậm.",
        },
        {
          name: "Sweetbottoms Naturals™",
          url: "https://sweetbottoms.com",
          platform: "Shopify DTC",
          shopify_detected: true,
          shopify_theme: "Prestige Theme v7.2",
          shopify_apps: [
            "Yotpo Product Reviews",
            "Klaviyo Email",
            "Cart Drawer Upsell",
          ],
          bestseller_item: "Organic Herbal Teething Soothing Oil (15ml)",
          bestseller_url:
            "https://sweetbottoms.com/collections/all?sort_by=best-selling",
          products_json_url: "https://sweetbottoms.com/products.json",
          ad_library_url:
            "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=sweetbottoms+teething",
          tiktok_url:
            "https://www.tiktok.com/search?q=sweetbottoms+naturals+teething",
          selling_price: 18.95,
          shipping_days: "5-8d",
          rating: 4.6,
          offer_type: "Mua 2 Giảm 15% Free Ship trên $35",
          hook_score: 75,
          weakness:
            "Không dùng đầu bi lăn thép làm mát mà dùng nắp bóp giọt cổ điển, video creative chạy quảng cáo quá mộc mạc thiếu yếu tố giật gân (hook yếu).",
        },
      ],
      outpositioning_strategy:
        'Định vị Snuglet là "Hệ thống giảm đau mọc răng không chạm tay" (No-Touch Teething Relief): Kết hợp bi lăn thép làm mát bên ngoài + Tặng kèm ngàm ngậm silicone thực phẩm đạt chuẩn FDA. Không nhét ngón tay bẩn vào miệng con.',
      price_opportunity:
        "Định giá $24.99 (rẻ hơn CopaCalmer $5) nhưng đẩy mạnh Gói Cặp Đôi Ngủ Ngon (Buy 1 Get 1 50% = $37.48) đạt AOV cao và Miễn phí vận chuyển (Free US Shipping trên $25).",
      gap_identified:
        "Cả 3 đối thủ Shopify đều chỉ bán chai tinh dầu đơn độc, không giải quyết được nhu cầu cắn nhai vật lý khi mầm răng nhú lên của bé. Snuglet là thương hiệu duy nhất cung cấp giải pháp kép.",
    },
    supplier_economics: {
      suppliers: [
        {
          source: "Guangdong Botanical Lab & Newsun OEM",
          unit_cost: 3.8,
          moq: 50,
          shipping_method: "YunExpress Special Line (Chất lỏng & Mỹ phẩm)",
          shipping_cost: 2.9,
          delivery_days: "6-9d",
          reliability_rating: 96,
          url: "https://www.alibaba.com/trade/search?SearchText=baby+teething+roller+oil+organic",
          verification_url: "https://www.yunexpress.com/",
        },
        {
          source: "CJ Dropshipping Verified Supplier",
          unit_cost: 4.2,
          moq: 1,
          shipping_method: "CJPacket Sensitive Liquid",
          shipping_cost: 3.4,
          delivery_days: "7-11d",
          reliability_rating: 92,
          url: "https://cjdropshipping.com/list/search?key=baby+teething+roller",
          verification_url: "https://cjdropshipping.com/",
        },
        {
          source: "AliExpress Direct Manufacturers",
          unit_cost: 4.8,
          moq: 1,
          shipping_method: "AliExpress Standard Shipping",
          shipping_cost: 3.9,
          delivery_days: "10-15d",
          reliability_rating: 88,
          url: "https://www.aliexpress.com/wholesale?SearchText=baby+teething+roller+oil",
          verification_url: "https://www.aliexpress.com",
        },
      ],
      break_even_roas: 1.51,
      target_roas: 2.45,
      profit_projection_100_orders: 1652,
      profit_projection_500_orders: 8260,
    },
    offer_package: {
      positioning_statement:
        "Giải pháp xoa dịu cơn đau mọc răng hữu cơ không chạm ngón tay đầu tiên với đầu bi lăn thép y tế 360° làm mát tức thì.",
      target_desire:
        "Giúp con dứt cơn quấy khóc sưng nướu sau 30 giây để cả con và bố mẹ ngủ trọn giấc suốt đêm.",
      packages: [
        {
          tier: "A",
          name: "1x Starter Roller (10ml)",
          price: 24.99,
          value: 34.99,
          savings: "TIẾT KIỆM $10",
          description:
            "1 chai bi lăn thảo mộc Snuglet™ Comfort Roller dùng trong 30-45 ngày liên tục.",
          items: [
            "1x Snuglet™ Comfort Roller (10ml)",
            "Hướng dẫn massage viền hàm 3 bước từ chuyên gia",
            "Túi vải cotton bảo quản chống bám bụi",
          ],
        },
        {
          tier: "B",
          badge: "POPULAR — BÁN CHẠY NHẤT",
          name: "2x Peaceful Nights Twin Pack (Buy 1 Get 1 50% OFF)",
          price: 37.48,
          value: 69.99,
          savings: "TIẾT KIỆM 46%",
          description:
            "1 chai để đầu giường phòng ngủ ban đêm + 1 chai để trong túi bỉm sữa mang theo ra ngoài.",
          items: [
            "2x Snuglet™ Comfort Rollers (10ml)",
            "Miễn phí vận chuyển nhanh toàn nước Mỹ (Trị giá $4.99)",
            "Túi nhung du lịch kháng khuẩn",
            "Cam kết bảo hành giấc ngủ 90 ngày",
          ],
        },
        {
          tier: "C",
          name: "Complete Day & Night Relief System",
          price: 52.99,
          value: 94.99,
          savings: "TIẾT KIỆM 50%",
          description:
            "Combo tối ưu: 2 chai lăn ban đêm + 1 đồ gặm silicone sao biển Snuglet ban ngày.",
          items: [
            "2x Snuglet™ Comfort Rollers (10ml)",
            "1x Snuglet™ Starfish Sensory Teether (100% Food Grade Silicone)",
            "Free Priority Insured Shipping",
            "Cam kết bảo hành giấc ngủ 90 ngày",
            "VIP Hotline tư vấn chuyên sâu chăm sóc bé mọc răng",
          ],
        },
      ],
      risk_reversal_guarantee:
        'Cam kết "Ngủ Ngon Sau 7 Đêm Hoặc Hoàn Tiền 100%": Nếu trong 7 đêm sử dụng bé không bớt quấy khóc và ngủ ngoan hơn, bố mẹ chỉ cần gửi email cho chúng tôi để nhận lại 100% tiền mà không cần gửi trả lại chai đã mở nắp.',
      urgency_hook:
        "Đợt chiết xuất thảo mộc hữu cơ tự nhiên Mẻ #4 — Chỉ còn 48 bộ Twin Pack giá ưu đãi mở bán trong kho US hôm nay.",
    },
    creative_pack: {
      viral_hooks: [
        {
          id: 1,
          angle: "Problem Hook (Mất ngủ 2h sáng)",
          hook_text:
            "Nếu đêm qua con bạn thức giấc lúc 2:14 sáng gào khóc vì nứt nướu... đừng vội thọc ngón tay vào miệng bé, xem ngay video này.",
          category: "Sleep Deprivation",
        },
        {
          id: 2,
          angle: "Outpositioning CopaCalmer & Gel",
          hook_text:
            "Tại sao các bà mẹ Mỹ đang vứt bỏ hết gel tra nướu hóa học để chuyển sang thanh lăn kim loại mát lạnh này?",
          category: "Competitor Displacement",
        },
        {
          id: 3,
          angle: "Hygiene & Bacteria Shock",
          hook_text:
            "Bạn có biết ngón tay người lớn chứa hàng triệu vi khuẩn khi chạm trực tiếp vào nướu đang rách của con không?",
          category: "Safety & Hygiene",
        },
        {
          id: 4,
          angle: "Visual ASMR Cooling Glide",
          hook_text:
            "Đầu bi lăn thép 360° lướt nhẹ dọc quai hàm — xem cách cơ mặt bé đang nhăn nhó lập tức giãn ra mỉm cười...",
          category: "Visual Proof",
        },
        {
          id: 5,
          angle: "100% Organic Purity",
          hook_text:
            "Chỉ 5 loại thảo dược hữu cơ nguyên chất: Dầu hoa trà, cúc La Mã và Copaiba. Không một giọt cồn hay chất gây tê nhân tạo.",
          category: "Ingredient Purity",
        },
        {
          id: 6,
          angle: "Diaper Bag Lifestyle",
          hook_text:
            "Thứ duy nhất mọi bà mẹ bỉm sữa bắt buộc phải có trong túi xách mỗi khi ra ngoài cùng em bé mọc răng.",
          category: "Lifestyle Habit",
        },
        {
          id: 7,
          angle: "Pediatrician Authority",
          hook_text:
            "Bác sĩ nhi giải thích: Tại sao massage làm mát viền xương hàm ngoài lại hiệu quả gấp 3 lần đồ cắn thông thường?",
          category: "Doctor Authority",
        },
        {
          id: 8,
          angle: "Husband / Dad POV",
          hook_text:
            "Vợ tôi đã không ngủ một giấc trọn vẹn suốt 2 tuần liền... cho đến khi tôi bí mật mua cho cô ấy món này.",
          category: "Emotional Storytelling",
        },
        {
          id: 9,
          angle: "First Impression Unboxing",
          hook_text:
            "Cầm trên tay chai lăn Snuglet nắp kim loại: Cảm giác mát lạnh ngay lập tức không cần cất tủ lạnh!",
          category: "Unboxing Demo",
        },
        {
          id: 10,
          angle: "Risk-Free Guarantee",
          hook_text:
            "Thử trong 7 đêm: Bé ngủ ngon hoặc bạn giữ lại chai và nhận lại 100% tiền. Không có rủi ro nào cả.",
          category: "Irresistible Offer",
        },
      ],
      video_scripts: [
        {
          title: "The 2:14 AM Screaming Wakeup (PAS Framework)",
          framework: "Problem - Agitation - Solution",
          target_length: "35s",
          scenes: [
            {
              time: "0-4s",
              visual:
                "Phòng ngủ tối, đồng hồ chỉ 2:14 AM. Mẹ bơ phờ ôm em bé đang khóc thét, tay bé giật mạnh cào vào má vì đau nướu.",
              audio:
                "Nếu đêm nào bạn cũng phải thức giấc lúc 2 giờ sáng với một em bé gào khóc không thể dỗ vì nứt nướu...",
              text_overlay: "POV: 2:14 AM với bé mọc răng 😭",
            },
            {
              time: "4-12s",
              visual:
                "Cảnh mẹ dùng ngón tay bôi gel dính nhớt vào miệng bé, bé khóc nhè ra và cắn ngón tay mẹ.",
              audio:
                "Đừng cố nhét ngón tay bẩn vào miệng bé nữa. Gel tê hóa học chỉ làm con cay miệng và nôn trớ.",
              text_overlay: "Gel bôi thông thường: Dơ tay & Bé nhè ra ❌",
            },
            {
              time: "12-25s",
              visual:
                "Cận cảnh thanh lăn Snuglet™: Bi lăn thép y tế 360° lướt nhẹ nhàng dọc xương hàm dưới của bé. Bé dừng khóc, cơ mặt giãn ra và mỉm cười.",
              audio:
                "Đây là thanh lăn làm mát Snuglet. Bi thép y tế massage hạ nhiệt bên ngoài xương hàm kết hợp dầu hoa cúc La Mã hữu cơ xoa dịu tức thì trong 30 giây.",
              text_overlay: "Bi lăn thép 360° + Thảo mộc dịu nướu ✨",
            },
            {
              time: "25-35s",
              visual:
                "Bé ngủ say bình yên trong nôi. Mẹ mỉm cười cầm gói Twin Pack BOGO 50% có tem bảo hành 90 ngày.",
              audio:
                "Đặt ngay Gói Cặp Đôi với ưu đãi Mua 1 Tặng 1 Giảm 50%. Bảo hành bé ngủ ngon sau 7 đêm hoặc hoàn tiền 100%!",
              text_overlay: "BOGO 50% OFF + Bảo hành giấc ngủ 90 ngày 🛡️",
            },
          ],
        },
        {
          title: "Outpositioning CopaCalmer & No-Touch Demo",
          framework: "Comparison & Demonstration",
          target_length: "30s",
          scenes: [
            {
              time: "0-5s",
              visual:
                "Đặt chai CopaCalmer bên trái (mờ) vs Chai Snuglet bên phải (sáng bóng, sang trọng nền gỗ mộc).",
              audio:
                "Đừng mua dầu lăn mọc răng cho đến khi bạn biết 2 điểm khác biệt sống còn này...",
              text_overlay: "CopaCalmer vs Snuglet: Có gì khác? 🔍",
            },
            {
              time: "5-16s",
              visual:
                "Cận cảnh bi lăn thép của Snuglet lướt êm ái trên da, giọt dầu thực vật trong vắt thẩm thấu ngay sau 10 giây không để lại vệt nhờn.",
              audio:
                "Snuglet dùng đầu bi thép y tế làm mát thật sự và 100% dầu hạt hoa trà hữu cơ. Không nhờn rít, không mùi hắc nhân tạo.",
              text_overlay: "Đầu bi thép y tế 360° + Dầu hữu cơ tự nhiên 🌿",
            },
            {
              time: "16-30s",
              visual:
                "Mẹ đặt chai Snuglet nhỏ gọn vào túi bỉm sữa cùng set gặm silicone sao biển.",
              audio:
                "Giá chỉ $24.99 kèm chương trình bảo hành hoàn tiền không cần trả hàng. Nhấp link bên dưới để nhận mã giảm giá ra mắt!",
              text_overlay: "Chỉ $24.99 • Hoàn tiền 100% nếu bé không hợp",
            },
          ],
        },
      ],
      shopify_page: {
        headline:
          "Dứt Cơn Quấy Khóc Mọc Răng Trong 30 Giây — Thanh Lăn Thảo Mộc Tự Nhiên Không Cần Chạm Tay",
        subheadline:
          "Thiết kế bi lăn thép y tế 360° lướt êm dịu theo viền xương hàm ngoài, kết hợp dầu hoa cúc La Mã hữu cơ hạ nhiệt nướu sưng đau để con và bố mẹ cùng ngủ trọn giấc.",
        benefits: [
          {
            title: "Đầu bi thép y tế làm mát 360°",
            desc: "Lướt êm dịu bên ngoài quai hàm, hạ nhiệt vùng nướu căng viêm ngay lập tức mà không cần để trong tủ lạnh.",
          },
          {
            title: "Vệ sinh 100% — Không chạm ngón tay",
            desc: "Loại bỏ hoàn toàn nguy cơ lây nhiễm vi khuẩn từ ngón tay người lớn vào vết nứt nướu non nớt của trẻ.",
          },
          {
            title: "100% Hữu cơ & Dược thảo lành tính",
            desc: "Chiết xuất từ dầu hoa trà (Camellia), cúc La Mã, trầm hương hữu cơ và Vitamin E. Tuyệt đối 0% cồn, 0% paraben, 0% hóa chất gây tê.",
          },
          {
            title: "Thẩm thấu tức thì — Không nhờn rít",
            desc: "Công thức dầu nhẹ tự nhiên thấm vào da trong 30 giây, không dính bết ra gối ngủ hay quần áo của bé.",
          },
        ],
        faqs: [
          {
            q: "Sản phẩm này có dùng được cho trẻ sơ sinh dưới 6 tháng không?",
            a: "Hoàn toàn an toàn cho trẻ từ 3 tháng tuổi trở lên vì sản phẩm chỉ thoa ngoài da dọc viền hàm, không đưa vào niêm mạc miệng.",
          },
          {
            q: "Tại sao lại thoa bên ngoài viền hàm thay vì bôi trực tiếp vào nướu?",
            a: "Xương hàm dưới của trẻ nhỏ có các đầu mút dây thần kinh cảm giác rất gần da. Việc massage làm mát viền hàm ngoài giúp chặn xung truyền tín hiệu đau lên não bộ hiệu quả mà vẫn giữ vệ sinh tuyệt đối.",
          },
          {
            q: "Một chai 10ml dùng được trong bao lâu?",
            a: "Đầu bi lăn tiết chế lượng dầu siêu mỏng, 1 chai 10ml dùng được từ 30 đến 45 ngày với tần suất thoa 2-3 lần/ngày.",
          },
          {
            q: "Chính sách bảo hành và hoàn tiền 90 ngày hoạt động ra sao?",
            a: "Nếu bé dùng không ưng ý hoặc không ngủ ngoan hơn sau 7 ngày, bạn chỉ cần gửi email cho chúng tôi. Chúng tôi hoàn tiền 100% vào tài khoản mà bạn không cần gửi trả sản phẩm.",
          },
        ],
        html_description: `<div class="snuglet-pdp"><h2>Dứt Cơn Quấy Khóc Mọc Răng Trong 30 Giây</h2><p>Được thiết kế để bố mẹ không còn phải trải qua những đêm 2h sáng thức trắng vì bé đau nhức nướu.</p><ul><li><strong>Bi lăn thép 360°:</strong> Làm mát tức thì không cần tủ lạnh.</li><li><strong>Không chạm tay:</strong> Giữ vệ sinh tuyệt đối cho niêm mạc miệng non nớt của bé.</li><li><strong>100% Dược thảo hữu cơ:</strong> Cúc La Mã, dầu hoa trà, Vitamin E tự nhiên.</li></ul><p><em>Cam kết hoàn tiền 100% trong 90 ngày nếu bé không ngủ ngon hơn.</em></p></div>`,
      },
    },
    pipeline_stage: "LAUNCH_READY",
    stage_status: {
      "01": "completed",
      "02": "completed",
      "03": "completed",
      "04": "completed",
      "05": "completed",
      "06": "completed",
    },
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "prod_snuglet_teether",
    name: "Snuglet™ 3-Piece Sensory Silicone Teether Set",
    source: "manual",
    url: "https://snuglet.com/products/snuglet-3-piece-sensory-silicone-teether-set",
    image_url: "/images/snuglet/star-toy/01-hero-colors.jpg",
    niche: "Baby Products",
    category: "Đồ chơi gặm nướu giác quan & Silicone thực phẩm",
    supplier_price: 1.14,
    selling_price: 19.99,
    shipping_cost: 2.6,
    payment_fee: 0.88,
    refund_reserve: 0.6,
    landed_cost: 5.22,
    gross_margin: 14.77,
    margin_percentage: 73.9,
    demand_score: 91,
    competition_score: 70,
    margin_score: 96,
    creative_score: 92,
    problem_score: 90,
    shipping_score: 98,
    product_score: 89.5,
    status: "approved_for_validation",
    recommendation: "TEST",
    recommendation_reason:
      "100% Food-grade Platinum Silicone đạt chuẩn FDA/CPSIA, trọng lượng siêu nhẹ 25g, 6 màu pastel hiện đại. Giá vốn $1.14/set 3 cái từ Newsun Silicone, tỷ lệ lãi 73.9% ($14.77 gross margin).",
    wow_factor:
      "Bề mặt đa kết cấu mô phỏng tự nhiên tiếp cận đúng vùng răng hàm sâu nhất, siêu dẻo dai bẻ gập 360° không biến dạng, làm lạnh an toàn trong ngăn đông tủ lạnh.",
    target_audience:
      "Bố mẹ có con 3-18 tháng trong giai đoạn cắn nhai dữ dội, muốn tập phản xạ cầm nắm giác quan và tìm sản phẩm silicone không chứa BPA.",
    pain_points: [
      "Bé ngứa nướu cắn mọi đồ vật mất vệ sinh trong nhà hoặc cắn chảy máu tay mẹ",
      "Đồ chơi gặm nướu thông thường quá cứng làm tổn thương lợi non nớt của trẻ",
      "Khó vệ sinh cặn bẩn trong các kẽ hở tạo môi trường cho vi khuẩn sinh sôi",
    ],
    angles: [
      "Góc Vật Liệu 100% Platinum Silicone: An toàn tuyệt đối khi đun sôi tiệt trùng 100°C hoặc để ngăn đá làm mát",
      "Góc Trọng Lượng Siêu Nhẹ 25g: Thiết kế ngôi sao thông minh giúp bàn tay tí hon của bé cầm nắm chắc chắn không rơi",
      "Góc Bundle 3 Món: Mua 1 set 3 màu khác nhau để xoay vòng — 1 cái trong ngăn đông, 1 cái bé đang chơi, 1 cái mang đi ngoài đường",
    ],
    validation: {
      trend_status: "surging",
      trend_growth_pct: 145,
      active_competitor_ads: 24,
      ads_longevity_days: 35,
      review_sentiment_score: 92,
      negative_reviews_mined: [
        {
          issue: "Đồ gặm silicone hút lông bụi khi rơi xuống nền nhà",
          frequency: "20%",
          workaround:
            "Tráng lớp phủ silicone chống tĩnh điện mịn màng (Anti-dust smooth finish) và tặng kèm hộp đựng kháng khuẩn",
        },
      ],
      validation_score: 90,
      verdict: "GO",
      verdict_reason:
        "Thị trường đồ gặm silicone luôn ổn định. Trọng lượng nhẹ 25g tối ưu chi phí vận chuyển quốc tế YunExpress (< $2.60).",
    },
    competitor_analysis: {
      competitors: [
        {
          name: "Comotomo Silicone Teether Store",
          selling_price: 18.99,
          shipping_days: "5-8 ngày",
          rating: 4.6,
          offer_type: "Bán lẻ 1 chiếc đơn điệu",
          hook_score: 72,
          weakness:
            "Hình dạng ngón tay đơn điệu, dễ bám bụi bẩn và không có hộp đựng kháng khuẩn",
          url: "https://comotomo.com/products/teether",
          platform: "Shopify Store",
          shopify_detected: true,
          shopify_theme: "Prestige / Dawn Custom",
          shopify_apps: ["Klaviyo", "Loox Reviews", "ReCharge Subscriptions"],
          bestseller_item: "Single Teether Stick",
          bestseller_url:
            "https://comotomo.com/collections/all?sort_by=best-selling",
          products_json_url: "https://comotomo.com/products.json",
          ad_library_url:
            "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=comotomo%20teether",
          tiktok_url:
            "https://www.tiktok.com/search?q=comotomo%20silicone%20teether",
        },
        {
          name: "Smily Mia Penguin Teether Co",
          selling_price: 16.99,
          shipping_days: "6-9 ngày",
          rating: 4.4,
          offer_type: "Mua 1 tặng voucher 10%",
          hook_score: 78,
          weakness:
            "Bé khó cầm vừa tay khi dưới 4 tháng, silicone hơi dày làm bé mỏi hàm",
          url: "https://smilymia.com/products/penguin-buddy",
          platform: "Shopify Store",
          shopify_detected: true,
          shopify_theme: "Impulse Responsive",
          shopify_apps: ["Judge.me", "SMSBump", "Frequently Bought Together"],
          bestseller_item: "Penguin Teether Ring",
          bestseller_url:
            "https://smilymia.com/collections/all?sort_by=best-selling",
          products_json_url: "https://smilymia.com/products.json",
          ad_library_url:
            "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=smilymia",
          tiktok_url: "https://www.tiktok.com/search?q=smily%20mia%20teether",
        },
      ],
      gap_identified:
        "Đối thủ chỉ bán lẻ từng chiếc ($16-$19/chiếc), chưa ai đóng gói bundle 3 màu xoay vòng vệ sinh kèm hộp đựng du lịch kháng khuẩn.",
      price_opportunity:
        "Đóng gói Set 3 món với giá $19.99 (tính ra chỉ ~$6.60/món), đè bẹp đối thủ đang bán $17-$19 cho 1 chiếc lẻ.",
      outpositioning_strategy:
        "Định vị Set 3 Món Giác Quan Xoay Vòng: 1 chiếc trong ngăn đông, 1 chiếc bé đang chơi, 1 chiếc dự phòng trong túi xách. Kèm hộp kháng khuẩn tặng kèm.",
    },
    supplier_economics: {
      suppliers: [
        {
          source: "Newsun Silicone Products Co., Limited (Guangdong, Diamond)",
          unit_cost: 1.14,
          moq: 20,
          shipping_method: "YunExpress US Direct",
          shipping_cost: 2.6,
          delivery_days: "7-10d",
          reliability_rating: 98,
          url: "https://s.1688.com/youyuan.html?keywords=silicone%20teether%20baby",
          verification_url: "https://www.yunexpress.com/",
          badge: "Factory Wholesale",
          notes:
            "Xưởng 100% Platinum Silicone đạt kiểm định CPSIA. Hỗ trợ dập logo thương hiệu riêng từ 50 set.",
        },
      ],
      break_even_roas: 1.35,
      target_roas: 2.2,
      gross_margin_pool_100: 1477,
      ad_spend_projection_100: 909,
      net_profit_projection_100_orders: 568,
      gross_margin_pool_500: 7800,
      ad_spend_projection_500: 4543,
      net_profit_projection_500_orders: 3257,
      profit_projection_100_orders: 568,
      profit_projection_500_orders: 3257,
    },
    pipeline_stage: "04_SUPPLIER",
    stage_status: {
      "01": "completed",
      "02": "completed",
      "03": "completed",
      "04": "completed",
      "05": "ready",
      "06": "locked",
    },
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Flagship demo (Snuglet Roller): derive the angle-driven creative system from its structured
// angles + offer so Stage 06 shows Marketing Angles / UGC Scripts / Static Creatives / Test Plan
// (with English render prompts) immediately, without a re-run.
(() => {
  const p = SEED_PRODUCTS.find((x) => x.id === "prod_snuglet_roller");
  if (!p || !p.creative_pack || !p.marketing_angles || !p.offer_package) return;
  const offer = p.offer_package;
  const imgBase = `Editorial lifestyle advertising photograph for "${p.name}". A relatable adult using the small rollerball bottle calmly in a bright tidy home; the product is the hero and softly lit. Reassuring understated mood. Soft window light, 50mm lens, shallow depth of field, warm premium colour grade, generous negative space for a headline. Photorealistic, 8k, no text, no logos. No children in distress, no clinical setting, nothing entering a mouth.`;
  const vidBase = `Vertical 9:16 UGC ad opening for "${p.name}". A relatable person speaks straight to camera in a real home for ~2s, then calmly picks up and shows the small rollerball bottle with a slow push-in on the last beat. Handheld phone feel, natural indoor light, lifelike expressions, 4k 30fps, no baked-in captions. Warm, calm, product-forward. No baby in distress, no clinical imagery.`;
  p.creative_pack.angle_briefs = p.marketing_angles;
  p.creative_pack.ugc_scripts = p.marketing_angles.map((a) => ({
    angle_id: a.id,
    angle_name: a.name,
    creator_persona: `Người thuộc tệp "${a.sub_audience}" tự quay bằng điện thoại, không dàn dựng studio.`,
    framework: a.recommended_format,
    target_length: "25-40 giây",
    hook_line: a.hooks[0].spoken_hook,
    scenes: [
      {
        time: "0-3s",
        visual: a.hooks[0].visual_first_frame,
        spoken: a.hooks[0].spoken_hook,
        on_screen_text: a.hooks[0].on_screen_text,
        video_prompt: a.hooks[0].video_prompt || vidBase,
      },
      {
        time: "3-15s",
        visual: "Kể hoàn cảnh thật của mình, quay cận, ánh sáng tự nhiên.",
        spoken: `Nói về: ${a.belief_to_shift} → vì sao mình đi tìm cách khác.`,
        on_screen_text: "Bám sát lời thoại",
        video_prompt: vidBase,
      },
      {
        time: "15-30s",
        visual: "Quay cảnh dùng thật theo hướng dẫn; KHÔNG dàn dựng kết quả.",
        spoken: `${a.promise}. ${a.proof_needed}`,
        on_screen_text: "Cách mình đang dùng",
        video_prompt: vidBase,
      },
      {
        time: "30-38s",
        visual: "Chỉ tay xuống link, hiện các gói đúng offer.",
        spoken: offer.risk_reversal_guarantee,
        on_screen_text: offer.urgency_hook,
        video_prompt: vidBase,
      },
    ],
    cta_line: `Xem các gói và chính sách đổi trả ở link. ${offer.risk_reversal_guarantee}`,
    b_roll_shot_list: [
      "Cảnh sinh hoạt của tệp khách (không dàn dựng kết quả)",
      "Cận tay cầm và dùng chai lăn",
      "Chai lăn đặt cạnh túi bỉm sữa / đầu giường",
      "Màn hình điện thoại mở trang sản phẩm",
    ],
    compliance_flags: [
      {
        claim: "Bất kỳ câu nào hứa 'ngủ ngay', giảm đau, an toàn tuyệt đối hoặc số phút cụ thể",
        risk: "Meta/TikTok duyệt gắt ngành trẻ em/sức khoẻ — dễ bị từ chối hoặc khoá tài khoản.",
        compliant_rewrite:
          "Chỉ mô tả cách dùng và trải nghiệm cá nhân; dẫn nguồn nhà sản xuất cho mọi tuyên bố công dụng.",
      },
    ],
  }));
  p.creative_pack.static_concepts = p.marketing_angles.map((a) => ({
    angle_id: a.id,
    format: "single_image" as const,
    concept: `Ảnh lifestyle theo góc "${a.name}": người thuộc tệp "${a.sub_audience}" dùng chai lăn bình thường trong bối cảnh nhà cửa, sản phẩm là hero. Không dàn dựng kết quả.`,
    headline: a.name,
    primary_text: `${a.promise} — ${a.proof_needed}`,
    image_prompt: a.hooks[0].image_prompt || imgBase,
  }));
  p.creative_pack.test_plan = {
    first_angle_id: 1,
    first_angle_rationale:
      "Test góc 'Mất ngủ 2h sáng' trước: cảm xúc lõi mạnh nhất, tệp khách rõ nhất, và trùng với tín hiệu review đối thủ. Cần xác nhận lại bằng ad longevity trên Meta Ad Library.",
    daily_budget_per_ad_set: 20,
    ad_set_count: 3,
    test_window_days: 3,
    kill_rules: [
      {
        metric: "Hook rate (xem 3s / hiển thị)",
        threshold: "< 25% sau ~1.000 hiển thị",
        action: "Đổi hook, giữ nguyên phần còn lại của creative",
      },
      {
        metric: "CTR outbound",
        threshold: "< 1%",
        action: "Đổi angle hoặc creative",
      },
      {
        metric: "CPA",
        threshold: `> Break-even ROAS (${p.supplier_economics?.break_even_roas ?? "xem Stage 04"}x) sau khi tiêu ~2x AOV`,
        action: "Tắt ad set",
      },
    ],
    scale_rule:
      "Angle nào đạt CPA dưới target 2-3 ngày liên tục → tăng 20-30% ngân sách/ngày hoặc nhân bản sang ad set mới.",
    iteration_note:
      "Winner → làm 3-5 biến thể CÙNG góc (đổi hook, đổi creator, đổi b-roll), không nhảy sang góc khác vội.",
  };
  p.creative_pack.compliance_summary = [
    "Ngành trẻ em / sức khoẻ bị Meta & TikTok duyệt gắt: KHÔNG hứa chữa/giảm đau, 'an toàn tuyệt đối', '#1', số phút cụ thể.",
    "Mọi tuyên bố thành phần/công dụng phải dẫn nguồn nhà sản xuất — không suy ra từ tên sản phẩm.",
    "KHÔNG ảnh/video trẻ em khóc hoặc cảnh đưa tay/sản phẩm vào miệng bé; không before/after ngụ ý kết quả đảm bảo.",
    "KHÔNG countdown/tồn kho giả trên landing (giảm lòng tin + rủi ro chính sách).",
    "Landing hiện tại có các câu cần sửa trước khi chạy: 'Dứt Cơn Quấy Khóc... Trong 30 Giây', 'Hoàn toàn an toàn cho trẻ từ 3 tháng', 'hiệu quả gấp 3 lần', 'chặn xung truyền tín hiệu đau lên não'.",
  ];
})();

class EcomStore {
  private data: EcomStoreData;

  constructor() {
    this.data = this.load();
  }

  private load(): EcomStoreData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      throw new Error("Không đọc được store; dừng để tránh ghi đè dữ liệu.", {
        cause: e,
      });
    }
    return {
      products: structuredClone(SEED_PRODUCTS),
      workflow_runs: [],
      agent_runs: [],
    };
  }

  /**
   * Atomic file persist using temporary file + rename to avoid lost writes or corruption.
   * Note: In a multi-tab environment, individual stage operations reload latest data before writing.
   */
  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DATA_FILE}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), "utf-8");
      fs.renameSync(tmpFile, DATA_FILE); // POSIX atomic rename
    } catch (e) {
      throw new Error("Không lưu được dữ liệu workflow.", { cause: e });
    }
  }

  /** Cross-process lock: fail closed on contention, never silently overwrite another worker. */
  private transaction<T>(mutate: () => T): T {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const lock = `${DATA_FILE}.lock`;
    try {
      fs.mkdirSync(lock);
    } catch (cause) {
      throw new Error(
        "Store đang được cập nhật hoặc còn lock từ tiến trình cũ. Thử lại sau.",
        { cause },
      );
    }
    try {
      this.data = this.load();
      const result = mutate();
      this.save();
      return result;
    } finally {
      fs.rmdirSync(lock);
    }
  }

  // --- Products ---
  getProducts(filters?: {
    niche?: string;
    status?: string;
    minScore?: number;
  }): Product[] {
    this.data = this.load();
    let list = [...this.data.products];
    if (filters?.niche && filters.niche !== "all") {
      list = list.filter((p) =>
        p.niche.toLowerCase().includes(filters.niche!.toLowerCase()),
      );
    }
    if (filters?.status && filters.status !== "all") {
      list = list.filter((p) => p.status === filters.status);
    }
    if (filters?.minScore) {
      list = list.filter((p) => p.product_score >= filters.minScore!);
    }
    return list.sort((a, b) => b.product_score - a.product_score);
  }

  getProductById(id: string): Product | undefined {
    this.data = this.load();
    return this.data.products.find((p) => p.id === id);
  }

  saveProduct(product: Product): Product {
    return this.transaction(() => {
      if (this.data.products.some((p) => p.id === product.id)) {
        throw new Error(
          "Sản phẩm đã tồn tại; dùng updateProduct với revision để cập nhật.",
        );
      }
      const saved = {
        ...product,
        revision: 1,
        updated_at: new Date().toISOString(),
      };
      this.data.products.unshift(saved);
      return saved;
    });
  }

  /**
   * Transactional update: reloads the freshest snapshot from disk, applies `mutator`, and persists —
   * all synchronously (no `await` in between), so concurrent stage workflows cannot lose each
   * other's writes the way a read → long-async-work → write-back-full-object sequence would.
   */
  updateProduct(
    id: string,
    mutator: (p: Product) => void,
    expectedRevision?: number,
  ): Product | undefined {
    return this.transaction(() => {
      const product = this.data.products.find((p) => p.id === id);
      if (!product) return undefined;
      if (
        expectedRevision !== undefined &&
        (product.revision ?? 0) !== expectedRevision
      ) {
        throw new Error(
          "Dữ liệu sản phẩm đã thay đổi trong lúc chạy. Tải lại và chạy lại stage.",
        );
      }
      mutator(product);
      product.revision = (product.revision ?? 0) + 1;
      product.updated_at = new Date().toISOString();
      return product;
    });
  }

  updateProductStatus(
    id: string,
    status: Product["status"],
  ): Product | undefined {
    if (
      ![
        "discovered",
        "approved_for_validation",
        "rejected",
        "testing",
      ].includes(status)
    ) {
      throw new Error("Trạng thái sản phẩm không hợp lệ.");
    }
    return this.updateProduct(id, (product) => {
      product.status = status;
      if (status === "rejected" || status === "discovered") {
        delete product.validation;
        delete product.competitor_analysis;
        delete product.supplier_economics;
        delete product.offer_package;
        delete product.creative_pack;
        delete product.no_go_override;
        product.pipeline_stage =
          status === "rejected" ? "REJECTED" : "01_DISCOVERY";
        product.stage_status = advanceStageStatus(undefined, "01");
        product.stage_status["02"] = "locked";
      } else if (!product.validation) {
        product.stage_status = advanceStageStatus(undefined, "01");
        product.stage_status["02"] = "ready";
        product.pipeline_stage = "01_DISCOVERY";
      }
    });
  }

  updateProductField<K extends keyof Product>(
    id: string,
    key: K,
    value: Product[K],
  ): Product | undefined {
    return this.updateProduct(id, (product) => {
      product[key] = value;
    });
  }

  // --- Workflow Runs ---
  saveWorkflowRun(run: WorkflowRun) {
    this.transaction(() => {
      const idx = this.data.workflow_runs.findIndex((r) => r.id === run.id);
      if (idx >= 0) this.data.workflow_runs[idx] = run;
      else this.data.workflow_runs.unshift(run);
    });
  }

  getWorkflowRun(id: string): WorkflowRun | undefined {
    this.data = this.load();
    return this.data.workflow_runs.find((r) => r.id === id);
  }

  // --- Agent Runs (Token & Cost tracking) ---
  addAgentRun(run: AgentRun) {
    this.transaction(() => this.data.agent_runs.unshift(run));
  }

  getStats() {
    this.data = this.load();
    const totalProducts = this.data.products.length;
    const approvedProducts = this.data.products.filter(
      (p) => p.status === "approved_for_validation",
    ).length;
    const totalRuns = this.data.workflow_runs.length;

    let totalTokens = 0;
    let totalCostUsd = 0;
    const providerUsage: Record<
      string,
      { calls: number; tokens: number; cost: number }
    > = {};

    // Standard primary models in the AI Router
    const workerMap: Record<
      string,
      {
        id: string;
        displayName: string;
        provider: string;
        model: string;
        calls: number;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        costUsd: number;
        avgLatencyMs: number;
        role: string;
        tier: string;
        status: "active" | "ready" | "standby";
      }
    > = {
      "gemini-3.6-flash": {
        id: "gemini-3.6-flash",
        displayName: "Gemini 3.6 Flash",
        provider: "gemini",
        model: "gemini-3.6-flash",
        calls: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        costUsd: 0,
        avgLatencyMs: 0,
        role: "Autonomous Discovery, Scoring & Competitor Extraction",
        tier: "Free Developer Tier ($0.00)",
        status: "active",
      },
      "claude-sonnet-4.5": {
        id: "claude-sonnet-4.5",
        displayName: "Claude Sonnet 4.5",
        provider: "claude",
        model: "claude-sonnet-4.5",
        calls: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        costUsd: 0,
        avgLatencyMs: 0,
        role: "Strategic Outpositioning & High-Converting Copywriting",
        tier: "Paid Pay-as-you-go ($3.00 / 1M tokens)",
        status: "active",
      },
      "gpt-4o-mini": {
        id: "gpt-4o-mini",
        displayName: "OpenAI GPT-4o-mini",
        provider: "openai",
        model: "gpt-4o-mini",
        calls: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        costUsd: 0,
        avgLatencyMs: 0,
        role: "Fast Classification & Multi-Tier Fallback",
        tier: "Paid Pay-as-you-go ($0.15 / 1M tokens)",
        status: "ready",
      },
    };

    const taskMap: Record<
      string,
      {
        task: string;
        agent: string;
        calls: number;
        tokens: number;
        costUsd: number;
      }
    > = {};

    const latencySum: Record<string, number> = {};

    for (const r of this.data.agent_runs) {
      totalTokens += r.total_tokens || 0;
      totalCostUsd += r.cost_usd || 0;

      // Provider usage
      if (!providerUsage[r.provider]) {
        providerUsage[r.provider] = { calls: 0, tokens: 0, cost: 0 };
      }
      providerUsage[r.provider].calls += 1;
      providerUsage[r.provider].tokens += r.total_tokens || 0;
      providerUsage[r.provider].cost += r.cost_usd || 0;

      // Worker Model mapping
      const mKey = r.model || r.provider;
      if (!workerMap[mKey]) {
        workerMap[mKey] = {
          id: mKey,
          displayName: mKey.includes("gemini")
            ? "Gemini 3.6 Flash"
            : mKey.includes("claude")
              ? "Claude Sonnet 4.5"
              : mKey.includes("gpt")
                ? "OpenAI GPT-4o-mini"
                : mKey,
          provider: r.provider,
          model: mKey,
          calls: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          costUsd: 0,
          avgLatencyMs: 0,
          role: "Dynamic AI Worker",
          tier: r.cost_usd === 0 ? "Free Tier" : "Pay-as-you-go",
          status: "active",
        };
      }

      workerMap[mKey].calls += 1;
      workerMap[mKey].inputTokens += r.input_tokens || 0;
      workerMap[mKey].outputTokens += r.output_tokens || 0;
      workerMap[mKey].totalTokens += r.total_tokens || 0;
      workerMap[mKey].costUsd += r.cost_usd || 0;

      if (!latencySum[mKey]) latencySum[mKey] = 0;
      latencySum[mKey] += r.latency_ms || 0;

      // Task Map
      const tKey = r.task || "general_chat";
      if (!taskMap[tKey]) {
        taskMap[tKey] = {
          task: tKey,
          agent: r.agent || tKey,
          calls: 0,
          tokens: 0,
          costUsd: 0,
        };
      }
      taskMap[tKey].calls += 1;
      taskMap[tKey].tokens += r.total_tokens || 0;
      taskMap[tKey].costUsd += r.cost_usd || 0;
    }

    // Calculate latency averages
    Object.keys(workerMap).forEach((key) => {
      const w = workerMap[key];
      if (w.calls > 0 && latencySum[key]) {
        w.avgLatencyMs = Math.round(latencySum[key] / w.calls);
      }
      w.costUsd = Number(w.costUsd.toFixed(4));
    });

    const workerStats = Object.values(workerMap);
    const taskStats = Object.values(taskMap);
    const recentRuns = this.data.agent_runs.slice(0, 30);

    return {
      totalProducts,
      approvedProducts,
      totalRuns,
      totalTokens,
      totalCostUsd: Number(totalCostUsd.toFixed(4)),
      providerUsage,
      workerStats,
      taskStats,
      recentRuns,
    };
  }
}

export const ecomStore = new EcomStore();
