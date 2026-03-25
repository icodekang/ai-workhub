/**
 * Work Product Types
 *
 * Shared type definitions for Work Product entities
 */

export interface WorkProduct {
  id: string;
  taskId?: string;
  employeeId?: string;
  employeeName?: string;
  filename: string;
  filepath: string;
  mimeType?: string;
  sizeBytes?: number;
  version: number;
  createdAt: number;
}

export interface WorkProductFilters {
  employeeId?: string;
  taskId?: string;
  search?: string;
}
