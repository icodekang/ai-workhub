/**
 * Conversation Storage - CRUD operations for conversations and messages
 *
 * Uses the existing database schema from ../../storage/db.ts
 */

import { v4 as uuidv4 } from 'uuid';
import * as db from '../../storage/db';
import type { Conversation, Message } from '../../storage/db';

// ============================================================
// Types
// ============================================================

export interface ConversationWithParticipants extends Conversation {
  participants: string[];
}

export interface MessageWithSender extends Message {
  senderName?: string;
}

// ============================================================
// Conversation CRUD
// ============================================================

/**
 * Create a new direct conversation between two employees.
 */
export function createDirectConversation(
  initiatorId: string,
  recipientId: string
): ConversationWithParticipants {
  const id = uuidv4();
  const conversation = db.createConversation({
    id,
    room_type: 'direct',
    room_id: `${initiatorId}:${recipientId}`,
  });

  return {
    ...conversation,
    participants: [initiatorId, recipientId],
  };
}

/**
 * Create a new team conversation.
 */
export function createTeamConversation(teamId: string): ConversationWithParticipants {
  const id = uuidv4();
  const conversation = db.createConversation({
    id,
    room_type: 'team',
    room_id: teamId,
  });

  // Get team members
  const members = db.getTeamMembers(teamId);
  const participantIds = members.map((m) => m.employee_id);

  return {
    ...conversation,
    participants: participantIds,
  };
}

/**
 * Get a conversation by ID with participant list.
 */
export function getConversation(conversationId: string): ConversationWithParticipants | undefined {
  const conversation = db.getConversationById(conversationId);
  if (!conversation) return undefined;

  // Get participants based on room type
  let participants: string[] = [];
  if (conversation.room_type === 'direct') {
    // room_id format: "emp1:emp2"
    participants = conversation.room_id.split(':');
  } else if (conversation.room_type === 'team') {
    const members = db.getTeamMembers(conversation.room_id);
    participants = members.map((m) => m.employee_id);
  }

  return { ...conversation, participants };
}

/**
 * Get all conversations for a given room (employee pair or team).
 */
export function getConversationsByRoom(
  roomType: 'direct' | 'team',
  roomId: string
): ConversationWithParticipants[] {
  const conversations = db.getConversationsByRoom(roomType, roomId);

  return conversations.map((conv) => {
    let participants: string[] = [];
    if (conv.room_type === 'direct') {
      participants = conv.room_id.split(':');
    } else if (conv.room_type === 'team') {
      const members = db.getTeamMembers(conv.room_id);
      participants = members.map((m) => m.employee_id);
    }
    return { ...conv, participants };
  });
}

/**
 * Get the most recent direct conversation between two employees.
 * Returns null if no previous conversation exists.
 */
export function getLastDirectConversation(
  employee1: string,
  employee2: string
): { id: string; created: number } | null {
  // Try both orderings
  const conv1 = db.getConversationsByRoom('direct', `${employee1}:${employee2}`);
  const conv2 = db.getConversationsByRoom('direct', `${employee2}:${employee1}`);

  const all = [...conv1, ...conv2].sort((a, b) => b.created_at - a.created_at);

  if (all.length === 0) return null;

  return { id: all[0].id, created: all[0].created_at };
}

/**
 * Delete a conversation and all its messages.
 */
export function deleteConversation(conversationId: string): boolean {
  return db.deleteConversation(conversationId);
}

// ============================================================
// Message CRUD
// ============================================================

/**
 * Store a new message in a conversation.
 */
export function createMessage(
  conversationId: string,
  senderId: string,
  senderType: 'user' | 'agent',
  content: string
): Message {
  return db.createMessage({
    id: uuidv4(),
    conversation_id: conversationId,
    sender_type: senderType,
    sender_id: senderId,
    content,
  });
}

/**
 * Get all messages for a conversation ordered by creation time.
 */
export function getConversationMessages(conversationId: string): MessageWithSender[] {
  const messages = db.getMessagesByConversation(conversationId);

  return messages.map((msg) => {
    // Try to get sender name
    let senderName: string | undefined;
    const employee = db.getEmployeeById(msg.sender_id);
    if (employee) {
      senderName = employee.name;
    }
    return { ...msg, senderName };
  });
}

/**
 * Get a single message by ID.
 */
export function getMessage(messageId: string): Message | undefined {
  return db.getMessageById(messageId);
}

/**
 * Delete a message.
 */
export function deleteMessage(messageId: string): boolean {
  return db.deleteMessage(messageId);
}

/**
 * Get the most recent N messages from a conversation.
 */
export function getRecentMessages(
  conversationId: string,
  limit: number = 10
): MessageWithSender[] {
  const all = getConversationMessages(conversationId);
  return all.slice(-limit);
}

// ============================================================
// Conversation Status Helpers
// ============================================================

/**
 * Get employee data by ID (helper to avoid circular imports).
 */
export function getEmployeeData(employeeId: string): {
  id: string;
  name: string;
  identity: string;
  plan: string;
  model: string;
  temperature: number;
} | null {
  const emp = db.getEmployeeById(employeeId);
  if (!emp) return null;
  return {
    id: emp.id,
    name: emp.name,
    identity: emp.identity ?? `You are ${emp.name}, a ${emp.role}.`,
    plan: emp.plan,
    model: emp.model,
    temperature: emp.temperature,
  };
}

/**
 * Get team data by ID (helper).
 */
export function getTeamData(teamId: string): {
  id: string;
  name: string;
  plan: string;
  memberIds: string[];
} | null {
  const team = db.getTeamById(teamId);
  if (!team) return null;
  const members = db.getTeamMembers(teamId);
  return {
    id: team.id,
    name: team.name,
    plan: team.plan,
    memberIds: members.map((m) => m.employee_id),
  };
}
