/**
 * LLM Chat Completion Service
 * Reference: AI Town convex/util/llm.ts - chatCompletion()
 */

import { getLLMConfig, validateLLMConfig } from './config';
import { retryWithBackoff } from './retry';
import {
  ChatCompletionOptions,
  ChatCompletionResult,
  LLMConfig,
  LLMMessage,
} from './types';

interface RetryableError extends Error {
  retry?: boolean;
}

/**
 * Build the complete list of stop words from config + options.
 */
function buildStopWords(config: LLMConfig, options: ChatCompletionOptions): string[] {
  const stopWords: string[] = [];

  if (options.stop) {
    stopWords.push(...(typeof options.stop === 'string' ? [options.stop] : options.stop));
  }

  if (config.stopWords?.length) {
    stopWords.push(...config.stopWords);
  }

  return stopWords;
}

/**
 * Perform a single chat completion request to an OpenAI-compatible API.
 */
async function requestChatCompletion(
  config: LLMConfig,
  options: ChatCompletionOptions,
): Promise<string> {
  const stopWords = buildStopWords(config, options);
  const model = options.model ?? config.chatModel;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const body: Record<string, unknown> = {
    model,
    messages: options.messages,
    temperature: options.temperature ?? 0.7,
  };

  if (options.max_tokens !== undefined) {
    body['max_tokens'] = options.max_tokens;
  }
  if (stopWords.length > 0) {
    body['stop'] = stopWords;
  }

  // Determine the correct endpoint
  let endpoint: string;
  if (config.provider === 'ollama') {
    // Ollama uses /api/chat instead of /v1/chat/completions
    endpoint = `${config.url}/api/chat`;
    // Ollama uses 'model' at top level, messages same structure
    body['model'] = model;
  } else {
    endpoint = `${config.url}/v1/chat/completions`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    const retryable =
      response.status === 429 ||
      response.status >= 500;
    const err: RetryableError = new Error(
      `Chat completion failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
    err.retry = retryable;
    throw err;
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = json.choices?.[0]?.message?.content ?? '';
  return content;
}

/**
 * Send a chat completion request with automatic retry on rate limit / server errors.
 *
 * @param options - Chat completion options
 * @param configOverride - Optional config override (defaults to env-based config)
 * @returns ChatCompletionResult with content and metrics
 */
export async function chatCompletion(
  options: ChatCompletionOptions,
  configOverride?: LLMConfig,
): Promise<ChatCompletionResult> {
  const config = configOverride ?? getLLMConfig();
  validateLLMConfig(config);

  const { result: content, retries, ms } = await retryWithBackoff(async () => {
    return requestChatCompletion(config, options);
  });

  return { content, retries, ms };
}

/**
 * Simple chat helper that just returns the content string.
 */
export async function chat(
  messages: LLMMessage[],
  options?: Partial<ChatCompletionOptions>,
): Promise<string> {
  const result = await chatCompletion({ messages, ...options });
  return result.content;
}
