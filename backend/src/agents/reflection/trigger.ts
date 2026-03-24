/**
 * Reflection System - Trigger Logic
 *
 * Determines when reflection should be triggered.
 * Based on AI Town's memory reflection scheduling.
 */

import * as db from '../../storage/db';
import type { MemoryRecord } from '../memory/types';
import { getEmployeeMemories, toMemoryRecord } from '../memory/store';

// Configuration
const REFLECTION_MIN_MEMORIES = parseInt(process.env.REFLECTION_MIN_MEMORIES || '5', 10);
const REFLECTION_IMPORTANCE_THRESHOLD = parseInt(process.env.REFLECTION_IMPORTANCE_THRESHOLD || '4', 10);
const REFLECTION_MAX_MEMORIES = parseInt(process.env.REFLECTION_MAX_MEMORIES || '20', 10);
const REFLECTION_MIN_INTERVAL_MS = parseInt(process.env.REFLECTION_MIN_INTERVAL_MS || '3600000', 10); // 1 hour

/**
 * Check if an employee should perform reflection based on their memories.
 */
export async function shouldReflect(employeeId: string): Promise<boolean> {
  // Get all memories for the employee
  const memories = getEmployeeMemories(employeeId);

  // Filter out existing reflection memories
  const nonReflectionMemories = memories.filter((m) => m.type !== 'reflection');

  // Check if we have enough memories
  if (nonReflectionMemories.length < REFLECTION_MIN_MEMORIES) {
    console.log(`[Reflection] Not enough memories (${nonReflectionMemories.length} < ${REFLECTION_MIN_MEMORIES})`);
    return false;
  }

  // Check if there's a recent reflection
  const recentReflection = memories
    .filter((m) => m.type === 'reflection')
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  if (recentReflection) {
    const timeSinceLastReflection = Date.now() - recentReflection.createdAt;
    if (timeSinceLastReflection < REFLECTION_MIN_INTERVAL_MS) {
      console.log(`[Reflection] Recent reflection exists (${Math.round(timeSinceLastReflection / 60000)}min ago)`);
      return false;
    }
  }

  // Check if there are important new memories since last reflection
  const lastReflectionTime = recentReflection?.createdAt || 0;
  const newImportantMemories = nonReflectionMemories.filter(
    (m) => m.createdAt > lastReflectionTime && m.importance >= REFLECTION_IMPORTANCE_THRESHOLD
  );

  if (newImportantMemories.length < 3) {
    console.log(`[Reflection] Not enough new important memories (${newImportantMemories.length} < 3)`);
    return false;
  }

  console.log(`[Reflection] Should reflect for employee ${employeeId}`);
  return true;
}

/**
 * Collect memories suitable for reflection.
 * Returns recent, important, non-reflection memories.
 */
export async function collectMemoriesForReflection(
  employeeId: string
): Promise<MemoryRecord[]> {
  const memories = getEmployeeMemories(employeeId);

  // Get the most recent reflection time
  const recentReflection = memories
    .filter((m) => m.type === 'reflection')
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  const lastReflectionTime = recentReflection?.createdAt || 0;

  // Filter: not reflection type, important enough, and either new or high importance
  const candidates = memories.filter((m) => {
    if (m.type === 'reflection') return false;
    if (m.importance < REFLECTION_IMPORTANCE_THRESHOLD) return false;

    // Include if created after last reflection OR if importance is very high
    const isNew = m.createdAt > lastReflectionTime;
    const isVeryImportant = m.importance >= 7;

    return isNew || isVeryImportant;
  });

  // Sort by importance descending, then by date
  candidates.sort((a, b) => {
    if (b.importance !== a.importance) {
      return b.importance - a.importance;
    }
    return b.createdAt - a.createdAt;
  });

  // Limit to max memories
  return candidates.slice(0, REFLECTION_MAX_MEMORIES);
}

/**
 * Get the timestamp of the last reflection for an employee.
 */
export function getLastReflectionTime(employeeId: string): number | null {
  const memories = getEmployeeMemories(employeeId);
  const reflections = memories.filter((m) => m.type === 'reflection');

  if (reflections.length === 0) return null;

  return reflections.sort((a, b) => b.createdAt - a.createdAt)[0].createdAt;
}

/**
 * Get reflection statistics for an employee.
 */
export function getReflectionStats(employeeId: string): {
  totalReflections: number;
  lastReflectionTime: number | null;
  memoriesSinceLastReflection: number;
} {
  const memories = getEmployeeMemories(employeeId);
  const reflections = memories.filter((m) => m.type === 'reflection');

  const lastReflectionTime = reflections.length > 0
    ? reflections.sort((a, b) => b.createdAt - a.createdAt)[0].createdAt
    : null;

  const memoriesSinceLastReflection = lastReflectionTime
    ? memories.filter((m) => m.createdAt > lastReflectionTime && m.type !== 'reflection').length
    : memories.filter((m) => m.type !== 'reflection').length;

  return {
    totalReflections: reflections.length,
    lastReflectionTime,
    memoriesSinceLastReflection,
  };
}
