/**
 * Employee Types
 *
 * Shared type definitions for Employee entities
 */

export interface Employee {
  id: string;
  name: string;
  role: string;
  identity?: string;
  plan: string;
  systemPrompt?: string;
  model: string;
  temperature: number;
  status: EmployeeStatus;
  createdAt: number;
  updatedAt: number;
}

export type EmployeeStatus = 'inactive' | 'active' | 'busy';

export interface CreateEmployeeInput {
  name: string;
  role: string;
  identity?: string;
  plan?: string;
  model?: string;
  temperature?: number;
}

export interface UpdateEmployeeInput {
  name?: string;
  role?: string;
  identity?: string;
  plan?: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  status?: EmployeeStatus;
}

export interface EmployeeFilters {
  status?: EmployeeStatus;
  search?: string;
}
