/**
 * Reflection System - Main Entry Point
 *
 * Enables AI employees to reflect on their memories and generate insights.
 * Based on AI Town's reflectOnMemories() architecture.
 *
 * Flow:
 * 1. Check if reflection should be triggered (shouldReflect)
 * 2. Collect relevant memories (collectMemoriesForReflection)
 * 3. Use LLM to analyze and generate insights (generateReflectionInsights)
 * 4. Store reflection as a special memory type
 */

import { shouldReflect as checkShouldReflect, collectMemoriesForReflection as getReflectionMemories, getReflectionStats } from './trigger';
import { generateReflectionInsights, generateBriefReflection } from './analyze';
import { buildReflectionPrompt, parseReflectionResponse } from './prompts';
import type { MemoryRecord } from '../memory/types';

/**
 * Main entry point: trigger reflection for an employee.
 * Returns the created reflection memory records.
 */
export async function reflectOnMemories(
  employeeId: string,
  identity?: string
): Promise<MemoryRecord[]> {
  console.log(`[Reflection] Starting reflection for employee ${employeeId}`);

  // Check if reflection should be triggered
  const shouldDoReflection = await checkShouldReflect(employeeId);
  if (!shouldDoReflection) {
    console.log(`[Reflection] Reflection not needed for employee ${employeeId}`);
    return [];
  }

  // Collect memories to reflect on
  const memories = await getReflectionMemories(employeeId);
  if (memories.length === 0) {
    console.log(`[Reflection] No suitable memories for reflection`);
    return [];
  }

  // Generate reflection insights
  const reflectionMemories = await generateReflectionInsights(employeeId, memories, identity);

  console.log(`[Reflection] Created ${reflectionMemories.length} reflection memory for employee ${employeeId}`);

  return reflectionMemories;
}

// Re-export for convenience
export { shouldReflect as checkShouldReflect } from './trigger';
export { collectMemoriesForReflection as getMemoriesForReflection } from './trigger';
export { getReflectionStats } from './trigger';
export { generateReflectionInsights, generateBriefReflection } from './analyze';
export { buildReflectionPrompt, parseReflectionResponse } from './prompts';
