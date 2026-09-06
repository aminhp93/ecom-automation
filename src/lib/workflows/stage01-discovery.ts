import { ecomStore, Product, WorkflowEvent, WorkflowRun } from '../db/store';
import { searchRawCandidates, RawProductCandidate } from '../tools/scraper';
import { calculateFinancials, calculateProductScore } from '../tools/scoring';
import { aiRouter } from '../ai/router';

export type EventCallback = (event: WorkflowEvent) => void;

export interface DiscoveryWorkflowOptions {
  runId?: string;
  niche: string;
  sources?: Array<'tiktok' | 'meta_ads' | 'amazon' | 'aliexpress'>;
  sellingPriceOverride?: number;
  onEvent?: EventCallback;
}

export async function runProductDiscoveryWorkflow(
  options: DiscoveryWorkflowOptions
): Promise<{ runId: string; products: Product[] }> {
  const runId = options.runId || `run_${Date.now()}`;
  const niche = options.niche || 'baby products';
  const sources = options.sources || ['tiktok', 'meta_ads', 'amazon', 'aliexpress'];

  const logs: WorkflowEvent[] = [];

  const emit = (
    type: WorkflowEvent['type'],
    message: string,
    data?: any
  ) => {
    const event: WorkflowEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      stage: '01_PRODUCT_DISCOVERY',
      message,
      data,
    };
    logs.push(event);
    if (options.onEvent) {
      try {
        options.onEvent(event);
      } catch (e) {
        console.error('Error emitting workflow event:', e);
      }
    }
  };

  const workflowRun: WorkflowRun = {
    id: runId,
    workflow: '01_PRODUCT_DISCOVERY',
    niche,
    status: 'running',
    progress: 5,
    started_at: new Date().toISOString(),
    logs,
    discovered_count: 0,
  };
  ecomStore.saveWorkflowRun(workflowRun);

  emit('info', `🚀 Khởi động Ecom OS — Stage 01: Product Discovery & Intelligence...`, {
    niche,
    sources,
  });

  // Step 1: Query & Scrape Candidate Products
  emit('search', `🔎 Đang thu thập dữ liệu từ ${sources.join(', ').toUpperCase()} cho thị trường "${niche}"...`);
  const rawCandidates: RawProductCandidate[] = await searchRawCandidates(niche, sources);

  emit('found', `✓ Tìm thấy ${rawCandidates.length} sản phẩm tiềm năng có xu hướng tăng trưởng cao.`, {
    count: rawCandidates.length,
    candidates: rawCandidates.map((c) => c.name),
  });

  workflowRun.progress = 25;
  ecomStore.saveWorkflowRun(workflowRun);

  const discoveredProducts: Product[] = [];

  // Step 2 & 3: Iterate candidates, perform AI Classification & Multi-factor Scoring
  let index = 0;
  for (const candidate of rawCandidates) {
    index++;
    const progressPercent = Math.min(90, Math.floor(25 + (index / rawCandidates.length) * 65));
    workflowRun.progress = progressPercent;

    emit(
      'ai_analyze',
      `🤖 AI Worker đang phân tích góc bán và trích xuất USP sản phẩm #${index}: "${candidate.name}"...`
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
  "angles": ["Góc quảng cáo 1 (Problem)", "Góc quảng cáo 2 (Before/After)", "Góc quảng cáo 3 (Testimonial)"],
  "demand_score": 85,
  "competition_score": 65,
  "creative_score": 90,
  "problem_score": 85,
  "shipping_score": 90
}
Điểm số đánh giá từ 0 đến 100.
`;

    let aiResult: any = null;
    try {
      const response = await aiRouter.run({
        task: 'product_classification',
        prompt,
        systemPrompt: 'Bạn là chuyên gia phân tích thị trường Dropshipping. Luôn trả lời ở định dạng JSON hợp lệ.',
        jsonMode: true,
      });

      aiResult = response.data;

      // Track AI Token & Cost in database
      ecomStore.addAgentRun({
        id: `agent_run_${Date.now()}_${index}`,
        workflow_run_id: runId,
        agent: 'Product Classifier & Evaluator',
        provider: response.provider,
        model: response.model,
        task: 'product_classification',
        input_tokens: response.usage.inputTokens,
        output_tokens: response.usage.outputTokens,
        total_tokens: response.usage.totalTokens,
        cost_usd: response.costUsd,
        latency_ms: response.latencyMs,
        created_at: new Date().toISOString(),
      });

      emit(
        'info',
        `  ↳ AI (${response.provider.toUpperCase()} / ${response.model}): Phân tích xong trong ${response.latencyMs}ms | Chi phí: $${response.costUsd.toFixed(4)}`
      );
    } catch (err: any) {
      console.warn('AI run failed, using fallback heuristic:', err);
    }

    // Default fallback values if AI JSON was incomplete
    const fallbackCategory = niche;
    const fallbackAudience = 'Người tiêu dùng trực tuyến quan tâm đến sản phẩm tiện ích';
    const fallbackPainPoints = [
      'Giải pháp truyền thống tốn kém và bất tiện',
      'Mất thời gian xử lý thủ công hàng ngày',
      'Chất lượng sản phẩm cũ không đảm bảo',
    ];
    const fallbackWow = 'Hiệu quả rõ rệt tức thì trong video minh họa thực tế.';
    const fallbackAngles = [
      'Góc 1: Vấn đề nhức nhối thường gặp',
      'Góc 2: So sánh trước và sau khi sử dụng',
      'Góc 3: Trải nghiệm thực tế của người dùng',
    ];

    const category = aiResult?.category || fallbackCategory;
    const targetAudience = aiResult?.target_audience || fallbackAudience;
    const painPoints = Array.isArray(aiResult?.pain_points) ? aiResult.pain_points : fallbackPainPoints;
    const wowFactor = aiResult?.wow_factor || fallbackWow;
    const angles = Array.isArray(aiResult?.angles) ? aiResult.angles : fallbackAngles;

    // Unit Economics & Financials
    const financials = calculateFinancials({
      supplier_price: candidate.supplier_price,
      shipping_cost: candidate.shipping_cost,
      selling_price: options.sellingPriceOverride,
    });

    // Scoring calculation (combines AI signals + margin economics)
    const demandScore = Number(aiResult?.demand_score) || 85;
    const compScore = Number(aiResult?.competition_score) || 68;
    const creativeScore = Number(aiResult?.creative_score) || 88;
    const probScore = Number(aiResult?.problem_score) || 84;
    const shipScore = Number(aiResult?.shipping_score) || 90;
    const marginScore = Math.min(100, Math.max(30, Math.round(financials.margin_percentage * 1.3)));

    const scoring = calculateProductScore({
      demand: demandScore,
      competition: compScore,
      margin: marginScore,
      creative: creativeScore,
      problem: probScore,
      shipping: shipScore,
    });

    const product: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
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

      // Scores
      demand_score: scoring.demand_score,
      competition_score: scoring.competition_score,
      margin_score: scoring.margin_score,
      creative_score: scoring.creative_score,
      problem_score: scoring.problem_score,
      shipping_score: scoring.shipping_score,
      product_score: scoring.product_score,

      status: 'discovered',
      recommendation: scoring.recommendation,
      recommendation_reason: scoring.recommendation_reason,

      wow_factor: wowFactor,
      target_audience: targetAudience,
      pain_points: painPoints,
      angles,

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    ecomStore.saveProduct(product);
    discoveredProducts.push(product);

    emit(
      'score',
      `🏆 Điểm số sản phẩm #${index}: ${product.product_score}/100 [${product.recommendation === 'TEST' ? '🔥 TEST' : product.recommendation === 'CONSIDER' ? '⚠️ CONSIDER' : '❌ SKIP'}] | Margin: $${product.gross_margin} (${product.margin_percentage}%)`,
      { product }
    );
  }

  // Complete workflow run
  workflowRun.status = 'completed';
  workflowRun.progress = 100;
  workflowRun.completed_at = new Date().toISOString();
  workflowRun.discovered_count = discoveredProducts.length;
  ecomStore.saveWorkflowRun(workflowRun);

  emit(
    'done',
    `🎉 Hoàn thành Stage 01! Đã phân tích và lưu ${discoveredProducts.length} sản phẩm vào cơ sở dữ liệu. Sẵn sàng duyệt (Approve) để chuyển tiếp sang Stage 02.`
  );

  return {
    runId,
    products: discoveredProducts,
  };
}
