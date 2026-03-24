/**
 * Memory System - Main Entry Point
 *
 * Vector-based memory system for AI agents, inspired by AI Town.
 *
 * Features:
 * - Store memories with embeddings and LLM-evaluated importance
 * - Vector similarity search with multi-factor ranking
 * - Automatic conversation memory capture
 * - Reflection memory generation from high-importance memories
 *
 * Reference: AI Town convex/agent/memory.ts
 *
 * @example
 * import { storeMemory, searchMemories } from './memory';
 *
 * // Store a memory
 * const memory = await storeMemory({
 *   employeeId: 'emp_123',
 *   description: 'Discussed project timeline with team lead',
 *   type: 'conversation',
 *   data: { conversationId: 'conv_456', participantIds: ['emp_789'] }
 * });
 *
 * // Search memories
 * const results = await searchMemories({
 *   query: 'project timeline discussion',
 *   employeeId: 'emp_123',
 *   limit: 5
 * });
 */

// Core operations
export { storeMemory, storeMemoryDirect, getMemory, getEmployeeMemories, deleteMemory } from './store';
export { searchMemories, searchMemoriesFTS, getMemoriesByType } from './search';

// Ranking algorithm
export { rankMemories, shouldUpdateLastAccess, sortByImportance, findReflectionCandidates } from './ranking';

// Importance calculation
export { calculateImportance, calculateImportanceBatch } from './importance';

// Conversation memory
export {
  rememberConversation,
  rememberConversationFromId,
  generateConversationSummary,
} from './conversation';

// Types
export type {
  MemoryType,
  LegacyMemoryType,
  AnyMemoryType,
  MemoryRecord,
  MemorySearchOptions,
  StoreMemoryOptions,
  ConversationMemoryData,
  TaskMemoryData,
  ReflectionMemoryData,
  RelationshipMemoryData,
  MemoryData,
} from './types';
