/**
 * pi-mono Agent Implementation
 *
 * A configurable AI agent backed by the LLM service.
 * Implements the AIAgent interface.
 */

import { AIAgent, AgentConfig } from '../types';
import { LLMMessage } from '../../core/llm/types';
import { chatCompletion, fetchEmbedding } from '../../core/llm';

export class PImonoAgent implements AIAgent {
  public readonly id: string;
  public readonly employeeId: string;
  public identity: string;
  public plan: string;
  public readonly model: string;
  public temperature: number;

  constructor(config: AgentConfig) {
    this.id = config.id;
    this.employeeId = config.employeeId;
    this.identity = config.identity;
    this.plan = config.plan;
    this.model = config.model;
    this.temperature = config.temperature;
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
   */
  async chat(messages: LLMMessage[]): Promise<string> {
    const systemMessage = this.buildSystemMessage();

    // Inject identity as first system message if not already set
    const filteredMessages = messages.filter((m) => m.role !== 'system');
    const allMessages: LLMMessage[] = [systemMessage, ...filteredMessages];

    const result = await chatCompletion({
      messages: allMessages,
      model: this.model,
      temperature: this.temperature,
    });

    return result.content;
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
