/**
 * Message Logging Service
 *
 * Part of TASK-4.1 - Message Logging System
 *
 * Features:
 * - All messages logged with timestamp
 * - Participant tracking
 * - Searchable by participant/time
 * - Pagination support
 */

import * as db from '../storage/db';
import type { Message } from '../storage/db';

export interface MessageLog {
  id: string;
  conversationId: string;
  senderType: 'user' | 'agent';
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: number;
}

export interface MessageSearchOptions {
  query?: string;          // Search in message content
  conversationId?: string;
  senderId?: string;
  senderType?: 'user' | 'agent';
  participantId?: string;   // Filter by conversation participant
  roomType?: 'direct' | 'team';
  roomId?: string;
  startTime?: number;      // Unix timestamp (ms)
  endTime?: number;        // Unix timestamp (ms)
}

export interface PaginatedMessages {
  messages: MessageLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Convert a DB Message to MessageLog format
 */
function toMessageLog(msg: Message, senderName?: string): MessageLog {
  return {
    id: msg.id,
    conversationId: msg.conversation_id,
    senderType: msg.sender_type,
    senderId: msg.sender_id,
    senderName,
    content: msg.content,
    createdAt: msg.created_at,
  };
}

/**
 * Search messages with filtering and pagination
 */
export function searchMessages(
  options: MessageSearchOptions,
  pagination: { page?: number; limit?: number } = {}
): PaginatedMessages {
  const { page = 1, limit = 20 } = pagination;
  const offset = (page - 1) * limit;

  // Build query conditions
  const conditions: string[] = [];
  const params: any[] = [];

  // Text search in content (simple LIKE for SQLite)
  if (options.query) {
    conditions.push('content LIKE ?');
    params.push(`%${options.query}%`);
  }

  // Filter by conversation
  if (options.conversationId) {
    conditions.push('conversation_id = ?');
    params.push(options.conversationId);
  }

  // Filter by sender
  if (options.senderId) {
    conditions.push('sender_id = ?');
    params.push(options.senderId);
  }

  // Filter by sender type
  if (options.senderType) {
    conditions.push('sender_type = ?');
    params.push(options.senderType);
  }

  // Filter by time range
  if (options.startTime) {
    conditions.push('created_at >= ?');
    params.push(options.startTime);
  }
  if (options.endTime) {
    conditions.push('created_at <= ?');
    params.push(options.endTime);
  }

  // Build WHERE clause
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countSql = `SELECT COUNT(*) as count FROM messages ${whereClause}`;
  const countResult = db.getDb().prepare(countSql).get(...params) as { count: number };
  const total = countResult.count;

  // Get paginated results
  const dataSql = `
    SELECT * FROM messages 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const messages = db.getDb().prepare(dataSql).all(...params, limit, offset) as Message[];

  // Enrich with sender names
  const enrichedMessages = messages.map((msg) => {
    let senderName: string | undefined;
    const employee = db.getEmployeeById(msg.sender_id);
    if (employee) {
      senderName = employee.name;
    }
    return toMessageLog(msg, senderName);
  });

  return {
    messages: enrichedMessages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + messages.length < total,
    },
  };
}

/**
 * Get messages by conversation with pagination
 */
export function getConversationMessages(
  conversationId: string,
  pagination: { page?: number; limit?: number } = {}
): PaginatedMessages {
  return searchMessages(
    { conversationId },
    pagination
  );
}

/**
 * Get messages by participant (employee) with pagination
 */
export function getMessagesByParticipant(
  participantId: string,
  pagination: { page?: number; limit?: number } = {}
): PaginatedMessages {
  // Find all conversations where this participant is involved
  // For direct conversations, check room_id format "id1:id2"
  // For team conversations, check team_members table
  
  const directConvs = db.getDb().prepare(`
    SELECT id FROM conversations 
    WHERE room_type = 'direct' 
    AND (room_id LIKE ? OR room_id LIKE ?)
  `).all(`%${participantId}%`, `%${participantId}%`) as { id: string }[];

  const teamMembers = db.getDb().prepare(`
    SELECT team_id FROM team_members WHERE employee_id = ?
  `).all(participantId) as { team_id: string }[];

  const teamConvs = db.getDb().prepare(`
    SELECT id FROM conversations 
    WHERE room_type = 'team' 
    AND room_id IN (${teamMembers.map(() => '?').join(',')})
  `).all(...teamMembers.map(t => t.team_id)) as { id: string }[];

  const allConvIds = [...directConvs, ...teamConvs].map(c => c.id);

  if (allConvIds.length === 0) {
    return {
      messages: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false },
    };
  }

  // Build query for these conversations
  const placeholders = allConvIds.map(() => '?').join(',');
  const { page = 1, limit = 20 } = pagination;
  const offset = (page - 1) * limit;

  // Get total
  const countSql = `SELECT COUNT(*) as count FROM messages WHERE conversation_id IN (${placeholders})`;
  const countResult = db.getDb().prepare(countSql).get(...allConvIds) as { count: number };
  const total = countResult.count;

  // Get messages
  const dataSql = `
    SELECT * FROM messages 
    WHERE conversation_id IN (${placeholders})
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const messages = db.getDb().prepare(dataSql).all(...allConvIds, limit, offset) as Message[];

  // Enrich with sender names
  const enrichedMessages = messages.map((msg) => {
    let senderName: string | undefined;
    const employee = db.getEmployeeById(msg.sender_id);
    if (employee) {
      senderName = employee.name;
    }
    return toMessageLog(msg, senderName);
  });

  return {
    messages: enrichedMessages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + messages.length < total,
    },
  };
}

/**
 * Get messages by room (team or direct chat) with pagination
 */
export function getMessagesByRoom(
  roomType: 'direct' | 'team',
  roomId: string,
  pagination: { page?: number; limit?: number } = {}
): PaginatedMessages {
  // First get all conversations for this room
  const conversations = db.getDb().prepare(`
    SELECT id FROM conversations WHERE room_type = ? AND room_id = ?
  `).all(roomType, roomId) as { id: string }[];

  if (conversations.length === 0) {
    return {
      messages: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false },
    };
  }

  const convIds = conversations.map(c => c.id);
  const placeholders = convIds.map(() => '?').join(',');
  const { page = 1, limit = 20 } = pagination;
  const offset = (page - 1) * limit;

  // Get total
  const countSql = `SELECT COUNT(*) as count FROM messages WHERE conversation_id IN (${placeholders})`;
  const countResult = db.getDb().prepare(countSql).get(...convIds) as { count: number };
  const total = countResult.count;

  // Get messages
  const dataSql = `
    SELECT * FROM messages 
    WHERE conversation_id IN (${placeholders})
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const messages = db.getDb().prepare(dataSql).all(...convIds, limit, offset) as Message[];

  // Enrich with sender names
  const enrichedMessages = messages.map((msg) => {
    let senderName: string | undefined;
    const employee = db.getEmployeeById(msg.sender_id);
    if (employee) {
      senderName = employee.name;
    }
    return toMessageLog(msg, senderName);
  });

  return {
    messages: enrichedMessages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: offset + messages.length < total,
    },
  };
}

/**
 * Get message statistics for a conversation or participant
 */
export function getMessageStats(options: MessageSearchOptions): {
  totalMessages: number;
  bySender: Record<string, { count: number; name?: string }>;
  firstMessageAt: number | null;
  lastMessageAt: number | null;
} {
  const conditions: string[] = [];
  const params: any[] = [];

  if (options.conversationId) {
    conditions.push('conversation_id = ?');
    params.push(options.conversationId);
  }

  if (options.participantId) {
    // Get all conversations for this participant
    const participantConvs = getConversationIdsForParticipant(options.participantId);
    if (participantConvs.length === 0) {
      return { totalMessages: 0, bySender: {}, firstMessageAt: null, lastMessageAt: null };
    }
    const placeholders = participantConvs.map(() => '?').join(',');
    conditions.push(`conversation_id IN (${placeholders})`);
    params.push(...participantConvs);
  }

  if (options.startTime) {
    conditions.push('created_at >= ?');
    params.push(options.startTime);
  }
  if (options.endTime) {
    conditions.push('created_at <= ?');
    params.push(options.endTime);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Total count
  const totalResult = db.getDb().prepare(`SELECT COUNT(*) as count FROM messages ${whereClause}`).get(...params) as { count: number };

  // By sender
  const bySenderRaw = db.getDb().prepare(`
    SELECT sender_id, COUNT(*) as count 
    FROM messages 
    ${whereClause}
    GROUP BY sender_id
  `).all(...params) as { sender_id: string; count: number }[];

  const bySender: Record<string, { count: number; name?: string }> = {};
  for (const row of bySenderRaw) {
    const employee = db.getEmployeeById(row.sender_id);
    bySender[row.sender_id] = {
      count: row.count,
      name: employee?.name,
    };
  }

  // Time bounds
  const firstResult = db.getDb().prepare(`SELECT MIN(created_at) as min_ts FROM messages ${whereClause}`).get(...params) as { min_ts: number | null };
  const lastResult = db.getDb().prepare(`SELECT MAX(created_at) as max_ts FROM messages ${whereClause}`).get(...params) as { max_ts: number | null };

  return {
    totalMessages: totalResult.count,
    bySender,
    firstMessageAt: firstResult.min_ts,
    lastMessageAt: lastResult.max_ts,
  };
}

/**
 * Helper: Get all conversation IDs for a participant
 */
function getConversationIdsForParticipant(participantId: string): string[] {
  // Direct conversations
  const directConvs = db.getDb().prepare(`
    SELECT id FROM conversations 
    WHERE room_type = 'direct' 
    AND (room_id LIKE ? OR room_id LIKE ?)
  `).all(`%${participantId}%`, `%${participantId}%`) as { id: string }[];

  // Team conversations
  const teamMembers = db.getDb().prepare(`
    SELECT team_id FROM team_members WHERE employee_id = ?
  `).all(participantId) as { team_id: string }[];

  if (teamMembers.length === 0) {
    return directConvs.map(c => c.id);
  }

  const teamConvs = db.getDb().prepare(`
    SELECT id FROM conversations 
    WHERE room_type = 'team' 
    AND room_id IN (${teamMembers.map(() => '?').join(',')})
  `).all(...teamMembers.map(t => t.team_id)) as { id: string }[];

  return [...new Set([...directConvs.map(c => c.id), ...teamConvs.map(c => c.id)])];
}

/**
 * Export conversation messages as JSON
 */
export function exportConversationMessages(
  conversationId: string,
  format: 'json' | 'text' = 'json'
): { content: string; filename: string } {
  const messages = searchMessages({ conversationId }, { limit: 10000 });

  if (format === 'text') {
    const text = messages.messages
      .map(m => `[${new Date(m.createdAt).toISOString()}] ${m.senderName ?? m.senderId}: ${m.content}`)
      .join('\n');
    return {
      content: text,
      filename: `conversation_${conversationId}_${Date.now()}.txt`,
    };
  }

  return {
    content: JSON.stringify(messages.messages, null, 2),
    filename: `conversation_${conversationId}_${Date.now()}.json`,
  };
}
