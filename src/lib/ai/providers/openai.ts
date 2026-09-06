import { AIProvider, AIRequest, AIResponse } from '../types';

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai' as const;
  readonly defaultModel = 'gpt-4o-mini';

  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  async generate<T = any>(request: AIRequest): Promise<AIResponse<T>> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured (OPENAI_API_KEY).');
    }

    const startTime = Date.now();
    const model = this.defaultModel;

    const messages: any[] = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push({ role: 'user', content: request.prompt });

    const body: any = {
      model,
      temperature: request.temperature ?? 0.5,
      messages,
    };

    if (request.maxTokens) {
      body.max_tokens = request.maxTokens;
    }

    if (request.jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const result = await response.json();
    const latencyMs = Date.now() - startTime;
    const text = result.choices?.[0]?.message?.content || '';

    const inputTokens = result.usage?.prompt_tokens ?? 0;
    const outputTokens = result.usage?.completion_tokens ?? 0;

    // GPT-4o-mini: $0.15 / MTok in, $0.60 / MTok out
    const costUsd = Number(((inputTokens * 0.15 + outputTokens * 0.60) / 1_000_000).toFixed(5));

    let data: T | undefined = undefined;
    if (request.jsonMode) {
      try {
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        data = JSON.parse(cleaned) as T;
      } catch (e) {
        console.error('Failed to parse OpenAI JSON output:', text);
      }
    }

    return {
      provider: 'openai',
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
