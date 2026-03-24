/**
 * LLM Embedding Service
 * Reference: AI Town convex/util/llm.ts - fetchEmbedding() / fetchEmbeddingBatch()
 */

import { getLLMConfig, validateLLMConfig } from './config';
import { retryWithBackoff } from './retry';
import { EmbeddingResult, BatchEmbeddingResult, LLMConfig } from './types';

interface RetryableError extends Error {
  retry?: boolean;
}

/**
 * Request embeddings from an OpenAI-compatible API (including Together.ai).
 */
async function requestOpenAICompatEmbedding(
  config: LLMConfig,
  texts: string[],
): Promise<BatchEmbeddingResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(`${config.url}/v1/embeddings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.embeddingModel,
      input: texts.map((t) => t.replace(/\n/g, ' ')),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    const retryable = response.status === 429 || response.status >= 500;
    const err: RetryableError = new Error(
      `Embedding request failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
    err.retry = retryable;
    throw err;
  }

  const json = (await response.json()) as {
    data: Array<{ embedding: number[]; index: number }>;
    usage?: { total_tokens?: number };
  };

  const embeddings = json.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);

  return {
    embeddings,
    usage: json.usage?.total_tokens,
  };
}

/**
 * Request embeddings from Ollama's /api/embeddings endpoint.
 */
async function requestOllamaEmbedding(
  config: LLMConfig,
  texts: string[],
): Promise<BatchEmbeddingResult> {
  const results: number[][] = await Promise.all(
    texts.map(async (text) => {
      const response = await fetch(`${config.url}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.embeddingModel,
          prompt: text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        const retryable = response.status === 429 || response.status >= 500;
        const err: RetryableError = new Error(
          `Ollama embedding failed: ${response.status} - ${errorText}`,
        );
        err.retry = retryable;
        throw err;
      }

      const json = (await response.json()) as { embedding?: number[] };
      if (!json.embedding) throw new Error('No embedding returned from Ollama');
      return json.embedding as number[];
    }),
  );

  return { embeddings: results };
}

/**
 * Fetch embeddings for a batch of texts.
 */
export async function fetchEmbeddingBatch(
  texts: string[],
  configOverride?: LLMConfig,
): Promise<BatchEmbeddingResult> {
  const config = configOverride ?? getLLMConfig();
  validateLLMConfig(config);

  const { result, retries: _retries, ms: _ms } = await retryWithBackoff(async () => {
    if (config.provider === 'ollama') {
      return requestOllamaEmbedding(config, texts);
    }
    return requestOpenAICompatEmbedding(config, texts);
  });

  return result;
}

/**
 * Fetch embedding for a single text.
 */
export async function fetchEmbedding(
  text: string,
  configOverride?: LLMConfig,
): Promise<EmbeddingResult> {
  const { embeddings, usage } = await fetchEmbeddingBatch([text], configOverride);
  return {
    embedding: embeddings[0],
    usage,
  };
}
