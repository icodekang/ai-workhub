/**
 * Leave Conversation Message
 *
 * Generate a farewell message when an agent leaves a conversation.
 * Reference: AI Town convex/agent/conversation.ts leaveConversationMessage()
 */

import { chat } from '../../core/llm';
import {
  getConversation,
  getEmployeeData,
  createMessage,
  deleteConversation,
} from './storage';
import { buildFarewellContext, stopWords, trimContentPrefix } from './prompts';
import { rememberConversation } from './memory';
import type { LLMMessage } from '../../core/llm/types';

/**
 * Leave a conversation and generate a farewell message.
 *
 * @param conversationId - The conversation to leave
 * @param leaverId - The employee ID of the person leaving
 * @param storeMemory - Whether to store the conversation as a memory (default: true)
 * @returns The generated farewell message content
 */
export async function leaveConversationMessage(
  conversationId: string,
  leaverId: string,
  storeMemory: boolean = true
): Promise<string> {
  // Step 1: Get conversation and participants
  const conversation = getConversation(conversationId);
  if (!conversation) {
    throw new Error(`Conversation not found: ${conversationId}`);
  }

  const otherParticipantId = conversation.participants.find((p) => p !== leaverId);
  if (!otherParticipantId) {
    throw new Error(`Leaver ${leaverId} is not a participant in conversation ${conversationId}`);
  }

  // Step 2: Get agent data
  const leaver = getEmployeeData(leaverId);
  const other = getEmployeeData(otherParticipantId);

  if (!leaver) {
    throw new Error(`Leaver employee not found: ${leaverId}`);
  }
  if (!other) {
    throw new Error(`Other participant employee not found: ${otherParticipantId}`);
  }

  // Step 3: Build the farewell prompt
  const promptParts = buildFarewellContext(
    leaver.name,
    other.name,
    { identity: other.identity, plan: other.plan },
    { identity: leaver.identity, plan: leaver.plan }
  );

  // Step 4: Generate the farewell message
  const messages: LLMMessage[] = [{ role: 'system', content: promptParts.join('\n') }];
  const stop = stopWords(other.name, leaver.name);

  try {
    const content = await chat(messages, {
      max_tokens: 200,
      temperature: leaver.temperature,
      stop,
    });

    const farewell = trimContentPrefix(content, `${leaver.name} to ${other.name}:`);

    // Step 5: Store the farewell message
    createMessage(conversationId, leaverId, 'agent', farewell);

    // Step 6: Store conversation memory if enabled
    if (storeMemory) {
      try {
        await rememberConversation(conversationId, conversation.participants);
      } catch (err) {
        console.warn('[leaveConversationMessage] Failed to store conversation memory:', err);
      }
    }

    // Step 7: Delete the conversation (cascade deletes messages)
    deleteConversation(conversationId);

    return farewell;
  } catch (err) {
    console.error('[leaveConversationMessage] Chat completion failed:', err);
    throw err;
  }
}

/**
 * End a conversation for one participant (they leave) and generate a farewell.
 * The conversation continues with the remaining participants if there are more than 2.
 *
 * @param conversationId - The conversation to leave
 * @param leaverId - The employee ID of the person leaving
 */
export async function leaveConversation(
  conversationId: string,
  leaverId: string
): Promise<{ farewell: string }> {
  const farewell = await leaveConversationMessage(conversationId, leaverId);
  return { farewell };
}
