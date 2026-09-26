import { apiClient } from './api';
import { fastCache } from './cache';
import type { Reservation, ReservationDetails, ReservationRefund, ReservationStatus } from '@/shared/types';

export const reservationService = {
  getCachedAll(): Reservation[] | null {
    return fastCache.get<Reservation[]>('reservations_all');
  },

  getCachedByCustomer(email: string): Reservation[] | null {
    return fastCache.get<Reservation[]>(`reservations_cust_${email}`);
  },

  getCachedDetails(id: string): ReservationDetails | null {
    return fastCache.get<ReservationDetails>(`reservation_details_${id}`);
  },

  async getAll(): Promise<Reservation[]> {
    const data = await apiClient.get<Reservation[]>('/reservations');
    if (Array.isArray(data)) {
      fastCache.set('reservations_all', data);
    }
    return data;
  },

  async getDetails(id: string): Promise<ReservationDetails> {
    const data = await apiClient.get<ReservationDetails>(`/reservations/${id}/details`);
    if (data) {
      fastCache.set(`reservation_details_${id}`, data);
    }
    return data;
  },

  async getAllRefunds(): Promise<ReservationRefund[]> {
    const data = await apiClient.get<ReservationRefund[]>('/reservations/refunds');
    return Array.isArray(data) ? data : [];
  },

  async getByCustomer(email: string): Promise<Reservation[]> {
    const data = await apiClient.get<Reservation[]>(`/reservations?customer=${encodeURIComponent(email)}`);
    if (Array.isArray(data)) {
      fastCache.set(`reservations_cust_${email}`, data);
    }
    return data;
  },

  async create(reservation: {
    apartmentId: string;
    apartmentTitle?: string;
    customerName?: string;
    customerEmail?: string;
    reservationFee?: number;
    appointmentId?: string;
  }): Promise<Reservation> {
    const res = await apiClient.post<Reservation>('/reservations', reservation);
    fastCache.invalidate('reservations');
    fastCache.invalidate('dashboard');
    return res;
  },

  async cancelWithRefund(
    id: string,
    payload: {
      refundAmount: number;
      companyRetainedAmount: number;
      reason: string;
      notes?: string;
    }
  ): Promise<ReservationRefund> {
    const res = await apiClient.post<ReservationRefund>(`/reservations/${id}/cancel`, payload);
    fastCache.invalidate('reservations');
    fastCache.invalidate('dashboard');
    fastCache.invalidate(`reservation_details_${id}`);
    fastCache.invalidate('sales');
    return res;
  },

  async processExpiredRefund(
    id: string,
    payload: {
      refundAmount: number;
      companyRetainedAmount: number;
      reason: string;
      notes?: string;
    }
  ): Promise<ReservationRefund> {
    const res = await apiClient.post<ReservationRefund>(`/reservations/${id}/refund`, payload);
    fastCache.invalidate('reservations');
    fastCache.invalidate('dashboard');
    fastCache.invalidate(`reservation_details_${id}`);
    fastCache.invalidate('sales');
    return res;
  },

  async updateStatus(id: string, status: ReservationStatus): Promise<Reservation> {
    const res = await apiClient.patch<Reservation>(`/reservations/${id}/status`, { status });
    fastCache.invalidate('reservations');
    fastCache.invalidate('dashboard');
    fastCache.invalidate(`reservation_details_${id}`);
    return res;
  },
};
