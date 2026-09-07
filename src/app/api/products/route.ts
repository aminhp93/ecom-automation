import { NextRequest, NextResponse } from "next/server";
import { ecomStore, Product } from "@/lib/db/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const niche = searchParams.get("niche") || undefined;
  const status = searchParams.get("status") || undefined;
  const minScoreStr = searchParams.get("minScore");
  const minScore = minScoreStr ? Number(minScoreStr) : undefined;
  const q = searchParams.get("q")?.toLowerCase() || "";

  let products = ecomStore.getProducts({ niche, status, minScore });

  if (q) {
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.niche.toLowerCase().includes(q) ||
        p.wow_factor.toLowerCase().includes(q),
    );
  }

  return NextResponse.json({
    success: true,
    total: products.length,
    products,
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (
      typeof id !== "string" ||
      ![
        "discovered",
        "approved_for_validation",
        "rejected",
        "testing",
      ].includes(status)
    ) {
      return NextResponse.json(
        { success: false, error: "Thiếu id hoặc status" },
        { status: 400 },
      );
    }

    const updated = ecomStore.updateProductStatus(
      id,
      status as Product["status"],
    );
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy sản phẩm" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      product: updated,
      message:
        status === "approved_for_validation"
          ? "Đã duyệt sản phẩm và mở khóa Stage 02: Product Validation!"
          : `Đã cập nhật trạng thái sang "${status}"`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      niche = "Custom Niche",
      category,
      supplier_price = 5.0,
      selling_price = 29.99,
      shipping_cost = 2.5,
      image_url,
      raw_description = "",
      auto_approve = true,
    } = body;

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Tên sản phẩm không được để trống" },
        { status: 400 },
      );
    }

    const { calculateFinancials, calculateProductScore, scoreOrDefault } =
      await import("@/lib/tools/scoring");
    const { aiRouter } = await import("@/lib/ai/router");

    if (
      [supplier_price, shipping_cost, selling_price].some(
        (value) =>
          (typeof value !== "number" && typeof value !== "string") ||
          String(value).trim() === "" ||
          !Number.isFinite(Number(value)),
      ) ||
      Number(supplier_price) < 0 ||
      Number(shipping_cost) < 0 ||
      Number(selling_price) <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Giá vốn/ship phải hữu hạn và không âm, giá bán phải > 0.",
        },
        { status: 400 },
      );
    }

    // 1. Calculate Unit Economics
    const financials = calculateFinancials({
      supplier_price: Number(supplier_price),
      shipping_cost: Number(shipping_cost),
      selling_price: Number(selling_price),
    });

    // 2. AI Quick Analysis for Wow factor & Angles
    let aiData: any = null;
    try {
      const prompt = `
Phân tích sản phẩm Dropshipping sau:
Tên: "${name}"
Niche: "${niche}"
Mô tả: "${raw_description}"
Giá bán: $${financials.selling_price}

Trả về JSON:
{
  "category": "Danh mục chi tiết",
  "target_audience": "Khách hàng mục tiêu",
  "pain_points": ["Nỗi đau 1", "Nỗi đau 2", "Nỗi đau 3"],
  "wow_factor": "Yếu tố giật gân 3 giây đầu",
  "angles": ["Góc ad 1", "Góc ad 2", "Góc ad 3"],
  "demand_score": 88,
  "competition_score": 65,
  "creative_score": 90,
  "problem_score": 85,
  "shipping_score": 92
}
`;
      const aiRes = await aiRouter.run({
        task: "product_classification",
        prompt,
        jsonMode: true,
      });
      aiData = aiRes.data;
    } catch (e) {
      console.warn("AI analysis fallback for custom product:", e);
    }

    const categoryFinal = category || aiData?.category || niche;
    const targetAudience =
      aiData?.target_audience ||
      "Người tiêu dùng yêu thích tiện ích thông minh";
    const painPoints = Array.isArray(aiData?.pain_points)
      ? aiData.pain_points
      : [
          "Giải pháp cũ tốn nhiều thời gian và công sức",
          "Bất tiện khi sử dụng hàng ngày",
          "Chi phí đắt đỏ",
        ];
    const wowFactor =
      aiData?.wow_factor ||
      "Hiệu quả rõ rệt và tiện dụng ngay trong lần đầu trải nghiệm.";
    const angles = Array.isArray(aiData?.angles)
      ? aiData.angles
      : [
          "Góc 1: Giải quyết nỗi đau thường gặp",
          "Góc 2: Trước & sau khi dùng",
          "Góc 3: Đánh giá thực tế",
        ];

    // Conservative baseline scores if AI data was unavailable
    const demandScore = scoreOrDefault(aiData?.demand_score, 55);
    const compScore = scoreOrDefault(aiData?.competition_score, 50);
    const creativeScore = scoreOrDefault(aiData?.creative_score, 55);
    const problemScore = scoreOrDefault(aiData?.problem_score, 50);
    const shippingScore = scoreOrDefault(aiData?.shipping_score, 60);
    const marginScore = Math.min(
      100,
      Math.max(0, Math.round(financials.margin_percentage * 1.3)),
    );

    const scoring = calculateProductScore({
      demand: demandScore,
      competition: compScore,
      margin: marginScore,
      creative: creativeScore,
      problem: problemScore,
      shipping: shippingScore,
    });

    const defaultImg =
      image_url && image_url.trim()
        ? image_url.trim()
        : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";

    const newProduct: Product = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      source: "manual",
      url:
        "https://myshopify.com/products/" +
        encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-")),
      image_url: defaultImg,
      niche,
      category: categoryFinal,

      supplier_price: financials.supplier_price,
      selling_price: financials.selling_price,
      shipping_cost: financials.shipping_cost,
      payment_fee: financials.payment_fee,
      refund_reserve: financials.refund_reserve,
      landed_cost: financials.landed_cost,
      gross_margin: financials.gross_margin,
      margin_percentage: financials.margin_percentage,

      demand_score: scoring.demand_score,
      competition_score: scoring.competition_score,
      margin_score: scoring.margin_score,
      creative_score: scoring.creative_score,
      problem_score: scoring.problem_score,
      shipping_score: scoring.shipping_score,
      product_score: scoring.product_score,

      status: auto_approve ? "approved_for_validation" : "discovered",
      pipeline_stage: "01_DISCOVERY",
      stage_status: {
        "01": "completed",
        "02": auto_approve ? "ready" : "pending",
        "03": "locked",
        "04": "locked",
        "05": "locked",
        "06": "locked",
      },
      recommendation: scoring.recommendation,
      recommendation_reason: scoring.recommendation_reason,

      wow_factor: wowFactor,
      target_audience: targetAudience,
      pain_points: painPoints,
      angles,

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    ecomStore.saveProduct(newProduct);

    return NextResponse.json({
      success: true,
      product: newProduct,
      message: "Đã thêm sản phẩm của bạn vào hệ thống thành công!",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Server error" },
      { status: 500 },
    );
  }
}
