/**
 * Memory Storage
 *
 * Store memories with auto-generated embeddings and LLM-evaluated importance.
 * Reference: AI Town convex/agent/memory.ts storeMemory()
 */

import { v4 as uuidv4 } from 'uuid';
import * as db from '../../storage/db';
import { fetchEmbedding } from '../../core/llm';
import { calculateImportance } from './importance';
import type { MemoryRecord, StoreMemoryOptions, MemoryData } from './types';

/**
 * Generate a unique ID for a new memory.
 */
function newMemoryId(): string {
  return `mem_${uuidv4()}`;
}

/**
 * Generate a unique ID for a memory embedding.
 */
function newEmbeddingId(): string {
  return `emb_${uuidv4()}`;
}

/**
 * Store a new memory with embedding and LLM-evaluated importance.
 *
 * Steps:
 * 1. Generate embedding via LLM
 * 2. Calculate importance via LLM (unless overridden)
 * 3. Insert memory record
 * 4. Store embedding vector
 */
export async function storeMemory(
  options: StoreMemoryOptions
): Promise<MemoryRecord> {
  const {
    employeeId,
    description,
    type,
    data,
    importanceOverride,
  } = options;

  const now = Date.now();
  const id = newMemoryId();

  // Step 1: Generate embedding
  let embedding: number[];
  try {
    const result = await fetchEmbedding(description);
    embedding = result.embedding;
  } catch (err) {
    console.error(`[storeMemory] Failed to fetch embedding for "${description.slice(0, 50)}..."`, err);
    throw new Error('Failed to generate embedding for memory');
  }

  // Step 2: Calculate importance (unless provided)
  const importance = importanceOverride ?? await calculateImportance(description);

  // Step 3: Store memory record
  const memory = db.createMemory({
    id,
    employee_id: employeeId,
    type,
    content: description,
    importance,
    last_access: now,
    data: JSON.stringify((data ?? {}) as Record<string, unknown>),
  });

  // Step 4: Store embedding vector
  try {
    db.createMemoryEmbedding({
      id: newEmbeddingId(),
      memory_id: id,
      embedding: JSON.stringify(embedding),
    });
  } catch (err) {
    console.error(`[storeMemory] Failed to store embedding for memory ${id}`, err);
    // Continue even if embedding storage fails - memory is still stored
  }

  return toMemoryRecord(memory);
}

/**
 * Store a memory directly with pre-computed values (for testing/migration).
 */
export function storeMemoryDirect(
  employeeId: string,
  description: string,
  type: string,
  embedding: number[],
  importance: number,
  data?: MemoryData
): MemoryRecord {
  const now = Date.now();
  const id = newMemoryId();
  const embId = newEmbeddingId();

  const memory = db.createMemory({
    id,
    employee_id: employeeId,
    type: type as any,
    content: description,
    importance,
    last_access: now,
    data: JSON.stringify((data ?? {}) as Record<string, unknown>),
  });

  db.createMemoryEmbedding({
    id: embId,
    memory_id: id,
    embedding: JSON.stringify(embedding),
  });

  return toMemoryRecord(memory);
}

/**
 * Get a single memory by ID with parsed data.
 */
export function getMemory(id: string): MemoryRecord | undefined {
  const memory = db.getMemoryById(id);
  if (!memory) return undefined;
  return toMemoryRecord(memory);
}

/**
 * Get all memories for an employee.
 */
export function getEmployeeMemories(employeeId: string): MemoryRecord[] {
  const memories = db.getMemoriesByEmployee(employeeId);
  return memories.map(toMemoryRecord);
}

/**
 * Delete a memory and its embeddings.
 */
export function deleteMemory(id: string): boolean {
  // Embeddings are deleted via CASCADE
  return db.deleteMemory(id);
}

/**
 * Convert a DB memory row to a MemoryRecord.
 */
export function toMemoryRecord(mem: db.Memory): MemoryRecord {
  let parsedData: MemoryData = {} as MemoryData;
  try {
    parsedData = JSON.parse(mem.data || '{}') as MemoryData;
  } catch {
    parsedData = {} as MemoryData;
  }

  return {
    id: mem.id,
    employeeId: mem.employee_id,
    type: mem.type as MemoryRecord['type'],
    description: mem.content,
    importance: mem.importance,
    lastAccess: mem.last_access,
    createdAt: mem.created_at,
    data: parsedData as MemoryData,
  };
}
