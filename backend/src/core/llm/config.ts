/**
 * LLM Configuration
 * Loads configuration from environment variables based on selected provider.
 */

import { LLMConfig, LLMProviderType } from './types';

// Environment variable helpers
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

// Provider-specific URL and API key loaders
function loadOpenAIConfig(): Pick<LLMConfig, 'url' | 'apiKey' | 'chatModel' | 'embeddingModel'> {
  return {
    url: optionalEnv('OPENAI_BASE_URL', 'https://api.openai.com'),
    apiKey: requiredEnv('OPENAI_API_KEY'),
    chatModel: optionalEnv('OPENAI_CHAT_MODEL', 'gpt-4o-mini'),
    embeddingModel: optionalEnv('OPENAI_EMBEDDING_MODEL', 'text-embedding-ada-002'),
  };
}

function loadTogetherConfig(): Pick<LLMConfig, 'url' | 'apiKey' | 'chatModel' | 'embeddingModel'> {
  return {
    url: 'https://api.together.xyz',
    apiKey: requiredEnv('TOGETHER_API_KEY'),
    chatModel: optionalEnv('TOGETHER_CHAT_MODEL', 'meta-llama/Llama-3-8b-chat-hf'),
    embeddingModel: optionalEnv('TOGETHER_EMBEDDING_MODEL', 'togethercomputer/m2-bert-80M-8k-retrieval'),
  };
}

function loadOllamaConfig(): Pick<LLMConfig, 'url' | 'apiKey' | 'chatModel' | 'embeddingModel'> {
  return {
    url: optionalEnv('OLLAMA_HOST', 'http://127.0.0.1:11434'),
    apiKey: undefined, // Ollama doesn't use API keys
    chatModel: optionalEnv('OLLAMA_MODEL', 'llama3'),
    embeddingModel: optionalEnv('OLLAMA_EMBEDDING_MODEL', 'mxbai-embed-large'),
  };
}

function loadCustomConfig(): Pick<LLMConfig, 'url' | 'apiKey' | 'chatModel' | 'embeddingModel'> {
  return {
    url: requiredEnv('LLM_API_URL'),
    apiKey: process.env.LLM_API_KEY ?? undefined,
    chatModel: optionalEnv('LLM_MODEL', 'gpt-4o-mini'),
    embeddingModel: optionalEnv('LLM_EMBEDDING_MODEL', 'text-embedding-ada-002'),
  };
}

/**
 * Get the current LLM configuration based on environment variables.
 * Call this at startup or when config needs to be refreshed.
 */
export function getLLMConfig(): LLMConfig {
  const provider = (optionalEnv('LLM_PROVIDER', 'ollama') as LLMProviderType);

  const providerConfig = (() => {
    switch (provider) {
      case 'openai':
        return loadOpenAIConfig();
      case 'together':
        return loadTogetherConfig();
      case 'ollama':
        return loadOllamaConfig();
      case 'custom':
        return loadCustomConfig();
      default:
        throw new Error(`Unknown LLM provider: ${provider}`);
    }
  })();

  // Parse optional stop words from env
  const stopWordsEnv = optionalEnv('LLM_STOP_WORDS', '');
  const stopWords = stopWordsEnv
    ? stopWordsEnv.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return {
    provider,
    stopWords,
    ...providerConfig,
  };
}

/**
 * Validate that the LLM configuration is usable (checks required fields).
 */
export function validateLLMConfig(config: LLMConfig): void {
  if (!config.url) throw new Error('LLM config missing url');
  if (!config.chatModel) throw new Error('LLM config missing chatModel');
  if (config.provider !== 'ollama' && !config.apiKey) {
    console.warn(`[LLM] Warning: No API key for provider ${config.provider}`);
  }
}
