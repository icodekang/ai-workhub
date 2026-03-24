// Shared types for AI-WorkHub

export interface Employee {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'member' | 'guest';
  teamId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  leaderId: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  teamId?: string;
  dueDate?: string;
  tags?: string[];
  workProductId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'channel';
  name?: string;
  participantIds: string[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'system';
  createdAt: string;
}

export interface WorkProduct {
  id: string;
  title: string;
  description?: string;
  type: 'document' | 'code' | 'image' | 'data' | 'other';
  url?: string;
  mimeType?: string;
  size?: number;
  ownerId: string;
  teamId?: string;
  taskId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
