/**
 * Work Products Routes - REST API for work products
 *
 * Part of TASK-5.2 - Work Product API
 */

import { Router, Request, Response } from 'express';
import * as workProductService from '../services/work-product.service';
import * as fileStorage from '../storage/file-storage';

const router = Router();

// GET /api/work-products - List work products
router.get('/', (req: Request, res: Response) => {
  const { employeeId, taskId } = req.query;

  const filters: { employeeId?: string; taskId?: string } = {};
  if (typeof employeeId === 'string') filters.employeeId = employeeId;
  if (typeof taskId === 'string') filters.taskId = taskId;

  const products = workProductService.listWorkProducts(filters);
  return res.status(200).json({ products });
});

// GET /api/work-products/:id - Get a single work product
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const product = workProductService.getWorkProduct(id);
  if (!product) {
    return res.status(404).json({ error: 'Work product not found' });
  }

  return res.status(200).json(product);
});

// POST /api/work-products - Create a new work product (from text content)
router.post('/', async (req: Request, res: Response) => {
  const { taskId, employeeId, filename, content, mimeType } = req.body;

  if (!employeeId || !filename) {
    return res.status(400).json({ error: 'employeeId and filename are required' });
  }

  try {
    // Convert content string to buffer
    const buffer = Buffer.from(content || '', 'utf-8');

    const product = await workProductService.createWorkProductFromFile({
      taskId,
      employeeId,
      fileBuffer: buffer,
      originalName: filename,
      mimeType: mimeType || 'text/plain',
    });

    if (!product) {
      return res.status(500).json({ error: 'Failed to create work product' });
    }

    return res.status(201).json(product);
  } catch (error: any) {
    console.error('[WorkProductRoutes] POST /api/work-products error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /api/work-products/:id - Delete a work product
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const deleted = await workProductService.deleteWorkProduct(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Work product not found' });
  }

  return res.status(204).send();
});

// GET /api/work-products/:id/download - Download a work product file
router.get('/:id/download', async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = workProductService.getWorkProduct(id);
  if (!product) {
    return res.status(404).json({ error: 'Work product not found' });
  }

  try {
    const fileBuffer = await fileStorage.readFile(product.filename);
    if (!fileBuffer) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', product.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${product.originalName}"`);
    if (product.sizeBytes) {
      res.setHeader('Content-Length', product.sizeBytes);
    }

    return res.status(200).send(fileBuffer);
  } catch (error: any) {
    console.error('[WorkProductRoutes] Download error:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
