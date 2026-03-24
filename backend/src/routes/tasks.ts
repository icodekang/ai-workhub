/**
 * Task Routes - REST API for Task management
 */

import { Router, Request, Response } from 'express';
import * as taskService from '../services/task.service';

const router = Router();

// POST /api/tasks - Create a new task
router.post('/', (req: Request, res: Response) => {
  const { title, description, assigneeType, assigneeId } = req.body;

  const result = taskService.createTask({
    title,
    description,
    assigneeType,
    assigneeId,
  });

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(201).json(result.task);
});

// GET /api/tasks - List tasks with filtering
router.get('/', (req: Request, res: Response) => {
  const { status, assigneeType, assigneeId, page, limit } = req.query;

  const filters: taskService.ListTasksFilter = {};
  if (status && ['pending', 'in_progress', 'completed', 'failed'].includes(status as string)) {
    filters.status = status as taskService.TaskStatus;
  }
  if (assigneeType && ['employee', 'team'].includes(assigneeType as string)) {
    filters.assigneeType = assigneeType as taskService.AssigneeType;
  }
  if (typeof assigneeId === 'string' && assigneeId.trim().length > 0) {
    filters.assigneeId = assigneeId.trim();
  }

  const pagination: taskService.PaginationInput = {};
  if (page !== undefined) {
    const pageNum = parseInt(page as string, 10);
    if (!isNaN(pageNum)) pagination.page = pageNum;
  }
  if (limit !== undefined) {
    const limitNum = parseInt(limit as string, 10);
    if (!isNaN(limitNum)) pagination.limit = limitNum;
  }

  const result = taskService.listTasks(filters, pagination);
  return res.status(200).json(result);
});

// GET /api/tasks/:id - Get a single task
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const task = taskService.getTaskById(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  return res.status(200).json(task);
});

// PUT /api/tasks/:id - Update task fields
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, status, result } = req.body;

  const result2 = taskService.updateTask(id, {
    title,
    description,
    status,
    result,
  });

  if (result2.error === 'Task not found') {
    return res.status(404).json({ error: result2.error });
  }
  if (result2.error) {
    return res.status(409).json({ error: result2.error });
  }

  return res.status(200).json(result2.task);
});

// PUT /api/tasks/:id/status - Update task status only
router.put('/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, result } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  const result2 = taskService.updateTaskStatus(id, { status, result });

  if (result2.error === 'Task not found') {
    return res.status(404).json({ error: result2.error });
  }
  if (result2.error) {
    return res.status(409).json({ error: result2.error });
  }

  return res.status(200).json(result2.task);
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const deleted = taskService.deleteTask(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Task not found' });
  }

  return res.status(204).send();
});

export default router;
