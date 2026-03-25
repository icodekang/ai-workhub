/**
 * Task Store
 *
 * Zustand store for task state management
 */

import { create } from 'zustand';
import type { Task, CreateTaskInput, UpdateTaskInput, TaskFilters } from '@/types/task';
import { api } from '@/lib/api';

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  loading: boolean;
  error: string | null;
  filters: TaskFilters;

  // Actions
  fetchTasks: (filters?: TaskFilters) => Promise<void>;
  fetchTask: (id: string) => Promise<Task | null>;
  createTask: (input: CreateTaskInput) => Promise<Task | null>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  executeTask: (id: string) => Promise<boolean>;
  selectTask: (task: Task | null) => void;
  setFilters: (filters: TaskFilters) => void;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  selectedTask: null,
  loading: false,
  error: null,
  filters: {},

  fetchTasks: async (filters?: TaskFilters) => {
    set({ loading: true, error: null });
    try {
      const tasks = await api.getTasks(filters);
      set({ tasks, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch tasks', loading: false });
    }
  },

  fetchTask: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const task = await api.getTask(id);
      set({ selectedTask: task, loading: false });
      return task;
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch task', loading: false });
      return null;
    }
  },

  createTask: async (input: CreateTaskInput) => {
    set({ loading: true, error: null });
    try {
      const task = await api.createTask(input);
      set((state) => ({
        tasks: [...state.tasks, task],
        loading: false,
      }));
      return task;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create task', loading: false });
      return null;
    }
  },

  updateTask: async (id: string, input: UpdateTaskInput) => {
    set({ loading: true, error: null });
    try {
      const task = await api.updateTask(id, input);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? task : t)),
        selectedTask: state.selectedTask?.id === id ? task : state.selectedTask,
        loading: false,
      }));
      return task;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update task', loading: false });
      return null;
    }
  },

  deleteTask: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
        loading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete task', loading: false });
      return false;
    }
  },

  executeTask: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.executeTask(id);
      set({ loading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to execute task', loading: false });
      return false;
    }
  },

  selectTask: (task: Task | null) => {
    set({ selectedTask: task });
  },

  setFilters: (filters: TaskFilters) => {
    set({ filters });
  },

  clearError: () => {
    set({ error: null });
  },
}));
