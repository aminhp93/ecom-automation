export type AITaskType =
  | 'product_classification'
  | 'product_scoring'
  | 'market_extraction'
  | 'competitor_analysis'
  | 'ad_copy'
  | 'strategic_reasoning'
  | 'general_chat';

export interface AITokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface AIRequest {
  task: AITaskType;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  agentName?: string;
  workflowRunId?: string;
  skipAutoLog?: boolean;
}

export interface AIResponse<T = any> {
  provider: 'gemini' | 'claude' | 'openai' | 'mock';
  model: string;
  content: string;
  data?: T;
  usage: AITokenUsage;
  costUsd: number;
  latencyMs: number;
  isFallback?: boolean;
  fallbackWarning?: string;
}

export interface AIProvider {
  readonly name: 'gemini' | 'claude' | 'openai' | 'mock';
  readonly defaultModel: string;
  isAvailable(): boolean;
  generate<T = any>(request: AIRequest): Promise<AIResponse<T>>;
}
