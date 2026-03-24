/**
 * TaskExecutor - Executes tasks using registered agents
 *
 * Part of TASK-3.5 - Task Execution Engine
 *
 * Execution flow:
 * 1. Parse task description
 * 2. Retrieve relevant memories
 * 3. Build execution prompt
 * 4. Execute with timeout
 * 5. Store result
 * 6. Create work products (if any)
 * 7. Update memory with completion
 */

import { v4 as uuidv4 } from 'uuid';
import { LLMMessage } from '../core/llm/types';
import { AgentRegistry } from '../agents/pi-mono/registry';
import { PImonoAgent } from '../agents/pi-mono/agent';
import { searchMemories, storeMemory, MemoryRecord, StoreMemoryOptions } from '../agents/memory';
import { taskQueue, TaskQueue, WorkProductSpec } from './queue';
import { retryHandler, MAX_RETRIES } from './retry';
import * as db from '../storage/db';
import * as taskService from '../services/task.service';

export interface ExecutionResult {
  content: string;
  plan?: string;
  work?: string;
  result?: string;
  summary?: string;
  products?: WorkProductSpec[];
}

export interface TaskExecutorDeps {
  registry: AgentRegistry;
  queue: TaskQueue;
  defaultTimeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export class TaskExecutor {
  private registry: AgentRegistry;
  private queue: TaskQueue;
  private defaultTimeoutMs: number;

  constructor(deps: TaskExecutorDeps) {
    this.registry = deps.registry;
    this.queue = deps.queue;
    this.defaultTimeoutMs = deps.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * Execute a task by ID
   */
  async executeTask(taskId: string): Promise<void> {
    // 1. Load task from DB
    const task = db.getTaskById(taskId);
    if (!task) {
      console.error(`[TaskExecutor] Task not found: ${taskId}`);
      return;
    }

    // 2. Get agent
    const agent = this.registry.getByEmployeeId(task.assignee_id);
    if (!agent) {
      console.error(`[TaskExecutor] Agent not found for employee: ${task.assignee_id}`);
      await this.handleTaskError(taskId, task.assignee_id, new Error('Agent not found'));
      return;
    }

    // 3. Update status to in_progress
    taskService.updateTaskStatus(taskId, { status: 'in_progress' });
    this.queue.updateExecution(taskId, { status: 'in_progress' });

    try {
      // 4. Search relevant memories
      const memories = await this.searchRelevantMemories(agent, task);

      // 5. Build and execute prompt
      const result = await this.executeWithRetry(agent, task, memories);

      // 6. Parse execution result
      const parsed = this.parseExecutionResult(result);

      // 7. Store result in DB
      await this.storeTaskResult(taskId, parsed.summary ?? result);

      // 8. Create work products if any
      if (parsed.products && parsed.products.length > 0) {
        await this.createWorkProducts(taskId, task.assignee_id, parsed.products);
      }

      // 9. Store completion memory
      await this.storeCompletionMemory(agent, task, parsed.summary ?? result);

      // 10. Mark complete
      this.queue.complete(taskId, parsed.summary ?? result);
      taskService.updateTaskStatus(taskId, { status: 'completed', result: parsed.summary ?? result });

      console.log(`[TaskExecutor] Task completed: ${taskId}`);

    } catch (error: any) {
      console.error(`[TaskExecutor] Task execution failed: ${taskId}`, error.message);
      await this.handleTaskError(taskId, task.assignee_id, error);
    }
  }

  /**
   * Search relevant memories for the agent about this task
   */
  private async searchRelevantMemories(
    agent: PImonoAgent,
    task: db.Task
  ): Promise<MemoryRecord[]> {
    try {
      const query = `task: ${task.title}${task.description ? ' - ' + task.description : ''}`;
      const results = await searchMemories({
        query,
        employeeId: agent.employeeId,
        limit: 5,
      });
      console.log(`[TaskExecutor] Found ${results.length} relevant memories for task ${task.id}`);
      return results;
    } catch (error: any) {
      console.warn(`[TaskExecutor] Memory search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Build the execution prompt with task info and memory context
   */
  private buildExecutionPrompt(
    task: db.Task,
    memories: MemoryRecord[]
  ): string {
    const memoryContext = memories.length > 0
      ? 'Relevant Context from Memory:\n' + memories.map((m) => `  - ${m.description}`).join('\n')
      : '';

    return `
You are ${this.registry.getByEmployeeId(task.assignee_id)?.name ?? 'an AI agent'}.

Current Task:
Title: ${task.title}
${task.description ? `Description: ${task.description}` : ''}

${memoryContext}

Please complete this task. Your response should include:
1. Your approach/plan
2. The work done
3. Results and any files created
4. Summary for memory storage

IMPORTANT: Format your response exactly as follows (each section on its own lines):
<plan>...</plan>
<work>...</work>
<result>...</result>
<summary>...</summary>
<products>
  [
    {"filename": "...", "filepath": "...", "mimeType": "..."},
    ...
  ]
</products>

If no work products were created, use: <products>[]</products>
`.trim();
  }

  /**
   * Execute the agent with timeout and retry
   */
  private async executeWithRetry(
    agent: PImonoAgent,
    task: db.Task,
    memories: MemoryRecord[]
  ): Promise<string> {
    const prompt = this.buildExecutionPrompt(task, memories);
    const messages: LLMMessage[] = [{ role: 'user', content: prompt }];

    return retryHandler.withRetry(
      () => this.executeWithTimeout(agent, messages, this.defaultTimeoutMs),
      `task=${task.id}`
    );
  }

  /**
   * Execute with a timeout using Promise.race
   */
  private async executeWithTimeout(
    agent: PImonoAgent,
    messages: LLMMessage[],
    timeoutMs: number
  ): Promise<string> {
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error(`Task timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    const executionPromise = agent.chat(messages);

    return Promise.race([executionPromise, timeoutPromise]);
  }

  /**
   * Parse the structured response from the agent
   */
  private parseExecutionResult(content: string): ExecutionResult {
    const getSection = (tag: string): string | undefined => {
      const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
      const match = content.match(regex);
      return match ? match[1].trim() : undefined;
    };

    const plan = getSection('plan');
    const work = getSection('work');
    const result = getSection('result');
    const summary = getSection('summary');

    // Parse products JSON
    let products: WorkProductSpec[] | undefined;
    const productsRaw = getSection('products');
    if (productsRaw) {
      try {
        const parsed = JSON.parse(productsRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          products = parsed.map((p: any) => ({
            filename: p.filename ?? 'unknown',
            filepath: p.filepath ?? '',
            mimeType: p.mimeType,
            sizeBytes: p.sizeBytes,
          }));
        }
      } catch {
        // ignore parse errors
      }
    }

    return { content, plan, work, result, summary, products };
  }

  /**
   * Store task result in the database
   */
  private async storeTaskResult(taskId: string, result: string): Promise<void> {
    try {
      db.updateTask(taskId, {
        status: 'completed',
        result: result.slice(0, 10000),
        completed_at: Date.now(),
      });
    } catch (error: any) {
      console.error(`[TaskExecutor] Failed to store result for task ${taskId}: ${error.message}`);
    }
  }

  /**
   * Create work product records in the database
   */
  private async createWorkProducts(
    taskId: string,
    employeeId: string,
    products: WorkProductSpec[]
  ): Promise<void> {
    for (const spec of products) {
      try {
        const wp = {
          id: uuidv4(),
          task_id: taskId,
          employee_id: employeeId,
          filename: spec.filename,
          filepath: spec.filepath,
          mime_type: spec.mimeType,
          size_bytes: spec.sizeBytes,
          version: 1,
        };
        db.createWorkProduct(wp);
        console.log(`[TaskExecutor] Created work product: ${spec.filename} for task ${taskId}`);
      } catch (error: any) {
        console.error(`[TaskExecutor] Failed to create work product: ${error.message}`);
      }
    }
  }

  /**
   * Store a memory record about task completion
   */
  private async storeCompletionMemory(
    agent: PImonoAgent,
    task: db.Task,
    summary: string
  ): Promise<void> {
    try {
      const memoryData: StoreMemoryOptions = {
        employeeId: agent.employeeId,
        description: `Completed task: ${task.title}. Result: ${summary}`,
        type: 'task',
        data: {
          taskId: task.id,
          title: task.title,
        },
      };
      await storeMemory(memoryData);
    } catch (error: any) {
      console.warn(`[TaskExecutor] Failed to store completion memory: ${error.message}`);
    }
  }

  /**
   * Handle task errors with retry logic
   */
  private async handleTaskError(taskId: string, agentId: string, error: Error): Promise<void> {
    const execution = this.queue.getStatus(taskId);

    if (execution && execution.retryCount < MAX_RETRIES && retryHandler.isRetryable(error)) {
      console.warn(`[TaskExecutor] Requeueing task ${taskId} (retry ${(execution.retryCount ?? 0) + 1})`);
      this.queue.requeue(taskId, agentId);
      taskService.updateTaskStatus(taskId, { status: 'pending' });
    } else {
      console.error(`[TaskExecutor] Task ${taskId} failed permanently: ${error.message}`);
      this.queue.fail(taskId, error.message);
      taskService.updateTaskStatus(taskId, { status: 'failed', result: error.message });
    }
  }
}
