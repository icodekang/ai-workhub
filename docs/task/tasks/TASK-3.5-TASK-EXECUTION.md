# Task 3.5: Task Execution Engine

## Metadata
| Field | Value |
|-------|-------|
| **Task ID** | TASK-3.5 |
| **Title** | Task Execution Engine |
| **Priority** | P0 |
| **Estimate** | 8 hours |
| **Owner** | @coder |
| **Status** | TODO |
| **Created** | 2026-03-24 |
| **Sprint** | 3 |
| **Dependencies** | TASK-3.1 (Agent Management), TASK-3.2 (Memory System) |

## Description
Implement the task execution engine that drives agent task performance. Inspired by AI Town's simulation engine but adapted for task-driven office scenarios.

## AI Town Reference
**File**: `convex/engine/` - Event-driven simulation engine
**Concept**: Time-driven execution with input queue

## Architecture

### Task Execution Flow

```
Task Created → Engine Queues → Agent Executes → Result Stored → Memory Updated
                                    ↓
                              Work Product Created (if any)
```

### Task States
```typescript
type TaskStatus = 'pending' | 'queued' | 'in_progress' | 'completed' | 'failed'

interface TaskExecution {
  id: string
  taskId: string
  agentId: string
  status: TaskStatus
  startedAt?: number
  completedAt?: number
  result?: string
  error?: string
  retryCount: number
}
```

## Core Components

### 1. Task Queue
```typescript
interface TaskQueue {
  enqueue(taskId: string, agentId: string): Promise<void>
  dequeue(): Promise<{ taskId: string; agentId: string } | null>
  requeue(taskId: string, agentId: string): Promise<void>
  getStatus(taskId: string): TaskExecution | null
}
```

### 2. Task Executor
```typescript
class TaskExecutor {
  constructor(
    private registry: AgentRegistry,
    private memorySystem: MemorySystem,
    private workProductService: WorkProductService,
    private taskQueue: TaskQueue
  ) {}
  
  async executeTask(taskId: string): Promise<void> {
    const task = await db.tasks.get(taskId)
    if (!task) throw new Error('Task not found')
    
    const agent = this.registry.get(task.assigneeId)
    if (!agent) throw new Error('Agent not found')
    
    // Update status
    await this.updateTaskStatus(taskId, 'in_progress')
    
    try {
      // 1. Parse task and get relevant memories
      const memories = await this.memorySystem.searchMemories(
        task.assigneeId,
        `task: ${task.title} - ${task.description}`,
        5
      )
      
      // 2. Build execution prompt
      const prompt = this.buildExecutionPrompt(task, memories)
      
      // 3. Execute with timeout
      const result = await this.executeWithTimeout(
        agent,
        prompt,
        task.timeout || 300000  // 5 min default
      )
      
      // 4. Store result
      await this.storeTaskResult(taskId, result)
      
      // 5. Create work products if any
      if (result.products) {
        await this.createWorkProducts(taskId, task.assigneeId, result.products)
      }
      
      // 6. Update memory with task completion
      await this.memorySystem.storeMemory(
        task.assigneeId,
        `Completed task: ${task.title}. Result: ${result.summary}`,
        'task',
        { taskId, title: task.title }
      )
      
      await this.updateTaskStatus(taskId, 'completed', result.summary)
      
    } catch (error: any) {
      await this.handleTaskError(taskId, error)
    }
  }
  
  private buildExecutionPrompt(task: Task, memories: Memory[]): string {
    return `
You are ${agent.name}.

Current Task:
Title: ${task.title}
Description: ${task.description}

${memories.length > 0 ? 'Relevant Context from Memory:\n' + memories.map(m => `- ${m.description}`).join('\n') : ''}

Please complete this task. Your response should include:
1. Your approach/plan
2. The work done
3. Results and any files created
4. Summary for memory storage

Format your response as:
<plan>...</plan>
<work>...</work>
<result>...</result>
<summary>...</summary>
${task.outputFormat ? `<format>${task.outputFormat}</format>` : ''}
`.trim()
  }
  
  private async executeWithTimeout(
    agent: AIAgent,
    prompt: string,
    timeoutMs: number
  ): Promise<ExecutionResult> {
    return Promise.race([
      agent.chat(prompt),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Task timeout')), timeoutMs)
      )
    ])
  }
  
  private async handleTaskError(taskId: string, error: Error): Promise<void> {
    const execution = await this.taskQueue.getStatus(taskId)
    
    if (execution.retryCount < MAX_RETRIES) {
      // Retry
      await this.taskQueue.requeue(taskId, execution.agentId)
      await this.updateTaskStatus(taskId, 'queued')
    } else {
      await this.updateTaskStatus(taskId, 'failed', undefined, error.message)
    }
  }
}
```

### 3. Task Engine (Simulation Loop)

```typescript
// Task engine runs the execution loop
class TaskEngine {
  private running = false
  private tickInterval = 5000  // 5 seconds
  
  async start(): Promise<void> {
    this.running = true
    this.tick()
  }
  
  async stop(): Promise<void> {
    this.running = false
  }
  
  private async tick(): Promise<void> {
    if (!this.running) return
    
    try {
      // Process pending tasks
      const pending = await db.tasks.query({
        status: 'pending',
        limit: 10
      })
      
      for (const task of pending) {
        await this.queueTask(task)
      }
      
      // Check queue and execute
      const next = await this.taskQueue.dequeue()
      if (next) {
        await this.executor.executeTask(next.taskId)
      }
      
    } catch (error) {
      console.error('Engine tick error:', error)
    }
    
    // Schedule next tick
    if (this.running) {
      setTimeout(() => this.tick(), this.tickInterval)
    }
  }
  
  private async queueTask(task: Task): Promise<void> {
    if (task.assigneeType === 'employee') {
      await this.taskQueue.enqueue(task.id, task.assigneeId)
    } else if (task.assigneeType === 'team') {
      // Team orchestration handles distribution
      await this.teamOrchestrator.distributeTask(task)
    }
    
    await this.updateTaskStatus(task.id, 'queued')
  }
}
```

### 4. Timeout and Retry Logic

```typescript
const MAX_RETRIES = 3
const RETRY_DELAYS = [5000, 30000, 60000]  // ms

class RetryHandler {
  async withRetry<T>(
    fn: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error
    
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        return await fn()
      } catch (error: any) {
        lastError = error
        
        if (!this.isRetryable(error)) {
          throw error
        }
        
        console.warn(`Retry ${i + 1}/${MAX_RETRIES} for ${context}`)
        await this.sleep(RETRY_DELAYS[i])
      }
    }
    
    throw lastError!
  }
  
  private isRetryable(error: Error): boolean {
    const retryablePatterns = [
      'timeout',
      'rate limit',
      'network',
      '503',
      '502',
      '429'
    ]
    
    return retryablePatterns.some(p => 
      error.message.toLowerCase().includes(p)
    )
  }
}
```

## API Integration

### POST /api/tasks/:id/execute
Manually trigger task execution.

### GET /api/tasks/:id/execution
Get execution status.

### POST /api/engine/start
Start the task engine.

### POST /api/engine/stop
Stop the task engine.

## Acceptance Criteria
- [ ] Tasks automatically queued when created
- [ ] Agent executes task with context (memories)
- [ ] Timeout handling with configurable duration
- [ ] Retry logic for transient failures
- [ ] Work products created from execution
- [ ] Memory updated after task completion
- [ ] Task engine runs on interval
- [ ] Manual trigger available

## Files to Create
```
backend/src/
├── engine/
│   ├── executor.ts       # TaskExecutor
│   ├── queue.ts         # TaskQueue
│   ├── engine.ts        # TaskEngine
│   ├── retry.ts         # RetryHandler
│   └── index.ts
└── services/
    └── task.service.ts   # Updated with execution
```

## Definition of Done
1. Tasks automatically processed from queue
2. Agent receives task with relevant memories
3. Results stored in task record
4. Work products created and linked to task
5. Memory updated after completion
6. Failed tasks retried up to MAX_RETRIES
7. Engine can be started/stopped
