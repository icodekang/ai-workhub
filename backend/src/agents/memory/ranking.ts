/**
 * Memory Ranking Algorithm
 *
 * Implements AI Town's multi-factor ranking:
 * overallScore = relevance + importance + recency
 *
 * - relevance: cosine similarity from vector search (0-1 normalized)
 * - importance: LLM-evaluated 0-9 score (normalized to 0-9)
 * - recency: exponential decay with 0.99 per hour
 *
 * Reference: AI Town convex/agent/memory.ts rankMemories()
 */

import type { MemoryRecord } from './types';

// AI Town constants
const RECENCY_DECAY_RATE = 0.99;         // Multiply by 0.99 per hour
const RECENCY_GRACE_HOURS = 4;           // New memories get a recency boost
const MEMORY_ACCESS_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

// Score ranges for normalization
const RELEVANCE_RANGE: [number, number] = [0.0, 1.0];
const IMPORTANCE_RANGE: [number, number] = [0, 9];

/**
 * Normalize a value to a 0-1 range given min/max bounds.
 */
function normalize(value: number, range: [number, number]): number {
  const [min, max] = range;
  if (max === min) return 1;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Compute recency score using exponential decay.
 * New memories (within grace hours) get a recency boost.
 */
function computeRecencyScore(lastAccess: number, now: number): number {
  const hoursSinceAccess = (now - lastAccess) / 1000 / 60 / 60;

  // Grace period boost for very recent memories
  if (hoursSinceAccess < RECENCY_GRACE_HOURS) {
    return Math.pow(0.99, Math.floor(hoursSinceAccess)) * 1.5;
  }

  return Math.pow(RECENCY_DECAY_RATE, Math.floor(hoursSinceAccess));
}

/**
 * Rank candidate memories by overall score.
 *
 * @param candidates - Memory records with similarity scores from vector search
 * @param limit - Max results to return
 * @param now - Current timestamp (for testing / override)
 * @returns Ranked memories with overall scores, lastAccess updated (throttled)
 */
export async function rankMemories(
  candidates: MemoryRecord[],
  limit: number,
  now: number = Date.now()
): Promise<MemoryRecord[]> {
  if (candidates.length === 0) return [];

  const scored = candidates.map((mem) => {
    const relevanceScore = mem.similarity !== undefined
      ? normalize(mem.similarity, RELEVANCE_RANGE)
      : 0.5; // Default if no vector score

    const importanceScore = normalize(mem.importance, IMPORTANCE_RANGE);

    const recencyScore = computeRecencyScore(mem.lastAccess, now);

    const overallScore = relevanceScore + importanceScore + recencyScore;

    return {
      memory: mem,
      relevanceScore,
      importanceScore,
      recencyScore,
      overallScore,
    };
  });

  // Sort descending by overall score
  scored.sort((a, b) => b.overallScore - a.overallScore);

  // Return top results, flag those needing lastAccess update
  const throttled = scored.slice(0, limit).map((s) => ({
    ...s.memory,
    overallScore: s.overallScore,
  }));

  // Return only the memory records with scores
  return throttled;
}

/**
 * Check if a memory's lastAccess timestamp should be updated.
 * Throttled to avoid excessive writes.
 */
export function shouldUpdateLastAccess(lastAccess: number, now: number): boolean {
  return now - lastAccess > MEMORY_ACCESS_THROTTLE_MS;
}

/**
 * Sort memories by importance descending (for reflection generation).
 */
export function sortByImportance(memories: MemoryRecord[], limit?: number): MemoryRecord[] {
  const sorted = [...memories].sort((a, b) => b.importance - a.importance);
  return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * Compute reflection candidates by finding high-importance recent memories.
 * Reflection threshold: sum of importance scores > 500 across recent 100 memories.
 */
export function findReflectionCandidates(
  memories: MemoryRecord[],
  threshold: number = 500,
  lookback: number = 100
): MemoryRecord[] {
  const recent = memories
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, lookback);

  const totalImportance = recent.reduce((sum, m) => sum + m.importance, 0);

  if (totalImportance < threshold) {
    return [];
  }

  // Return top memories by importance for reflection synthesis
  return recent.sort((a, b) => b.importance - a.importance).slice(0, 10);
}
