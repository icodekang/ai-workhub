/**
 * pi-mono Agent Module
 *
 * Exports:
 * - PImonoAgent: The main agent implementation
 * - AgentRegistry / agentRegistry: Singleton registry for managing agents
 */

export { PImonoAgent } from './pi-mono/agent';
export { AgentRegistry, agentRegistry } from './pi-mono/registry';
export * from './types';
