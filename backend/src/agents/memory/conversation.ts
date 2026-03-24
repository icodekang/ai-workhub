/**
 * Conversation Memory
 *
 * Automatically store conversation summaries as memories.
 * Reference: AI Town convex/agent/memory.ts rememberConversation()
 */

import { storeMemory } from './store';
import { getMessagesByConversation } from '../../storage/db';
import type { MemoryRecord, ConversationMemoryData } from './types';

/**
 * Store a conversation as a memory for an employee.
 *
 * This is called after a conversation ends to capture what was discussed.
 * The summary should be AI-generated from the conversation messages.
 *
 * @param employeeId - The employee who participated in the conversation
 * @param conversationId - The conversation to remember
 * @param participantIds - All participant IDs in the conversation
 * @param summary - AI-generated summary of the conversation
 */
export async function rememberConversation(
  employeeId: string,
  conversationId: string,
  participantIds: string[],
  summary: string
): Promise<MemoryRecord> {
  // Filter out self from participant list
  const otherParticipants = participantIds.filter((id) => id !== employeeId);
  const participantLabel = otherParticipants.length > 0
    ? otherParticipants.join(', ')
    : 'themselves';

  const description = `Conversation with ${participantLabel}: ${summary}`;

  const data: ConversationMemoryData = {
    conversationId,
    participantIds: otherParticipants,
  };

  return storeMemory({
    employeeId,
    description,
    type: 'conversation',
    data,
  });
}

/**
 * Generate a summary of conversation messages using simple concatenation.
 * In production, this would use LLM summarization.
 *
 * @param messages - Array of message contents
 * @param maxLength - Max characters in summary
 */
export function generateConversationSummary(
  messages: Array<{ senderId: string; content: string }>,
  maxLength: number = 500
): string {
  if (messages.length === 0) {
    return 'Empty conversation';
  }

  // Simple concatenation with speaker labels
  const lines = messages.map((m) => `[${m.senderId.slice(0, 8)}]: ${m.content}`);
  const joined = lines.join(' | ');

  if (joined.length <= maxLength) {
    return joined;
  }

  return joined.slice(0, maxLength - 3) + '...';
}

/**
 * Remember a conversation by fetching messages and generating a summary.
 * Convenience function that handles the full flow.
 */
export async function rememberConversationFromId(
  employeeId: string,
  conversationId: string,
  participantIds: string[],
  summary?: string
): Promise<MemoryRecord> {
  // Generate summary if not provided
  const finalSummary = summary ?? (() => {
    const messages = getMessagesByConversation(conversationId);
    const contents = messages.map((m) => ({
      senderId: m.sender_id,
      content: m.content,
    }));
    return generateConversationSummary(contents);
  })();

  return rememberConversation(employeeId, conversationId, participantIds, finalSummary);
}
