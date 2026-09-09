import fs from "fs";
import path from "path";
import crypto from "crypto";
import { GoogleGenAI, PersonGeneration } from "@google/genai";
import { IMAGE_NEGATIVE_PROMPT } from "./prompt-builder";

export interface GenerateImageOptions {
  /** Fully-built English prompt (from prompt-builder). Passed through, not re-wrapped. */
  prompt: string;
  aspectRatio?: "1:1" | "9:16";
  productName?: string;
}

export interface GenerateImageResult {
  /** Stable local path under /generated — never a multi-MB data: URI. */
  imageUrl: string;
  provider: "imagen-3" | "flux-1-free";
  promptUsed: string;
}

const GENERATED_DIR = path.join(process.cwd(), "public", "generated");

/** Persist raw image bytes to public/generated and return the servable path. */
function saveImage(bytes: Buffer, ext = "jpg"): string {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  const name = `${crypto.randomBytes(10).toString("hex")}.${ext}`;
  fs.writeFileSync(path.join(GENERATED_DIR, name), bytes);
  return `/generated/${name}`;
}

/**
 * Generate a commercial product ad image.
 * 1. Google Imagen 3 (if GEMINI_API_KEY is set and allow-listed for Imagen).
 * 2. Free FLUX.1 via pollinations, downloaded and cached locally.
 * Either way the result is written to disk and returned as a `/generated/...` path.
 */
export async function generateProductImage(
  options: GenerateImageOptions,
): Promise<GenerateImageResult> {
  const { prompt, aspectRatio = "1:1" } = options;
  const width = aspectRatio === "9:16" ? 896 : 1024;
  const height = aspectRatio === "9:16" ? 1600 : 1024;

  // 1. Google Imagen 3
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const response = await ai.models.generateImages({
        model: "imagen-3.0-generate-002",
        prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: aspectRatio === "9:16" ? "9:16" : "1:1",
          negativePrompt: IMAGE_NEGATIVE_PROMPT,
          personGeneration: PersonGeneration.ALLOW_ADULT,
        },
      });

      const b64 = response.generatedImages?.[0]?.image?.imageBytes;
      if (b64) {
        return {
          imageUrl: saveImage(Buffer.from(b64, "base64"), "jpg"),
          provider: "imagen-3",
          promptUsed: prompt,
        };
      }
    } catch (err) {
      console.warn(
        "Imagen 3 unavailable (quota / not allow-listed), falling back to FLUX.1:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // 2. FLUX.1 (free) — generate, then download + cache the bytes locally.
  const fluxUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt,
  )}?width=${width}&height=${height}&model=flux&enhance=true&nologo=true&seed=${Math.floor(
    Math.random() * 1_000_000,
  )}`;

  try {
    const res = await fetch(fluxUrl);
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 1024) {
        return {
          imageUrl: saveImage(buf, "jpg"),
          provider: "flux-1-free",
          promptUsed: prompt,
        };
      }
    }
  } catch (err) {
    console.warn("FLUX download failed, returning the hotlink URL:", err instanceof Error ? err.message : err);
  }

  // Last resort: hand back the hotlink (short URL, no store bloat).
  return { imageUrl: fluxUrl, provider: "flux-1-free", promptUsed: prompt };
}
