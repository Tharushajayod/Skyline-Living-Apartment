import { apiClient } from './api';
import { fastCache } from './cache';
import type { Payment } from '@/shared/types';

export const paymentService = {
  getCachedAll(): Payment[] | null {
    return fastCache.get<Payment[]>('payments_all');
  },

  getCachedByCustomer(email: string): Payment[] | null {
    return fastCache.get<Payment[]>(`payments_cust_${email}`);
  },

  async getAll(): Promise<Payment[]> {
    const data = await apiClient.get<Payment[]>('/payments');
    if (Array.isArray(data)) {
      fastCache.set('payments_all', data);
    }
    return data;
  },

  async getByCustomer(email: string): Promise<Payment[]> {
    const data = await apiClient.get<Payment[]>(`/payments?customer=${encodeURIComponent(email)}`);
    if (Array.isArray(data)) {
      fastCache.set(`payments_cust_${email}`, data);
    }
    return data;
  },

  async create(payment: { apartmentId?: string; reservationId?: string; paymentPlanId?: string; paymentPlanItemId?: string; type: string; amount: number; notes?: string }): Promise<Payment> {
    const res = await apiClient.post<Payment>('/payments', payment);
    fastCache.invalidate('payments');
    fastCache.invalidate('dashboard');
    return res;
  },

  async uploadProof(id: string, formData: FormData): Promise<Payment> {
    const res = await apiClient.upload<Payment>(`/payments/${id}/proof`, formData);
    fastCache.invalidate('payments');
    fastCache.invalidate('dashboard');
    return res;
  },

  async verify(id: string, verifiedBy: string, notes?: string): Promise<Payment> {
    const res = await apiClient.patch<Payment>(`/payments/${id}/verify`, { verifiedBy, notes });
    fastCache.invalidate('payments');
    fastCache.invalidate('sales');
    fastCache.invalidate('dashboard');
    return res;
  },

  async reject(id: string, verifiedBy: string, notes: string): Promise<Payment> {
    const res = await apiClient.patch<Payment>(`/payments/${id}/reject`, { verifiedBy, notes });
    fastCache.invalidate('payments');
    fastCache.invalidate('dashboard');
    return res;
  },
};
