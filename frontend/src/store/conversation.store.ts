/**
 * Conversation Store
 *
 * Zustand store for conversation state management
 */

import { create } from 'zustand';
import type { Conversation, Message } from '@/types/conversation';
import { api } from '@/lib/api';

interface ConversationState {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchConversations: () => Promise<void>;
  fetchConversation: (id: string) => Promise<Conversation | null>;
  createConversation: (input: any) => Promise<Conversation | null>;
  selectConversation: (conversation: Conversation | null) => void;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, message: any) => Promise<Message | null>;
  clearError: () => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  selectedConversation: null,
  messages: [],
  loading: false,
  error: null,

  fetchConversations: async () => {
    set({ loading: true, error: null });
    try {
      const conversations = await api.getConversations();
      set({ conversations, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch conversations', loading: false });
    }
  },

  fetchConversation: async (id: string) => {
    set({ loading: true, error: null });
    try {
      // Get conversation details
      const response = await fetch(`/api/conversations/${id}`);
      const conversation = await response.json();
      set({ selectedConversation: conversation, loading: false });
      return conversation;
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch conversation', loading: false });
      return null;
    }
  },

  createConversation: async (input: any) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      const conversation = data.conversation;
      set((state) => ({
        conversations: [...state.conversations, conversation],
        loading: false,
      }));
      return conversation;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create conversation', loading: false });
      return null;
    }
  },

  selectConversation: (conversation: Conversation | null) => {
    set({ selectedConversation: conversation });
    if (conversation) {
      get().fetchMessages(conversation.id);
    } else {
      set({ messages: [] });
    }
  },

  fetchMessages: async (conversationId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.getConversationMessages(conversationId);
      set({ messages: response.messages || [], loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch messages', loading: false });
    }
  },

  sendMessage: async (conversationId: string, message: any) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
      const data = await response.json();
      
      // Add the new message to messages
      set((state) => ({
        messages: [...state.messages, data.userMessage || data.message],
      }));
      
      return data.userMessage || data.message;
    } catch (err: any) {
      set({ error: err.message || 'Failed to send message' });
      return null;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
