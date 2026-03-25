/**
 * Conversation Types
 *
 * Shared type definitions for Conversation entities
 */

export interface Conversation {
  id: string;
  roomType: 'direct' | 'team';
  roomId: string;
  createdAt: number;
  participants?: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: 'user' | 'agent';
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: number;
}

export interface CreateConversationInput {
  type: 'direct' | 'team';
  initiatorId?: string;
  recipientId?: string;
  teamId?: string;
}

export interface SendMessageInput {
  senderId: string;
  senderType: 'user' | 'agent';
  content: string;
}
