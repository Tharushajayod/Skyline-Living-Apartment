import { apiClient } from './api';
import { fastCache } from './cache';
import type { Reservation, ReservationDetails, ReservationRefund, ReservationStatus, RefundEligibility } from '@/shared/types';

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
  async cancelReservation(
    id: string,
    payload?: {
      reason?: string;
    }
  ): Promise<ReservationRefund> {
    const res = await apiClient.post<ReservationRefund>(`/reservations/${id}/cancel`, payload || {});
    fastCache.invalidate('reservations');
    fastCache.invalidate('dashboard');
    fastCache.invalidate(`reservation_details_${id}`);
    fastCache.invalidate('sales');
    fastCache.invalidate('apartments');
    return res;
  },

  async getRefundEligibility(id: string): Promise<RefundEligibility> {
    return apiClient.get<RefundEligibility>(`/reservations/${id}/refund-eligibility`);
  },

  async settleRefund(refundId: string): Promise<ReservationRefund> {
    const res = await apiClient.post<ReservationRefund>(`/reservations/refunds/${refundId}/process`, {});
    fastCache.invalidate('reservations');
    fastCache.invalidate('dashboard');
    fastCache.invalidate('sales');
    return res;
  },

  async reviewSettlement(
    refundId: string,
    payload: {
      companyRetainedAmount: number;
      settlementNote?: string;
    }
  ): Promise<ReservationRefund> {
    const res = await apiClient.post<ReservationRefund>(`/reservations/refunds/${refundId}/review`, payload);
    fastCache.invalidate('reservations');
    fastCache.invalidate('dashboard');
    fastCache.invalidate('sales');
    return res;
  },

  async recordRefundPayment(
    refundId: string,
    payload: {
      refundMethod: string;
      transactionReference?: string;
      settlementNote?: string;
      proofUrl?: string;
    }
  ): Promise<ReservationRefund> {
    const res = await apiClient.post<ReservationRefund>(`/reservations/refunds/${refundId}/complete-payment`, payload);
    fastCache.invalidate('reservations');
    fastCache.invalidate('dashboard');
    fastCache.invalidate('sales');
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

  async confirmRefundReceipt(refundId: string | number): Promise<ReservationRefund> {
    const res = await apiClient.post<ReservationRefund>(`/reservations/refunds/${refundId}/confirm-receipt`, {});
    fastCache.invalidate('reservations');
    fastCache.invalidate('payments');
    fastCache.invalidate('dashboard');
    fastCache.invalidate('sales');
    return res;
  },

  async confirmRefundReceiptByReservation(reservationId: string | number): Promise<ReservationRefund> {
    const res = await apiClient.post<ReservationRefund>(`/reservations/${reservationId}/confirm-refund`, {});
    fastCache.invalidate('reservations');
    fastCache.invalidate('payments');
    fastCache.invalidate('dashboard');
    fastCache.invalidate(`reservation_details_${reservationId}`);
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
