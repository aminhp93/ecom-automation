import {
  ecomStore,
  Product,
  WorkflowEvent,
  WorkflowRun,
  MarketingAngle,
} from "../db/store";
import { searchRawCandidates, RawProductCandidate } from "../tools/scraper";
import {
  calculateFinancials,
  calculateProductScore,
  scoreOrDefault,
} from "../tools/scoring";
import { marketingAngleSchema } from "./schemas";
import { aiRouter } from "../ai/router";

const MIN_DOLLAR_MARGIN = 12; // below this, cold paid-social CAC eats the whole margin
const SAFE_DOLLAR_MARGIN = 18; // thin but workable if a bundle lifts AOV

/** Build 3 conservative, structured angles from the mined pain points when the AI gives none. */
function buildFallbackAngles(painPoints: string[]): MarketingAngle[] {
  const seeds = painPoints.slice(0, 3);
  while (seeds.length < 3) seeds.push("Giải pháp cũ bất tiện và tốn thời gian");
  const emotions = [
    "Bực bội, mệt mỏi",
    "Lo lắng, mất niềm tin",
    "Tò mò, muốn thử",
  ];
  const formats = [
    "UGC talking-head + b-roll thao tác thật",
    "So sánh cách cũ vs cách mới (không dàn dựng kết quả)",
    "Founder / người dùng kể lại trải nghiệm",
  ];
  return seeds.map((pain, i) => ({
    id: i + 1,
    name: `Góc ${i + 1}: ${pain.slice(0, 48)}`,
    sub_audience:
      "Cần xác định tệp khách cụ thể (độ tuổi, hoàn cảnh, mức độ nhận thức) trước khi chạy.",
    core_emotion: emotions[i],
    belief_to_shift: "Phải chấp nhận sống chung với vấn đề này.",
    promise:
      "Xử lý được vấn đề nhanh hơn, gọn hơn — cần kiểm chứng bằng demo thật.",
    proof_needed:
      "Quay cảnh dùng thật theo hướng dẫn nhà sản xuất; không hứa kết quả/định lượng chưa có bằng chứng.",
    awareness_level: "problem_aware" as const,
    recommended_format: formats[i],
    hooks: (["A", "B", "C"] as const).map((v, h) => ({
      variation: v,
      platform: (["tiktok", "meta", "both"] as const)[h],
      spoken_hook: `(${v}) Cần viết lại cho cụ thể — thêm con số/mốc thời gian/tình huống chính xác về: "${pain.slice(0, 40)}"`,
      visual_first_frame: "Cận cảnh khoảnh khắc vấn đề xảy ra (chưa dàn dựng).",
      on_screen_text: "Chèn chữ bám sát lời thoại",
      why_it_stops_scroll:
        "Placeholder — hook fallback chưa đủ mạnh, cần người viết trau lại.",
    })),
  }));
}

export type EventCallback = (event: WorkflowEvent) => void;

export interface DiscoveryWorkflowOptions {
  runId?: string;
  niche: string;
  sources?: Array<"tiktok" | "meta_ads" | "amazon" | "aliexpress" | "kalodata">;
  sellingPriceOverride?: number;
  onEvent?: EventCallback;
}

export async function runProductDiscoveryWorkflow(
  options: DiscoveryWorkflowOptions,
): Promise<{ runId: string; products: Product[] }> {
  const runId = options.runId || `run_${Date.now()}`;
  const niche = options.niche || "baby products";
  const sources = options.sources || [
    "tiktok",
    "meta_ads",
    "amazon",
    "aliexpress",
  ];

  const logs: WorkflowEvent[] = [];

  const emit = (type: WorkflowEvent["type"], message: string, data?: any) => {
    const event: WorkflowEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      stage: "01_PRODUCT_DISCOVERY",
      message,
      data,
    };
    logs.push(event);
    if (options.onEvent) {
      try {
        options.onEvent(event);
      } catch (e) {
        console.error("Error emitting workflow event:", e);
      }
    }
  };

  const workflowRun: WorkflowRun = {
    id: runId,
    workflow: "01_PRODUCT_DISCOVERY",
    niche,
    status: "running",
    progress: 5,
    started_at: new Date().toISOString(),
    logs,
    discovered_count: 0,
  };
  ecomStore.saveWorkflowRun(workflowRun);

  emit(
    "info",
    `🚀 Khởi động Ecom OS — Stage 01: Product Discovery & Intelligence...`,
    {
      niche,
      sources,
    },
  );

  // Step 1: Query & Scrape Candidate Products
  emit(
    "search",
    `🔍 Đang quét dữ liệu thị trường từ các kênh ${sources.join(", ")} cho niche "${niche}"...`,
  );
  const rawCandidates: RawProductCandidate[] = await searchRawCandidates(
    niche,
    sources,
  );

  emit(
    "found",
    `🎯 Đã tìm thấy ${rawCandidates.length} ứng viên sản phẩm có tín hiệu bán hàng mạnh từ thị trường thực tế.`,
    {
      count: rawCandidates.length,
      candidates: rawCandidates.map((c) => c.name),
    },
  );

  workflowRun.progress = 25;
  ecomStore.saveWorkflowRun(workflowRun);

  const discoveredProducts: Product[] = [];

  // Step 2 & 3: Iterate candidates, perform AI Classification & Multi-factor Scoring
  let index = 0;
  for (const candidate of rawCandidates) {
    index++;
    const progressPercent = Math.min(
      90,
      Math.floor(25 + (index / rawCandidates.length) * 65),
    );
    workflowRun.progress = progressPercent;

    emit(
      "ai_analyze",
      `🤖 AI Worker đang phân tích góc bán và trích xuất USP sản phẩm #${index}: "${candidate.name}"...`,
    );

    // Call AI Router for Classification
    const prompt = `
Bạn là AI chuyên gia Dropshipping E-commerce hàng đầu thế giới.
Hãy phân tích sản phẩm sau:
Tên: "${candidate.name}"
Nguồn: ${candidate.source}
Mô tả gốc: "${candidate.raw_description}"
Tín hiệu nền tảng: ${JSON.stringify(candidate.platform_signals)}

Hãy trả về JSON với cấu trúc:
{
  "category": "Danh mục chi tiết",
  "target_audience": "Chân dung khách hàng mục tiêu cụ thể",
  "pain_points": ["Nỗi đau 1", "Nỗi đau 2", "Nỗi đau 3"],
  "wow_factor": "Yếu tố tạo ấn tượng tức thì trong 3 giây đầu video",
  "marketing_angles": [
    {
      "name": "Tên góc ngắn (VD: 'Mất ngủ 2h sáng')",
      "sub_audience": "Tệp khách hàng con CỤ THỂ mà góc này nhắm tới (tuổi, hoàn cảnh)",
      "core_emotion": "Cảm xúc lõi hook phải chạm (tuyệt vọng / ghê sợ / tò mò / ghen tị...)",
      "belief_to_shift": "Niềm tin cũ mà quảng cáo phải phá vỡ",
      "promise": "Lời hứa của góc này với người mua",
      "proof_needed": "Bằng chứng creative BẮT BUỘC phải cho thấy (demo, so sánh, review...)",
      "awareness_level": "unaware | problem_aware | solution_aware | product_aware | most_aware",
      "recommended_format": "VD: UGC talking-head + b-roll",
      "hooks": [
        { "variation": "A", "platform": "tiktok", "spoken_hook": "Câu nói ĐẦU TIÊN, khẩu ngữ, CỤ THỂ (có con số / mốc thời gian / tình huống chính xác)", "visual_first_frame": "Hình lấp đầy frame 1 — pattern interrupt", "on_screen_text": "Chữ overlay", "why_it_stops_scroll": "Vì sao nó chặn ngón tay đang lướt" },
        { "variation": "B", "platform": "meta", "spoken_hook": "...", "visual_first_frame": "...", "on_screen_text": "...", "why_it_stops_scroll": "..." },
        { "variation": "C", "platform": "both", "spoken_hook": "...", "visual_first_frame": "...", "on_screen_text": "...", "why_it_stops_scroll": "..." }
      ]
    }
  ],
  "demand_score": 85,
  "competition_score": 65,
  "creative_score": 90,
  "problem_score": 85,
  "shipping_score": 90
}
Điểm số đánh giá từ 0 đến 100.

QUAN TRỌNG về "marketing_angles":
- Trả về 3-4 GÓC KHÁC NHAU: khác tệp khách hàng, khác cảm xúc lõi, khác niềm tin cần phá. Đây là các "lý do mua" độc lập để test đối đầu nhau.
- "Góc" KHÔNG phải là format. "Problem / Before-After / Testimonial / PAS" là CÁCH KỂ, không phải góc — đừng dùng chúng làm tên góc.
- Mỗi góc có đúng 3 hook (A/B/C). Hook phải cụ thể trần trụi, không dùng câu chung chung kiểu "nếu bạn đang chật vật với vấn đề này".
- Không suy ra công dụng y tế / độ an toàn / số liệu từ tên sản phẩm. Nếu thiếu bằng chứng, ghi rõ trong "proof_needed".
`;

    let aiResult: any = null;
    try {
      const response = await aiRouter.run({
        task: "product_classification",
        agentName: "Product Classifier & Evaluator",
        workflowRunId: runId,
        prompt,
        systemPrompt:
          "Bạn là chuyên gia phân tích thị trường Dropshipping. Luôn trả lời ở định dạng JSON hợp lệ.",
        jsonMode: true,
      });

      aiResult = response.data;

      emit(
        "info",
        `  ↳ AI (${response.provider.toUpperCase()} / ${response.model}): Phân tích xong trong ${response.latencyMs}ms | Chi phí: $${response.costUsd.toFixed(4)}${response.isFallback ? " (⚠️ Chạy qua fallback)" : ""}`,
      );
      if (response.fallbackWarning) {
        emit("info", `  ↳ ⚠️ Cảnh báo Router: ${response.fallbackWarning}`);
      }
    } catch (err: any) {
      console.warn("AI run failed, using fallback heuristic:", err);
      emit(
        "info",
        `  ↳ ⚠️ AI API lỗi/không phản hồi (${err?.message || "timeout"}). Chuyển sang chấm điểm dự phòng bảo thủ (Heuristic Mode).`,
      );
    }

    // Default conservative fallback values if AI JSON was incomplete
    const fallbackCategory = niche;
    const fallbackAudience =
      "Người tiêu dùng trực tuyến quan tâm đến sản phẩm tiện ích";
    const fallbackPainPoints = [
      "Giải pháp truyền thống tốn kém và bất tiện",
      "Mất thời gian xử lý thủ công hàng ngày",
      "Chất lượng sản phẩm cũ không đảm bảo",
    ];
    const fallbackWow = "Hiệu quả rõ rệt tức thì trong video minh họa thực tế.";

    const category = aiResult?.category || fallbackCategory;
    const targetAudience = aiResult?.target_audience || fallbackAudience;
    const painPoints = Array.isArray(aiResult?.pain_points)
      ? aiResult.pain_points
      : fallbackPainPoints;
    const wowFactor = aiResult?.wow_factor || fallbackWow;

    // Structured angles — validate each; keep only well-formed ones. "Angle" = reason-to-buy, not a format.
    const rawAngles: any[] = Array.isArray(aiResult?.marketing_angles)
      ? aiResult.marketing_angles
      : [];
    const parsedAngles: MarketingAngle[] = rawAngles
      .map((a, i) => {
        const r = marketingAngleSchema.safeParse({ ...a, id: a?.id ?? i + 1 });
        return r.success ? r.data : null;
      })
      .filter((a): a is MarketingAngle => a !== null)
      .slice(0, 5);
    const marketingAngles =
      parsedAngles.length >= 2 ? parsedAngles : buildFallbackAngles(painPoints);
    if (parsedAngles.length < 2) {
      emit(
        "info",
        `  ↳ ⚠️ AI không trả về góc bán có cấu trúc hợp lệ — dùng góc dự phòng (cần người viết trau lại hook).`,
      );
    }
    const angles = marketingAngles.map((a) => a.name);

    // Unit Economics & Financials
    const financials = calculateFinancials({
      supplier_price: candidate.supplier_price,
      shipping_cost: candidate.shipping_cost,
      selling_price: options.sellingPriceOverride,
    });

    // Scoring calculation: If AI failed, use conservative scores (50-60) instead of inflated scores
    const demandScore = scoreOrDefault(aiResult?.demand_score, 55);
    const compScore = scoreOrDefault(aiResult?.competition_score, 50);
    const creativeScore = scoreOrDefault(aiResult?.creative_score, 55);
    const probScore = scoreOrDefault(aiResult?.problem_score, 50);
    const shipScore = scoreOrDefault(aiResult?.shipping_score, 65);
    const marginScore = Math.min(
      100,
      Math.max(0, Math.round(financials.margin_percentage * 1.3)),
    );

    const scoring = calculateProductScore({
      demand: demandScore,
      competition: compScore,
      margin: marginScore,
      creative: creativeScore,
      problem: probScore,
      shipping: shipScore,
    });

    // Hard gates for "will this actually make money on paid social", independent of the AI score.
    let gatedRecommendation = scoring.recommendation;
    let gatedReason = scoring.recommendation_reason;
    if (
      financials.gross_margin < MIN_DOLLAR_MARGIN &&
      gatedRecommendation !== "KILL"
    ) {
      gatedRecommendation = "KILL";
      gatedReason = `Lãi gộp $${financials.gross_margin}/đơn < $${MIN_DOLLAR_MARGIN}. CAC cold traffic trên Meta/TikTok thường $15-40 nên biên này không chạy paid ads có lãi được — cần tăng giá bán hoặc hạ giá vốn.`;
    } else if (
      financials.gross_margin < SAFE_DOLLAR_MARGIN &&
      gatedRecommendation === "TEST"
    ) {
      gatedRecommendation = "CONSIDER";
      gatedReason = `${scoring.recommendation_reason} ⚠️ Lãi gộp $${financials.gross_margin}/đơn còn mỏng (< $${SAFE_DOLLAR_MARGIN}); chỉ test nếu bundle nâng được AOV.`;
    }
    const adSignal = Number(candidate.platform_signals?.active_ads) || 0;
    const salesSignal = Number(candidate.platform_signals?.orders_30d) || 0;
    if (adSignal === 0 && salesSignal === 0 && gatedRecommendation === "TEST") {
      gatedRecommendation = "CONSIDER";
      gatedReason += ` ⚠️ Chưa có tín hiệu đối thủ chạy ads hoặc đơn hàng thực tế — kiểm chứng cầu (Meta Ad Library / doanh số) trước khi đổ ngân sách test.`;
    }

    // Deduplication check against existing products
    const existingList = ecomStore.getProducts();
    const existing = existingList.find(
      (p) =>
        p.name.trim().toLowerCase() === candidate.name.trim().toLowerCase() ||
        (candidate.url &&
          p.url &&
          p.url.trim().toLowerCase() === candidate.url.trim().toLowerCase()),
    );

    // Check if existing product was already approved or progressing in pipeline
    const isApprovedOrProgressed = !!(
      existing && existing.status !== "discovered"
    );

    const product: Product = {
      id: existing
        ? existing.id
        : `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: candidate.name,
      source: candidate.source,
      url: candidate.url,
      image_url: candidate.image_url,
      niche,
      category,

      // Financials
      supplier_price: financials.supplier_price,
      selling_price: financials.selling_price,
      shipping_cost: financials.shipping_cost,
      payment_fee: financials.payment_fee,
      refund_reserve: financials.refund_reserve,
      landed_cost: financials.landed_cost,
      gross_margin: financials.gross_margin,
      margin_percentage: financials.margin_percentage,

      // Preserve existing score & recommendation if product was already approved / progressing in pipeline
      demand_score: isApprovedOrProgressed
        ? existing.demand_score
        : scoring.demand_score,
      competition_score: isApprovedOrProgressed
        ? existing.competition_score
        : scoring.competition_score,
      margin_score: isApprovedOrProgressed
        ? existing.margin_score
        : scoring.margin_score,
      creative_score: isApprovedOrProgressed
        ? existing.creative_score
        : scoring.creative_score,
      problem_score: isApprovedOrProgressed
        ? existing.problem_score
        : scoring.problem_score,
      shipping_score: isApprovedOrProgressed
        ? existing.shipping_score
        : scoring.shipping_score,
      product_score: isApprovedOrProgressed
        ? existing.product_score
        : scoring.product_score,

      status: existing?.status || "discovered",
      recommendation: isApprovedOrProgressed
        ? existing.recommendation
        : gatedRecommendation,
      recommendation_reason: isApprovedOrProgressed
        ? existing.recommendation_reason
        : gatedReason,

      wow_factor: wowFactor,
      target_audience: targetAudience,
      pain_points: painPoints,
      angles,
      marketing_angles: isApprovedOrProgressed
        ? (existing.marketing_angles ?? marketingAngles)
        : marketingAngles,

      // Preserve existing downstream stage artifacts if discovery is re-run
      validation: existing?.validation,
      competitor_analysis: existing?.competitor_analysis,
      supplier_economics: existing?.supplier_economics,
      offer_package: existing?.offer_package,
      creative_pack: existing?.creative_pack,

      pipeline_stage: existing?.pipeline_stage || "01_DISCOVERY",
      stage_status: existing?.stage_status || {
        "01": "completed",
        "02": "pending",
        "03": "locked",
        "04": "locked",
        "05": "locked",
        "06": "locked",
      },

      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Discovery must not overwrite approved inputs or reattach obsolete downstream artifacts.
    if (existing) {
      discoveredProducts.push(existing);
      emit(
        "info",
        `Đã có "${existing.name}" — giữ nguyên dữ liệu và tiến độ, không ghi đè bằng mẫu discovery.`,
      );
      continue;
    }
    ecomStore.saveProduct(product);
    discoveredProducts.push(product);

    emit(
      "score",
      `🏆 Điểm số sản phẩm #${index}: ${product.product_score}/100 [${product.recommendation === "TEST" ? "🔥 TEST" : product.recommendation === "CONSIDER" ? "⚠️ CONSIDER" : "❌ SKIP"}] | Margin: $${product.gross_margin} (${product.margin_percentage}%)`,
      { product },
    );
  }

  // Complete workflow run
  workflowRun.status = "completed";
  workflowRun.progress = 100;
  workflowRun.completed_at = new Date().toISOString();
  workflowRun.discovered_count = discoveredProducts.length;
  ecomStore.saveWorkflowRun(workflowRun);

  emit(
    "done",
    `🎉 Hoàn thành Stage 01! Đã phân tích và lưu ${discoveredProducts.length} sản phẩm vào cơ sở dữ liệu. Sẵn sàng duyệt (Approve) để chuyển tiếp sang Stage 02.`,
  );

  return {
    runId,
    products: discoveredProducts,
  };
}
