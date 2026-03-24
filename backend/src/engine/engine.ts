/**
 * TaskEngine - Event-driven task processing loop
 *
 * Part of TASK-3.5 - Task Execution Engine
 *
 * Inspired by AI Town's simulation engine (convex/gameEngine.ts):
 * - Runs on a tick interval
 * - Processes pending tasks from the queue
 * - Executes tasks using the TaskExecutor
 */

import { TaskExecutor } from './executor';
import { taskQueue, TaskQueue } from './queue';
import { AgentRegistry, agentRegistry } from '../agents/pi-mono/registry';
import * as db from '../storage/db';

const TICK_INTERVAL_MS = 5000; // 5 seconds
const BATCH_SIZE = 10; // Max pending tasks to process per tick

export interface TaskEngineConfig {
  tickInterval?: number;
  batchSize?: number;
}

export class TaskEngine {
  private running = false;
  private tickInterval: number;
  private batchSize: number;
  private executor: TaskExecutor;
  private timerHandle?: ReturnType<typeof setTimeout>;
  private registry: AgentRegistry;

  constructor(config: TaskEngineConfig = {}) {
    this.tickInterval = config.tickInterval ?? TICK_INTERVAL_MS;
    this.batchSize = config.batchSize ?? BATCH_SIZE;
    this.registry = agentRegistry;
    this.executor = new TaskExecutor({
      registry: this.registry,
      queue: taskQueue,
    });
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Start the engine tick loop
   */
  async start(): Promise<void> {
    if (this.running) {
      console.log('[TaskEngine] Already running');
      return;
    }

    this.running = true;
    console.log(`[TaskEngine] Started (tick=${this.tickInterval}ms, batch=${this.batchSize})`);
    this.tick();
  }

  /**
   * Stop the engine tick loop
   */
  async stop(): Promise<void> {
    if (!this.running) {
      console.log('[TaskEngine] Not running');
      return;
    }

    this.running = false;
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = undefined;
    }
    console.log('[TaskEngine] Stopped');
  }

  /**
   * Check if the engine is running
   */
  get isRunning(): boolean {
    return this.running;
  }

  // ─── Event Handlers ─────────────────────────────────────────────────────────

  /**
   * Called when a new task is created (event-driven hook)
   * Enqueues the task for processing.
   */
  onTaskCreated(taskId: string, assigneeType: string, assigneeId: string): void {
    if (assigneeType === 'employee') {
      taskQueue.enqueue(taskId, assigneeId);
      console.log(`[TaskEngine] Task ${taskId} queued for employee ${assigneeId}`);
    } else if (assigneeType === 'team') {
      // Team task: queue for each team member
      const members = db.getTeamMembers(assigneeId);
      for (const member of members) {
        taskQueue.enqueue(taskId, member.employee_id);
      }
      console.log(`[TaskEngine] Task ${taskId} queued for team ${assigneeId} (${members.length} members)`);
    }
  }

  /**
   * Manually trigger execution of a specific task
   */
  async executeNow(taskId: string): Promise<void> {
    const task = db.getTaskById(taskId);
    if (!task) {
      console.error(`[TaskEngine] executeNow: task not found ${taskId}`);
      return;
    }
    await this.executor.executeTask(taskId);
  }

  // ─── Tick Loop ──────────────────────────────────────────────────────────────

  private async tick(): Promise<void> {
    if (!this.running) return;

    try {
      await this.processTick();
    } catch (error: any) {
      console.error('[TaskEngine] Tick error:', error.message);
    }

    // Schedule next tick
    if (this.running) {
      this.timerHandle = setTimeout(() => this.tick(), this.tickInterval);
    }
  }

  private async processTick(): Promise<void> {
    // 1. Find pending tasks and enqueue them
    const pending = db.getTasksByStatus('pending').slice(0, this.batchSize);
    for (const task of pending) {
      // Only enqueue if not already in queue
      const status = taskQueue.getStatus(task.id);
      if (!status || status.status === 'completed' || status.status === 'failed') {
        this.onTaskCreated(task.id, task.assignee_type, task.assignee_id);
      }
    }

    // 2. Dequeue and execute the next task
    const next = taskQueue.dequeue();
    if (next) {
      console.log(`[TaskEngine] Executing task ${next.taskId}`);
      await this.executor.executeTask(next.taskId);
    }
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────

  /**
   * Get engine status summary
   */
  getStatus(): {
    running: boolean;
    queueDepth: number;
    executions: number;
  } {
    return {
      running: this.running,
      queueDepth: taskQueue.depth,
      executions: taskQueue.getAllExecutions().length,
    };
  }
}

// Singleton instance
export const taskEngine = new TaskEngine();
