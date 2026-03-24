/**
 * pi-mono Agent Module
 *
 * Exports:
 * - PImonoAgent: The main agent implementation
 * - AgentRegistry / agentRegistry: Singleton registry for managing agents
 * - AgentLifecycle / agentLifecycle: Lifecycle management
 * - AgentChat / agentChat: Context-aware chat interface
 */

export { PImonoAgent, AgentStatus } from './pi-mono/agent';
export type { AgentRuntimeConfig } from './pi-mono/agent';
export { AgentRegistry, agentRegistry } from './pi-mono/registry';
export { AgentLifecycle, agentLifecycle } from './lifecycle';
export { AgentChat, agentChat } from './chat';
export type { ChatContext, ChatResult } from './chat';
export * from './types';
