/**
 * Reflection System - Prompt Templates
 *
 * Based on AI Town reflectOnMemories() concept
 */

import type { MemoryRecord } from '../memory/types';

/**
 * Build a prompt for LLM to generate reflection insights from memories.
 */
export function buildReflectionPrompt(
  memories: MemoryRecord[],
  identity?: string
): string {
  const memoryList = memories
    .map((m, i) => {
      const date = new Date(m.createdAt).toLocaleDateString();
      return `[${i + 1}] ${date}: ${m.description} (importance: ${m.importance}/9)`;
    })
    .join('\n');

  const roleContext = identity ? `You are ${identity}. ` : '';

  return `${roleContext}You are an AI assistant that excels at reflection and generating insights.

## Your Task
Analyze the following memories and generate high-level insights. Look for:
- Patterns in behavior or decisions
- Emerging goals or motivations
- Relationships or connections
- Lessons learned or recommendations

## Memories to Analyze
${memoryList}

## Output Format
Provide your reflection in the following format:

### Key Insights
(List 2-4 high-level insights derived from these memories)

### Patterns Observed
(Describe any recurring patterns or themes)

### Recommendations
(Provide 1-2 actionable recommendations based on these insights)

Be thoughtful and analytical. Focus on insights that would help improve future decisions or actions.`;
}

/**
 * Build a brief prompt for checking if reflection should be triggered.
 */
export function buildReflectionCheckPrompt(memoryCount: number): string {
  return `You are evaluating whether an AI assistant should perform a reflection based on their memories.

Current memory count: ${memoryCount}
Minimum threshold: 5

Should reflection be triggered? Consider:
- Are there enough memories to derive meaningful insights?
- Have enough new memories accumulated since the last reflection?

Respond with ONLY "YES" or "NO" followed by a brief reason.`;
}

/**
 * Parse LLM reflection response to extract structured insights.
 */
export function parseReflectionResponse(
  response: string
): { insights: string[]; patterns: string[]; recommendations: string[] } {
  const insights: string[] = [];
  const patterns: string[] = [];
  const recommendations: string[] = [];

  const lines = response.split('\n');
  let currentSection: 'insights' | 'patterns' | 'recommendations' | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect section headers
    if (trimmed.toLowerCase().startsWith('### key insights') || trimmed.toLowerCase().startsWith('### insights')) {
      currentSection = 'insights';
      continue;
    }
    if (trimmed.toLowerCase().startsWith('### patterns') || trimmed.toLowerCase().startsWith('### pattern')) {
      currentSection = 'patterns';
      continue;
    }
    if (trimmed.toLowerCase().startsWith('### recommendations') || trimmed.toLowerCase().startsWith('### recommendation')) {
      currentSection = 'recommendations';
      continue;
    }

    // Parse bullet points or numbered items
    if (currentSection && (trimmed.startsWith('-') || trimmed.match(/^\d+\./))) {
      const content = trimmed.replace(/^-\s*/, '').replace(/^\d+\.\s*/, '').trim();
      if (content) {
        if (currentSection === 'insights') insights.push(content);
        else if (currentSection === 'patterns') patterns.push(content);
        else if (currentSection === 'recommendations') recommendations.push(content);
      }
    }
  }

  // If no structured output found, treat entire response as insight
  if (insights.length === 0 && response.trim()) {
    insights.push(response.trim());
  }

  return { insights, patterns, recommendations };
}
