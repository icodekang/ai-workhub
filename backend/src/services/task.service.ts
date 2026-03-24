/**
 * Task Service - Business logic for Task management
 */

import { v4 as uuidv4 } from 'uuid';
import * as db from '../storage/db';
import { Task } from '../storage/db';

// ============================================================
// Types
// ============================================================

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type AssigneeType = 'employee' | 'team';

export interface CreateTaskInput {
  title: string;
  description?: string;
  assigneeType: AssigneeType;
  assigneeId: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  result?: string;
}

export interface UpdateTaskStatusInput {
  status: TaskStatus;
  result?: string;
}

export interface ListTasksFilter {
  status?: TaskStatus;
  assigneeType?: AssigneeType;
  assigneeId?: string;
}

export interface PaginationInput {
  page?: number;
  limit?: number;
}

const VALID_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ['in_progress'],
  in_progress: ['completed', 'failed'],
  completed: [],
  failed: [],
};

// ============================================================
// Response Shape Helpers
// ============================================================

function toTaskResponse(task: Task, assigneeName?: string | null) {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? null,
    status: task.status,
    assigneeType: task.assignee_type,
    assigneeId: task.assignee_id,
    assigneeName: assigneeName ?? null,
    result: task.result ?? null,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    completedAt: task.completed_at ?? null,
  };
}

function toTaskSummary(task: Task, assigneeName?: string | null) {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    assigneeType: task.assignee_type,
    assigneeId: task.assignee_id,
    assigneeName: assigneeName ?? undefined,
    createdAt: task.created_at,
  };
}

// ============================================================
// Validation
// ============================================================

function validateCreateInput(input: CreateTaskInput): string | null {
  if (!input.title || input.title.trim().length === 0) {
    return 'title is required';
  }
  if (input.title.length > 200) {
    return 'title must be 1-200 characters';
  }
  if (input.description && input.description.length > 5000) {
    return 'description must be max 5000 characters';
  }
  if (!input.assigneeType || !['employee', 'team'].includes(input.assigneeType)) {
    return 'assigneeType must be employee or team';
  }
  if (!input.assigneeId || input.assigneeId.trim().length === 0) {
    return 'assigneeId is required';
  }
  return null;
}

function validateUpdateInput(input: UpdateTaskInput): string | null {
  if (input.title !== undefined) {
    if (input.title.trim().length === 0) return 'title cannot be empty';
    if (input.title.length > 200) return 'title must be 1-200 characters';
  }
  if (input.description !== undefined && input.description.length > 5000) {
    return 'description must be max 5000 characters';
  }
  if (input.status !== undefined && !['pending', 'in_progress', 'completed', 'failed'].includes(input.status)) {
    return 'status must be one of: pending, in_progress, completed, failed';
  }
  if (input.result !== undefined && input.result.length > 10000) {
    return 'result must be max 10000 characters';
  }
  return null;
}

function validateStatusTransition(current: TaskStatus, next: TaskStatus): string | null {
  const allowed = VALID_STATUS_TRANSITIONS[current];
  if (!allowed.includes(next)) {
    return `invalid status transition: ${current} → ${next}`;
  }
  return null;
}

function getAssigneeName(assigneeType: AssigneeType, assigneeId: string): string | null {
  if (assigneeType === 'employee') {
    const emp = db.getEmployeeById(assigneeId);
    return emp?.name ?? null;
  } else {
    const team = db.getTeamById(assigneeId);
    return team?.name ?? null;
  }
}

// ============================================================
// CRUD Operations
// ============================================================

export function createTask(input: CreateTaskInput): { task: ReturnType<typeof toTaskResponse>; error?: string } {
  const validationError = validateCreateInput(input);
  if (validationError) {
    return { task: null as any, error: validationError };
  }

  // Validate assignee exists
  if (input.assigneeType === 'employee') {
    const emp = db.getEmployeeById(input.assigneeId);
    if (!emp) {
      return { task: null as any, error: 'Employee not found' };
    }
  } else {
    const team = db.getTeamById(input.assigneeId);
    if (!team) {
      return { task: null as any, error: 'Team not found' };
    }
  }

  const id = uuidv4();
  const now = Date.now();

  const taskData = {
    id,
    title: input.title.trim(),
    description: input.description?.trim() ?? null,
    status: 'pending' as const,
    assignee_type: input.assigneeType,
    assignee_id: input.assigneeId,
    result: null,
  };

  const stmt = db.getDb().prepare(`
    INSERT INTO tasks (id, title, description, status, assignee_type, assignee_id, result, created_at, updated_at, completed_at)
    VALUES (@id, @title, @description, @status, @assignee_type, @assignee_id, @result, @created_at, @updated_at, @completed_at)
  `);
  stmt.run({ ...taskData, created_at: now, updated_at: now, completed_at: null });

  const created = db.getTaskById(id)!;
  const assigneeName = getAssigneeName(input.assigneeType, input.assigneeId);
  return { task: toTaskResponse(created, assigneeName) };
}

export function getTaskById(id: string): ReturnType<typeof toTaskResponse> | null {
  const task = db.getTaskById(id);
  if (!task) return null;
  const assigneeName = getAssigneeName(task.assignee_type, task.assignee_id);
  return toTaskResponse(task, assigneeName);
}

export function listTasks(
  filters: ListTasksFilter = {},
  pagination: PaginationInput = {}
): {
  tasks: ReturnType<typeof toTaskSummary>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} {
  const page = Math.max(1, pagination.page ?? 1);
  const limit = Math.min(100, Math.max(1, pagination.limit ?? 20));
  const offset = (page - 1) * limit;

  const db2 = db.getDb();
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters.assigneeType) {
    conditions.push('assignee_type = ?');
    params.push(filters.assigneeType);
  }
  if (filters.assigneeId) {
    conditions.push('assignee_id = ?');
    params.push(filters.assigneeId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count total
  const countStmt = db2.prepare(`SELECT COUNT(*) as count FROM tasks ${whereClause}`);
  const { count } = countStmt.get(...params) as { count: number };

  // Fetch rows
  const rowsStmt = db2.prepare(`
    SELECT * FROM tasks ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);
  const rows = rowsStmt.all(...params, limit, offset) as Task[];

  const tasks = rows.map((task) => {
    const assigneeName = getAssigneeName(task.assignee_type, task.assignee_id);
    return toTaskSummary(task, assigneeName);
  });

  return {
    tasks,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
}

export function updateTask(
  id: string,
  input: UpdateTaskInput
): { task: ReturnType<typeof toTaskResponse> | null; error?: string } {
  const validationError = validateUpdateInput(input);
  if (validationError) {
    return { task: null, error: validationError };
  }

  const existing = db.getTaskById(id);
  if (!existing) {
    return { task: null, error: 'Task not found' };
  }

  // Validate status transition if status is being updated
  if (input.status && input.status !== existing.status) {
    const transitionError = validateStatusTransition(existing.status, input.status);
    if (transitionError) {
      return { task: null, error: transitionError };
    }
  }

  const updates: Partial<Task> = {};
  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.description !== undefined) updates.description = input.description?.trim() ?? null;
  if (input.status !== undefined) updates.status = input.status;
  if (input.result !== undefined) updates.result = input.result ?? null;

  // Set completed_at when status changes to completed or failed
  if (input.status && (input.status === 'completed' || input.status === 'failed')) {
    updates.completed_at = Date.now();
  }

  if (Object.keys(updates).length > 0) {
    updates.updated_at = Date.now();
    db.updateTask(id, updates);
  }

  const updated = db.getTaskById(id)!;
  const assigneeName = getAssigneeName(updated.assignee_type, updated.assignee_id);
  return { task: toTaskResponse(updated, assigneeName) };
}

export function updateTaskStatus(
  id: string,
  input: UpdateTaskStatusInput
): { task: ReturnType<typeof toTaskResponse> | null; error?: string } {
  const existing = db.getTaskById(id);
  if (!existing) {
    return { task: null, error: 'Task not found' };
  }

  const transitionError = validateStatusTransition(existing.status, input.status);
  if (transitionError) {
    return { task: null, error: transitionError };
  }

  const updates: Partial<Task> = {
    status: input.status,
    result: input.result ?? undefined,
  };

  if (input.status === 'completed' || input.status === 'failed') {
    updates.completed_at = Date.now();
  }

  updates.updated_at = Date.now();
  db.updateTask(id, updates);

  const updated = db.getTaskById(id)!;
  const assigneeName = getAssigneeName(updated.assignee_type, updated.assignee_id);
  return { task: toTaskResponse(updated, assigneeName) };
}

export function deleteTask(id: string): boolean {
  const existing = db.getTaskById(id);
  if (!existing) return false;
  return db.deleteTask(id);
}
