/**
 * Memory Importance Calculator
 *
 * Uses LLM to evaluate memory importance on a 0-9 scale.
 * Based on AI Town's calculateImportance() function.
 *
 * Scale:
 *   0 = completely mundane (e.g., brushing teeth)
 *   5 = moderately notable (e.g., had lunch with colleague)
 *   9 = extremely poignant (e.g., break up, college acceptance, major life event)
 */

import { chatCompletion } from '../../core/llm';

const IMPORTANCE_MODEL = process.env.IMPORTANCE_MODEL || 'gpt-4';

/**
 * Evaluate the importance of a memory description using LLM.
 * Returns a score from 0-9.
 */
export async function calculateImportance(description: string): Promise<number> {
  const prompt = `Rate the importance of the following memory on a scale of 0-9:

Memory: ${description}

Scale:
- 0 = completely mundane (e.g., "brushed teeth", "drank water")
- 3 = minor event (e.g., "checked email", "walked to kitchen")
- 5 = moderately notable (e.g., "had lunch with colleague", "finished a routine task")
- 7 = significant (e.g., "got praised by manager", "completed a difficult project")
- 9 = extremely poignant (e.g., "break up", "college acceptance", "major life change")

Respond with ONLY a single number between 0 and 9. No explanation.`;

  try {
    const result = await chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      model: IMPORTANCE_MODEL,
      temperature: 0.0,
      max_tokens: 3,
    });

    const score = parseFloat(result.content.trim());
    if (isNaN(score) || score < 0 || score > 9) {
      console.warn(`[Importance] Invalid score "${result.content}", defaulting to 5`);
      return 5;
    }
    return score;
  } catch (err) {
    console.error(`[Importance] LLM call failed, defaulting to 5:`, err);
    return 5;
  }
}

/**
 * Batch calculate importance for multiple descriptions.
 * Uses sequential calls to avoid rate limiting.
 */
export async function calculateImportanceBatch(
  descriptions: string[]
): Promise<number[]> {
  return Promise.all(descriptions.map((d) => calculateImportance(d)));
}
