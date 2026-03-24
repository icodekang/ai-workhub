/**
 * Conversation System - Prompt Building Helpers
 *
 * Reference: AI Town convex/agent/conversation.ts - prompt builders
 */

import type { LLMMessage } from '../../core/llm/types';
import type { MemoryRecord } from '../memory/types';

/**
 * Number of memories to include in conversation prompts (AI Town default: 3)
 */
export const NUM_MEMORIES_TO_SEARCH = 3;

/**
 * Build agent identity/plan prompts for conversation participants.
 */
export function agentPrompts(
  otherPlayerName: string,
  agent: { identity: string; plan: string } | null,
  otherAgent: { identity: string; plan: string } | null
): string[] {
  const prompt: string[] = [];
  if (agent) {
    prompt.push(`About you: ${agent.identity}`);
    prompt.push(`Your goals: ${agent.plan}`);
  }
  if (otherAgent) {
    prompt.push(`About ${otherPlayerName}: ${otherAgent.identity}`);
  }
  return prompt;
}

/**
 * Build a prompt about a previous conversation with the other participant.
 */
export function previousConversationPrompt(
  otherName: string,
  conversation: { created: number } | null
): string[] {
  if (!conversation) return [];

  const prev = new Date(conversation.created);
  const now = new Date();

  return [
    `Last time you chatted with ${otherName} it was ${prev.toLocaleString()}. It's now ${now.toLocaleString()}.`,
  ];
}

/**
 * Build a prompt section from related memories.
 */
export function relatedMemoriesPrompt(memories: MemoryRecord[]): string[] {
  if (!memories.length) return [];

  const prompt = ['Here are some related memories in decreasing relevance order:'];
  for (const memory of memories) {
    prompt.push(` - ${memory.description}`);
  }
  return prompt;
}

/**
 * Build stop words to prevent LLM from speaking as the other person.
 */
export function stopWords(otherName: string, myName: string): string[] {
  return [
    `${otherName} to ${myName}:`,
    `${otherName.toLowerCase()} to ${myName.toLowerCase()}:`,
  ];
}

/**
 * Trim the content prefix from a generated message.
 * AI Town format: "Alice to Bob: Hello there!"
 * We want to extract just "Hello there!"
 */
export function trimContentPrefix(content: string, prefix: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith(prefix)) {
    return trimmed.slice(prefix.length).trim();
  }
  return trimmed;
}

/**
 * Build the conversation intro context for starting a new conversation.
 */
export function buildConversationIntro(
  speakerName: string,
  otherName: string,
  startedAt: Date,
  otherAgent: { identity: string; plan: string } | null,
  speakerAgent: { identity: string; plan: string } | null,
  relatedMemories: MemoryRecord[],
  previousConversation: { created: number } | null,
  includePreviousHint: boolean
): string[] {
  const now = new Date();

  const prompt: string[] = [
    `You are ${speakerName}, and you just started a conversation with ${otherName}.`,
    `The conversation is starting now at ${now.toLocaleString()}.`,
    ...agentPrompts(otherName, speakerAgent, otherAgent),
    ...previousConversationPrompt(otherName, previousConversation),
    ...relatedMemoriesPrompt(relatedMemories),
  ];

  if (includePreviousHint) {
    prompt.push(`Be sure to include some detail or question about a previous conversation.`);
  }

  prompt.push(`${speakerName} to ${otherName}:`);

  return prompt;
}

/**
 * Build the conversation continuation context.
 */
export function buildConversationContinue(
  speakerName: string,
  otherName: string,
  startedAt: Date,
  otherAgent: { identity: string; plan: string } | null,
  speakerAgent: { identity: string; plan: string } | null,
  relatedMemories: MemoryRecord[],
  includeGreetingReminder: boolean
): string[] {
  const now = Date.now();
  const startDate = new Date(startedAt);

  const prompt: string[] = [
    `You are ${speakerName}, and you're currently in a conversation with ${otherName}.`,
    `The conversation started at ${startDate.toLocaleString()}. It's now ${new Date(now).toLocaleString()}.`,
    ...agentPrompts(otherName, speakerAgent, otherAgent),
    ...relatedMemoriesPrompt(relatedMemories),
    `Below is the current chat history.`,
  ];

  if (includeGreetingReminder) {
    prompt.push(`DO NOT greet them again. Your response should be brief and within 200 characters.`);
  }

  prompt.push(`${speakerName} to ${otherName}:`);

  return prompt;
}

/**
 * Build farewell context for leaving a conversation.
 */
export function buildFarewellContext(
  speakerName: string,
  otherName: string,
  otherAgent: { identity: string; plan: string } | null,
  speakerAgent: { identity: string; plan: string } | null
): string[] {
  return [
    `You are ${speakerName}, and you're currently in a conversation with ${otherName}.`,
    `You've decided to leave the conversation and would like to politely say goodbye.`,
    ...agentPrompts(otherName, speakerAgent, otherAgent),
    `How would you like to tell them that you're leaving? Brief, within 200 characters.`,
    `${speakerName} to ${otherName}:`,
  ];
}
