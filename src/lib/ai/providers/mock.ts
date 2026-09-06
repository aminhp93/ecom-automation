import { AIProvider, AIRequest, AIResponse } from '../types';

export class MockProvider implements AIProvider {
  readonly name = 'mock' as const;
  readonly defaultModel = 'local-simulation-v1';

  isAvailable(): boolean {
    return true;
  }

  async generate<T = any>(request: AIRequest): Promise<AIResponse<T>> {
    const latencyMs = 250;
    await new Promise((r) => setTimeout(r, latencyMs));

    let content = 'Phân tích sản phẩm thành công.';
    let data: any = undefined;

    if (request.task === 'product_classification') {
      data = {
        category: 'Baby Care & Safety',
        target_audience: 'New mothers & fathers (infants 3-18 months)',
        pain_points: [
          'Messy food drool causing rash',
          'Sore gums while teething making babies cry at night',
          'Choking hazards with regular chew toys',
        ],
        wow_factor: 'Self-cooling textured surface soothes inflamed gums instantly in 30 seconds',
        angles: [
          'Problem: Sleepless nights from teething distress',
          'Before/After: Fussy screaming baby vs happily self-soothing',
          'Demonstration: Safe food-grade silicone freezing test',
        ],
      };
      content = JSON.stringify(data, null, 2);
    } else if (request.task === 'product_scoring') {
      data = {
        demand_score: 88,
        competition_score: 64,
        margin_score: 92,
        creative_score: 90,
        problem_score: 86,
        shipping_score: 82,
        recommendation: 'TEST',
        reason: 'Strong visual problem-solving angle, 74% gross margin, active TikTok momentum',
      };
      content = JSON.stringify(data, null, 2);
    } else {
      content = 'Phản hồi từ AI OS: Tác vụ đã được phân tích theo các tiêu chuẩn Dropshipping.';
    }

    return {
      provider: 'mock',
      model: this.defaultModel,
      content,
      data: data as T,
      usage: {
        inputTokens: 250,
        outputTokens: 180,
        totalTokens: 430,
      },
      costUsd: 0.0,
      latencyMs,
    };
  }
}
