/**
 * Start Conversation Message
 *
 * Generate an opening greeting when an agent initiates a conversation.
 * Reference: AI Town convex/agent/conversation.ts startConversationMessage()
 */

import { chat, fetchEmbedding } from '../../core/llm';
import { searchMemories } from '../memory/search';
import { getEmployeeData, getLastDirectConversation, createMessage } from './storage';
import {
  buildConversationIntro,
  stopWords,
  trimContentPrefix,
  NUM_MEMORIES_TO_SEARCH,
} from './prompts';
import type { LLMMessage } from '../../core/llm/types';

/**
 * Start a new conversation between two agents and generate the opening message.
 *
 * @param initiatorId - The employee ID of the conversation initiator
 * @param recipientId - The employee ID of the conversation recipient
 * @param conversationId - The conversation ID to store the message
 * @returns The generated opening message content
 */
export async function startConversationMessage(
  initiatorId: string,
  recipientId: string,
  conversationId: string
): Promise<string> {
  // Step 1: Get both agents' data
  const initiator = getEmployeeData(initiatorId);
  const recipient = getEmployeeData(recipientId);

  if (!initiator) {
    throw new Error(`Initiator employee not found: ${initiatorId}`);
  }
  if (!recipient) {
    throw new Error(`Recipient employee not found: ${recipientId}`);
  }

  // Step 2: Get related memories for the initiator
  let relatedMemories: any[] = [];
  try {
    const embedding = await import('../../core/llm').then((m) =>
      m.fetchEmbedding(`${initiator.name} is talking to ${recipient.name}`)
    );
    relatedMemories = await searchMemories({
      query: `${initiator.name} conversation with ${recipient.name}`,
      employeeId: initiatorId,
      limit: NUM_MEMORIES_TO_SEARCH,
    });
  } catch (err) {
    console.warn('[startConversationMessage] Memory search failed:', err);
  }

  // Step 3: Check for previous conversation
  const lastConversation = getLastDirectConversation(initiatorId, recipientId);

  // Step 4: Check if there's a previous conversation memory
  const includePreviousHint = relatedMemories.some(
    (m: any) =>
      m.type === 'conversation' &&
      m.data?.participantIds?.includes(recipientId)
  );

  // Step 5: Build the prompt
  const promptParts = buildConversationIntro(
    initiator.name,
    recipient.name,
    new Date(),
    { identity: recipient.identity, plan: recipient.plan },
    { identity: initiator.identity, plan: initiator.plan },
    relatedMemories,
    lastConversation,
    includePreviousHint
  );

  const prompt = promptParts.join('\n');

  // Step 6: Generate the response
  const messages: LLMMessage[] = [{ role: 'system', content: prompt }];

  const stop = stopWords(recipient.name, initiator.name);

  try {
    const content = await chat(messages, {
      max_tokens: 300,
      temperature: initiator.temperature,
      stop,
    });

    const trimmed = trimContentPrefix(content, `${initiator.name} to ${recipient.name}:`);

    // Step 7: Store the opening message
    createMessage(conversationId, initiatorId, 'agent', trimmed);

    return trimmed;
  } catch (err) {
    console.error('[startConversationMessage] Chat completion failed:', err);
    throw err;
  }
}

/**
 * Start a conversation and return both the message and conversation ID.
 * Convenience wrapper for the common case.
 */
export async function startConversation(
  initiatorId: string,
  recipientId: string
): Promise<{ conversationId: string; message: string }> {
  const { createDirectConversation } = await import('./storage');
  const { v4: uuidv4 } = await import('uuid');

  const conversation = createDirectConversation(initiatorId, recipientId);
  const message = await startConversationMessage(initiatorId, recipientId, conversation.id);

  return { conversationId: conversation.id, message };
}
