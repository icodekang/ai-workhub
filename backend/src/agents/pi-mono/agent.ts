/**
 * pi-mono Agent Implementation
 *
 * A configurable AI agent backed by the LLM service.
 * Implements the AIAgent interface with full lifecycle support.
 */

import { AIAgent, AgentConfig } from '../types';
import { LLMMessage } from '../../core/llm/types';
import { chatCompletion, fetchEmbedding } from '../../core/llm';

export type AgentStatus = 'idle' | 'working' | 'chatting' | 'error';

export interface AgentRuntimeConfig {
  id: string;
  employeeId: string;
  name: string;
  identity: string;
  plan: string;
  model: string;
  temperature: number;
  status: AgentStatus;
  createdAt: number;
  lastActive: number;
}

export class PImonoAgent implements AIAgent {
  public readonly id: string;
  public readonly employeeId: string;
  public readonly name: string;
  public identity: string;
  public plan: string;
  public readonly model: string;
  public temperature: number;
  public status: AgentStatus;
  public readonly createdAt: number;
  public lastActive: number;

  constructor(config: AgentRuntimeConfig) {
    this.id = config.id;
    this.employeeId = config.employeeId;
    this.name = config.name;
    this.identity = config.identity;
    this.plan = config.plan;
    this.model = config.model;
    this.temperature = config.temperature;
    this.status = config.status;
    this.createdAt = config.createdAt;
    this.lastActive = config.lastActive;
  }

  /**
   * Get current agent status.
   */
  getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Build the system message from identity and current plan.
   */
  private buildSystemMessage(): LLMMessage {
    return {
      role: 'system',
      content: `${this.identity}\n\n当前目标: ${this.plan}`,
    };
  }

  /**
   * Send a chat message and get a response.
   * Prepends the agent's identity as a system message.
   * Updates lastActive timestamp on completion.
   */
  async chat(messages: LLMMessage[]): Promise<string> {
    this.status = 'chatting';
    this.lastActive = Date.now();

    try {
      const systemMessage = this.buildSystemMessage();

      // Inject identity as first system message if not already set
      const filteredMessages = messages.filter((m) => m.role !== 'system');
      const allMessages: LLMMessage[] = [systemMessage, ...filteredMessages];

      const result = await chatCompletion({
        messages: allMessages,
        model: this.model,
        temperature: this.temperature,
      });

      this.lastActive = Date.now();
      this.status = 'idle';
      return result.content;
    } catch (err) {
      this.status = 'error';
      throw err;
    }
  }

  /**
   * Generate an embedding vector for the given text.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const { embedding } = await fetchEmbedding(text);
    return embedding;
  }

  /**
   * Update the agent's current plan/objective.
   */
  setPlan(plan: string): void {
    this.plan = plan;
  }

  /**
   * Update the agent's identity description.
   */
  setIdentity(identity: string): void {
    this.identity = identity;
  }

  /**
   * Update the sampling temperature.
   */
  setTemperature(temperature: number): void {
    this.temperature = Math.max(0, Math.min(2, temperature));
  }
}
