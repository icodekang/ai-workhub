/**
 * Team Orchestration - Distribution Strategies
 *
 * Different strategies for distributing tasks among team members.
 */

export type DistributionStrategy = 'round_robin' | 'load_balanced' | 'random' | 'capability_matched';

export interface DistributionResult {
  assigneeId: string;
  assigneeName: string;
  strategy: DistributionStrategy;
  reason: string;
}

export interface TeamMemberInfo {
  employeeId: string;
  name: string;
  role: string;
  currentLoad: number;
  activeTasks: number;
}

/**
 * Round-robin distribution - cycles through team members
 */
export function distributeRoundRobin(
  members: TeamMemberInfo[],
  lastAssigneeIndex: number
): DistributionResult {
  if (members.length === 0) {
    throw new Error('No team members available');
  }

  const nextIndex = (lastAssigneeIndex + 1) % members.length;
  const selected = members[nextIndex];

  return {
    assigneeId: selected.employeeId,
    assigneeName: selected.name,
    strategy: 'round_robin',
    reason: `Round-robin selection (position ${nextIndex + 1} of ${members.length})`,
  };
}

/**
 * Load-balanced distribution - assigns to member with lowest current load
 */
export function distributeLoadBalanced(
  members: TeamMemberInfo[]
): DistributionResult {
  if (members.length === 0) {
    throw new Error('No team members available');
  }

  // Sort by current load (ascending), then by name for consistency
  const sorted = [...members].sort((a, b) => {
    if (a.currentLoad !== b.currentLoad) {
      return a.currentLoad - b.currentLoad;
    }
    return a.name.localeCompare(b.name);
  });

  const selected = sorted[0];

  return {
    assigneeId: selected.employeeId,
    assigneeName: selected.name,
    strategy: 'load_balanced',
    reason: `Selected member with lowest load (${selected.currentLoad} current tasks)`,
  };
}

/**
 * Random distribution
 */
export function distributeRandom(
  members: TeamMemberInfo[]
): DistributionResult {
  if (members.length === 0) {
    throw new Error('No team members available');
  }

  const index = Math.floor(Math.random() * members.length);
  const selected = members[index];

  return {
    assigneeId: selected.employeeId,
    assigneeName: selected.name,
    strategy: 'random',
    reason: `Random selection (${index + 1} of ${members.length})`,
  };
}

/**
 * Capability-matched distribution - matches task requirements to member capabilities
 * This is a simplified version that just returns load-balanced for now
 */
export function distributeCapabilityMatched(
  members: TeamMemberInfo[],
  taskRequirements?: string
): DistributionResult {
  // In a more advanced implementation, we would:
  // 1. Parse task requirements
  // 2. Match against member skills/capabilities
  // 3. Select best match with lowest load among matches
  
  // For now, fall back to load balancing
  return distributeLoadBalanced(members);
}

/**
 * Main distribution function that selects the appropriate strategy
 */
export function distributeTask(
  members: TeamMemberInfo[],
  strategy: DistributionStrategy,
  lastAssigneeIndex: number = -1,
  taskRequirements?: string
): DistributionResult {
  switch (strategy) {
    case 'round_robin':
      return distributeRoundRobin(members, lastAssigneeIndex);
    case 'load_balanced':
      return distributeLoadBalanced(members);
    case 'random':
      return distributeRandom(members);
    case 'capability_matched':
      return distributeCapabilityMatched(members, taskRequirements);
    default:
      return distributeLoadBalanced(members);
  }
}

/**
 * Distribute multiple tasks among team members
 */
export function distributeTasks(
  members: TeamMemberInfo[],
  taskCount: number,
  strategy: DistributionStrategy = 'load_balanced'
): DistributionResult[] {
  const results: DistributionResult[] = [];
  let lastIndex = -1;

  for (let i = 0; i < taskCount; i++) {
    const result = distributeTask(members, strategy, lastIndex);
    results.push(result);
    
    // Track last assignee for round-robin
    const memberIndex = members.findIndex(m => m.employeeId === result.assigneeId);
    if (memberIndex !== -1) {
      lastIndex = memberIndex;
    }
  }

  return results;
}
