/**
 * Memory Vector Search
 *
 * Performs vector similarity search followed by AI Town-style ranking.
 * Reference: AI Town convex/agent/memory.ts searchMemories()
 */

import { fetchEmbedding } from '../../core/llm';
import * as db from '../../storage/db';
import { rankMemories, shouldUpdateLastAccess } from './ranking';
import type { MemoryRecord, MemorySearchOptions } from './types';
import { toMemoryRecord } from './store';

// How many extra candidates to fetch for better ranking (AI Town: 10x)
const MEMORY_OVERFETCH = 10;

/**
 * Search memories for an employee using vector similarity + ranking.
 *
 * @param options.searchQuery - Text query to search
 * @param options.employeeId - Employee ID
 * @param options.type - Optional memory type filter
 * @param options.limit - Max results (default 5)
 */
export async function searchMemories(
  options: MemorySearchOptions
): Promise<MemoryRecord[]> {
  const { query, employeeId, type, limit = 5 } = options;

  if (!query || query.trim().length === 0) {
    return [];
  }

  // Step 1: Generate query embedding
  let queryEmbedding: number[];
  try {
    const result = await fetchEmbedding(query);
    queryEmbedding = result.embedding;
  } catch (err) {
    console.error(`[searchMemories] Failed to generate query embedding:`, err);
    throw new Error('Failed to generate search embedding');
  }

  // Step 2: Vector search to get candidates (overfetch for ranking)
  const overfetchLimit = limit * MEMORY_OVERFETCH;
  let rawResults = db.searchMemoryByVector(employeeId, queryEmbedding, overfetchLimit);

  // Step 3: Apply type filter if specified
  if (type) {
    rawResults = rawResults.filter((r) => r.memory.type === type);
  }

  // Step 4: Build candidate records with similarity scores
  const candidates: MemoryRecord[] = rawResults.map((r) => ({
    ...toMemoryRecord(r.memory),
    similarity: r.similarity,
  }));

  // Step 5: Rank by relevance + importance + recency
  const ranked = await rankMemories(candidates, limit);

  // Step 6: Update lastAccess timestamps (throttled)
  const now = Date.now();
  for (const mem of ranked) {
    const original = rawResults.find((r) => r.memory.id === mem.id);
    if (original && shouldUpdateLastAccess(original.memory.last_access, now)) {
      db.updateMemoryLastAccess(mem.id, now);
    }
  }

  return ranked;
}

/**
 * Full-text search fallback when vector search is unavailable.
 * Uses SQLite FTS5 for keyword matching.
 */
export async function searchMemoriesFTS(
  options: MemorySearchOptions
): Promise<MemoryRecord[]> {
  const { query, employeeId, type, limit = 5 } = options;

  if (!query || query.trim().length === 0) {
    return [];
  }

  const memories = db.searchMemories(employeeId, query);
  let filtered = memories.map(toMemoryRecord);

  if (type) {
    filtered = filtered.filter((m) => m.type === type);
  }

  // Sort by importance and recency
  const now = Date.now();
  const scored = filtered.map((m) => ({
    ...m,
    overallScore: m.importance + Math.pow(0.99, (now - m.lastAccess) / 3600000),
  }));

  scored.sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0));
  return scored.slice(0, limit);
}

/**
 * Search memories by type for an employee.
 */
export async function getMemoriesByType(
  employeeId: string,
  type: string,
  limit: number = 20
): Promise<MemoryRecord[]> {
  const memories = db.getMemoriesByEmployee(employeeId);
  return memories
    .filter((m) => m.type === type)
    .map(toMemoryRecord)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, limit);
}
