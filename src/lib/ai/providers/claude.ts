import { AIProvider, AIRequest, AIResponse } from '../types';

export class ClaudeProvider implements AIProvider {
  readonly name = 'claude' as const;
  readonly defaultModel = 'claude-sonnet-4-5-20250929';

  isAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  async generate<T = any>(request: AIRequest): Promise<AIResponse<T>> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API key is not configured (ANTHROPIC_API_KEY).');
    }

    const startTime = Date.now();
    const model = this.defaultModel;

    const messages = [{ role: 'user', content: request.prompt }];
    const body: any = {
      model,
      max_tokens: request.maxTokens || 2048,
      temperature: request.temperature ?? 0.5,
      messages,
    };

    if (request.systemPrompt) {
      body.system = request.systemPrompt;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API error (${response.status}): ${errText}`);
    }

    const result = await response.json();
    const latencyMs = Date.now() - startTime;
    const text = result.content?.[0]?.text || '';

    const inputTokens = result.usage?.input_tokens ?? 0;
    const outputTokens = result.usage?.output_tokens ?? 0;

    // Claude 3.5 Sonnet: $3 / MTok in, $15 / MTok out
    const costUsd = Number(((inputTokens * 3 + outputTokens * 15) / 1_000_000).toFixed(4));

    let data: T | undefined = undefined;
    if (request.jsonMode) {
      try {
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        data = JSON.parse(cleaned) as T;
      } catch (e) {
        console.error('Failed to parse Claude JSON output:', text);
      }
    }

    return {
      provider: 'claude',
      model,
      content: text,
      data,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      costUsd,
      latencyMs,
    };
  }
}
