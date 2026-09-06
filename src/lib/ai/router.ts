import { AIProvider, AIRequest, AIResponse, AITaskType } from './types';
import { GeminiProvider } from './providers/gemini';
import { ClaudeProvider } from './providers/claude';
import { OpenAIProvider } from './providers/openai';
import { MockProvider } from './providers/mock';

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
        tier: 'Free Developer Tier ($0.00)',
      },
      claude: {
        available: this.claude.isAvailable(),
        model: this.claude.defaultModel,
        tier: 'Paid Pay-as-you-go',
      },
      openai: {
        available: this.openai.isAvailable(),
        model: this.openai.defaultModel,
        tier: 'Paid Pay-as-you-go',
      },
      mock: {
        available: true,
        model: this.mock.defaultModel,
        tier: 'Offline Simulation',
      },
    };
  }

  selectProvider(task: AITaskType): AIProvider {
    // 1. Routine classification, extraction, and initial scoring default to Gemini Flash ($0.00)
    if (
      task === 'product_classification' ||
      task === 'product_scoring' ||
      task === 'market_extraction'
    ) {
      if (this.gemini.isAvailable()) return this.gemini;
      if (this.openai.isAvailable()) return this.openai;
      if (this.claude.isAvailable()) return this.claude;
      return this.mock;
    }

    // 2. High reasoning tasks (ad copy, strategic positioning) prefer Claude
    if (task === 'ad_copy' || task === 'strategic_reasoning') {
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

  async run<T = any>(request: AIRequest): Promise<AIResponse<T>> {
    const provider = this.selectProvider(request.task);
    try {
      return await provider.generate<T>(request);
    } catch (err) {
      console.warn(`Provider ${provider.name} failed for task ${request.task}, falling back...`, err);
      // Fallback chain
      if (provider.name !== 'gemini' && this.gemini.isAvailable()) {
        return await this.gemini.generate<T>(request);
      }
      if (provider.name !== 'openai' && this.openai.isAvailable()) {
        return await this.openai.generate<T>(request);
      }
      return await this.mock.generate<T>(request);
    }
  }
}

export const aiRouter = new AIRouter();
