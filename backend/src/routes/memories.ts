/**
 * Memory Routes - REST API for employee memory management
 *
 * Endpoints:
 * - POST   /api/employees/:id/memories     - Create a new memory
 * - GET    /api/employees/:id/memories     - Search/list memories
 * - GET    /api/employees/:id/memories/:memoryId - Get a specific memory
 * - DELETE /api/employees/:id/memories/:memoryId - Delete a memory
 */

import { Router, Request, Response } from 'express';
import * as memory from '../agents/memory';
import type { AnyMemoryType } from '../agents/memory';
import * as db from '../storage/db';

const router = Router();

// ─── Create Memory ───────────────────────────────────────────────────────────

// POST /api/employees/:id/memories
router.post('/:id/memories', async (req: Request, res: Response) => {
  const { id: employeeId } = req.params;
  const { description, type, data, importanceOverride } = req.body;

  if (!description || typeof description !== 'string') {
    return res.status(400).json({ error: 'description is required and must be a string' });
  }

  if (!type) {
    return res.status(400).json({ error: 'type is required' });
  }

  const validTypes = ['conversation', 'task', 'reflection', 'relationship', 'episodic', 'semantic', 'working'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
  }

  // Verify employee exists
  const employee = db.getEmployeeById(employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  try {
    const result = await memory.storeMemory({
      employeeId,
      description,
      type: type as any,
      data,
      importanceOverride: importanceOverride !== undefined ? Number(importanceOverride) : undefined,
    });

    return res.status(201).json(result);
  } catch (err: any) {
    console.error(`[MemoryRoutes] Failed to store memory:`, err);
    return res.status(500).json({ error: err.message ?? 'Failed to store memory' });
  }
});

// ─── Search / List Memories ─────────────────────────────────────────────────

// GET /api/employees/:id/memories
router.get('/:id/memories', async (req: Request, res: Response) => {
  const { id: employeeId } = req.params;
  const { q, type, limit: limitStr, offset } = req.query;

  // Verify employee exists
  const employee = db.getEmployeeById(employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const limit = limitStr ? Math.min(parseInt(limitStr as string, 10) || 5, 50) : 5;

  // If query provided, do vector search
  if (q && typeof q === 'string' && q.trim().length > 0) {
    try {
      const results = await memory.searchMemories({
        query: q,
        employeeId,
        type: type as AnyMemoryType | undefined,
        limit,
      });
      return res.status(200).json({ memories: results, total: results.length, source: 'vector' });
    } catch (err: any) {
      console.error(`[MemoryRoutes] Vector search failed, falling back to FTS:`, err);
      try {
        const results = await memory.searchMemoriesFTS({
          query: q,
          employeeId,
          type: type as AnyMemoryType | undefined,
          limit,
        });
        return res.status(200).json({ memories: results, total: results.length, source: 'fts' });
      } catch (ftsErr: any) {
        return res.status(500).json({ error: ftsErr.message ?? 'Search failed' });
      }
    }
  }

  // No query - list memories by type or all
  try {
    let memories: memory.MemoryRecord[];
    if (type && typeof type === 'string') {
      memories = await memory.getMemoriesByType(employeeId, type, limit);
    } else {
      memories = memory.getEmployeeMemories(employeeId).slice(Number(offset) || 0, limit);
    }
    return res.status(200).json({ memories, total: memories.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Failed to list memories' });
  }
});

// ─── Get Specific Memory ─────────────────────────────────────────────────────

// GET /api/employees/:id/memories/:memoryId
router.get('/:id/memories/:memoryId', (req: Request, res: Response) => {
  const { memoryId } = req.params;
  const { id: employeeId } = req.params;

  const mem = memory.getMemory(memoryId);
  if (!mem) {
    return res.status(404).json({ error: 'Memory not found' });
  }

  if (mem.employeeId !== employeeId) {
    return res.status(403).json({ error: 'Memory belongs to a different employee' });
  }

  return res.status(200).json(mem);
});

// ─── Delete Memory ───────────────────────────────────────────────────────────

// DELETE /api/employees/:id/memories/:memoryId
router.delete('/:id/memories/:memoryId', (req: Request, res: Response) => {
  const { id: employeeId, memoryId } = req.params;

  const mem = memory.getMemory(memoryId);
  if (!mem) {
    return res.status(404).json({ error: 'Memory not found' });
  }

  if (mem.employeeId !== employeeId) {
    return res.status(403).json({ error: 'Memory belongs to a different employee' });
  }

  const deleted = memory.deleteMemory(memoryId);
  if (!deleted) {
    return res.status(500).json({ error: 'Failed to delete memory' });
  }

  return res.status(204).send();
});

// ─── Conversation Memory ─────────────────────────────────────────────────────

// POST /api/employees/:id/memories/from-conversation
router.post('/:id/memories/from-conversation', async (req: Request, res: Response) => {
  const { id: employeeId } = req.params;
  const { conversationId, summary, participantIds } = req.body;

  if (!conversationId || typeof conversationId !== 'string') {
    return res.status(400).json({ error: 'conversationId is required' });
  }

  if (!participantIds || !Array.isArray(participantIds)) {
    return res.status(400).json({ error: 'participantIds must be an array' });
  }

  const employee = db.getEmployeeById(employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  try {
    const result = await memory.rememberConversationFromId(
      employeeId,
      conversationId,
      participantIds,
      summary
    );
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? 'Failed to remember conversation' });
  }
});

export default router;
