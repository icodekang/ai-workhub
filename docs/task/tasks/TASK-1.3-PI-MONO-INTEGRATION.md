# Task 1.3: pi-mono Integration

## Metadata
| Field | Value |
|-------|-------|
| **Task ID** | TASK-1.3 |
| **Title** | pi-mono Integration |
| **Priority** | P0 |
| **Estimate** | 4 hours |
| **Owner** | @coder |
| **Status** | TODO |
| **Created** | 2026-03-24 |
| **Sprint** | 1 |
| **Dependencies** | TASK-1.1 |

## Description
Integrate pi-mono as the core agent framework, with LLM provider abstraction inspired by AI Town's `convex/util/llm.ts`. Support multiple LLM providers (OpenAI, Ollama, Together.ai, custom).

## AI Town Reference
**File**: `convex/util/llm.ts`
**Key Features**:
- Multi-provider support (OpenAI, Together.ai, Ollama, Custom)
- Chat completion with retry logic
- Embedding generation with batching
- Automatic model pulling (Ollama)

## LLM Provider Configuration

### Provider Interface
```typescript
interface LLMConfig {
  provider: 'openai' | 'together' | 'ollama' | 'custom'
  url: string
  chatModel: string
  embeddingModel: string
  stopWords: string[]
  apiKey?: string
}

interface ChatCompletionOptions {
  messages: LLMMessage[]
  model?: string
  temperature?: number
  max_tokens?: number
  stop?: string | string[]
  stream?: boolean
}

interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}
```

### Environment Variables
```bash
# Primary provider selection
LLM_PROVIDER=ollama  # openai | together | ollama | custom

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002

# Together.ai
TOGETHER_API_KEY=...
TOGETHER_CHAT_MODEL=meta-llama/Llama-3-8b-chat-hf
TOGETHER_EMBEDDING_MODEL=togethercomputer/m2-bert-80M-8k-retrieval

# Ollama (local)
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=llama3
OLLAMA_EMBEDDING_MODEL=mxbai-embed-large

# Custom (any OpenAI-compatible API)
LLM_API_URL=https://your-api.com
LLM_API_KEY=...
LLM_MODEL=your-model
LLM_EMBEDDING_MODEL=your-embedding-model
```

## Core LLM Functions

### 1. Chat Completion
```typescript
// Reference: AI Town convex/util/llm.ts - chatCompletion()
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<{ content: string; retries: number; ms: number }> {
  const config = getLLMConfig()
  
  // Build stop words
  const stopWords = options.stop 
    ? (typeof options.stop === 'string' ? [options.stop] : options.stop)
    : []
  if (config.stopWords) {
    stopWords.push(...config.stopWords)
  }
  
  // Retry with backoff
  const { result: content, retries, ms } = await retryWithBackoff(async () => {
    const response = await fetch(config.url + '/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
      },
      body: JSON.stringify({
        model: options.model ?? config.chatModel,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens,
        stop: stopWords.length ? stopWords : undefined
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw {
        retry: response.status === 429 || response.status >= 500,
        error: new Error(`Chat completion failed: ${response.status}`)
      }
    }
    
    const json = await response.json()
    return json.choices[0].message?.content ?? ''
  })
  
  return { content, retries, ms }
}
```

### 2. Embedding Generation
```typescript
// Reference: AI Town - fetchEmbedding() and fetchEmbeddingBatch()
export async function fetchEmbedding(text: string): Promise<EmbeddingResult> {
  const { embeddings, ...stats } = await fetchEmbeddingBatch([text])
  return { embedding: embeddings[0], ...stats }
}

export async function fetchEmbeddingBatch(
  texts: string[]
): Promise<{ embeddings: number[][]; usage?: number }> {
  const config = getLLMConfig()
  
  if (config.provider === 'ollama') {
    // Ollama has different API
    const embeddings = await Promise.all(
      texts.map(async (text) => {
        const response = await fetch(`${config.url}/api/embeddings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.embeddingModel,
            prompt: text
          })
        })
        const json = await response.json()
        return json.embedding
      })
    )
    return { embeddings }
  }
  
  // OpenAI-compatible API
  const response = await fetch(config.url + '/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
    },
    body: JSON.stringify({
      model: config.embeddingModel,
      input: texts.map(t => t.replace(/\n/g, ' '))
    })
  })
  
  const json = await response.json()
  const embeddings = json.data
    .sort((a, b) => a.index - b.index)
    .map(d => d.embedding)
  
  return {
    embeddings,
    usage: json.usage?.total_tokens
  }
}
```

### 3. Retry with Backoff
```typescript
// Reference: AI Town - retryWithBackoff()
const RETRY_BACKOFF = [1000, 10000, 20000]  // ms

export async function retryWithBackoff<T>(
  fn: () => Promise<T>
): Promise<{ retries: number; result: T; ms: number }> {
  let i = 0
  for (; i <= RETRY_BACKOFF.length; i++) {
    try {
      const start = Date.now()
      const result = await fn()
      return { retries: i, result, ms: Date.now() - start }
    } catch (error: any) {
      if (i === RETRY_BACKOFF.length || !error?.retry) {
        throw error
      }
      await sleep(RETRY_BACKOFF[i] + Math.random() * 100)
    }
  }
  throw new Error('Should not reach here')
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

## pi-mono Agent Integration

### Agent Interface
```typescript
// Basic agent interface that pi-mono will manage
interface AIAgent {
  id: string
  employeeId: string
  identity: string        // "我是Alice，后端工程师"
  plan: string           // "当前目标：完成API文档"
  model: string
  temperature: number
  
  // Methods
  chat(messages: LLMMessage[]): Promise<string>
  generateEmbedding(text: string): Promise<number[]>
}

// Agent registry
class AgentRegistry {
  private agents: Map<string, AIAgent> = new Map()
  
  register(agent: AIAgent): void
  get(id: string): AIAgent | undefined
  list(): AIAgent[]
  remove(id: string): void
}
```

## Implementation Steps

### Step 1: Install Dependencies
```bash
npm install pi-mono
# For vector search, you'll need:
npm install better-sqlite3  # or pgvector for PostgreSQL
```

### Step 2: Create LLM Configuration
```typescript
// backend/src/core/llm/config.ts
export function getLLMConfig(): LLMConfig {
  // Implementation based on env vars
}
```

### Step 3: Create LLM Service
```typescript
// backend/src/core/llm/chat.ts
export async function chatCompletion(options): Promise<ChatResult>

// backend/src/core/llm/embedding.ts
export async function fetchEmbedding(text: string): Promise<number[]>
```

### Step 4: Create pi-mono Agent Wrapper
```typescript
// backend/src/agents/pi-mono/agent.ts
import { Agent } from 'pi-mono'

export class PImonoAgent implements AIAgent {
  constructor(config: AgentConfig) {
    // Initialize pi-mono agent
  }
  
  async chat(messages: LLMMessage[]): Promise<string> {
    // Use chatCompletion
  }
  
  async generateEmbedding(text: string): Promise<number[]> {
    // Use fetchEmbedding
  }
}
```

## Acceptance Criteria
- [ ] Supports OpenAI, Ollama, Together.ai providers
- [ ] Chat completion with retry logic
- [ ] Embedding generation (single and batch)
- [ ] Environment-based configuration
- [ ] pi-mono agent wrapper created
- [ ] Agent registry implemented
- [ ] Stop words support for conversation control

## Files to Create
```
backend/src/
├── core/
│   ├── llm/
│   │   ├── config.ts       # getLLMConfig()
│   │   ├── chat.ts         # chatCompletion()
│   │   ├── embedding.ts     # fetchEmbedding(), fetchEmbeddingBatch()
│   │   ├── retry.ts        # retryWithBackoff()
│   │   └── types.ts        # LLM types
│   └── agent-config.ts     # Agent configuration
├── agents/
│   ├── pi-mono/
│   │   ├── agent.ts        # PImonoAgent class
│   │   └── registry.ts     # AgentRegistry
│   └── types.ts            # Agent types
└── index.ts                 # Export LLM functions
```

## Definition of Done
1. `chatCompletion()` works with all configured providers
2. `fetchEmbedding()` generates vectors for memory storage
3. Retry logic handles 429 and 5xx errors
4. pi-mono agents can be created and managed
5. Agent registry provides access to all agents
6. Configuration via environment variables works
