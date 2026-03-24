# Task 3.2: Memory System (记忆系统)

## Metadata
| Field | Value |
|-------|-------|
| **Task ID** | TASK-3.2 |
| **Title** | Memory System (记忆系统) |
| **Priority** | P0 |
| **Estimate** | 8 hours |
| **Owner** | @coder |
| **Status** | TODO |
| **Created** | 2026-03-24 |
| **Sprint** | 3 |
| **Dependencies** | TASK-1.2 (Database Schema), TASK-1.3 (pi-mono Integration) |

## Description
Implement a vector-based memory system for AI agents, inspired by AI Town's `convex/agent/memory.ts`. This system stores agent memories as embeddings and provides intelligent retrieval with multi-factor ranking.

## AI Town Reference
**File**: `convex/agent/memory.ts`
**Key Functions**:
- `rememberConversation()` - Store conversation as memory
- `searchMemories()` - Vector search + ranking
- `rankAndTouchMemories()` - Multi-factor ranking

## Architecture

### Memory Types
```typescript
type MemoryType = 'conversation' | 'task' | 'reflection' | 'relationship'

interface Memory {
  id: string
  employeeId: string
  description: string      // 记忆描述 (用于检索)
  embedding: number[]     // 向量嵌入
  importance: number      // 重要性 (0-9, LLM评估)
  lastAccess: number     // 上次访问时间戳
  createdAt: number
  type: MemoryType
  data: {
    // conversation: { conversationId, playerIds[] }
    // task: { taskId, title }
    // reflection: { relatedMemoryIds[] }
    // relationship: { targetEmployeeId }
  }
}
```

### Memory Embedding Table
```sql
CREATE TABLE memory_embeddings (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  embedding BLOB NOT NULL,  -- vector blob
  created_at INTEGER NOT NULL
);

-- Vector index (SQLite vec or pgvector)
CREATE VIRTUAL TABLE memory_embeddings USING vec(
  embedding(768),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);
```

## Core Functions

### 1. Store Memory
```typescript
async function storeMemory(
  employeeId: string,
  description: string,
  type: MemoryType,
  data: object
): Promise<Memory> {
  // 1. Generate embedding
  const { embedding } = await fetchEmbedding(description)
  
  // 2. Calculate importance via LLM
  const importance = await calculateImportance(description)
  
  // 3. Store in DB
  const memory = await db.insert('memories', {
    employeeId,
    description,
    type,
    data,
    importance,
    lastAccess: Date.now(),
    embeddingId: await storeEmbedding(embedding)
  })
  
  return memory
}
```

### 2. Calculate Importance (AI Town 风格)
```typescript
async function calculateImportance(description: string): Promise<number> {
  const { content } = await chatCompletion({
    messages: [{
      role: 'user',
      content: `Rate the importance of this memory (0-9):
Memory: ${description}
0 = mundane (e.g., brushing teeth)
9 = extremely poignant (e.g., break up, college acceptance)
Respond with a single number.`
    }],
    temperature: 0.0,
    max_tokens: 1
  })
  
  return parseFloat(content) || 5  // default to 5
}
```

### 3. Search Memories (核心 - AI Town 排名逻辑)
```typescript
async function searchMemories(
  employeeId: string,
  query: string,
  limit: number = 5
): Promise<Memory[]> {
  // 1. Get query embedding
  const queryEmbedding = await fetchEmbedding(query)
  
  // 2. Vector search candidates
  const candidates = await vectorSearch('memory_embeddings', {
    vector: queryEmbedding,
    filter: { employeeId },
    limit: limit * MEMORY_OVERFETCH  // AI Town uses 10x
  })
  
  // 3. Rank by relevance + importance + recency
  const ranked = await rankMemories(candidates, limit)
  
  return ranked
}

async function rankMemories(candidates, limit) {
  const now = Date.now()
  
  const withScores = candidates.map(c => {
    const memory = c.memory
    const hoursSinceAccess = (now - memory.lastAccess) / 1000 / 60 / 60
    
    // AI Town 排名公式
    const relevanceScore = normalize(c.vectorScore, relevanceRange)
    const importanceScore = normalize(memory.importance, importanceRange)
    const recencyScore = Math.pow(0.99, Math.floor(hoursSinceAccess))
    
    const overallScore = relevanceScore + importanceScore + recencyScore
    
    return { memory, overallScore }
  })
  
  // Sort by overall score descending
  withScores.sort((a, b) => b.overallScore - a.overallScore)
  
  // Update last access (throttled)
  for (const { memory } of withScores.slice(0, limit)) {
    if (memory.lastAccess < now - MEMORY_ACCESS_THROTTLE) {
      await db.patch(memory.id, { lastAccess: now })
    }
  }
  
  return withScores.slice(0, limit).map(s => s.memory)
}
```

### 4. Remember Conversation (AI Town 风格)
```typescript
async function rememberConversation(
  employeeId: string,
  conversationId: string,
  participantIds: string[],
  summary: string  // AI生成的对话摘要
): Promise<Memory> {
  const description = `Conversation with ${participantIds.join(', ')}: ${summary}`
  
  return storeMemory(employeeId, description, 'conversation', {
    conversationId,
    playerIds: participantIds.filter(id => id !== employeeId)
  })
}
```

## API Endpoints

### POST /api/employees/:id/memories
Create a new memory for employee.

### GET /api/employees/:id/memories
Search employee's memories.

**Query Parameters**:
- `q`: Search query
- `type`: Filter by memory type
- `limit`: Max results (default 5)

### DELETE /api/employees/:id/memories/:memoryId
Delete a specific memory.

## Acceptance Criteria
- [ ] Memories stored with embeddings in vector DB
- [ ] Vector search returns relevant memories
- [ ] Ranking considers: relevance + importance + recency
- [ ] Importance calculated via LLM (0-9 scale)
- [ ] Conversation memories auto-generated
- [ ] Memory access timestamps updated (throttled)
- [ ] All memories linked to employee

## Files to Create
```
backend/src/
├── agents/
│   ├── memory/
│   │   ├── index.ts           # Main exports
│   │   ├── store.ts          # storeMemory()
│   │   ├── search.ts         # searchMemories()
│   │   ├── ranking.ts        # rankMemories()
│   │   ├── importance.ts     # calculateImportance()
│   │   └── conversation.ts   # rememberConversation()
│   └── types.ts              # Memory types
```

## Technical Notes
- Use SQLite + sqlite-vec extension OR pgvector for embeddings
- Embedding dimension: 768 (mxbai-embed-large) or 1536 (OpenAI)
- MEMORY_OVERFETCH = 10 (fetch 10x for better ranking)
- MEMORY_ACCESS_THROTTLE = 5 minutes (don't update too frequently)
- Importance threshold for reflection: 500 (sum of recent 100 memories)

## Definition of Done
1. Memory can be stored with auto-generated embedding
2. Vector search returns semantically similar memories
3. Results ranked by overallScore = relevance + importance + recency
4. Conversation creates memory automatically
5. Employee can only see their own memories
