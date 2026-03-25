/**
 * Work Product Store
 *
 * Zustand store for work product state management
 */

import { create } from 'zustand';
import type { WorkProduct, WorkProductFilters } from '@/types/work-product';

interface WorkProductState {
  workProducts: WorkProduct[];
  selectedProduct: WorkProduct | null;
  loading: boolean;
  error: string | null;
  filters: WorkProductFilters;

  // Actions
  fetchWorkProducts: (filters?: WorkProductFilters) => Promise<void>;
  selectProduct: (product: WorkProduct | null) => void;
  setFilters: (filters: WorkProductFilters) => void;
  clearError: () => void;
}

export const useWorkProductStore = create<WorkProductState>((set) => ({
  workProducts: [],
  selectedProduct: null,
  loading: false,
  error: null,
  filters: {},

  fetchWorkProducts: async (filters?: WorkProductFilters) => {
    set({ loading: true, error: null });
    try {
      // TODO: Replace with actual API call when backend is ready
      // For now, return empty array as placeholder
      const products: WorkProduct[] = [];
      set({ workProducts: products, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch work products', loading: false });
    }
  },

  selectProduct: (product: WorkProduct | null) => {
    set({ selectedProduct: product });
  },

  setFilters: (filters: WorkProductFilters) => {
    set({ filters });
  },

  clearError: () => {
    set({ error: null });
  },
}));
