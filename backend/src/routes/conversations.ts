/**
 * Conversation Routes - REST API for agent-to-agent conversations
 *
 * Endpoints:
 * - POST   /api/conversations              - Create/start a conversation
 * - GET    /api/conversations/:id          - Get conversation details
 * - DELETE /api/conversations/:id          - End a conversation
 * - GET    /api/conversations/:id/messages - Get conversation messages
 * - POST   /api/conversations/:id/messages - Send a message (user or agent)
 * - POST   /api/conversations/:id/continue - Agent continues conversation (auto-generate response)
 * - POST   /api/conversations/:id/leave    - Leave/end conversation
 */

import { Router, Request, Response } from 'express';
import {
  startConversationMessage,
  continueConversationMessage,
  continueWithUserMessage,
  leaveConversationMessage,
  createDirectConversation,
  createTeamConversation,
  getConversation,
  getConversationsByRoom,
  getConversationMessages,
  getRecentMessages,
  getEmployeeData,
  getTeamData,
} from '../agents/conversation';

import {
  searchMessages,
  getMessagesByParticipant,
  getMessagesByRoom,
  getMessageStats,
  exportConversationMessages,
  type MessageSearchOptions,
} from '../services/message-log.service';

const router = Router();

// ─── Create Conversation ─────────────────────────────────────────────────────

// POST /api/conversations - Start a new conversation
router.post('/', async (req: Request, res: Response) => {
  const { type, participants, teamId, initiatorId, recipientId } = req.body;

  try {
    if (type === 'direct') {
      // Direct conversation between two employees
      if (!initiatorId || !recipientId) {
        return res.status(400).json({ error: 'initiatorId and recipientId are required for direct conversations' });
      }

      // Validate employees exist
      const initiator = getEmployeeData(initiatorId);
      const recipient = getEmployeeData(recipientId);
      if (!initiator) {
        return res.status(404).json({ error: `Initiator not found: ${initiatorId}` });
      }
      if (!recipient) {
        return res.status(404).json({ error: `Recipient not found: ${recipientId}` });
      }

      // Create conversation
      const conversation = createDirectConversation(initiatorId, recipientId);

      // Generate opening message
      const greeting = await startConversationMessage(initiatorId, recipientId, conversation.id);

      return res.status(201).json({
        conversation,
        greeting,
      });
    } else if (type === 'team') {
      // Team conversation
      if (!teamId) {
        return res.status(400).json({ error: 'teamId is required for team conversations' });
      }

      const team = getTeamData(teamId);
      if (!team) {
        return res.status(404).json({ error: `Team not found: ${teamId}` });
      }

      const conversation = createTeamConversation(teamId);

      return res.status(201).json({
        conversation,
        greeting: null, // Team conversations don't auto-generate greeting
      });
    } else {
      return res.status(400).json({ error: 'Invalid conversation type. Must be "direct" or "team"' });
    }
  } catch (err: any) {
    console.error('[ConversationRoutes] POST /api/conversations error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Get Conversation ────────────────────────────────────────────────────────

// GET /api/conversations/:id - Get conversation details
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const conversation = getConversation(id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  return res.status(200).json(conversation);
});

// ─── Delete / End Conversation ──────────────────────────────────────────────

// DELETE /api/conversations/:id - End a conversation
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { leaverId } = req.body;

  if (!leaverId) {
    return res.status(400).json({ error: 'leaverId is required in request body' });
  }

  try {
    const farewell = await leaveConversationMessage(id, leaverId);
    return res.status(200).json({ farewell, conversationEnded: true });
  } catch (err: any) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    console.error('[ConversationRoutes] DELETE /api/conversations/:id error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Messages ────────────────────────────────────────────────────────────────

// GET /api/conversations/:id/messages - Get conversation messages
router.get('/:id/messages', (req: Request, res: Response) => {
  const { id } = req.params;
  const { limit } = req.query;

  const conversation = getConversation(id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const messages =
    typeof limit === 'string'
      ? getRecentMessages(id, parseInt(limit, 10))
      : getConversationMessages(id);

  return res.status(200).json({ messages });
});

// POST /api/conversations/:id/messages - Send a message in a conversation
router.post('/:id/messages', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { senderId, senderType, content } = req.body;

  if (!senderId || !content) {
    return res.status(400).json({ error: 'senderId and content are required' });
  }

  if (!['user', 'agent'].includes(senderType)) {
    return res.status(400).json({ error: 'senderType must be "user" or "agent"' });
  }

  const conversation = getConversation(id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // Verify sender is a participant
  if (!conversation.participants.includes(senderId)) {
    return res.status(403).json({ error: 'Sender is not a participant in this conversation' });
  }

  try {
    if (senderType === 'user') {
      // User message - auto-generate agent response
      const { userMsgId, agentResponse } = await continueWithUserMessage(id, senderId, content);
      return res.status(201).json({
        userMessage: { id: userMsgId, senderId, content },
        agentResponse,
      });
    } else {
      // Agent message - just store it
      const { createMessage } = await import('../agents/conversation');
      const msg = createMessage(id, senderId, senderType, content);
      return res.status(201).json({ message: msg });
    }
  } catch (err: any) {
    console.error('[ConversationRoutes] POST /api/conversations/:id/messages error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Agent Continue ───────────────────────────────────────────────────────────

// POST /api/conversations/:id/continue - Agent continues the conversation (auto-generate)
router.post('/:id/continue', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { speakerId } = req.body;

  if (!speakerId) {
    return res.status(400).json({ error: 'speakerId is required' });
  }

  const conversation = getConversation(id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // Verify speaker is a participant
  if (!conversation.participants.includes(speakerId)) {
    return res.status(403).json({ error: 'Speaker is not a participant in this conversation' });
  }

  try {
    const response = await continueConversationMessage(id, speakerId);
    return res.status(200).json({ response });
  } catch (err: any) {
    console.error('[ConversationRoutes] POST /api/conversations/:id/continue error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Leave Conversation ───────────────────────────────────────────────────────

// POST /api/conversations/:id/leave - Leave a conversation with a farewell
router.post('/:id/leave', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { leaverId, storeMemory } = req.body;

  if (!leaverId) {
    return res.status(400).json({ error: 'leaverId is required' });
  }

  const conversation = getConversation(id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  // Verify leaver is a participant
  if (!conversation.participants.includes(leaverId)) {
    return res.status(403).json({ error: 'Leaver is not a participant in this conversation' });
  }

  try {
    const farewell = await leaveConversationMessage(
      id,
      leaverId,
      storeMemory !== false // default to true
    );
    return res.status(200).json({
      farewell,
      conversationEnded: true,
    });
  } catch (err: any) {
    console.error('[ConversationRoutes] POST /api/conversations/:id/leave error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── List Conversations ───────────────────────────────────────────────────────

// GET /api/conversations - List conversations for a room or employee
router.get('/', (req: Request, res: Response) => {
  const { type, roomId, employeeId } = req.query;

  if (type === 'direct' && employeeId) {
    // Get all direct conversations involving an employee
    // This requires scanning - for now return empty as we need a helper
    return res.status(200).json({ conversations: [] });
  } else if (type === 'team' && roomId) {
    const conversations = getConversationsByRoom('team', roomId as string);
    return res.status(200).json({ conversations });
  }

  return res.status(400).json({ error: 'Provide type + roomId or type + employeeId' });
});

// ─── Message Logging (TASK-4.1) ────────────────────────────────────────────────

// GET /api/messages/search - Search messages with filters
router.get('/messages/search', (req: Request, res: Response) => {
  const {
    query,
    conversationId,
    senderId,
    senderType,
    participantId,
    startTime,
    endTime,
    page,
    limit,
  } = req.query;

  const options: MessageSearchOptions = {};

  if (typeof query === 'string') options.query = query;
  if (typeof conversationId === 'string') options.conversationId = conversationId;
  if (typeof senderId === 'string') options.senderId = senderId;
  if (senderType === 'user' || senderType === 'agent') options.senderType = senderType;
  if (typeof participantId === 'string') options.participantId = participantId;
  if (typeof startTime === 'string') options.startTime = parseInt(startTime, 10);
  if (typeof endTime === 'string') options.endTime = parseInt(endTime, 10);

  const result = searchMessages(options, {
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 20,
  });

  return res.status(200).json(result);
});

// GET /api/messages/participant/:participantId - Get messages for a participant
router.get('/messages/participant/:participantId', (req: Request, res: Response) => {
  const { participantId } = req.params;
  const { page, limit } = req.query;

  const result = getMessagesByParticipant(participantId, {
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 20,
  });

  return res.status(200).json(result);
});

// GET /api/messages/room/:type/:roomId - Get messages for a room
router.get('/messages/room/:type/:roomId', (req: Request, res: Response) => {
  const { type, roomId } = req.params;
  const { page, limit } = req.query;

  if (type !== 'direct' && type !== 'team') {
    return res.status(400).json({ error: 'Room type must be "direct" or "team"' });
  }

  const result = getMessagesByRoom(type as 'direct' | 'team', roomId, {
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 20,
  });

  return res.status(200).json(result);
});

// GET /api/messages/stats - Get message statistics
router.get('/messages/stats', (req: Request, res: Response) => {
  const { conversationId, participantId, startTime, endTime } = req.query;

  const options: MessageSearchOptions = {};
  if (typeof conversationId === 'string') options.conversationId = conversationId;
  if (typeof participantId === 'string') options.participantId = participantId;
  if (typeof startTime === 'string') options.startTime = parseInt(startTime, 10);
  if (typeof endTime === 'string') options.endTime = parseInt(endTime, 10);

  const stats = getMessageStats(options);
  return res.status(200).json(stats);
});

// GET /api/messages/export/:conversationId - Export conversation messages
router.get('/messages/export/:conversationId', (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { format } = req.query;

  const conversation = getConversation(conversationId);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const exportFormat = (format === 'text' ? 'text' : 'json');
  const { content, filename } = exportConversationMessages(conversationId, exportFormat);

  res.setHeader('Content-Type', exportFormat === 'json' ? 'application/json' : 'text/plain');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(content);
});

export default router;
