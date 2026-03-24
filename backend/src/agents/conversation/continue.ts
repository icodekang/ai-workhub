/**
 * Continue Conversation Message
 *
 * Generate a continuation message when an agent responds in an existing conversation.
 * Reference: AI Town convex/agent/conversation.ts continueConversationMessage()
 */

import { chat } from '../../core/llm';
import { searchMemories } from '../memory/search';
import {
  getConversation,
  getConversationMessages,
  getEmployeeData,
  createMessage,
} from './storage';
import {
  buildConversationContinue,
  stopWords,
  trimContentPrefix,
  NUM_MEMORIES_TO_SEARCH,
} from './prompts';
import type { LLMMessage } from '../../core/llm/types';

/**
 * Continue an existing conversation by generating a response from the speaker.
 *
 * @param conversationId - The conversation to continue
 * @param speakerId - The employee ID of the agent generating the response
 * @returns The generated response content
 */
export async function continueConversationMessage(
  conversationId: string,
  speakerId: string
): Promise<string> {
  // Step 1: Get conversation and participants
  const conversation = getConversation(conversationId);
  if (!conversation) {
    throw new Error(`Conversation not found: ${conversationId}`);
  }

  const otherParticipantId = conversation.participants.find((p) => p !== speakerId);
  if (!otherParticipantId) {
    throw new Error(`Speaker ${speakerId} is not a participant in conversation ${conversationId}`);
  }

  // Step 2: Get agent data
  const speaker = getEmployeeData(speakerId);
  const other = getEmployeeData(otherParticipantId);

  if (!speaker) {
    throw new Error(`Speaker employee not found: ${speakerId}`);
  }
  if (!other) {
    throw new Error(`Other participant employee not found: ${otherParticipantId}`);
  }

  // Step 3: Get memories related to the other person
  let relatedMemories: any[] = [];
  try {
    relatedMemories = await searchMemories({
      query: `What do you think about ${other.name}?`,
      employeeId: speakerId,
      limit: NUM_MEMORIES_TO_SEARCH,
    });
  } catch (err) {
    console.warn('[continueConversationMessage] Memory search failed:', err);
  }

  // Step 4: Get conversation history
  const messages = getConversationMessages(conversationId);

  // Step 5: Build the prompt
  const startedAt = new Date(conversation.created_at);

  const promptParts = buildConversationContinue(
    speaker.name,
    other.name,
    startedAt,
    { identity: other.identity, plan: other.plan },
    { identity: speaker.identity, plan: speaker.plan },
    relatedMemories,
    true // include greeting reminder: DO NOT greet them again
  );

  // Step 6: Build message history for LLM
  const llmMessages: LLMMessage[] = [{ role: 'system', content: promptParts.join('\n') }];

  // Add conversation history
  for (const msg of messages) {
    const author = msg.sender_id === speakerId ? speaker : other;
    const recipient = msg.sender_id === speakerId ? other : speaker;
    llmMessages.push({
      role: 'user',
      content: `${author.name} to ${recipient.name}: ${msg.content}`,
    });
  }

  llmMessages.push({ role: 'user', content: `${speaker.name} to ${other.name}:` });

  // Step 7: Generate response
  const stop = stopWords(other.name, speaker.name);

  try {
    const content = await chat(llmMessages, {
      max_tokens: 300,
      temperature: speaker.temperature,
      stop,
    });

    const trimmed = trimContentPrefix(content, `${speaker.name} to ${other.name}:`);

    // Step 8: Store the message
    createMessage(conversationId, speakerId, 'agent', trimmed);

    return trimmed;
  } catch (err) {
    console.error('[continueConversationMessage] Chat completion failed:', err);
    throw err;
  }
}

/**
 * Send a user message in a conversation and auto-generate an agent response.
 * This is useful for simulating a full conversation where the user speaks
 * and the agent responds.
 *
 * @param conversationId - The conversation ID
 * @param userId - The user/employee sending the message
 * @param userMessage - The message content
 * @returns The agent's generated response
 */
export async function continueWithUserMessage(
  conversationId: string,
  userId: string,
  userMessage: string
): Promise<{ userMsgId: string; agentResponse: string }> {
  // Store the user's message
  const userMsg = createMessage(conversationId, userId, 'user', userMessage);

  // Generate agent response
  const agentResponse = await continueConversationMessage(conversationId, userId);

  return { userMsgId: userMsg.id, agentResponse };
}
