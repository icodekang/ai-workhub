/**
 * pi-mono Agent Module
 *
 * Exports:
 * - PImonoAgent: The main agent implementation
 * - AgentRegistry / agentRegistry: Singleton registry for managing agents
 * - AgentLifecycle / agentLifecycle: Lifecycle management
 * - AgentChat / agentChat: Context-aware chat interface
 * - Reflection functions for memory insight generation
 */

export { PImonoAgent, AgentStatus } from './pi-mono/agent';
export type { AgentRuntimeConfig } from './pi-mono/agent';
export { AgentRegistry, agentRegistry } from './pi-mono/registry';
export { AgentLifecycle, agentLifecycle } from './lifecycle';
export { AgentChat, agentChat } from './chat';
export type { ChatContext, ChatResult } from './chat';
export * from './types';

// Reflection System exports
export {
  reflectOnMemories,
  checkShouldReflect,
  getMemoriesForReflection,
  getReflectionStats,
  generateReflectionInsights,
  generateBriefReflection,
} from './reflection';

// Team Orchestration exports
export {
  distributeTeamTask,
  getTeamMemberLoadInfo,
  getTeamDistributionStats,
  buildTeamContext,
  searchTeamMemories,
  storeTeamMemory,
  buildTeamSummaryPrompt,
  buildTeamCoordinationPrompt,
  distributeTask,
  distributeTasks,
  type DistributeOptions,
  type DistributeResult,
  type DistributionStrategy,
  type DistributionResult,
  type TeamMemberInfo,
  type TeamContext,
} from './orchestration';
