/**
 * Team Orchestration Module
 *
 * Provides team-level coordination capabilities:
 * - Task distribution among team members
 * - Shared team context
 * - Team-level memory and communication
 *
 * Part of TASK-3.6: Team Orchestration
 */

export {
  distributeTeamTask,
  getTeamMemberLoadInfo,
  getTeamDistributionStats,
  type DistributeOptions,
  type DistributeResult,
} from './distributor';

export {
  buildTeamContext,
  searchTeamMemories,
  storeTeamMemory,
  buildTeamSummaryPrompt,
  buildTeamCoordinationPrompt,
  type TeamContext,
} from './context';

export {
  distributeTask,
  distributeTasks,
  distributeRoundRobin,
  distributeLoadBalanced,
  distributeRandom,
  distributeCapabilityMatched,
  type DistributionStrategy,
  type DistributionResult,
  type TeamMemberInfo,
} from './strategies';
