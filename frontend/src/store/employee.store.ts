/**
 * Employee Store
 *
 * Zustand store for employee state management
 */

import { create } from 'zustand';
import type { Employee, CreateEmployeeInput, UpdateEmployeeInput, EmployeeStatus } from '@/types/employee';
import { api } from '@/lib/api';

interface EmployeeState {
  employees: Employee[];
  selectedEmployee: Employee | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchEmployees: () => Promise<void>;
  fetchEmployee: (id: string) => Promise<Employee | null>;
  createEmployee: (input: CreateEmployeeInput) => Promise<Employee | null>;
  updateEmployee: (id: string, input: UpdateEmployeeInput) => Promise<Employee | null>;
  deleteEmployee: (id: string) => Promise<boolean>;
  selectEmployee: (employee: Employee | null) => void;
  clearError: () => void;
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  selectedEmployee: null,
  loading: false,
  error: null,

  fetchEmployees: async () => {
    set({ loading: true, error: null });
    try {
      const employees = await api.getEmployees();
      set({ employees, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch employees', loading: false });
    }
  },

  fetchEmployee: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const employee = await api.getEmployee(id);
      set({ selectedEmployee: employee, loading: false });
      return employee;
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch employee', loading: false });
      return null;
    }
  },

  createEmployee: async (input: CreateEmployeeInput) => {
    set({ loading: true, error: null });
    try {
      const employee = await api.createEmployee(input);
      set((state) => ({
        employees: [...state.employees, employee],
        loading: false,
      }));
      return employee;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create employee', loading: false });
      return null;
    }
  },

  updateEmployee: async (id: string, input: UpdateEmployeeInput) => {
    set({ loading: true, error: null });
    try {
      const employee = await api.updateEmployee(id, input);
      set((state) => ({
        employees: state.employees.map((e) => (e.id === id ? employee : e)),
        selectedEmployee: state.selectedEmployee?.id === id ? employee : state.selectedEmployee,
        loading: false,
      }));
      return employee;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update employee', loading: false });
      return null;
    }
  },

  deleteEmployee: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.deleteEmployee(id);
      set((state) => ({
        employees: state.employees.filter((e) => e.id !== id),
        selectedEmployee: state.selectedEmployee?.id === id ? null : state.selectedEmployee,
        loading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete employee', loading: false });
      return false;
    }
  },

  selectEmployee: (employee: Employee | null) => {
    set({ selectedEmployee: employee });
  },

  clearError: () => {
    set({ error: null });
  },
}));
