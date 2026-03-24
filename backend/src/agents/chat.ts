/**
 * Agent Chat Interface
 *
 * Provides chat functionality with context awareness (memory integration).
 */

import { agentRegistry, AgentRegistry } from './pi-mono/registry';
import { agentLifecycle } from './lifecycle';
import { PImonoAgent, AgentStatus } from './pi-mono/agent';
import { LLMMessage } from '../core/llm/types';
import * as db from '../storage/db';
import { v4 as uuidv4 } from 'uuid';

export interface ChatContext {
  taskId?: string;
  conversationId?: string;
}

export interface ChatResult {
  response: string;
  agentId: string;
  status: AgentStatus;
  memoriesUsed: number;
}

/**
 * Agent Chat - context-aware chat for AI agents
 */
export class AgentChat {
  constructor(
    private registry: AgentRegistry = agentRegistry,
    private lifecycle = agentLifecycle
  ) {}

  // ─── Main Chat Interface ────────────────────────────────────────────────────

  /**
   * Send a chat message to an agent with memory context.
   */
  async chat(
    employeeId: string,
    message: string,
    context?: ChatContext
  ): Promise<ChatResult> {
    let agent = this.registry.getByEmployeeId(employeeId);

    // Auto-start agent if not running
    if (!agent) {
      console.log(`[AgentChat] Agent not running for ${employeeId}, auto-starting`);
      agent = this.lifecycle.startAgent(employeeId);
    }

    // Update status to chatting
    agent.status = 'chatting';
    agent.lastActive = Date.now();

    try {
      // Get relevant memories for context
      const memories = await this.searchMemories(employeeId, message, 5);

      // Build context prompt from memories
      const contextPrompt = memories.length > 0
        ? `Relevant memories:\n${memories.map((m) => `- ${m.content}`).join('\n')}`
        : '';

      // Build messages array
      const systemMessages: LLMMessage[] = [
        {
          role: 'system',
          content: `${agent.identity}\n\n当前目标: ${agent.plan}`,
        },
      ];

      if (contextPrompt) {
        systemMessages.push({
          role: 'system',
          content: contextPrompt,
        });
      }

      const userMessage: LLMMessage = { role: 'user', content: message };

      // Generate response
      const response = await agent.chat(systemMessages.concat([userMessage]));

      // Persist conversation message
      if (context?.conversationId) {
        this.persistMessage(context.conversationId, 'agent', agent.id, response);
        if (message) {
          // Store user message too if we have a conversation
          this.persistMessage(context.conversationId, 'user', employeeId, message);
        }
      }

      return {
        response,
        agentId: agent.id,
        status: agent.status,
        memoriesUsed: memories.length,
      };
    } finally {
      agent.status = 'idle';
      agent.lastActive = Date.now();
      this.lifecycle.persistState(employeeId);
    }
  }

  // ─── Working Mode ──────────────────────────────────────────────────────────

  /**
   * Set agent to working status (for task execution).
   */
  setWorking(employeeId: string): void {
    const agent = this.registry.getByEmployeeId(employeeId);
    if (!agent) throw new Error('Agent not found');
    agent.status = 'working';
    agent.lastActive = Date.now();
  }

  /**
   * Set agent back to idle after work completes.
   */
  setIdle(employeeId: string): void {
    const agent = this.registry.getByEmployeeId(employeeId);
    if (!agent) return;
    agent.status = 'idle';
    agent.lastActive = Date.now();
    this.lifecycle.persistState(employeeId);
  }

  // ─── Memory Integration ─────────────────────────────────────────────────────

  /**
   * Search memories for an employee using vector similarity.
   */
  async searchMemories(
    employeeId: string,
    query: string,
    topK: number = 5
  ): Promise<db.Memory[]> {
    try {
      // Get agent for embedding generation
      const agent = this.registry.getByEmployeeId(employeeId);
      if (!agent) return [];

      // Generate query embedding
      const queryEmbedding = await agent.generateEmbedding(query);

      // Search by vector similarity
      const results = db.searchMemoryByVector(employeeId, queryEmbedding, topK);

      // Filter by similarity threshold
      return results
        .filter((r) => r.similarity > 0.5)
        .map((r) => r.memory);
    } catch (err) {
      // Fallback to text search if vector search fails
      console.warn(`[AgentChat] Vector search failed, falling back to text search:`, err);
      return db.searchMemories(employeeId, query).slice(0, topK);
    }
  }

  /**
   * Add a memory to an employee's memory store.
   */
  async addMemory(
    employeeId: string,
    content: string,
    type: 'episodic' | 'semantic' | 'working' = 'episodic',
    importance: number = 0.5
  ): Promise<db.Memory> {
    const id = uuidv4();
    const memory = db.createMemory({
      id,
      employee_id: employeeId,
      type,
      content,
      importance,
    });

    // Generate and store embedding
    const agent = this.registry.getByEmployeeId(employeeId);
    if (agent) {
      try {
        const embedding = await agent.generateEmbedding(content);
        db.createMemoryEmbedding({
          id: uuidv4(),
          memory_id: id,
          embedding: JSON.stringify(embedding),
        });
      } catch (err) {
        console.warn(`[AgentChat] Failed to generate embedding for memory ${id}:`, err);
      }
    }

    return memory;
  }

  // ─── Conversation Helpers ───────────────────────────────────────────────────

  /**
   * Persist a message to the conversation log.
   */
  private persistMessage(
    conversationId: string,
    senderType: 'user' | 'agent',
    senderId: string,
    content: string
  ): void {
    try {
      db.createMessage({
        id: uuidv4(),
        conversation_id: conversationId,
        sender_type: senderType,
        sender_id: senderId,
        content,
      });
    } catch (err) {
      console.warn(`[AgentChat] Failed to persist message:`, err);
    }
  }

  /**
   * Get conversation history for context.
   */
  getConversationHistory(conversationId: string, limit: number = 20): db.Message[] {
    const messages = db.getMessagesByConversation(conversationId);
    return messages.slice(-limit);
  }

  /**
   * Build a conversation context array for the agent.
   */
  buildConversationMessages(
    conversationId: string,
    limit: number = 10
  ): LLMMessage[] {
    const messages = this.getConversationHistory(conversationId, limit);
    return messages.map((m) => ({
      role: m.sender_type === 'agent' ? 'assistant' : 'user',
      content: m.content,
    })) as LLMMessage[];
  }
}

// Singleton
export const agentChat = new AgentChat();
