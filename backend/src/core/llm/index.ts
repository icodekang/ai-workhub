/**
 * LLM Module - Core AI/ML capabilities
 *
 * Exports:
 * - getLLMConfig() - Load LLM configuration from environment
 * - chatCompletion() - Chat completion with retry logic
 * - chat() - Simple chat helper
 * - fetchEmbedding() - Single embedding
 * - fetchEmbeddingBatch() - Batch embeddings
 * - retryWithBackoff() - Generic retry utility
 */

export { getLLMConfig, validateLLMConfig } from './config';
export { chatCompletion, chat } from './chat';
export { fetchEmbedding, fetchEmbeddingBatch } from './embedding';
export { retryWithBackoff } from './retry';

// Re-export all types
export * from './types';
