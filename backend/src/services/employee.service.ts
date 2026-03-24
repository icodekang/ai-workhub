/**
 * Employee Service - Business logic for AI Employee management
 *
 * Integrates with AgentLifecycle for automatic agent lifecycle management:
 * - Employee created → Agent auto-started
 * - Employee deleted → Agent stopped and removed
 * - Employee updated → Agent config updated
 */

import { v4 as uuidv4 } from 'uuid';
import * as db from '../storage/db';
import { Employee } from '../storage/db';
import { agentLifecycle } from '../agents/lifecycle';
import { agentRegistry } from '../agents/pi-mono/registry';

export interface CreateEmployeeInput {
  name: string;
  role: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  identity?: string;
  plan?: string;
}

export interface UpdateEmployeeInput {
  name?: string;
  role?: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  identity?: string;
  plan?: string;
  status?: 'inactive' | 'active' | 'busy';
}

export interface ListEmployeesFilter {
  status?: 'inactive' | 'active' | 'busy';
  role?: string;
}

// Validation helpers
function validateCreateInput(input: CreateEmployeeInput): string | null {
  if (!input.name || input.name.trim().length === 0) {
    return 'name is required';
  }
  if (input.name.length > 100) {
    return 'name must be 1-100 characters';
  }
  if (!input.role || input.role.trim().length === 0) {
    return 'role is required';
  }
  if (input.role.length > 50) {
    return 'role must be 1-50 characters';
  }
  if (input.systemPrompt && input.systemPrompt.length > 10000) {
    return 'systemPrompt must be max 10000 characters';
  }
  if (input.temperature !== undefined && (input.temperature < 0 || input.temperature > 2)) {
    return 'temperature must be between 0.0 and 2.0';
  }
  return null;
}

function validateUpdateInput(input: UpdateEmployeeInput): string | null {
  if (input.name !== undefined) {
    if (input.name.trim().length === 0) return 'name cannot be empty';
    if (input.name.length > 100) return 'name must be 1-100 characters';
  }
  if (input.role !== undefined) {
    if (input.role.trim().length === 0) return 'role cannot be empty';
    if (input.role.length > 50) return 'role must be 1-50 characters';
  }
  if (input.systemPrompt !== undefined && input.systemPrompt.length > 10000) {
    return 'systemPrompt must be max 10000 characters';
  }
  if (input.temperature !== undefined && (input.temperature < 0 || input.temperature > 2)) {
    return 'temperature must be between 0.0 and 2.0';
  }
  if (input.status !== undefined && !['inactive', 'active', 'busy'].includes(input.status)) {
    return 'status must be one of: inactive, active, busy';
  }
  return null;
}

// DB row -> API response shape
function toEmployeeResponse(emp: Employee) {
  return {
    id: emp.id,
    name: emp.name,
    role: emp.role,
    identity: emp.identity ?? null,
    plan: emp.plan,
    model: emp.model,
    temperature: emp.temperature,
    status: emp.status,
    systemPrompt: emp.system_prompt ?? null,
    createdAt: emp.created_at,
    updatedAt: emp.updated_at,
  };
}

function toEmployeeSummary(emp: Employee) {
  return {
    id: emp.id,
    name: emp.name,
    role: emp.role,
    status: emp.status,
    createdAt: emp.created_at,
  };
}

/**
 * Create a new employee and start a corresponding agent.
 */
export function createEmployee(input: CreateEmployeeInput): { employee: ReturnType<typeof toEmployeeResponse>; error?: string } {
  const validationError = validateCreateInput(input);
  if (validationError) {
    return { employee: null as any, error: validationError };
  }

  const id = uuidv4();
  const now = Date.now();

  const employeeData = {
    id,
    name: input.name.trim(),
    role: input.role.trim(),
    identity: input.identity ?? null,
    plan: input.plan ?? 'free',
    system_prompt: input.systemPrompt ?? null,
    model: input.model ?? 'gpt-4',
    temperature: input.temperature ?? 0.7,
    status: 'active' as const, // Agent is started, so employee is active
  };

  // Insert into DB
  const stmt = db.getDb().prepare(`
    INSERT INTO employees (id, name, role, identity, plan, system_prompt, model, temperature, status, created_at, updated_at)
    VALUES (@id, @name, @role, @identity, @plan, @system_prompt, @model, @temperature, @status, @created_at, @updated_at)
  `);
  stmt.run({ ...employeeData, created_at: now, updated_at: now });

  // Start the agent (registers in registry + persists to DB)
  try {
    agentLifecycle.startAgent(id);
  } catch (err) {
    console.error(`[EmployeeService] Failed to start agent for employee ${id}:`, err);
    // Continue anyway - employee is created, agent can be started manually
  }

  const created = db.getEmployeeById(id)!;
  return { employee: toEmployeeResponse(created) };
}

/**
 * Get a single employee by ID.
 */
export function getEmployeeById(id: string): ReturnType<typeof toEmployeeResponse> | null {
  const emp = db.getEmployeeById(id);
  if (!emp) return null;
  return toEmployeeResponse(emp);
}

/**
 * List employees with optional filters.
 */
export function listEmployees(filters?: ListEmployeesFilter): { employees: ReturnType<typeof toEmployeeSummary>[]; total: number } {
  let rows: Employee[];

  if (filters?.status) {
    rows = db.getDb()
      .prepare('SELECT * FROM employees WHERE status = ? ORDER BY created_at DESC')
      .all(filters.status) as Employee[];
  } else if (filters?.role) {
    rows = db.getDb()
      .prepare('SELECT * FROM employees WHERE role = ? ORDER BY created_at DESC')
      .all(filters.role) as Employee[];
  } else {
    rows = db.getAllEmployees();
  }

  return {
    employees: rows.map(toEmployeeSummary),
    total: rows.length,
  };
}

/**
 * Update an employee. If agent-related fields change, update the running agent config.
 */
export function updateEmployee(id: string, input: UpdateEmployeeInput): { employee: ReturnType<typeof toEmployeeResponse> | null; error?: string } {
  const validationError = validateUpdateInput(input);
  if (validationError) {
    return { employee: null, error: validationError };
  }

  const existing = db.getEmployeeById(id);
  if (!existing) {
    return { employee: null, error: 'Employee not found' };
  }

  // Build updates object
  const updates: Partial<Employee> = {};
  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.role !== undefined) updates.role = input.role.trim();
  if (input.identity !== undefined) updates.identity = input.identity;
  if (input.plan !== undefined) updates.plan = input.plan;
  if (input.systemPrompt !== undefined) updates.system_prompt = input.systemPrompt;
  if (input.model !== undefined) updates.model = input.model;
  if (input.temperature !== undefined) updates.temperature = input.temperature;
  if (input.status !== undefined) updates.status = input.status;

  if (Object.keys(updates).length > 0) {
    updates.updated_at = Date.now();
    db.updateEmployee(id, updates);

    // Sync agent config if agent-related fields changed
    const agentFieldsChanged =
      input.identity !== undefined ||
      input.plan !== undefined ||
      input.model !== undefined ||
      input.temperature !== undefined;

    if (agentFieldsChanged) {
      try {
        agentLifecycle.updateAgentConfig(id, {
          identity: input.identity,
          plan: input.plan,
          model: input.model,
          temperature: input.temperature,
        });
      } catch (err) {
        console.warn(`[EmployeeService] Agent not running for ${id}, skipping config sync`);
      }
    }
  }

  const updated = db.getEmployeeById(id)!;
  return { employee: toEmployeeResponse(updated) };
}

/**
 * Delete an employee. Stops and removes the corresponding agent.
 */
export function deleteEmployee(id: string): boolean {
  const existing = db.getEmployeeById(id);
  if (!existing) return false;

  // Stop and remove agent (registry + DB)
  try {
    agentLifecycle.stopAgent(id);
  } catch (err) {
    console.warn(`[EmployeeService] Error stopping agent for ${id}:`, err);
  }

  // Delete the employee (team_members foreign key CASCADE handles cleanup)
  return db.deleteEmployee(id);
}

/**
 * Get agent status for an employee.
 */
export function getAgentStatus(id: string): { status: string | null; agentId: string | null } {
  const employee = db.getEmployeeById(id);
  if (!employee) return { status: null, agentId: null };

  const agent = agentRegistry.getByEmployeeId(id);
  return {
    status: agent?.status ?? null,
    agentId: agent?.id ?? null,
  };
}
