/**
 * Team Orchestration - Task Distributor
 *
 * Distributes team-level tasks to individual team members.
 */

import * as db from '../../storage/db';
import { distributeTask, DistributionResult as StrategyResult, TeamMemberInfo, DistributionStrategy } from './strategies';

export interface DistributeOptions {
  teamId: string;
  taskTitle: string;
  taskDescription?: string;
  strategy?: DistributionStrategy;
  assignToAll?: boolean; // If true, create subtasks for each member
}

export interface SubtaskInfo {
  taskId: string;
  assigneeId: string;
  assigneeName: string;
  status: string;
}

export interface DistributeResult {
  success: boolean;
  tasks: SubtaskInfo[];
  distribution?: StrategyResult[];
  error?: string;
}

/**
 * Get team members with their current load information
 */
export function getTeamMemberLoadInfo(teamId: string): TeamMemberInfo[] {
  const members = db.getTeamMembers(teamId);
  
  return members.map((member) => {
    // Get employee's active tasks count
    const tasks = db.getTasksByAssignee('employee', member.employee_id);
    const activeTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'pending');
    
    // Get employee info
    const employee = db.getEmployeeById(member.employee_id);
    
    return {
      employeeId: member.employee_id,
      name: employee?.name ?? 'Unknown',
      role: member.role,
      currentLoad: activeTasks.length,
      activeTasks: activeTasks.length,
    };
  });
}

/**
 * Get the last task assignee index for round-robin
 */
function getLastAssigneeIndex(teamId: string): number {
  // Get team metadata or default to -1
  const team = db.getTeamById(teamId);
  if (!team) return -1;
  
  // Check if there's any metadata tracking last assignee
  // For now, we'll store this in memory (in production, this should be in DB)
  return (global as any).__teamLastAssignee?.[teamId] ?? -1;
}

/**
 * Update the last assignee index for round-robin
 */
function setLastAssigneeIndex(teamId: string, index: number): void {
  if (!(global as any).__teamLastAssignee) {
    (global as any).__teamLastAssignee = {};
  }
  (global as any).__teamLastAssignee[teamId] = index;
}

/**
 * Create a subtask for a team member
 */
function createSubtask(
  teamId: string,
  teamName: string,
  parentTaskTitle: string,
  assigneeId: string,
  assigneeName: string,
  description?: string
): SubtaskInfo {
  const subtaskTitle = `[${teamName}] ${parentTaskTitle}`;
  const subtaskDescription = description 
    ? `${description}\n\nAssigned from team task: ${parentTaskTitle}`
    : `Assigned from team task: ${parentTaskTitle}`;

  const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  
  db.createTask({
    id: taskId,
    title: subtaskTitle,
    description: subtaskDescription,
    status: 'pending',
    assignee_type: 'employee',
    assignee_id: assigneeId,
  });

  return {
    taskId,
    assigneeId,
    assigneeName,
    status: 'pending',
  };
}

/**
 * Distribute a team task to individual team members
 */
export function distributeTeamTask(options: DistributeOptions): DistributeResult {
  const { teamId, taskTitle, taskDescription, strategy = 'load_balanced', assignToAll = false } = options;

  // Verify team exists
  const team = db.getTeamById(teamId);
  if (!team) {
    return { success: false, tasks: [], error: 'Team not found' };
  }

  // Get team members
  const members = db.getTeamMembers(teamId);
  if (members.length === 0) {
    return { success: false, tasks: [], error: 'Team has no members' };
  }

  // Get member load info
  const memberInfo = getTeamMemberLoadInfo(teamId);

  const distributionResults: StrategyResult[] = [];
  const tasks: SubtaskInfo[] = [];

  if (assignToAll) {
    // Create subtasks for all members
    for (const member of memberInfo) {
      const task = createSubtask(teamId, team.name, taskTitle, member.employeeId, member.name, taskDescription);
      tasks.push(task);
      distributionResults.push({
        assigneeId: member.employeeId,
        assigneeName: member.name,
        strategy,
        reason: `Assigned to all members (${member.name})`,
      });
    }
  } else {
    // Distribute to one member based on strategy
    const lastIndex = getLastAssigneeIndex(teamId);
    const distribution = distributeTask(memberInfo, strategy, lastIndex);

    const task = createSubtask(teamId, team.name, taskTitle, distribution.assigneeId, distribution.assigneeName, taskDescription);
    tasks.push(task);
    distributionResults.push(distribution);

    // Update last assignee for round-robin
    const assigneeIndex = memberInfo.findIndex(m => m.employeeId === distribution.assigneeId);
    if (assigneeIndex !== -1) {
      setLastAssigneeIndex(teamId, assigneeIndex);
    }
  }

  console.log(`[Orchestration] Distributed task "${taskTitle}" to team ${teamId}: ${tasks.length} subtask(s)`);

  return {
    success: true,
    tasks,
    distribution: distributionResults,
  };
}

/**
 * Get team task distribution statistics
 */
export function getTeamDistributionStats(teamId: string): {
  totalMembers: number;
  totalTasks: number;
  tasksByMember: Record<string, { name: string; taskCount: number; pending: number; inProgress: number }>;
} {
  const members = db.getTeamMembers(teamId);

  const memberStats: Record<string, { name: string; taskCount: number; pending: number; inProgress: number }> = {};

  for (const member of members) {
    const memberTasks = db.getTasksByAssignee('employee', member.employee_id);
    const pending = memberTasks.filter(t => t.status === 'pending').length;
    const inProgress = memberTasks.filter(t => t.status === 'in_progress').length;
    const employee = db.getEmployeeById(member.employee_id);
    
    memberStats[member.employee_id] = {
      name: employee?.name ?? 'Unknown',
      taskCount: memberTasks.length,
      pending,
      inProgress,
    };
  }

  const allTasks = db.getTasksByAssignee('team', teamId);

  return {
    totalMembers: members.length,
    totalTasks: allTasks.length,
    tasksByMember: memberStats,
  };
}
