/**
 * Reflection System - LLM Analysis Module
 *
 * Uses LLM to analyze memories and generate reflection insights.
 * Reference: AI Town reflectOnMemories() - generateAgentInsights()
 */

import { chatCompletion } from '../../core/llm';
import { calculateImportance } from '../memory/importance';
import { storeMemory } from '../memory/store';
import type { MemoryRecord, ReflectionMemoryData } from '../memory/types';
import { buildReflectionPrompt, parseReflectionResponse } from './prompts';

const REFLECTION_MODEL = process.env.REFLECTION_MODEL || 'gpt-4';

/**
 * Generate reflection insights from a set of memories.
 * Returns the created reflection memory records.
 */
export async function generateReflectionInsights(
  employeeId: string,
  memories: MemoryRecord[],
  identity?: string
): Promise<MemoryRecord[]> {
  if (memories.length === 0) {
    console.log(`[Reflection] No memories to reflect on for employee ${employeeId}`);
    return [];
  }

  console.log(`[Reflection] Generating insights from ${memories.length} memories for employee ${employeeId}`);

  // Build prompt with memories
  const prompt = buildReflectionPrompt(memories, identity);

  // Call LLM to generate reflection
  let response: string;
  try {
    const result = await chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      model: REFLECTION_MODEL,
      temperature: 0.7,
      max_tokens: 1500,
    });
    response = result.content;
  } catch (err) {
    console.error(`[Reflection] LLM call failed:`, err);
    throw new Error('Failed to generate reflection insights');
  }

  console.log(`[Reflection] LLM response:\n${response.slice(0, 200)}...`);

  // Parse structured response
  const { insights, patterns, recommendations } = parseReflectionResponse(response);

  // Combine all parts into a coherent reflection
  const reflectionParts: string[] = [];
  if (insights.length > 0) {
    reflectionParts.push('## Insights\n' + insights.map((i) => `- ${i}`).join('\n'));
  }
  if (patterns.length > 0) {
    reflectionParts.push('## Patterns\n' + patterns.map((p) => `- ${p}`).join('\n'));
  }
  if (recommendations.length > 0) {
    reflectionParts.push('## Recommendations\n' + recommendations.map((r) => `- ${r}`).join('\n'));
  }
  const fullInsight = reflectionParts.join('\n\n');

  // Store the reflection as a memory
  const relatedMemoryIds = memories.map((m) => m.id);
  const reflectionData: ReflectionMemoryData = {
    relatedMemoryIds,
    insight: fullInsight,
  };

  // Calculate importance for the reflection (reflections are typically important)
  const importance = await calculateImportance(fullInsight);

  // Store reflection memory
  const reflectionMemory = await storeMemory({
    employeeId,
    description: fullInsight,
    type: 'reflection',
    data: reflectionData,
    importanceOverride: Math.max(importance, 5), // Reflections are at least moderately important
  });

  console.log(`[Reflection] Created reflection memory ${reflectionMemory.id} for employee ${employeeId}`);

  return [reflectionMemory];
}

/**
 * Generate a brief summary reflection from memories.
 * Used when quick reflection is needed.
 */
export async function generateBriefReflection(
  employeeId: string,
  memories: MemoryRecord[]
): Promise<string> {
  if (memories.length === 0) {
    return '';
  }

  const prompt = buildReflectionPrompt(memories);

  try {
    const result = await chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      model: REFLECTION_MODEL,
      temperature: 0.5,
      max_tokens: 500,
    });
    return result.content;
  } catch (err) {
    console.error(`[Reflection] Brief reflection failed:`, err);
    return '';
  }
}
