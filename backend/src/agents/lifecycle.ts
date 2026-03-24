/**
 * Agent Lifecycle Management
 *
 * Handles the full lifecycle of agents: create, start, stop, restart.
 * Coordinates between the AgentRegistry and the database.
 */

import { agentRegistry, AgentRegistry } from './pi-mono/registry';
import { PImonoAgent, AgentStatus } from './pi-mono/agent';
import * as db from '../storage/db';

export { AgentStatus };

export class AgentLifecycle {
  constructor(private registry: AgentRegistry = agentRegistry) {}

  // ─── Lifecycle Operations ───────────────────────────────────────────────────

  /**
   * Start a new agent for an employee.
   * Creates the agent in both the registry (memory) and DB.
   */
  startAgent(employeeId: string): PImonoAgent {
    // Check if already running
    const existing = this.registry.getByEmployeeId(employeeId);
    if (existing) {
      console.log(`[AgentLifecycle] Agent already running for employee ${employeeId}`);
      return existing;
    }

    const employee = db.getEmployeeById(employeeId);
    if (!employee) {
      throw new Error(`Employee not found: ${employeeId}`);
    }

    const agent = this.registry.registerAgent({
      id: employee.id,
      employeeId: employee.id,
      name: employee.name,
      identity: employee.identity ?? `You are ${employee.name}, a ${employee.role}.`,
      plan: employee.plan ?? 'free',
      model: employee.model ?? 'gpt-4',
      temperature: employee.temperature ?? 0.7,
    });

    // Update employee status to active
    db.updateEmployee(employeeId, { status: 'active' });

    console.log(`[AgentLifecycle] Started agent for employee ${employeeId} (agentId=${agent.id})`);
    return agent;
  }

  /**
   * Stop an agent, persist its state, and remove from registry.
   */
  stopAgent(employeeId: string): void {
    const agent = this.registry.getByEmployeeId(employeeId);
    if (!agent) {
      console.log(`[AgentLifecycle] No agent found for employee ${employeeId}`);
      return;
    }

    // Persist current state
    this.persistState(employeeId);

    // Remove from registry
    this.registry.removeByEmployeeId(employeeId);

    // Update DB agent status to stopped
    const dbAgent = db.getAgentByEmployee(employeeId);
    if (dbAgent) {
      db.updateAgent(dbAgent.id, { status: 'stopped' });
    }

    // Update employee status
    db.updateEmployee(employeeId, { status: 'inactive' });

    console.log(`[AgentLifecycle] Stopped agent for employee ${employeeId}`);
  }

  /**
   * Restart an agent: stop then start.
   */
  restartAgent(employeeId: string): PImonoAgent {
    const existing = this.registry.getByEmployeeId(employeeId);
    if (existing) {
      this.stopAgent(employeeId);
    }
    return this.startAgent(employeeId);
  }

  /**
   * Pause an agent (marks as paused in DB, keeps in memory as idle).
   */
  pauseAgent(employeeId: string): void {
    const agent = this.registry.getByEmployeeId(employeeId);
    if (!agent) throw new Error('Agent not found');

    agent.status = 'idle';
    this.persistState(employeeId);

    const dbAgent = db.getAgentByEmployee(employeeId);
    if (dbAgent) {
      db.updateAgent(dbAgent.id, { status: 'paused' });
    }

    console.log(`[AgentLifecycle] Paused agent for employee ${employeeId}`);
  }

  /**
   * Resume a paused agent.
   */
  resumeAgent(employeeId: string): void {
    const agent = this.registry.getByEmployeeId(employeeId);
    if (!agent) throw new Error('Agent not found');

    agent.status = 'idle';

    const dbAgent = db.getAgentByEmployee(employeeId);
    if (dbAgent) {
      db.updateAgent(dbAgent.id, { status: 'idle' });
    }

    console.log(`[AgentLifecycle] Resumed agent for employee ${employeeId}`);
  }

  // ─── Config Updates ─────────────────────────────────────────────────────────

  /**
   * Update agent configuration. Changes take effect immediately in the running agent.
   */
  updateAgentConfig(
    employeeId: string,
    updates: {
      identity?: string;
      plan?: string;
      model?: string;
      temperature?: number;
    }
  ): PImonoAgent {
    const agent = this.registry.getByEmployeeId(employeeId);
    if (!agent) throw new Error('Agent not found');

    // Update in-memory agent
    this.registry.updateConfig(employeeId, updates);

    // Persist to DB
    const dbAgent = db.getAgentByEmployee(employeeId);
    if (dbAgent) {
      const currentConfig = JSON.parse(dbAgent.config);
      db.updateAgent(dbAgent.id, {
        config: JSON.stringify({
          ...currentConfig,
          identity: updates.identity ?? currentConfig.identity,
          plan: updates.plan ?? currentConfig.plan,
          model: updates.model ?? currentConfig.model,
          temperature: updates.temperature ?? currentConfig.temperature,
        }),
      });
    }

    console.log(`[AgentLifecycle] Updated config for employee ${employeeId}`);
    return this.registry.getByEmployeeId(employeeId)!;
  }

  // ─── State ──────────────────────────────────────────────────────────────────

  /**
   * Get agent status.
   */
  getAgentStatus(employeeId: string): AgentStatus | null {
    const agent = this.registry.getByEmployeeId(employeeId);
    return agent?.status ?? null;
  }

  /**
   * Persist current agent state to DB.
   */
  persistState(employeeId: string): void {
    this.registry.persistState(employeeId);
  }

  /**
   * Get all running agents.
   */
  listAgents(): PImonoAgent[] {
    return this.registry.list();
  }

  /**
   * Rebuild all agents from DB on server startup.
   */
  rebuildFromDb(): number {
    return this.registry.rebuildFromDb();
  }
}

// Singleton
export const agentLifecycle = new AgentLifecycle();
