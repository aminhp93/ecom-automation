import { NextRequest } from "next/server";
import { generateProductImage } from "@/lib/ai/media/image-generator";
import { ecomStore } from "@/lib/db/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { productId, targetType, id, prompt, aspectRatio: rawAspect } = body;
    const aspectRatio = rawAspect === "9:16" ? "9:16" : "1:1";

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 8) {
      return Response.json(
        { error: "Prompt không hợp lệ." },
        { status: 400 }
      );
    }

    const product = productId ? ecomStore.getProductById(productId) : null;
    if (product && product.status === "rejected") {
      return Response.json(
        { error: "Sản phẩm đã bị loại — không tạo asset." },
        { status: 409 }
      );
    }
    const productName = product?.name || "E-commerce Product";

    // 1. Generate image using Imagen 3 / FLUX.1
    const result = await generateProductImage({
      prompt,
      aspectRatio,
      productName,
    });

    // 2. Persist in store if productId provided
    if (productId && product) {
      ecomStore.updateProduct(productId, (p) => {
        if (!p.creative_pack) return p;

        if (targetType === "static_concept" && p.creative_pack.static_concepts) {
          const idx = typeof id === "number" ? id : parseInt(id, 10);
          if (p.creative_pack.static_concepts[idx]) {
            p.creative_pack.static_concepts[idx].generated_image_url =
              result.imageUrl;
          }
        } else if (targetType === "hook" && p.creative_pack.angle_briefs) {
          const [angleIdStr, variation] = String(id).split("_");
          const angleId = parseInt(angleIdStr, 10);
          const angle = p.creative_pack.angle_briefs.find((a) => a.id === angleId);
          if (angle) {
            const hook = angle.hooks.find((h) => h.variation === variation);
            if (hook) {
              hook.generated_image_url = result.imageUrl;
            }
          }
        }
        return p;
      });
    }

    return Response.json({
      success: true,
      imageUrl: result.imageUrl,
      provider: result.provider,
      promptUsed: result.promptUsed,
    });
  } catch (error: any) {
    console.error("Image generation route error:", error);
    return Response.json(
      { error: error?.message || "Đã xảy ra lỗi khi tạo ảnh." },
      { status: 500 }
    );
  }
}
