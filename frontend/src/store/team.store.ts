/**
 * Team Store
 *
 * Zustand store for team state management
 */

import { create } from 'zustand';
import type { Team, CreateTeamInput, UpdateTeamInput } from '@/types/team';
import { api } from '@/lib/api';

interface TeamState {
  teams: Team[];
  selectedTeam: Team | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchTeams: () => Promise<void>;
  fetchTeam: (id: string) => Promise<Team | null>;
  createTeam: (input: CreateTeamInput) => Promise<Team | null>;
  updateTeam: (id: string, input: UpdateTeamInput) => Promise<Team | null>;
  deleteTeam: (id: string) => Promise<boolean>;
  addMember: (teamId: string, employeeId: string, role?: string) => Promise<boolean>;
  removeMember: (teamId: string, employeeId: string) => Promise<boolean>;
  selectTeam: (team: Team | null) => void;
  clearError: () => void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  selectedTeam: null,
  loading: false,
  error: null,

  fetchTeams: async () => {
    set({ loading: true, error: null });
    try {
      const teams = await api.getTeams();
      set({ teams, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch teams', loading: false });
    }
  },

  fetchTeam: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const team = await api.getTeam(id);
      set({ selectedTeam: team, loading: false });
      return team;
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch team', loading: false });
      return null;
    }
  },

  createTeam: async (input: CreateTeamInput) => {
    set({ loading: true, error: null });
    try {
      const team = await (api as any).createTeam(input);
      set((state) => ({
        teams: [...state.teams, team],
        loading: false,
      }));
      return team;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create team', loading: false });
      return null;
    }
  },

  updateTeam: async (id: string, input: UpdateTeamInput) => {
    set({ loading: true, error: null });
    try {
      // Use direct fetch since API client may not have updateTeam
      const response = await fetch(`/api/teams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const team = await response.json();
      set((state) => ({
        teams: state.teams.map((t) => (t.id === id ? team : t)),
        selectedTeam: state.selectedTeam?.id === id ? team : state.selectedTeam,
        loading: false,
      }));
      return team;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update team', loading: false });
      return null;
    }
  },

  deleteTeam: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await fetch(`/api/teams/${id}`, { method: 'DELETE' });
      set((state) => ({
        teams: state.teams.filter((t) => t.id !== id),
        selectedTeam: state.selectedTeam?.id === id ? null : state.selectedTeam,
        loading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete team', loading: false });
      return false;
    }
  },

  addMember: async (teamId: string, employeeId: string, role?: string) => {
    set({ loading: true, error: null });
    try {
      await api.addTeamMember(teamId, employeeId, role);
      // Refresh team data
      await get().fetchTeam(teamId);
      set({ loading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to add member', loading: false });
      return false;
    }
  },

  removeMember: async (teamId: string, employeeId: string) => {
    set({ loading: true, error: null });
    try {
      await api.removeTeamMember(teamId, employeeId);
      // Refresh team data
      await get().fetchTeam(teamId);
      set({ loading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to remove member', loading: false });
      return false;
    }
  },

  selectTeam: (team: Team | null) => {
    set({ selectedTeam: team });
  },

  clearError: () => {
    set({ error: null });
  },
}));
