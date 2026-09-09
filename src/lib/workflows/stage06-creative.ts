import { z } from "zod";
import {
  ecomStore,
  Product,
  WorkflowEvent,
  CreativePack,
  MarketingAngle,
  OfferPackage,
} from "../db/store";
import { aiRouter } from "../ai/router";
import { assertStageReady, commitStage } from "./pipeline";
import {
  creativeSchema,
  marketingAngleSchema,
  ugcScriptSchema,
  staticConceptSchema,
  testPlanSchema,
  complianceSummarySchema,
} from "./schemas";

export type EventCallback = (event: WorkflowEvent) => void;

export interface CreativeWorkflowOptions {
  runId?: string;
  startedAt?: string;
  productId: string;
  onEvent?: EventCallback;
}

// ---------------------------------------------------------------------------
// English render-prompt helpers. Image/video models are English-trained, so the
// prompt fed to Imagen / Flux / Kling / Runway is ALWAYS English + detailed +
// brand-safe (no children in distress, no clinical imagery, no implied results).
// ---------------------------------------------------------------------------

const IMG_QUALITY =
  "Premium DTC e-commerce advertising photography. Soft directional window light, 50mm lens, shallow depth of field, crisp focus on the product, calm minimal composition with generous negative space for a headline, warm neutral premium colour grade, subtle film grain, photorealistic, 8k. No text, no logos, no watermark.";
const VID_QUALITY =
  "Authentic handheld UGC filmed on a modern phone, natural indoor light, documentary feel, lifelike skin texture and micro-expressions, gentle organic camera movement, 4k 30fps, no baked-in captions, no CGI sheen.";
const SAFE =
  "Brand-safe: no children in distress, no crying, no clinical or medical setting, nothing entering anyone's mouth, no before/after implying a guaranteed result. Keep it warm, calm, lifestyle-led and product-forward.";

function englishImagePrompt(product: Product): string {
  return `Editorial lifestyle advertising photograph for "${product.name}"${
    product.category ? ` (${product.category})` : ""
  }. A relatable adult using the product calmly and naturally in a bright, tidy home; the product is clearly in frame and hero-lit. Reassuring, understated mood. ${IMG_QUALITY} ${SAFE}`;
}

function englishVideoPrompt(product: Product): string {
  return `Vertical 9:16 UGC ad opening for "${product.name}"${
    product.category ? ` (${product.category})` : ""
  }. A relatable person speaks straight to camera in a real home for ~2 seconds, then calmly picks up and shows the product with a slow push-in on the last beat. ${VID_QUALITY} ${SAFE}`;
}

/** Fill any missing English `image_prompt` / `video_prompt` so the gen buttons always have a usable prompt. */
function ensureRenderPrompts(pack: CreativePack, product: Product): void {
  const img = englishImagePrompt(product);
  const vid = englishVideoPrompt(product);
  for (const a of pack.angle_briefs ?? []) {
    for (const h of a.hooks) {
      if (!h.image_prompt?.trim()) h.image_prompt = img;
      if (!h.video_prompt?.trim()) h.video_prompt = vid;
    }
  }
  for (const s of pack.ugc_scripts ?? []) {
    for (const sc of s.scenes) {
      if (!sc.video_prompt?.trim()) sc.video_prompt = vid;
    }
  }
  for (const c of pack.static_concepts ?? []) {
    if (!c.image_prompt?.trim()) c.image_prompt = img;
  }
}

/** Products discovered before the angle rework only have flat `angles`; rebuild minimal structs. */
function deriveAnglesFromFlat(product: Product): MarketingAngle[] {
  const names = (product.angles ?? []).filter(Boolean).slice(0, 4);
  const pains = product.pain_points ?? [];
  const source = names.length ? names : pains.slice(0, 3);
  const img = englishImagePrompt(product);
  const vid = englishVideoPrompt(product);
  return source.map((name, i) => ({
    id: i + 1,
    name: name.slice(0, 60),
    sub_audience:
      product.target_audience ||
      "Cần xác định tệp khách cụ thể (tuổi, hoàn cảnh, mức độ nhận thức) trước khi chạy.",
    core_emotion: ["Bực bội / mệt mỏi", "Lo lắng / mất niềm tin", "Tò mò"][i % 3],
    belief_to_shift: `Phải chấp nhận sống chung với: ${pains[i] || name}.`,
    promise: "Xử lý vấn đề gọn hơn — cần kiểm chứng bằng demo dùng thật.",
    proof_needed:
      "Quay cảnh dùng thật theo hướng dẫn nhà sản xuất; không hứa kết quả / định lượng / an toàn chưa có bằng chứng.",
    awareness_level: "problem_aware" as const,
    recommended_format: [
      "UGC talking-head + b-roll thao tác thật",
      "So sánh cách cũ vs cách mới (không dàn dựng kết quả)",
      "Founder / người dùng kể lại trải nghiệm",
    ][i % 3],
    hooks: (["A", "B", "C"] as const).map((v, h) => ({
      variation: v,
      platform: (["tiktok", "meta", "both"] as const)[h],
      spoken_hook: `(${v}) Viết lại cho cụ thể: thêm con số / mốc thời gian / tình huống chính xác về "${(
        pains[i] || name
      ).slice(0, 44)}".`,
      visual_first_frame:
        "Người thuộc tệp khách, trong bối cảnh sinh hoạt thật, cầm/dùng sản phẩm một cách bình thường (không dàn dựng kết quả).",
      on_screen_text: "Chèn chữ bám sát lời thoại",
      why_it_stops_scroll:
        "Placeholder — hook fallback là khung, cần người viết trau cho sắc.",
      image_prompt: img,
      video_prompt: vid,
    })),
  }));
}

function buildFallbackCreative(
  product: Product,
  offerInfo: OfferPackage,
  angles: MarketingAngle[],
  packagesSummary: string,
): CreativePack {
  const first = angles[0];
  return {
    viral_hooks: angles.flatMap((a) =>
      a.hooks.map((h, idx) => ({
        id: a.id * 10 + idx,
        angle: a.name,
        hook_text: h.spoken_hook,
        category: a.awareness_level,
      })),
    ),
    video_scripts: [
      {
        title: `Kịch bản nháp theo góc "${first.name}" (PAS)`,
        framework: "Problem - Agitation - Solution",
        target_length: "30-40 giây",
        scenes: [
          {
            time: "0-3s",
            visual: first.hooks[0].visual_first_frame,
            audio: first.hooks[0].spoken_hook,
            text_overlay: first.hooks[0].on_screen_text,
          },
          {
            time: "3-12s",
            visual:
              "Khoét sâu vào hoàn cảnh của tệp khách; chưa dàn dựng kết quả.",
            audio: `Nói rõ nỗi đau: ${(product.pain_points ?? [])[0] || first.belief_to_shift}`,
            text_overlay: "Bám sát lời thoại",
          },
          {
            time: "12-25s",
            visual:
              "Quay thao tác dùng thật theo hướng dẫn nhà sản xuất; không dàn dựng kết quả.",
            audio: `Giới thiệu ${product.name} và cách dùng. ${first.proof_needed}`,
            text_overlay: "Xem hướng dẫn sử dụng",
          },
          {
            time: "25-35s",
            visual: "Hiển thị các gói đúng với offer đã chốt.",
            audio: `${packagesSummary}. ${offerInfo.risk_reversal_guarantee}`,
            text_overlay: offerInfo.urgency_hook,
          },
        ],
      },
    ],
    shopify_page: {
      headline: `Trải Nghiệm ${product.name}`,
      subheadline: offerInfo.positioning_statement,
      benefits: [
        {
          title: "Thông tin sản phẩm",
          desc: "Cần đối chiếu công dụng với tài liệu nhà sản xuất trước khi công bố.",
        },
        {
          title: "Chất liệu và hướng dẫn",
          desc: "Cần kiểm tra mẫu và chứng từ trước khi công bố.",
        },
        {
          title: "Chính sách đổi trả",
          desc: offerInfo.risk_reversal_guarantee,
        },
      ],
      faqs: [
        {
          q: "Sản phẩm phù hợp với ai?",
          a: "Cần đối chiếu hướng dẫn và giới hạn sử dụng của nhà sản xuất.",
        },
        {
          q: "Chính sách bảo hành như thế nào?",
          a: offerInfo.risk_reversal_guarantee,
        },
      ],
      html_description: `<div class="ecom-description"><h2>${product.name}</h2><p>${offerInfo.positioning_statement}</p><p>Nội dung cần kiểm chứng công dụng và nguồn trước khi xuất bản.</p></div>`,
    },
    angle_briefs: angles,
    ugc_scripts: angles.map((a) => ({
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
        },
        {
          time: "3-15s",
          visual: "Kể hoàn cảnh thật của mình, quay cận, ánh sáng tự nhiên.",
          spoken: `Nói về: ${a.belief_to_shift} → vì sao mình đi tìm cách khác.`,
          on_screen_text: "Bám sát lời thoại",
        },
        {
          time: "15-30s",
          visual: "Quay cảnh dùng thật theo hướng dẫn; KHÔNG dàn dựng kết quả.",
          spoken: `${a.promise}. ${a.proof_needed}`,
          on_screen_text: "Cách mình đang dùng",
        },
        {
          time: "30-38s",
          visual: "Chỉ tay xuống link, hiện các gói đúng offer.",
          spoken: `${offerInfo.risk_reversal_guarantee}`,
          on_screen_text: offerInfo.urgency_hook,
        },
      ],
      cta_line: `Xem các gói và chính sách đổi trả ở link. ${offerInfo.risk_reversal_guarantee}`,
      b_roll_shot_list: [
        "Cảnh vấn đề xảy ra (góc nhìn thứ nhất)",
        "Cận tay cầm/dùng sản phẩm",
        "Bối cảnh sinh hoạt liên quan tới tệp khách",
        "Màn hình điện thoại mở trang sản phẩm",
      ],
      compliance_flags: [
        {
          claim:
            "Bất kỳ câu nào hứa kết quả, thời gian, hoặc mức độ an toàn/hiệu quả",
          risk: "Meta/TikTok có thể từ chối quảng cáo hoặc khoá tài khoản (nhất là ngành trẻ em/sức khoẻ).",
          compliant_rewrite:
            "Chỉ mô tả cách dùng và trải nghiệm cá nhân; dẫn nguồn nhà sản xuất cho mọi tuyên bố công dụng.",
        },
      ],
    })),
    static_concepts: angles.map((a) => ({
      angle_id: a.id,
      format: "single_image" as const,
      concept: `Ảnh sản phẩm lifestyle theo góc "${a.name}": người thuộc tệp "${a.sub_audience}" dùng sản phẩm bình thường trong bối cảnh nhà cửa, sản phẩm là hero. Không dàn dựng kết quả.`,
      headline: a.name,
      primary_text: `${a.promise} — ${a.proof_needed}`,
      image_prompt: englishImagePrompt(product),
    })),
    test_plan: {
      first_angle_id: first.id,
      first_angle_rationale: `Ưu tiên test góc "${first.name}" vì cảm xúc lõi mạnh nhất và tệp khách rõ nhất; cần xác nhận lại bằng dữ liệu ad longevity của đối thủ.`,
      daily_budget_per_ad_set: 20,
      ad_set_count: Math.max(2, Math.min(angles.length, 4)),
      test_window_days: 3,
      kill_rules: [
        {
          metric: "Hook rate (xem 3s / hiển thị)",
          threshold: "< 25% sau ~1.000 hiển thị",
          action: "Đổi hook, giữ nguyên phần còn lại của creative",
        },
        {
          metric: "CTR (outbound)",
          threshold: "< 1%",
          action: "Đổi angle hoặc creative",
        },
        {
          metric: "CPA / chi phí mỗi lần mua",
          threshold: "> Break-even (xem Stage 04) sau khi tiêu ~2x AOV",
          action: "Tắt ad set",
        },
      ],
      scale_rule:
        "Angle nào đạt CPA dưới target ROAS 2-3 ngày liên tục → tăng 20-30% ngân sách/ngày hoặc nhân bản sang ad set mới.",
      iteration_note:
        "Winner → làm 3-5 biến thể CÙNG góc (đổi hook, đổi creator, đổi b-roll), không nhảy sang góc khác vội.",
    },
    compliance_summary: [
      "Ngành trẻ em / sức khoẻ / làm đẹp bị Meta & TikTok duyệt gắt: không hứa chữa bệnh, giảm đau, an toàn tuyệt đối, hay '#1'.",
      "Mọi tuyên bố công dụng phải dẫn nguồn nhà sản xuất; không suy ra từ tên sản phẩm.",
      "Không dùng before/after ngụ ý kết quả đảm bảo; không dùng ảnh y tế gây sốc.",
      "Không đặt countdown/tồn kho giả trên landing (giảm lòng tin + rủi ro chính sách).",
    ],
  };
}

export async function runCreativeProductionWorkflow(
  options: CreativeWorkflowOptions,
): Promise<{ product: Product; creativePack: CreativePack }> {
  const product = ecomStore.getProductById(options.productId);
  if (!product) {
    throw new Error(`Product not found: ${options.productId}`);
  }
  assertStageReady(product, "06");

  if (!product.offer_package) {
    throw new Error(
      `Sản phẩm "${product.name}" chưa hoàn thành Stage 05 (Thiết kế Offer). Cần có cấu trúc gói bán, giá ưu đãi và cam kết bảo hành để viết kịch bản video và dựng trang bán hàng Shopify.`,
    );
  }

  const runId =
    options.runId ??
    `wf_run_06_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const startedAt = options.startedAt ?? new Date().toISOString();
  const workflowEvents: WorkflowEvent[] = [];

  const emit = (type: WorkflowEvent["type"], message: string, data?: any) => {
    const event: WorkflowEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      stage: "06_CREATIVE_PRODUCTION",
      message,
      data,
    };
    workflowEvents.push(event);
    if (options.onEvent) options.onEvent(event);
  };

  emit(
    "info",
    `🚀 Kích hoạt Stage 06: Sản xuất hệ thống creative theo góc bán cho "${product.name}"...`,
  );

  const offerInfo = product.offer_package;
  const packagesSummary = offerInfo.packages
    .map((p) => `${p.tier} - ${p.name}: $${p.price} (${p.savings})`)
    .join(" | ");

  const sourceAngles: MarketingAngle[] = product.marketing_angles?.length
    ? product.marketing_angles.slice(0, 3)
    : deriveAnglesFromFlat(product);

  if (!product.marketing_angles?.length) {
    emit(
      "info",
      "  ↳ ⚠️ Sản phẩm chưa có góc bán có cấu trúc từ Stage 01 — dựng tạm từ angles/pain_points cũ (nên chạy lại Stage 01).",
    );
  }

  emit(
    "ai_analyze",
    `🤖 Viết ${sourceAngles.length} angle brief + UGC script + concept ảnh tĩnh + kế hoạch test + rà compliance...`,
  );

  const prompt = `
Bạn là Creative Strategist cho các nhãn DTC E-commerce chạy paid social (Meta/TikTok).
Sản phẩm: "${product.name}" (${product.category})
Đối tượng: "${product.target_audience}"
Nỗi đau đã biết: ${JSON.stringify(product.pain_points)}
Offer đã CHỐT ở Stage 05 (KHÔNG được đổi giá/số lượng/savings/guarantee):
- Định vị: "${offerInfo.positioning_statement}"
- Các gói: "${packagesSummary}"
- Cam kết đổi trả: "${offerInfo.risk_reversal_guarantee}"
- Câu khẩn cấp: "${offerInfo.urgency_hook}"

CÁC GÓC BÁN cần phát triển (giữ nguyên id & name, làm giàu phần còn lại, viết lại hook cho thật cụ thể):
${JSON.stringify(sourceAngles.map((a) => ({ id: a.id, name: a.name, sub_audience: a.sub_audience })))}

Quy tắc:
- "Góc" = lý do mua gắn với 1 tệp khách. KHÔNG dùng PAS/Before-After/Testimonial làm góc (đó là format).
- Hook phải cụ thể trần trụi: có con số / mốc thời gian / tình huống chính xác. Cấm câu chung chung.
- KHÔNG hứa kết quả, thời gian, công dụng y tế, độ an toàn, "#1", số liệu khách hàng nếu chưa có bằng chứng. Ghi các câu rủi ro vào "compliance_flags" kèm bản viết lại an toàn.
- Đây là BẢN NHÁP cần người duyệt. Chỉ mô tả cách dùng + trải nghiệm cá nhân.

RENDER PROMPTS (image_prompt / video_prompt) — BẮT BUỘC:
- Viết HOÀN TOÀN BẰNG TIẾNG ANH (model tạo ảnh/video train tiếng Anh; prompt tiếng Việt ra chất lượng rất xấu).
- Chi tiết & có cấu trúc: subject, wardrobe, setting/props, lighting, camera & lens, motion (với video), style, mood, composition, colour grade. Thêm "photorealistic, 8k, no text" cho ảnh; "handheld UGC, 4k 30fps, natural light" cho video.
- BRAND-SAFE tuyệt đối: KHÔNG trẻ em khóc/quấy/đau, KHÔNG bối cảnh y tế/lâm sàng, KHÔNG cảnh đưa gì vào miệng ai, KHÔNG before/after ngụ ý kết quả đảm bảo. Chỉ cảnh lifestyle ấm áp, bình thường, tôn sản phẩm.
- image_prompt cho MỖI hook (dựng hình frame 1) và MỖI static_concept. video_prompt cho MỖI hook (3 giây đầu) và MỖI ugc scene.

Trả về JSON:
{
  "angle_briefs": [ { "id": 1, "name": "...", "sub_audience": "...", "core_emotion": "...", "belief_to_shift": "...", "promise": "...", "proof_needed": "...", "awareness_level": "problem_aware", "recommended_format": "...", "hooks": [ { "variation": "A", "platform": "tiktok", "spoken_hook": "...", "visual_first_frame": "...", "on_screen_text": "...", "why_it_stops_scroll": "...", "image_prompt": "ENGLISH detailed image prompt for frame 1", "video_prompt": "ENGLISH detailed 3s video prompt" } ] } ],
  "ugc_scripts": [ { "angle_id": 1, "angle_name": "...", "creator_persona": "ai quay, quay ở đâu, phong cách", "framework": "PAS | Before-After | Founder story | 3 reasons", "target_length": "30-40s", "hook_line": "câu mở đầu = 1 hook của góc", "scenes": [ { "time": "0-3s", "visual": "chỉ đạo quay, cảm giác quay bằng điện thoại", "spoken": "lời thoại khẩu ngữ", "on_screen_text": "...", "video_prompt": "ENGLISH detailed video prompt for this scene" } ], "cta_line": "...", "b_roll_shot_list": ["clip 1", "clip 2"], "compliance_flags": [ { "claim": "câu rủi ro", "risk": "vì sao rủi ro", "compliant_rewrite": "bản an toàn" } ] } ],
  "static_concepts": [ { "angle_id": 1, "format": "single_image | carousel | before_after | meme_ugc", "concept": "ý tưởng hình", "headline": "...", "primary_text": "...", "image_prompt": "ENGLISH detailed image prompt" } ],
  "test_plan": { "first_angle_id": 1, "first_angle_rationale": "vì sao test góc này trước", "daily_budget_per_ad_set": 20, "ad_set_count": 3, "test_window_days": 3, "kill_rules": [ { "metric": "Hook rate", "threshold": "< 25%", "action": "đổi hook" } ], "scale_rule": "...", "iteration_note": "winner → 3-5 biến thể cùng góc" },
  "compliance_summary": ["luật nền tảng ngành này cần tránh 1", "..."],
  "viral_hooks": [ { "id": 1, "angle": "tên góc", "hook_text": "hook", "category": "awareness level" } ],
  "video_scripts": [ { "title": "...", "framework": "...", "target_length": "30-40s", "scenes": [ { "time": "0-3s", "visual": "...", "audio": "...", "text_overlay": "..." } ] } ],
  "shopify_page": { "headline": "...", "subheadline": "...", "benefits": [ { "title": "...", "desc": "..." } ], "faqs": [ { "q": "...", "a": "..." } ], "html_description": "<div>...</div>" }
}
`;

  const fallback = buildFallbackCreative(
    product,
    offerInfo,
    sourceAngles,
    packagesSummary,
  );

  let raw: any = fallback;
  let dataQuality: "mock" | "unverified" = "mock";
  try {
    const aiRes = await aiRouter.run({
      task: "ad_copy",
      agentName: "Creative Studio Copywriter",
      prompt,
      systemPrompt:
        "Bạn là chuyên gia creative paid-social E-commerce. Luôn trả lời JSON hợp lệ. Chỉ tạo bản nháp cần duyệt.",
      jsonMode: true,
      workflowRunId: runId,
      maxTokens: 16000,
    });
    dataQuality = aiRes.provider === "mock" ? "mock" : "unverified";
    if (aiRes.data && Array.isArray(aiRes.data.viral_hooks)) {
      raw = aiRes.data;
      emit(
        "info",
        `  ↳ Bản nháp bởi ${aiRes.provider.toUpperCase()} (${aiRes.model}) trong ${aiRes.latencyMs}ms`,
      );
    } else {
      throw new Error("Incomplete JSON");
    }
  } catch (err: any) {
    dataQuality = "mock";
    raw = fallback;
    emit(
      "info",
      `  ↳ ⚠️ AI gặp sự cố (${err?.message || "timeout"}). Dùng bộ creative dự phòng (hook/kịch bản là khung, cần người viết trau).`,
    );
  }

  // Core fields must always validate (tests + view + downstream depend on them).
  const core = creativeSchema.parse({
    viral_hooks: raw.viral_hooks,
    video_scripts: raw.video_scripts,
    shopify_page: raw.shopify_page,
  });

  // Angle-system fields are optional: attach only the ones that individually validate,
  // falling back to the deterministic draft when the AI's version is malformed.
  const creativeData: CreativePack = { ...core };
  const attach = (
    value: unknown,
    draft: unknown,
    schema: z.ZodTypeAny,
    key: keyof CreativePack,
  ) => {
    const primary = schema.safeParse(value);
    if (primary.success) {
      (creativeData as any)[key] = primary.data;
      return;
    }
    const backup = schema.safeParse(draft);
    if (backup.success) {
      (creativeData as any)[key] = backup.data;
      if (value !== undefined)
        emit(
          "info",
          `  ↳ ⚠️ "${String(key)}" từ AI sai định dạng — dùng bản nháp dự phòng.`,
        );
    }
  };
  attach(
    raw.angle_briefs,
    fallback.angle_briefs,
    z.array(marketingAngleSchema).min(1),
    "angle_briefs",
  );
  attach(
    raw.ugc_scripts,
    fallback.ugc_scripts,
    z.array(ugcScriptSchema).min(1),
    "ugc_scripts",
  );
  attach(
    raw.static_concepts,
    fallback.static_concepts,
    z.array(staticConceptSchema).min(1),
    "static_concepts",
  );
  attach(raw.test_plan, fallback.test_plan, testPlanSchema, "test_plan");
  attach(
    raw.compliance_summary,
    fallback.compliance_summary,
    complianceSummarySchema,
    "compliance_summary",
  );

  // Guarantee every hook / scene / concept has a usable English render prompt.
  ensureRenderPrompts(creativeData, product);

  creativeData.data_quality = dataQuality;
  creativeData.requires_review = true;

  const saved = commitStage(product, "06", (p) => {
    p.creative_pack = creativeData;
    p.pipeline_stage = "06_CREATIVE";
  });

  ecomStore.saveWorkflowRun({
    id: runId,
    workflow: "06_CREATIVE_PRODUCTION",
    niche: product.niche,
    status: "completed",
    progress: 100,
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    logs: workflowEvents,
    discovered_count:
      creativeData.ugc_scripts?.length ?? creativeData.video_scripts.length,
  });

  emit(
    "score",
    `Đã tạo bản nháp: ${creativeData.angle_briefs?.length ?? 0} góc bán, ${creativeData.ugc_scripts?.length ?? 0} UGC script, kế hoạch test. Cần rà claim & compliance trước khi chạy.`,
    { creativePack: creativeData },
  );
  emit(
    "done",
    "Hoàn thành bản nháp creative. Chưa phê duyệt launch hoặc chi ngân sách quảng cáo.",
  );

  return { product: saved, creativePack: creativeData };
}
