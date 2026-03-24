/**
 * Employee Routes - REST API for AI Employee management
 */

import { Router, Request, Response } from 'express';
import * as employeeService from '../services/employee.service';
import { agentLifecycle } from '../agents/lifecycle';
import { agentRegistry } from '../agents/pi-mono/registry';
import { agentChat } from '../agents/chat';

const router = Router();

// ─── Employee CRUD ───────────────────────────────────────────────────────────

// POST /api/employees - Create a new employee (auto-starts agent)
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

// DELETE /api/employees/:id - Delete an employee (stops agent)
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const deleted = employeeService.deleteEmployee(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  return res.status(204).send();
});

// ─── Agent Lifecycle ──────────────────────────────────────────────────────────

// GET /api/employees/:id/agent - Get agent status
router.get('/:id/agent', (req: Request, res: Response) => {
  const { id } = req.params;
  const agentStatus = employeeService.getAgentStatus(id);

  if (!agentStatus.agentId) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  const agent = agentRegistry.getByEmployeeId(id)!;
  return res.status(200).json({
    id: agent.id,
    employeeId: agent.employeeId,
    name: agent.name,
    identity: agent.identity,
    plan: agent.plan,
    model: agent.model,
    temperature: agent.temperature,
    status: agent.status,
    createdAt: agent.createdAt,
    lastActive: agent.lastActive,
  });
});

// POST /api/employees/:id/agent/start - Start agent
router.post('/:id/agent/start', (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const agent = agentLifecycle.startAgent(id);
    return res.status(200).json({
      id: agent.id,
      employeeId: agent.employeeId,
      status: agent.status,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/employees/:id/agent/stop - Stop agent
router.post('/:id/agent/stop', (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    agentLifecycle.stopAgent(id);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /api/employees/:id/agent/restart - Restart agent
router.post('/:id/agent/restart', (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const agent = agentLifecycle.restartAgent(id);
    return res.status(200).json({
      id: agent.id,
      employeeId: agent.employeeId,
      status: agent.status,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// PUT /api/employees/:id/agent/config - Update agent config
router.put('/:id/agent/config', (req: Request, res: Response) => {
  const { id } = req.params;
  const { identity, plan, model, temperature } = req.body;

  try {
    const agent = agentLifecycle.updateAgentConfig(id, {
      identity,
      plan,
      model,
      temperature,
    });
    return res.status(200).json({
      id: agent.id,
      identity: agent.identity,
      plan: agent.plan,
      model: agent.model,
      temperature: agent.temperature,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ─── Agent Chat ───────────────────────────────────────────────────────────────

// POST /api/employees/:id/chat - Chat with agent
router.post('/:id/chat', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { message, taskId, conversationId } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const result = await agentChat.chat(id, message, { taskId, conversationId });
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/employees/:id/agents - List all agents (admin)
router.get('/agents/list', (_req: Request, res: Response) => {
  return res.status(200).json({
    agents: agentRegistry.listSummary(),
    total: agentRegistry.count,
  });
});

// POST /api/employees/:id/memories - Add a memory to an employee
router.post('/:id/memories', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content, type, importance } = req.body;

  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'content is required' });
  }

  try {
    const memory = await agentChat.addMemory(
      id,
      content,
      type ?? 'episodic',
      importance ?? 0.5
    );
    return res.status(201).json(memory);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
