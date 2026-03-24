/**
 * Conversation Memory - Store conversation summaries as memories
 *
 * Reference: AI Town convex/agent/memory.ts rememberConversation()
 */

import { chat } from '../../core/llm';
import { storeMemory } from '../memory/store';
import { getConversationMessages } from './storage';
import type { MemoryRecord, ConversationMemoryData } from '../memory/types';

/**
 * Generate a conversation summary using the LLM.
 * This summarizes what was discussed in the conversation.
 *
 * @param messages - Array of messages with sender info
 * @param participantNames - Map of participant IDs to names
 * @param maxLength - Max characters for the summary
 */
export async function summarizeConversationMessages(
  messages: Array<{ senderId: string; senderName?: string; content: string; createdAt: number }>,
  participantNames: Record<string, string>,
  maxLength: number = 400
): Promise<string> {
  if (messages.length === 0) {
    return 'Empty conversation - no messages were exchanged.';
  }

  // Format messages for summarization
  const formattedMessages = messages.map((m) => {
    const name = m.senderName ?? participantNames[m.senderId] ?? m.senderId.slice(0, 8);
    const time = new Date(m.createdAt).toLocaleTimeString();
    return `[${time}] ${name}: ${m.content}`;
  });

  const conversationText = formattedMessages.join('\n');

  // If short enough, just join them
  if (conversationText.length <= maxLength) {
    return conversationText;
  }

  // Use LLM to summarize for longer conversations
  try {
    const summaryPrompt = `Summarize the following conversation in 2-3 sentences. Focus on the key topics discussed and any important conclusions or action items.\n\n${conversationText.slice(0, 2000)}`;

    const summary = await chat(
      [
        {
          role: 'user',
          content: summaryPrompt,
        },
      ],
      { max_tokens: 150, temperature: 0.5 }
    );

    return summary.trim();
  } catch (err) {
    // Fallback to simple truncation
    console.warn('[summarizeConversation] LLM summarization failed, using truncation:', err);
    return conversationText.slice(0, maxLength - 3) + '...';
  }
}

/**
 * Store a conversation as a memory for each participant.
 *
 * This is called after a conversation ends to capture what was discussed.
 *
 * @param conversationId - The conversation to remember
 * @param participantIds - All participant IDs in the conversation
 * @param summary - Optional pre-generated summary
 */
export async function rememberConversation(
  conversationId: string,
  participantIds: string[],
  summary?: string
): Promise<MemoryRecord[]> {
  // Get messages for summarization
  const messages = getConversationMessages(conversationId);

  // Get participant names
  const participantNames: Record<string, string> = {};
  for (const pid of participantIds) {
    // Lazy import to avoid circular dependency
    const { getEmployeeData } = await import('./storage');
    const emp = getEmployeeData(pid);
    if (emp) {
      participantNames[pid] = emp.name;
    }
  }

  // Generate summary if not provided
  const finalSummary =
    summary ??
    (await summarizeConversationMessages(
      messages.map((m) => ({
        senderId: m.sender_id,
        senderName: m.senderName,
        content: m.content,
        createdAt: m.created_at,
      })),
      participantNames
    ));

  // Store a memory for each participant
  const records: MemoryRecord[] = [];

  for (const participantId of participantIds) {
    const otherParticipants = participantIds.filter((id) => id !== participantId);
    const participantLabel =
      otherParticipants.length > 0
        ? otherParticipants
            .map((id) => participantNames[id] ?? id.slice(0, 8))
            .join(', ')
        : 'themselves';

    const description = `Conversation with ${participantLabel}: ${finalSummary}`;

    const data: ConversationMemoryData = {
      conversationId,
      participantIds: otherParticipants,
    };

    try {
      const record = await storeMemory({
        employeeId: participantId,
        description,
        type: 'conversation',
        data,
      });
      records.push(record);
    } catch (err) {
      console.error(`[rememberConversation] Failed to store memory for ${participantId}:`, err);
    }
  }

  return records;
}

/**
 * Quick helper to remember a conversation with a pre-computed summary.
 */
export async function rememberConversationWithSummary(
  conversationId: string,
  participantIds: string[],
  precomputedSummary: string
): Promise<MemoryRecord[]> {
  return rememberConversation(conversationId, participantIds, precomputedSummary);
}
