import { apiClient } from './api';
import { fastCache } from './cache';
import type { Reservation, ReservationStatus } from '@/shared/types';

export const reservationService = {
  getCachedAll(): Reservation[] | null {
    return fastCache.get<Reservation[]>('reservations_all');
  },

  getCachedByCustomer(email: string): Reservation[] | null {
    return fastCache.get<Reservation[]>(`reservations_cust_${email}`);
  },

  async getAll(): Promise<Reservation[]> {
    const data = await apiClient.get<Reservation[]>('/reservations');
    if (Array.isArray(data)) {
      fastCache.set('reservations_all', data);
    }
    return data;
  },

  async getByCustomer(email: string): Promise<Reservation[]> {
    const data = await apiClient.get<Reservation[]>(`/reservations?customer=${encodeURIComponent(email)}`);
    if (Array.isArray(data)) {
      fastCache.set(`reservations_cust_${email}`, data);
    }
    return data;
  },

  async create(reservation: Omit<Reservation, 'id' | 'createdAt' | 'status' | 'expiresAt'>): Promise<Reservation> {
    const res = await apiClient.post<Reservation>('/reservations', reservation);
    fastCache.invalidate('reservations');
    fastCache.invalidate('dashboard');
    return res;
  },

  async updateStatus(id: string, status: ReservationStatus): Promise<Reservation> {
    const res = await apiClient.patch<Reservation>(`/reservations/${id}/status`, { status });
    fastCache.invalidate('reservations');
    fastCache.invalidate('dashboard');
    return res;
  },
};
