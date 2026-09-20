import { apiClient } from './api';
import { fastCache } from './cache';
import type { Sale, User } from '@/shared/types';

export const salesService = {
  getCached(): Sale[] | null {
    return fastCache.get<Sale[]>('sales_all');
  },

  async getAll(): Promise<Sale[]> {
    const data = await apiClient.get<Sale[]>('/sales');
    if (Array.isArray(data)) {
      fastCache.set('sales_all', data);
    }
    return data;
  },

  async create(sale: Omit<Sale, 'id' | 'saleDate'>): Promise<Sale> {
    const result = await apiClient.post<Sale>('/sales', sale);
    fastCache.invalidate('sales');
    fastCache.invalidate('dashboard');
    return result;
  },
};

export const dashboardService = {
  getCachedStats(): any | null {
    return fastCache.get<any>('dashboard_stats');
  },

  getCachedReports(): any | null {
    return fastCache.get<any>('dashboard_reports');
  },

  async getStats(): Promise<any> {
    const data = await apiClient.get<any>('/dashboard/stats');
    if (data) {
      fastCache.set('dashboard_stats', data);
    }
    return data;
  },

  async getReports(): Promise<any> {
    const data = await apiClient.get<any>('/dashboard/reports');
    if (data) {
      fastCache.set('dashboard_reports', data);
    }
    return data;
  },
};

export const userService = {
  getCached(): User[] | null {
    return fastCache.get<User[]>('users_all');
  },

  async getAll(): Promise<User[]> {
    const data = await apiClient.get<User[]>('/users');
    if (Array.isArray(data)) {
      fastCache.set('users_all', data);
    }
    return data;
  },

  async updateRole(id: string, role: User['role']): Promise<User> {
    const result = await apiClient.patch<User>(`/users/${id}/role`, { role });
    fastCache.invalidate('users');
    return result;
  },

  async updateStatus(id: string, status: User['status']): Promise<User> {
    const result = await apiClient.patch<User>(`/users/${id}/status`, { status });
    fastCache.invalidate('users');
    return result;
  },
};
