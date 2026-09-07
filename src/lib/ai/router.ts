import { AIProvider, AIRequest, AIResponse, AITaskType } from "./types";
import { GeminiProvider } from "./providers/gemini";
import { ClaudeProvider } from "./providers/claude";
import { OpenAIProvider } from "./providers/openai";
import { MockProvider } from "./providers/mock";

export class AIRouter {
  private gemini = new GeminiProvider();
  private claude = new ClaudeProvider();
  private openai = new OpenAIProvider();
  private mock = new MockProvider();

  getActiveProviders() {
    return {
      gemini: {
        available: this.gemini.isAvailable(),
        model: this.gemini.defaultModel,
        tier: "Free Developer Tier ($0.00)",
      },
      claude: {
        available: this.claude.isAvailable(),
        model: this.claude.defaultModel,
        tier: "Paid Pay-as-you-go",
      },
      openai: {
        available: this.openai.isAvailable(),
        model: this.openai.defaultModel,
        tier: "Paid Pay-as-you-go",
      },
      mock: {
        available: true,
        model: this.mock.defaultModel,
        tier: "Offline Simulation",
      },
    };
  }

  selectProvider(task: AITaskType): AIProvider {
    // 1. Routine classification, extraction, and initial scoring default to Gemini Flash ($0.00)
    if (
      task === "product_classification" ||
      task === "product_scoring" ||
      task === "market_extraction"
    ) {
      if (this.gemini.isAvailable()) return this.gemini;
      if (this.openai.isAvailable()) return this.openai;
      if (this.claude.isAvailable()) return this.claude;
      return this.mock;
    }

    // 2. High reasoning tasks (ad copy, strategic positioning, competitor analysis) prefer Claude / Gemini
    if (
      task === "ad_copy" ||
      task === "strategic_reasoning" ||
      task === "competitor_analysis"
    ) {
      if (this.claude.isAvailable()) return this.claude;
      if (this.gemini.isAvailable()) return this.gemini;
      if (this.openai.isAvailable()) return this.openai;
      return this.mock;
    }

    // Default general task: prioritize Gemini Flash for speed & cost savings
    if (this.gemini.isAvailable()) return this.gemini;
    if (this.openai.isAvailable()) return this.openai;
    if (this.claude.isAvailable()) return this.claude;
    return this.mock;
  }

  private getAgentTitleByTask(task: AITaskType): string {
    switch (task) {
      case "product_classification":
        return "Product Discovery Classifier";
      case "product_scoring":
        return "6-Factor Product Scorer";
      case "market_extraction":
        return "Market Review & Trend Extractor";
      case "competitor_analysis":
        return "Competitor Outpositioning Analyst";
      case "ad_copy":
        return "Creative Studio Copywriter";
      case "strategic_reasoning":
        return "Offer & Guarantee Architect";
      case "general_chat":
        return "AI Workflow Assistant";
      default:
        return "AI Worker";
    }
  }

  async run<T = any>(request: AIRequest): Promise<AIResponse<T>> {
    const provider = this.selectProvider(request.task);
    let response: AIResponse<T> | undefined;
    const chain = [
      ...new Set([provider, this.gemini, this.openai, this.claude, this.mock]),
    ];
    for (const candidate of chain) {
      if (!candidate.isAvailable()) continue;
      try {
        const result = await candidate.generate<T>(request);
        if (
          request.jsonMode &&
          (result.data === undefined || result.data === null)
        ) {
          throw new Error(
            "Provider không trả JSON hợp lệ hoặc response bị cắt.",
          );
        }
        result.isFallback = candidate !== provider || candidate.name === "mock";
        if (result.isFallback)
          result.fallbackWarning = `Sử dụng ${candidate.name}; mock là dữ liệu mô phỏng, không phải bằng chứng thực tế.`;
        response = result;
        break;
      } catch (error) {
        console.warn(
          `Provider ${candidate.name} failed for ${request.task}`,
          error,
        );
      }
    }
    if (!response) throw new Error("Không provider nào trả kết quả hợp lệ.");

    // Auto-record token usage and cost for complete worker audit
    if (!request.skipAutoLog) {
      try {
        const { ecomStore } = await import("../db/store");
        ecomStore.addAgentRun({
          id: `agent_run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          workflow_run_id: request.workflowRunId,
          agent: request.agentName || this.getAgentTitleByTask(request.task),
          provider: response.provider,
          model: response.model,
          task: request.task,
          input_tokens: response.usage.inputTokens,
          output_tokens: response.usage.outputTokens,
          total_tokens: response.usage.totalTokens,
          cost_usd: response.costUsd,
          latency_ms: response.latencyMs,
          created_at: new Date().toISOString(),
        });
      } catch (logErr) {
        console.warn("Failed to auto-log agent run:", logErr);
      }
    }

    return response;
  }
}

export const aiRouter = new AIRouter();
