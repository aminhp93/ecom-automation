import { GoogleGenAI } from '@google/genai';
import { AIProvider, AIRequest, AIResponse } from '../types';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini' as const;
  readonly defaultModel = 'gemini-3.6-flash';
  private client: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey });
      } catch (err) {
        console.warn('Failed to initialize Gemini client:', err);
      }
    }
  }

  isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY && !!this.client;
  }

  async generate<T = any>(request: AIRequest): Promise<AIResponse<T>> {
    if (!this.client) {
      throw new Error('Gemini API key is not configured in environment (GEMINI_API_KEY).');
    }

    const startTime = Date.now();
    const model = this.defaultModel;

    const config: Record<string, any> = {
      temperature: request.temperature ?? 0.4,
    };

    if (request.systemPrompt) {
      config.systemInstruction = request.systemPrompt;
    }

    if (request.jsonMode) {
      config.responseMimeType = 'application/json';
    }

    if (request.maxTokens) {
      config.maxOutputTokens = request.maxTokens;
    }

    try {
      const response = await this.client.models.generateContent({
        model,
        contents: request.prompt,
        config,
      });

      const latencyMs = Date.now() - startTime;
      const text = response.text || '';
      const usageMetadata = response.usageMetadata;

      const inputTokens = usageMetadata?.promptTokenCount ?? 0;
      const outputTokens = usageMetadata?.candidatesTokenCount ?? 0;
      const totalTokens = usageMetadata?.totalTokenCount ?? (inputTokens + outputTokens);

      let data: T | undefined = undefined;
      if (request.jsonMode) {
        try {
          const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          data = JSON.parse(cleaned) as T;
        } catch (e) {
          console.error('Failed to parse Gemini JSON output:', text);
        }
      }

      // Gemini developer tier is $0.00 within free limits
      return {
        provider: 'gemini',
        model,
        content: text,
        data,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens,
        },
        costUsd: 0.0, // Free tier
        latencyMs,
      };
    } catch (error: any) {
      console.error('Gemini generate error:', error);
      throw error;
    }
  }
}
