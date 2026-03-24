/**
 * Team Orchestration - Shared Team Context
 *
 * Provides shared context and memory for team activities.
 */

import * as db from '../../storage/db';
import { searchMemories, storeMemory, MemoryRecord } from '../memory';

export interface TeamContext {
  teamId: string;
  teamName: string;
  description?: string;
  plan: string;
  members: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  recentMemories: MemoryRecord[];
  activeTasks: number;
}

/**
 * Build shared team context for team conversations and coordination
 */
export function buildTeamContext(teamId: string): TeamContext | null {
  const team = db.getTeamById(teamId);
  if (!team) {
    return null;
  }

  const members = db.getTeamMembers(teamId);
  const memberDetails = members.map(m => {
    const emp = db.getEmployeeById(m.employee_id);
    return {
      id: m.employee_id,
      name: emp?.name ?? 'Unknown',
      role: m.role,
    };
  });

  // Get active tasks for team
  const allTasks = db.getTasksByAssignee('team', teamId);
  const activeTasks = allTasks.filter(t => 
    t.assignee_type === 'team' && 
    (t.status === 'pending' || t.status === 'in_progress')
  ).length;

  return {
    teamId,
    teamName: team.name,
    description: team.description ?? undefined,
    plan: team.plan,
    members: memberDetails,
    recentMemories: [], // Will be populated by searchTeamMemories
    activeTasks,
  };
}

/**
 * Search for memories related to a team across all team members
 */
export async function searchTeamMemories(
  teamId: string,
  query: string,
  limit: number = 10
): Promise<Array<{ memberId: string; memberName: string; memories: MemoryRecord[] }>> {
  const members = db.getTeamMembers(teamId);
  const results: Array<{ memberId: string; memberName: string; memories: MemoryRecord[] }> = [];

  for (const member of members) {
    const employee = db.getEmployeeById(member.employee_id);
    const memberName = employee?.name ?? 'Unknown';

    try {
      const memories = await searchMemories({
        query,
        employeeId: member.employee_id,
        limit,
      });

      if (memories.length > 0) {
        results.push({
          memberId: member.employee_id,
          memberName,
          memories,
        });
      }
    } catch (error) {
      console.warn(`[TeamContext] Failed to search memories for member ${member.employee_id}:`, error);
    }
  }

  return results;
}

/**
 * Store a team-level memory shared across all members
 */
export async function storeTeamMemory(
  teamId: string,
  description: string,
  relatedTaskId?: string
): Promise<MemoryRecord[]> {
  const members = db.getTeamMembers(teamId);
  const storedMemories: MemoryRecord[] = [];

  for (const member of members) {
    try {
      const memory = await storeMemory({
        employeeId: member.employee_id,
        description: `[Team] ${description}`,
        type: 'conversation',
        data: {
          taskId: relatedTaskId,
          teamId,
        } as any,
        importanceOverride: 5,
      });
      storedMemories.push(memory);
    } catch (error) {
      console.warn(`[TeamContext] Failed to store team memory for member ${member.employee_id}:`, error);
    }
  }

  return storedMemories;
}

/**
 * Generate team summary prompt for team conversations
 */
export function buildTeamSummaryPrompt(teamId: string): string {
  const context = buildTeamContext(teamId);
  if (!context) {
    return 'Team not found';
  }

  const memberList = context.members
    .map(m => `  - ${m.name} (${m.role})`)
    .join('\n');

  return `
## Team: ${context.teamName}

**Description:** ${context.description ?? 'No description'}
**Current Plan:** ${context.plan}

**Members:**
${memberList}

**Active Tasks:** ${context.activeTasks}
`.trim();
}

/**
 * Build a context prompt for team coordination
 */
export function buildTeamCoordinationPrompt(
  teamId: string,
  taskDescription?: string
): string {
  const context = buildTeamContext(teamId);
  if (!context) {
    return 'Team not found';
  }

  let prompt = `You are coordinating team: ${context.teamName}\n\n`;
  prompt += `Team members:\n`;
  
  for (const member of context.members) {
    const tasks = db.getTasksByAssignee('employee', member.id);
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    
    prompt += `- ${member.name} (${member.role}): ${pending} pending, ${inProgress} in progress\n`;
  }

  if (taskDescription) {
    prompt += `\n**Current Task:** ${taskDescription}\n`;
  }

  prompt += `\n**Team Plan:** ${context.plan}\n`;

  return prompt;
}
