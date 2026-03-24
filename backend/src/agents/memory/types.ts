/**
 * Memory System Types
 *
 * Based on AI Town memory architecture:
 * - conversation: dialogue memories between employees/players
 * - task: task-related memories
 * - reflection: high-level insights (derived from many memories)
 * - relationship: relationship between employees
 */

export type MemoryType = 'conversation' | 'task' | 'reflection' | 'relationship';

// Legacy types for backward compatibility
export type LegacyMemoryType = 'episodic' | 'semantic' | 'working';

export type AnyMemoryType = MemoryType | LegacyMemoryType;

/**
 * Memory data payload per type
 */
export interface ConversationMemoryData {
  conversationId: string;
  participantIds: string[];
}

export interface TaskMemoryData {
  taskId: string;
  title: string;
}

export interface ReflectionMemoryData {
  relatedMemoryIds: string[];
  insight: string;
}

export interface RelationshipMemoryData {
  targetEmployeeId: string;
  summary?: string;
}

export type MemoryData =
  | ConversationMemoryData
  | TaskMemoryData
  | ReflectionMemoryData
  | RelationshipMemoryData;

/**
 * Enriched memory record with parsed data
 */
export interface MemoryRecord {
  id: string;
  employeeId: string;
  type: AnyMemoryType;
  description: string;   // description = content field
  importance: number;    // 0-9 scale (LLM-evaluated)
  lastAccess: number;    // timestamp
  createdAt: number;
  data: MemoryData;
  // Vector similarity score (only present in search results)
  similarity?: number;
  // Overall ranking score (only present in ranked results)
  overallScore?: number;
}

/**
 * Search options for memory retrieval
 */
export interface MemorySearchOptions {
  query: string;
  employeeId: string;
  type?: AnyMemoryType;
  limit?: number;
}

/**
 * Store options for new memory
 */
export interface StoreMemoryOptions {
  employeeId: string;
  description: string;
  type: AnyMemoryType;
  data?: MemoryData;
  importanceOverride?: number; // Skip LLM calculation if provided
}
