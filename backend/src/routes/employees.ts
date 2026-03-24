/**
 * Employee Routes - REST API for AI Employee management
 */

import { Router, Request, Response } from 'express';
import * as employeeService from '../services/employee.service';

const router = Router();

// POST /api/employees - Create a new employee
router.post('/', (req: Request, res: Response) => {
  const { name, role, systemPrompt, model, temperature, identity, plan } = req.body;

  const result = employeeService.createEmployee({
    name,
    role,
    systemPrompt,
    model,
    temperature,
    identity,
    plan,
  });

  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(201).json(result.employee);
});

// GET /api/employees - List all employees
router.get('/', (req: Request, res: Response) => {
  const { status, role } = req.query;

  const filters: { status?: 'inactive' | 'active' | 'busy'; role?: string } = {};
  if (status && ['inactive', 'active', 'busy'].includes(status as string)) {
    filters.status = status as 'inactive' | 'active' | 'busy';
  }
  if (typeof role === 'string' && role.trim().length > 0) {
    filters.role = role.trim();
  }

  const result = employeeService.listEmployees(filters);
  return res.status(200).json(result);
});

// GET /api/employees/:id - Get a single employee
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const employee = employeeService.getEmployeeById(id);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  return res.status(200).json(employee);
});

// PUT /api/employees/:id - Update an employee
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, role, systemPrompt, model, temperature, identity, plan, status } = req.body;

  const result = employeeService.updateEmployee(id, {
    name,
    role,
    systemPrompt,
    model,
    temperature,
    identity,
    plan,
    status,
  });

  if (result.error === 'Employee not found') {
    return res.status(404).json({ error: result.error });
  }
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }

  return res.status(200).json(result.employee);
});

// DELETE /api/employees/:id - Delete an employee
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const deleted = employeeService.deleteEmployee(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  return res.status(204).send();
});

export default router;
