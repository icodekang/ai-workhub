/**
 * Team Types
 *
 * Shared type definitions for Team entities
 */

export interface Team {
  id: string;
  name: string;
  description?: string;
  plan: string;
  createdAt: number;
  updatedAt: number;
  members?: TeamMember[];
}

export interface TeamMember {
  employeeId: string;
  name: string;
  role: 'member' | 'leader';
  addedAt: number;
}

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

export interface TeamFilters {
  search?: string;
}
