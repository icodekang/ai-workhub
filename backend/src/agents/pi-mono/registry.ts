/**
 * Agent Registry - Singleton for managing all AI agents
 *
 * Provides centralized access to all registered PImonoAgent instances.
 */

import { AIAgent } from '../types';
import { PImonoAgent } from './agent';

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, AIAgent> = new Map();

  private constructor() {
    // Private constructor enforces singleton
  }

  /**
   * Get the singleton registry instance.
   */
  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  /**
   * Register an agent. If an agent with the same id exists, it is replaced.
   */
  register(agent: AIAgent): void {
    this.agents.set(agent.id, agent);
    console.log(`[AgentRegistry] Registered agent: ${agent.id}`);
  }

  /**
   * Register a new PImonoAgent from an AgentConfig.
   */
  registerAgent(config: {
    id: string;
    employeeId: string;
    identity: string;
    plan: string;
    model: string;
    temperature: number;
  }): PImonoAgent {
    const agent = new PImonoAgent(config);
    this.register(agent);
    return agent;
  }

  /**
   * Get an agent by id, or undefined if not found.
   */
  get(id: string): AIAgent | undefined {
    return this.agents.get(id);
  }

  /**
   * List all registered agents.
   */
  list(): AIAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * List all registered agents as a summary (for debugging/admin).
   */
  listSummary(): Array<{
    id: string;
    employeeId: string;
    identity: string;
    plan: string;
  }> {
    return this.list().map((a) => ({
      id: a.id,
      employeeId: a.employeeId,
      identity: a.identity,
      plan: a.plan,
    }));
  }

  /**
   * Remove an agent by id.
   * Returns true if the agent existed and was removed.
   */
  remove(id: string): boolean {
    const existed = this.agents.has(id);
    this.agents.delete(id);
    if (existed) {
      console.log(`[AgentRegistry] Removed agent: ${id}`);
    }
    return existed;
  }

  /**
   * Get the count of registered agents.
   */
  get count(): number {
    return this.agents.size;
  }

  /**
   * Clear all registered agents.
   */
  clear(): void {
    this.agents.clear();
    console.log('[AgentRegistry] Cleared all agents');
  }
}

// Convenient singleton accessor
export const agentRegistry = AgentRegistry.getInstance();
