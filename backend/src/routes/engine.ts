/**
 * Engine Routes - REST API for Task Engine control
 *
 * Part of TASK-3.5 - Task Execution Engine
 */

import { Router, Request, Response } from 'express';
import { taskEngine } from '../engine';

const router = Router();

// POST /api/engine/start - Start the task engine
router.post('/start', (_req: Request, res: Response) => {
  if (taskEngine.isRunning) {
    return res.status(409).json({ error: 'Engine already running' });
  }
  taskEngine.start();
  return res.status(200).json({ message: 'Engine started' });
});

// POST /api/engine/stop - Stop the task engine
router.post('/stop', (_req: Request, res: Response) => {
  if (!taskEngine.isRunning) {
    return res.status(409).json({ error: 'Engine not running' });
  }
  taskEngine.stop();
  return res.status(200).json({ message: 'Engine stopped' });
});

// GET /api/engine/status - Get engine status
router.get('/status', (_req: Request, res: Response) => {
  const status = taskEngine.getStatus();
  return res.status(200).json(status);
});

export default router;
