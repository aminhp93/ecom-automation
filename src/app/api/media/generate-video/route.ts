import { NextRequest } from "next/server";
import { generateFalVideo } from "@/lib/ai/media/fal-video";
import { ecomStore } from "@/lib/db/store";
import { errorCode, errorMessage } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { productId, targetType, id, prompt } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 8) {
      return Response.json(
        { error: "GENERATION_FAILED", message: "Prompt không hợp lệ." },
        { status: 400 }
      );
    }

    const product = productId ? ecomStore.getProductById(productId) : null;
    if (product && product.status === "rejected") {
      return Response.json(
        { error: "GENERATION_FAILED", message: "Sản phẩm đã bị loại — không tạo asset." },
        { status: 409 }
      );
    }

    // 1. Generate video via Fal.ai
    const result = await generateFalVideo({ prompt });

    // 2. Persist in store if productId provided
    if (productId) {
      ecomStore.updateProduct(productId, (p) => {
        if (!p.creative_pack) return p;

        if (targetType === "hook" && p.creative_pack.angle_briefs) {
          const [angleIdStr, variation] = String(id).split("_");
          const angleId = parseInt(angleIdStr, 10);
          const angle = p.creative_pack.angle_briefs.find((a) => a.id === angleId);
          if (angle) {
            const hook = angle.hooks.find((h) => h.variation === variation);
            if (hook) {
              hook.generated_video_url = result.videoUrl;
            }
          }
        } else if (targetType === "ugc_scene" && p.creative_pack.ugc_scripts) {
          const [angleIdStr, sceneIdxStr] = String(id).split("_");
          const angleId = parseInt(angleIdStr, 10);
          const sceneIdx = parseInt(sceneIdxStr, 10);
          const script = p.creative_pack.ugc_scripts.find(
            (s) => s.angle_id === angleId
          );
          if (script && script.scenes[sceneIdx]) {
            script.scenes[sceneIdx].generated_video_url = result.videoUrl;
          }
        }
        return p;
      });
    }

    return Response.json({
      success: true,
      videoUrl: result.videoUrl,
      requestId: result.requestId,
      modelUsed: result.modelUsed,
    });
  } catch (error: unknown) {
    console.error("Video generation route error:", error);
    const isMissingKey = errorCode(error) === "MISSING_FAL_KEY";
    return Response.json(
      {
        error: isMissingKey ? "MISSING_FAL_KEY" : "GENERATION_FAILED",
        message: errorMessage(error, "Đã xảy ra lỗi khi tạo video."),
      },
      { status: isMissingKey ? 400 : 500 }
    );
  }
}
