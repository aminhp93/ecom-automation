/**
 * Prompt Builder for AI Image & Video generation.
 *
 * Rule: the render prompt fed to Imagen / Flux / Kling / Runway / Luma is ALWAYS English and
 * heavily specified (subject, environment, light, lens, style, mood, composition, colour).
 * Stage 06 authors an English `image_prompt` / `video_prompt` alongside each creative; this
 * builder frames that prompt with quality + safety scaffolding. When a legacy pack has no
 * authored prompt, the builder composes a competent English fallback from the structured
 * context so output stays usable (re-run Stage 06 to get a hand-authored prompt).
 */

export interface PromptContext {
  productName: string;
  category?: string;
  niche?: string;
  targetAudience?: string;
  angleName?: string;
  format?: string;
}

/** Never render these — protects the ad account and the brand. */
export const IMAGE_NEGATIVE_PROMPT =
  "crying child, distressed infant, child in pain, tears, medical procedure, injury, blood, rash close-up, syringe, hands near a baby's mouth, before-and-after comparison implying a medical result, exaggerated symptoms, text watermark, logo, extra fingers, deformed hands, distorted face, mutated anatomy, blurry, low resolution, jpeg artifacts, oversaturated, plastic skin, uncanny, stock-photo cliche, harsh flash.";

export const VIDEO_NEGATIVE_PROMPT =
  "crying or screaming child, infant in visible distress, medical or clinical setting, applying product inside a mouth, staged symptom relief, dramatic before/after, morphing artifacts, warping faces, jitter, flicker, text overlays baked in, watermark, CGI sheen.";

const IMAGE_QUALITY_TAIL =
  "Shot as premium DTC e-commerce advertising photography. Natural soft directional window light, 50mm lens, shallow depth of field, crisp focus on the product, calm minimal composition with generous negative space, warm neutral premium colour grade, subtle film grain, photorealistic, 8k, high dynamic range.";

const VIDEO_QUALITY_TAIL =
  "Raw authentic UGC filmed handheld on a modern phone, natural indoor lighting, documentary feel, lifelike skin texture and micro-expressions, gentle organic camera movement, 4k, 30fps, no on-screen text baked in, no CGI look.";

const BRAND_SAFETY_NOTE =
  "Brand-safe: no children in distress, no crying, no medical or clinical imagery, no product going into anyone's mouth, no implied guaranteed results. Keep it warm, calm, lifestyle-led and product-forward.";

function aspectLine(aspectRatio: "1:1" | "9:16" | "16:9"): string {
  if (aspectRatio === "9:16") return "Vertical 9:16 full-frame mobile composition.";
  if (aspectRatio === "16:9") return "Horizontal 16:9 cinematic composition.";
  return "Square 1:1 composition.";
}

/** Best-effort English scene line when the pack has no authored prompt. */
function fallbackImageScene(
  raw: string | undefined,
  context: PromptContext,
): string {
  const subject = context.productName;
  const who = context.targetAudience
    ? `a real member of the target audience (${context.targetAudience})`
    : "a relatable everyday person";
  const angle = context.angleName ? ` conveying the angle "${context.angleName}"` : "";
  // We do not trust `raw` to be English or safe, so we describe around it rather than pass it through.
  return `A tasteful lifestyle product scene featuring ${subject}${angle}. In frame: ${who} in a bright, tidy home setting, interacting calmly and naturally with the product. The product is clearly visible and hero-lit. Mood: reassuring, premium, understated.${raw ? ` Loose visual reference (do not copy literally, keep it calm and brand-safe): ${raw}.` : ""}`;
}

function fallbackVideoScene(
  raw: string | undefined,
  context: PromptContext,
): string {
  const subject = context.productName;
  return `First 3 seconds of a vertical UGC ad for ${subject}. A relatable person${context.targetAudience ? ` from the audience "${context.targetAudience}"` : ""} speaks directly to camera in a real home, then reveals and uses the product on-frame in a calm, everyday way. Slow push-in on the product.${raw ? ` Loose reference (keep calm and brand-safe): ${raw}.` : ""}`;
}

/**
 * Static ad image prompt. Prefers `concept.image_prompt` (authored English); otherwise composes one.
 */
export function buildImagePrompt(
  concept: {
    concept?: string;
    headline?: string;
    primary_text?: string;
    image_prompt?: string;
    visual_first_frame?: string;
  },
  context: PromptContext,
  aspectRatio: "1:1" | "9:16" = "1:1",
): { prompt: string; fullCopyText: string; authored: boolean } {
  const authored = !!(concept.image_prompt && concept.image_prompt.trim());
  const core = authored
    ? concept.image_prompt!.trim()
    : fallbackImageScene(concept.visual_first_frame || concept.concept, context);

  const prompt = [
    core,
    `Product: "${context.productName}"${context.category ? ` — ${context.category}` : ""}.`,
    aspectLine(aspectRatio),
    IMAGE_QUALITY_TAIL,
    BRAND_SAFETY_NOTE,
  ].join(" ");

  const fullCopyText = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 STATIC AD IMAGE PROMPT${authored ? "" : "  (auto-fallback — re-run Stage 06 for an authored prompt)"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Product: ${context.productName}${context.category ? ` (${context.category})` : ""}
🎯 Audience: ${context.targetAudience || "—"}
💡 Angle: ${context.angleName || "—"}
🖼️ Format: ${context.format || "single image"} · Aspect: ${aspectRatio}

📝 AD COPY:
• Headline: "${concept.headline || ""}"
• Primary text: "${concept.primary_text || ""}"

🎨 IMAGE PROMPT (Imagen / Flux / Midjourney / Leonardo):
${prompt}

🚫 NEGATIVE PROMPT:
${IMAGE_NEGATIVE_PROMPT}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return { prompt, fullCopyText, authored };
}

/**
 * 3-second hook video prompt. Prefers `hook.video_prompt` (authored English); otherwise composes one.
 */
export function buildVideoPrompt(
  hook: {
    variation: string;
    spoken_hook: string;
    visual_first_frame: string;
    on_screen_text: string;
    why_it_stops_scroll?: string;
    video_prompt?: string;
    image_prompt?: string;
  },
  context: PromptContext,
): { prompt: string; fullCopyText: string; authored: boolean } {
  const authored = !!(hook.video_prompt && hook.video_prompt.trim());
  const core = authored
    ? hook.video_prompt!.trim()
    : fallbackVideoScene(hook.visual_first_frame, context);

  const prompt = [
    core,
    `Product context: "${context.productName}"${context.category ? ` — ${context.category}` : ""}.`,
    "Vertical 9:16, ~3 seconds, scroll-stopping opening beat.",
    VIDEO_QUALITY_TAIL,
    BRAND_SAFETY_NOTE,
  ].join(" ");

  const fullCopyText = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 3-SECOND HOOK VIDEO PROMPT${authored ? "" : "  (auto-fallback — re-run Stage 06 for an authored prompt)"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Product: ${context.productName}
🎯 Audience: ${context.targetAudience || "—"}
💡 Angle: ${context.angleName || "—"}  ·  ⚡ Hook ${hook.variation}

🗣️ VOICE-OVER (0-3s):
"${hook.spoken_hook}"

🔤 ON-SCREEN TEXT (add in edit, not baked into the render):
"${hook.on_screen_text}"

🎥 VIDEO PROMPT (Kling / Runway Gen-3 / Luma / Minimax):
${prompt}

🚫 NEGATIVE PROMPT:
${VIDEO_NEGATIVE_PROMPT}

💡 WHY IT STOPS THE SCROLL:
${hook.why_it_stops_scroll || "Pattern interrupt in the first frame."}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return { prompt, fullCopyText, authored };
}

/** Per-scene UGC video prompt. Prefers `scene.video_prompt`; otherwise composes one. */
export function buildScenePrompt(
  scene: {
    time: string;
    visual: string;
    spoken: string;
    on_screen_text: string;
    video_prompt?: string;
  },
  context: PromptContext,
): { prompt: string; fullCopyText: string; authored: boolean } {
  const authored = !!(scene.video_prompt && scene.video_prompt.trim());
  const core = authored
    ? scene.video_prompt!.trim()
    : fallbackVideoScene(scene.visual, context);

  const prompt = [
    core,
    `Product: "${context.productName}".`,
    "Authentic handheld UGC, vertical 9:16.",
    VIDEO_QUALITY_TAIL,
    BRAND_SAFETY_NOTE,
  ].join(" ");

  const fullCopyText = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 UGC SCENE [${scene.time}]${authored ? "" : "  (auto-fallback)"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Product: ${context.productName}  ·  💡 Angle: ${context.angleName || "—"}

🗣️ Line: "${scene.spoken}"
🔤 Overlay (add in edit): "${scene.on_screen_text}"

🎥 VIDEO PROMPT (Kling / Runway / Luma):
${prompt}

🚫 NEGATIVE PROMPT:
${VIDEO_NEGATIVE_PROMPT}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return { prompt, fullCopyText, authored };
}
