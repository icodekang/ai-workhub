/**
 * Agent Registry - Singleton for managing all AI agents
 *
 * Provides centralized access to all registered PImonoAgent instances.
 * Supports lookup by agent ID or employee ID.
 */

import { PImonoAgent, AgentRuntimeConfig, AgentStatus } from './agent';
import * as db from '../../storage/db';

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, PImonoAgent> = new Map(); // key = agent id
  private employeeIndex: Map<string, string> = new Map(); // employeeId -> agentId

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

  // ─── Registration ───────────────────────────────────────────────────────────

  /**
   * Register an agent. If an agent with the same id exists, it is replaced.
   */
  register(agent: PImonoAgent): void {
    this.agents.set(agent.id, agent);
    this.employeeIndex.set(agent.employeeId, agent.id);
    console.log(`[AgentRegistry] Registered agent: ${agent.id} (employeeId=${agent.employeeId})`);
  }

  /**
   * Register a new PImonoAgent from config + employee name.
   * Persists the agent record to DB.
   */
  registerAgent(config: {
    id: string;
    employeeId: string;
    name: string;
    identity: string;
    plan: string;
    model: string;
    temperature: number;
  }): PImonoAgent {
    const now = Date.now();
    const agent = new PImonoAgent({
      id: config.id,
      employeeId: config.employeeId,
      name: config.name,
      identity: config.identity,
      plan: config.plan,
      model: config.model,
      temperature: config.temperature,
      status: 'idle',
      createdAt: now,
      lastActive: now,
    });

    this.register(agent);

    // Persist to DB
    db.createAgent({
      id: config.id,
      employee_id: config.employeeId,
      config: JSON.stringify({
        identity: config.identity,
        plan: config.plan,
        model: config.model,
        temperature: config.temperature,
        name: config.name,
      }),
      status: 'idle',
    });

    return agent;
  }

  // ─── Lookup ─────────────────────────────────────────────────────────────────

  /**
   * Get an agent by agent id, or undefined if not found.
   */
  get(id: string): PImonoAgent | undefined {
    return this.agents.get(id);
  }

  /**
   * Get an agent by employee id, or undefined if not found.
   */
  getByEmployeeId(employeeId: string): PImonoAgent | undefined {
    const agentId = this.employeeIndex.get(employeeId);
    if (!agentId) return undefined;
    return this.agents.get(agentId);
  }

  /**
   * List all registered agents.
   */
  list(): PImonoAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * List all registered agents as a summary (for debugging/admin).
   */
  listSummary(): Array<{
    id: string;
    employeeId: string;
    name: string;
    identity: string;
    plan: string;
    status: AgentStatus;
    lastActive: number;
  }> {
    return this.list().map((a) => ({
      id: a.id,
      employeeId: a.employeeId,
      name: a.name,
      identity: a.identity,
      plan: a.plan,
      status: a.status,
      lastActive: a.lastActive,
    }));
  }

  // ─── Mutators ────────────────────────────────────────────────────────────────

  /**
   * Remove an agent by id.
   * Returns true if the agent existed and was removed.
   */
  remove(id: string): boolean {
    const agent = this.agents.get(id);
    if (!agent) return false;
    this.agents.delete(id);
    this.employeeIndex.delete(agent.employeeId);
    console.log(`[AgentRegistry] Removed agent: ${id}`);
    return true;
  }

  /**
   * Remove an agent by employee id.
   * Returns true if the agent existed and was removed.
   */
  removeByEmployeeId(employeeId: string): boolean {
    const agentId = this.employeeIndex.get(employeeId);
    if (!agentId) return false;
    return this.remove(agentId);
  }

  /**
   * Update an agent's runtime config (identity, plan, model, temperature).
   * Changes take effect immediately in the running agent instance.
   */
  updateConfig(employeeId: string, updates: {
    identity?: string;
    plan?: string;
    model?: string;
    temperature?: number;
  }): PImonoAgent | null {
    const agent = this.getByEmployeeId(employeeId);
    if (!agent) return null;

    if (updates.identity !== undefined) agent.identity = updates.identity;
    if (updates.plan !== undefined) agent.plan = updates.plan;
    if (updates.model !== undefined) (agent as any).model = updates.model;
    if (updates.temperature !== undefined) agent.temperature = updates.temperature;

    console.log(`[AgentRegistry] Updated config for agent: ${agent.id}`);
    return agent;
  }

  /**
   * Set agent status.
   */
  setStatus(employeeId: string, status: AgentStatus): boolean {
    const agent = this.getByEmployeeId(employeeId);
    if (!agent) return false;
    agent.status = status;
    return true;
  }

  // ─── Persistence sync ────────────────────────────────────────────────────────

  /**
   * Persist current agent state to DB (status + lastActive).
   */
  persistState(employeeId: string): void {
    const agent = this.getByEmployeeId(employeeId);
    if (!agent) return;
    db.updateAgent(agent.id, {
      status: agent.status,
      config: JSON.stringify({
        identity: agent.identity,
        plan: agent.plan,
        model: agent.model,
        temperature: agent.temperature,
        name: agent.name,
      }),
    });
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────

  /**
   * Get the count of registered agents.
   */
  get count(): number {
    return this.agents.size;
  }

  /**
   * Clear all registered agents (use with caution).
   */
  clear(): void {
    this.agents.clear();
    this.employeeIndex.clear();
    console.log('[AgentRegistry] Cleared all agents');
  }

  /**
   * Rebuild in-memory agents from DB records.
   * Useful on server restart to restore agent state.
   */
  rebuildFromDb(): number {
    const agents = db.getAllAgents();
    let count = 0;
    for (const row of agents) {
      let config: any;
      try {
        config = JSON.parse(row.config);
      } catch {
        console.warn(`[AgentRegistry] Failed to parse config for agent ${row.id}, skipping`);
        continue;
      }
      const agent = new PImonoAgent({
        id: row.id,
        employeeId: row.employee_id,
        name: config.name ?? 'Unknown',
        identity: config.identity ?? `You are an AI agent.`,
        plan: config.plan ?? 'free',
        model: config.model ?? 'gpt-4',
        temperature: config.temperature ?? 0.7,
        status: row.status as AgentStatus ?? 'idle',
        createdAt: row.created_at,
        lastActive: row.updated_at,
      });
      this.register(agent);
      count++;
    }
    console.log(`[AgentRegistry] Rebuilt ${count} agents from DB`);
    return count;
  }
}

// Convenient singleton accessor
export const agentRegistry = AgentRegistry.getInstance();
