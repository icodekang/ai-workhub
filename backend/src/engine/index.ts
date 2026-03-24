/**
 * Task Execution Engine
 *
 * Part of TASK-3.5 - Task Execution Engine
 *
 * Exports:
 * - TaskQueue: In-memory FIFO task queue with execution tracking
 * - TaskExecutor: Executes tasks using registered AI agents
 * - TaskEngine: Tick-based event loop for automated task processing
 * - RetryHandler: Exponential backoff retry logic for transient failures
 */

// Queue types
export { taskQueue, TaskQueue } from './queue';
export type { TaskExecution, TaskStatus, WorkProductSpec } from './queue';

// Executor
export { TaskExecutor } from './executor';
export type { ExecutionResult } from './executor';

// Engine
export { taskEngine, TaskEngine } from './engine';
export type { TaskEngineConfig } from './engine';

// Retry
export { retryHandler, RetryHandler, MAX_RETRIES } from './retry';
