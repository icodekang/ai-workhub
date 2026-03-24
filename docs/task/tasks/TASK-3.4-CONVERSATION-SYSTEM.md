# Task 3.4: Conversation System (对话系统)

## Metadata
| Field | Value |
|-------|-------|
| **Task ID** | TASK-3.4 |
| **Title** | Conversation System (对话系统) |
| **Priority** | P0 |
| **Estimate** | 8 hours |
| **Owner** | @coder |
| **Status** | TODO |
| **Created** | 2026-03-24 |
| **Sprint** | 3 |
| **Dependencies** | TASK-3.1 (Agent Management), TASK-3.2 (Memory System) |

## Description
Implement inter-agent communication system, inspired by AI Town's `convex/agent/conversation.ts`. Agents can initiate conversations, exchange messages, and generate context-aware responses.

## AI Town Reference
**File**: `convex/agent/conversation.ts`
**Key Functions**:
- `startConversationMessage()` - Generate opening greeting
- `continueConversationMessage()` - Continue existing conversation
- `leaveConversationMessage()` - Generate farewell message

## Architecture

### Conversation Types
```typescript
type ConversationType = 'direct' | 'team'

interface Conversation {
  id: string
  type: ConversationType
  participants: string[]        // employee IDs
  teamId?: string               // for team conversations
  status: 'active' | 'ended'
  createdAt: number
  endedAt?: number
}

interface Message {
  id: string
  conversationId: string
  senderId: string              // employee ID or 'user'
  senderType: 'agent' | 'user'
  content: string
  createdAt: number
}
```

## Core Functions

### 1. Start Conversation (发起对话)
```typescript
async function startConversationMessage(
  initiatorId: string,        // 发起者
  recipientId: string         // 接收者
): Promise<string> {
  // 1. Get both agents' data
  const initiator = await getAgentData(initiatorId)
  const recipient = await getAgentData(recipientId)
  
  // 2. Get related memories
  const embedding = await fetchEmbedding(
    `${initiator.name} is talking to ${recipient.name}`
  )
  const memories = await searchMemories(initiatorId, embedding, NUM_MEMORIES_TO_SEARCH)
  
  // 3. Check for previous conversation
  const lastConversation = await getLastConversation(initiatorId, recipientId)
  
  // 4. Build prompt (AI Town style)
  const prompt = [
    `You are ${initiator.name}, and you just started a conversation with ${recipient.name}.`,
    ...agentPrompts(recipient, initiator, recipient),
    ...previousConversationPrompt(recipient, lastConversation),
    ...relatedMemoriesPrompt(memories),
  ]
  
  if (memories.find(m => m.type === 'conversation' && m.data.playerIds.includes(recipientId))) {
    prompt.push(`Be sure to include some detail or question about a previous conversation.`)
  }
  
  prompt.push(`${initiator.name} to ${recipient.name}:`)
  
  // 5. Generate response
  const { content } = await chatCompletion({
    messages: [{ role: 'system', content: prompt.join('\n') }],
    max_tokens: 300,
    stop: stopWords(recipient.name, initiator.name)
  })
  
  return trimContentPrefix(content, `${initiator.name} to ${recipient.name}:`)
}
```

### 2. Continue Conversation (继续对话)
```typescript
async function continueConversationMessage(
  conversationId: string,
  speakerId: string
): Promise<string> {
  // 1. Get conversation and participants
  const conversation = await getConversation(conversationId)
  const otherParticipantId = conversation.participants.find(p => p !== speakerId)
  
  const speaker = await getAgentData(speakerId)
  const other = await getAgentData(otherParticipantId)
  
  // 2. Get memories related to the other person
  const embedding = await fetchEmbedding(`What do you think about ${other.name}?`)
  const memories = await searchMemories(speakerId, embedding, 3)
  
  // 3. Get conversation history
  const messages = await getMessages(conversationId)
  
  // 4. Build prompt
  const now = Date.now()
  const started = new Date(conversation.createdAt)
  
  const prompt = [
    `You are ${speaker.name}, and you're currently in a conversation with ${other.name}.`,
    `The conversation started at ${started.toLocaleString()}. It's now ${now.toLocaleString()}.`,
    ...agentPrompts(other, speaker, other),
    ...relatedMemoriesPrompt(memories),
    `Below is the current chat history.`,
    `DO NOT greet them again. Your response should be brief and within 200 characters.`
  ]
  
  // 5. Build message history for LLM
  const llmMessages = [{ role: 'system', content: prompt.join('\n') }]
  
  for (const msg of messages) {
    const author = msg.senderId === speakerId ? speaker : other
    const recipient = msg.senderId === speakerId ? other : speaker
    llmMessages.push({
      role: 'user',
      content: `${author.name} to ${recipient.name}: ${msg.content}`
    })
  }
  
  llmMessages.push({ role: 'user', content: `${speaker.name} to ${other.name}:` })
  
  // 6. Generate response
  const { content } = await chatCompletion({
    messages: llmMessages,
    max_tokens: 300,
    stop: stopWords(other.name, speaker.name)
  })
  
  return trimContentPrefix(content, `${speaker.name} to ${other.name}:`)
}
```

### 3. Leave Conversation (离开对话)
```typescript
async function leaveConversationMessage(
  conversationId: string,
  leaverId: string
): Promise<string> {
  const conversation = await getConversation(conversationId)
  const otherId = conversation.participants.find(p => p !== leaverId)
  
  const leaver = await getAgentData(leaverId)
  const other = await getAgentData(otherId)
  
  const prompt = [
    `You are ${leaver.name}, and you're currently in a conversation with ${other.name}.`,
    `You've decided to leave the conversation and would like to politely say goodbye.`,
    ...agentPrompts(other, leaver, other),
    `How would you like to tell them that you're leaving? Brief, within 200 characters.`
  ]
  
  // Similar to continueConversation but with farewell context
  // ...
}
```

### 4. Helper: Build Prompts
```typescript
function agentPrompts(
  otherPlayer: { name: string },
  agent: { identity: string; plan: string } | null,
  otherAgent: { identity: string; plan: string } | null
): string[] {
  const prompt = []
  if (agent) {
    prompt.push(`About you: ${agent.identity}`)
    prompt.push(`Your goals: ${agent.plan}`)
  }
  if (otherAgent) {
    prompt.push(`About ${otherPlayer.name}: ${otherAgent.identity}`)
  }
  return prompt
}

function previousConversationPrompt(
  other: { name: string },
  conversation: { created: number } | null
): string[] {
  if (!conversation) return []
  
  const prev = new Date(conversation.created)
  const now = new Date()
  
  return [
    `Last time you chatted with ${other.name} it was ${prev.toLocaleString()}. It's now ${now.toLocaleString()}.`
  ]
}

function relatedMemoriesPrompt(memories: Memory[]): string[] {
  if (!memories.length) return []
  
  const prompt = ['Here are some related memories in decreasing relevance order:']
  for (const memory of memories) {
    prompt.push(` - ${memory.description}`)
  }
  return prompt
}

function stopWords(otherName: string, myName: string): string[] {
  // Prevent LLM from speaking as the other person
  return [
    `${otherName} to ${myName}:`,
    `${otherName.toLowerCase()} to ${myName.toLowerCase()}:`
  ]
}
```

## API Endpoints

### POST /api/conversations
Start a new conversation between two employees.
```json
{
  "type": "direct",
  "participants": ["emp_1", "emp_2"]
}
```

### POST /api/conversations/:id/messages
Send a message in a conversation.

```json
{
  "senderId": "emp_1",
  "content": "Hey, can you help me with the API docs?"
}
```

### GET /api/conversations/:id/messages
Get conversation messages.

### POST /api/conversations/:id/continue
Agent continues the conversation (auto-generate response).
```json
{
  "speakerId": "emp_2"
}
```

### POST /api/conversations/:id/end
End a conversation.

## Memory Integration
After conversation ends:
```typescript
async function onConversationEnd(conversationId: string) {
  // Generate conversation summary
  const summary = await summarizeConversation(conversationId)
  
  // Store memory for each participant
  for (const participantId of conversation.participants) {
    await rememberConversation(
      participantId,
      conversationId,
      conversation.participants,
      summary
    )
  }
}
```

## Acceptance Criteria
- [ ] Agents can initiate conversations
- [ ] Messages stored with timestamps
- [ ] Responses include: identity, plan, memories, history
- [ ] Conversation generates memory when ended
- [ ] Can assign to employee or team
- [ ] Status transitions tracked
- [ ] Agent registry updated on employee create/delete

## Files to Create
```
backend/src/
├── agents/
│   └── conversation/
│       ├── index.ts           # Main exports
│       ├── start.ts          # startConversationMessage()
│       ├── continue.ts       # continueConversationMessage()
│       ├── leave.ts          # leaveConversationMessage()
│       ├── prompts.ts        # Prompt building helpers
│       ├── storage.ts         # Conversation/Message CRUD
│       └── memory.ts          # Remember conversation logic
```

## Definition of Done
1. Two agents can have a full conversation
2. Messages include context (identity, memories, history)
3. Conversation ending generates memory for each participant
4. API supports starting, continuing, ending conversations
5. Team conversations work similarly
