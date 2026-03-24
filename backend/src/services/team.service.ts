/**
 * Team Service - Business logic for AI Team management
 */

import { v4 as uuidv4 } from 'uuid';
import * as db from '../storage/db';
import { Team, TeamMember } from '../storage/db';

// ============================================================
// Types
// ============================================================

export interface CreateTeamInput {
  name: string;
  description?: string;
  plan?: string;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  plan?: string;
}

export interface AddMemberInput {
  employeeId: string;
  role?: 'member' | 'leader';
}

// ============================================================
// Response Shape Helpers
// ============================================================

function toTeamResponse(team: Team) {
  return {
    id: team.id,
    name: team.name,
    description: team.description ?? null,
    plan: team.plan,
    createdAt: team.created_at,
    updatedAt: team.updated_at,
  };
}

function toTeamListItem(team: Team & { member_count: number }) {
  return {
    id: team.id,
    name: team.name,
    memberCount: team.member_count,
    createdAt: team.created_at,
  };
}

function toMemberResponse(member: { employee_id: string; emp_name: string; role: 'member' | 'leader'; added_at: number }) {
  return {
    employeeId: member.employee_id,
    name: member.emp_name,
    role: member.role,
    addedAt: member.added_at,
  };
}

// ============================================================
// Validation
// ============================================================

function validateCreateInput(input: CreateTeamInput): string | null {
  if (!input.name || input.name.trim().length === 0) {
    return 'name is required';
  }
  if (input.name.length > 100) {
    return 'name must be 1-100 characters';
  }
  if (input.description && input.description.length > 500) {
    return 'description must be max 500 characters';
  }
  return null;
}

function validateUpdateInput(input: UpdateTeamInput): string | null {
  if (input.name !== undefined) {
    if (input.name.trim().length === 0) return 'name cannot be empty';
    if (input.name.length > 100) return 'name must be 1-100 characters';
  }
  if (input.description !== undefined && input.description.length > 500) {
    return 'description must be max 500 characters';
  }
  return null;
}

function validateRole(role: string | undefined): string | null {
  if (role !== undefined && !['member', 'leader'].includes(role)) {
    return 'role must be member or leader';
  }
  return null;
}

// ============================================================
// CRUD Operations
// ============================================================

export function createTeam(input: CreateTeamInput): { team: ReturnType<typeof toTeamResponse>; error?: string } {
  const validationError = validateCreateInput(input);
  if (validationError) {
    return { team: null as any, error: validationError };
  }

  const id = uuidv4();
  const now = Date.now();

  const teamData = {
    id,
    name: input.name.trim(),
    description: input.description ?? null,
    plan: input.plan ?? 'free',
  };

  const stmt = db.getDb().prepare(`
    INSERT INTO teams (id, name, description, plan, created_at, updated_at)
    VALUES (@id, @name, @description, @plan, @created_at, @updated_at)
  `);
  stmt.run({ ...teamData, created_at: now, updated_at: now });

  const created = db.getTeamById(id)!;
  const base = toTeamResponse(created);
  const response: typeof base & { members: ReturnType<typeof toMemberResponse>[] } = { ...base, members: [] };
  return { team: response };
}

export function listTeams(): { teams: ReturnType<typeof toTeamListItem>[]; total: number } {
  const db2 = db.getDb();
  const rows = db2.prepare(`
    SELECT t.*, COUNT(tm.employee_id) as member_count
    FROM teams t
    LEFT JOIN team_members tm ON tm.team_id = t.id
    GROUP BY t.id
    ORDER BY t.created_at DESC
  `).all() as (Team & { member_count: number })[];

  return {
    teams: rows.map(toTeamListItem),
    total: rows.length,
  };
}

export function getTeamById(id: string): (ReturnType<typeof toTeamResponse> & { members: ReturnType<typeof toMemberResponse>[] }) | null {
  const team = db.getTeamById(id);
  if (!team) return null;

  const members = db.getTeamMembers(id) as unknown as { employee_id: string; emp_name: string; role: 'member' | 'leader'; added_at: number }[];

  return {
    ...toTeamResponse(team),
    members: members.map(toMemberResponse),
  };
}

export function updateTeam(id: string, input: UpdateTeamInput): { team: ReturnType<typeof toTeamResponse> | null; error?: string } {
  const validationError = validateUpdateInput(input);
  if (validationError) {
    return { team: null, error: validationError };
  }

  const existing = db.getTeamById(id);
  if (!existing) {
    return { team: null, error: 'Team not found' };
  }

  const updates: Partial<Team> = {};
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.description !== undefined) updates.description = input.description;
  if (input.plan !== undefined) updates.plan = input.plan;

  if (Object.keys(updates).length > 0) {
    updates.updated_at = Date.now();
    const db2 = db.getDb();
    const fields = Object.keys(updates).filter(k => k !== 'created_at');
    const setClause = fields.map(f => `${f} = @${f}`).join(', ');
    const stmt = db2.prepare(`UPDATE teams SET ${setClause} WHERE id = @id`);
    stmt.run({ ...updates, id });
  }

  const updated = db.getTeamById(id)!;
  return { team: toTeamResponse(updated) };
}

export function deleteTeam(id: string): boolean {
  const existing = db.getTeamById(id);
  if (!existing) return false;

  // team_members are deleted via CASCADE foreign key
  return db.deleteTeam(id);
}

// ============================================================
// Member Management
// ============================================================

export function addMember(teamId: string, input: AddMemberInput): { result: { teamId: string; employeeId: string; role: string; addedAt: number }; error?: string } {
  if (!input.employeeId || input.employeeId.trim().length === 0) {
    return { result: null as any, error: 'employeeId is required' };
  }

  const roleError = validateRole(input.role);
  if (roleError) {
    return { result: null as any, error: roleError };
  }

  const team = db.getTeamById(teamId);
  if (!team) {
    return { result: null as any, error: 'Team not found' };
  }

  const employee = db.getEmployeeById(input.employeeId);
  if (!employee) {
    return { result: null as any, error: 'Employee not found' };
  }

  // Check if already a member
  const db2 = db.getDb();
  const existing = db2.prepare(
    'SELECT 1 FROM team_members WHERE team_id = ? AND employee_id = ?'
  ).get(teamId, input.employeeId);
  if (existing) {
    return { result: null as any, error: 'Employee already in team' };
  }

  const role = input.role ?? 'member';
  const now = Date.now();

  const stmt = db2.prepare(`
    INSERT INTO team_members (team_id, employee_id, role, added_at)
    VALUES (@team_id, @employee_id, @role, @added_at)
  `);
  stmt.run({ team_id: teamId, employee_id: input.employeeId, role, added_at: now });

  return {
    result: {
      teamId,
      employeeId: input.employeeId,
      role,
      addedAt: now,
    },
  };
}

export function removeMember(teamId: string, employeeId: string): { success: boolean; error?: string } {
  const team = db.getTeamById(teamId);
  if (!team) {
    return { success: false, error: 'Team not found' };
  }

  const removed = db.removeTeamMember(teamId, employeeId);
  if (!removed) {
    return { success: false, error: 'Employee not in team' };
  }

  return { success: true };
}
