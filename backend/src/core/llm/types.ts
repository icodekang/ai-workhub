/**
 * LLM Types for AI-WorkHub
 * Supports: OpenAI, Ollama, Together.ai, and custom OpenAI-compatible providers
 */

// Provider types
export type LLMProviderType = 'openai' | 'together' | 'ollama' | 'custom';

// LLM Configuration interface
export interface LLMConfig {
  provider: LLMProviderType;
  url: string;
  chatModel: string;
  embeddingModel: string;
  stopWords: string[];
  apiKey?: string;
}

// Chat message structure
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Chat completion options
export interface ChatCompletionOptions {
  messages: LLMMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stop?: string | string[];
  stream?: boolean;
}

// Chat completion result
export interface ChatCompletionResult {
  content: string;
  retries: number;
  ms: number;
}

// Embedding result
export interface EmbeddingResult {
  embedding: number[];
  usage?: number;
  retries?: number;
  ms?: number;
}

// Batch embedding result
export interface BatchEmbeddingResult {
  embeddings: number[][];
  usage?: number;
}

// Agent configuration interface
export interface AgentConfig {
  id: string;
  employeeId: string;
  identity: string;
  plan: string;
  model: string;
  temperature: number;
}

// AIAgent interface - the contract all agents must implement
export interface AIAgent {
  id: string;
  employeeId: string;
  identity: string;
  plan: string;
  model: string;
  temperature: number;

  chat(messages: LLMMessage[]): Promise<string>;
  generateEmbedding(text: string): Promise<number[]>;
}
