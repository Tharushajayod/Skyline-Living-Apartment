import { apiClient } from './api';
import { fastCache } from './cache';
import type { Sale, SaleDetails, User, SalesSummary, DashboardStats, ReportData } from '@/shared/types';

export const salesService = {
  getCached(): Sale[] | null {
    return fastCache.get<Sale[]>('sales_all');
  },

  getCachedSummary(): SalesSummary | null {
    return fastCache.get<SalesSummary>('sales_summary');
  },

  getCachedDetails(id: string): SaleDetails | null {
    return fastCache.get<SaleDetails>(`sale_details_${id}`);
  },

  async getAll(): Promise<Sale[]> {
    const data = await apiClient.get<Sale[]>('/sales');
    if (Array.isArray(data)) {
      fastCache.set('sales_all', data);
    }
    return data;
  },

  async getSummary(): Promise<SalesSummary> {
    const data = await apiClient.get<SalesSummary>('/sales/summary');
    if (data) {
      fastCache.set('sales_summary', data);
    }
    return data;
  },

  async getDetails(id: string): Promise<SaleDetails> {
    const data = await apiClient.get<SaleDetails>(`/sales/${id}/details`);
    if (data) {
      fastCache.set(`sale_details_${id}`, data);
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
  getCachedStats(): DashboardStats | null {
    return fastCache.get<DashboardStats>('dashboard_stats');
  },

  getCachedReports(range = '6m'): ReportData | null {
    return fastCache.get<ReportData>(`dashboard_reports_${range}`);
  },

  async getStats(): Promise<DashboardStats> {
    const data = await apiClient.get<DashboardStats>('/dashboard/stats');
    if (data) {
      fastCache.set('dashboard_stats', data);
    }
    return data;
  },

  async getReports(range = '6m'): Promise<ReportData> {
    const data = await apiClient.get<ReportData>(`/dashboard/reports?range=${encodeURIComponent(range)}`);
    if (data) {
      fastCache.set(`dashboard_reports_${range}`, data);
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
