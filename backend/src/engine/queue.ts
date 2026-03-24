/**
 * TaskQueue - In-memory FIFO queue with persistence
 *
 * Part of TASK-3.5 - Task Execution Engine
 */

import { v4 as uuidv4 } from 'uuid';

export type TaskStatus = 'pending' | 'queued' | 'in_progress' | 'completed' | 'failed';

export interface TaskExecution {
  id: string;
  taskId: string;
  agentId: string;
  status: TaskStatus;
  startedAt?: number;
  completedAt?: number;
  result?: string;
  error?: string;
  retryCount: number;
}

interface QueueEntry {
  taskId: string;
  agentId: string;
  enqueuedAt: number;
}

export interface WorkProductSpec {
  filename: string;
  filepath: string;
  mimeType?: string;
  sizeBytes?: number;
}

/**
 * In-memory task queue backed by a Map for execution tracking.
 * The actual task data lives in the DB (storage/db.ts).
 */
export class TaskQueue {
  // FIFO queue of pending task entries
  private queue: QueueEntry[] = [];
  // Track execution status by taskId
  private executions: Map<string, TaskExecution> = new Map();
  // Track which tasks are currently in queue (dedup)
  private queuedTasks: Set<string> = new Set();

  /**
   * Add a task to the queue for execution
   */
  enqueue(taskId: string, agentId: string): void {
    if (this.queuedTasks.has(taskId)) {
      console.log(`[TaskQueue] Task ${taskId} already in queue, skipping`);
      return;
    }

    const entry: QueueEntry = {
      taskId,
      agentId,
      enqueuedAt: Date.now(),
    };

    this.queue.push(entry);
    this.queuedTasks.add(taskId);

    // Initialize execution record
    const existing = this.executions.get(taskId);
    this.executions.set(taskId, {
      id: existing?.id ?? uuidv4(),
      taskId,
      agentId,
      status: 'queued',
      retryCount: existing?.retryCount ?? 0,
    });

    console.log(`[TaskQueue] Enqueued task=${taskId} agent=${agentId}, queue size=${this.queue.length}`);
  }

  /**
   * Remove and return the next task from the queue, or null if empty
   */
  dequeue(): QueueEntry | null {
    const entry = this.queue.shift();
    if (!entry) return null;

    this.queuedTasks.delete(entry.taskId);

    const execution = this.executions.get(entry.taskId);
    if (execution) {
      execution.status = 'in_progress';
      execution.startedAt = Date.now();
    }

    return entry;
  }

  /**
   * Requeue a task (increment retry count)
   */
  requeue(taskId: string, agentId: string): void {
    const execution = this.executions.get(taskId);
    if (execution) {
      execution.retryCount += 1;
      execution.status = 'queued';
      execution.error = undefined;
    }
    // Re-add to queue (dedup set will prevent double-queueing for now,
    // but we re-add to ensure it's processed)
    if (!this.queuedTasks.has(taskId)) {
      this.queue.push({ taskId, agentId, enqueuedAt: Date.now() });
      this.queuedTasks.add(taskId);
    }
  }

  /**
   * Get the current execution status for a task
   */
  getStatus(taskId: string): TaskExecution | null {
    return this.executions.get(taskId) ?? null;
  }

  /**
   * Update execution status
   */
  updateExecution(taskId: string, updates: Partial<TaskExecution>): void {
    const existing = this.executions.get(taskId);
    if (!existing) return;
    this.executions.set(taskId, { ...existing, ...updates });
  }

  /**
   * Mark a task as completed
   */
  complete(taskId: string, result: string): void {
    const execution = this.executions.get(taskId);
    if (!execution) return;
    execution.status = 'completed';
    execution.completedAt = Date.now();
    execution.result = result;
    this.queuedTasks.delete(taskId);
  }

  /**
   * Mark a task as failed
   */
  fail(taskId: string, error: string): void {
    const execution = this.executions.get(taskId);
    if (!execution) return;
    execution.status = 'failed';
    execution.completedAt = Date.now();
    execution.error = error;
    this.queuedTasks.delete(taskId);
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Get queue depth
   */
  get depth(): number {
    return this.queue.length;
  }

  /**
   * Get all executions (for debugging/admin)
   */
  getAllExecutions(): TaskExecution[] {
    return Array.from(this.executions.values());
  }

  /**
   * Peek at next entry without dequeuing
   */
  peek(): QueueEntry | null {
    return this.queue[0] ?? null;
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    this.queuedTasks.clear();
  }
}

// Singleton instance
export const taskQueue = new TaskQueue();
