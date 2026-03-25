/**
 * Task Types
 *
 * Shared type definitions for Task entities
 */

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assigneeType: 'employee' | 'team';
  assigneeId: string;
  assigneeName?: string;
  result?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface CreateTaskInput {
  title: string;
  description?: string;
  assigneeType: 'employee' | 'team';
  assigneeId: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  result?: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  assigneeType?: 'employee' | 'team';
  assigneeId?: string;
}
