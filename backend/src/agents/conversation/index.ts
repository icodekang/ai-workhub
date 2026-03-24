/**
 * Conversation System - Main Entry Point
 *
 * Agent-to-agent communication system inspired by AI Town.
 *
 * Features:
 * - Start conversations with AI-generated opening messages
 * - Continue conversations with context-aware responses
 * - Leave conversations with polite farewells
 * - Store conversation summaries as memories
 * - Full message history with timestamps
 *
 * Reference: AI Town convex/agent/conversation.ts
 *
 * @example
 * import { startConversationMessage, continueConversationMessage, leaveConversationMessage } from './conversation';
 *
 * // Start a conversation
 * const greeting = await startConversationMessage('emp_alice', 'emp_bob', 'conv_123');
 *
 * // Continue the conversation
 * const response = await continueConversationMessage('conv_123', 'emp_bob');
 *
 * // Leave the conversation
 * const farewell = await leaveConversationMessage('conv_123', 'emp_alice');
 */

// Main conversation functions
export { startConversationMessage, startConversation } from './start';
export { continueConversationMessage, continueWithUserMessage } from './continue';
export { leaveConversationMessage, leaveConversation } from './leave';

// Storage helpers (exposed for API layer)
export {
  createDirectConversation,
  createTeamConversation,
  getConversation,
  getConversationsByRoom,
  getLastDirectConversation,
  deleteConversation,
  createMessage,
  getConversationMessages,
  getRecentMessages,
  getEmployeeData,
  getTeamData,
  type ConversationWithParticipants,
  type MessageWithSender,
} from './storage';

// Memory integration
export { rememberConversation, summarizeConversationMessages } from './memory';

// Prompt helpers (exposed for testing/customization)
export {
  buildConversationIntro,
  buildConversationContinue,
  buildFarewellContext,
  agentPrompts,
  previousConversationPrompt,
  relatedMemoriesPrompt,
  stopWords,
  trimContentPrefix,
  NUM_MEMORIES_TO_SEARCH,
} from './prompts';
