import { apiClient } from './api';
import { fastCache } from './cache';
import type { Appointment, AppointmentRescheduleHistory, AppointmentStatus } from '@/shared/types';

export const appointmentService = {
  getCachedAll(): Appointment[] | null {
    return fastCache.get<Appointment[]>('appointments_all');
  },

  getCachedByCustomer(email: string): Appointment[] | null {
    return fastCache.get<Appointment[]>(`appointments_cust_${email}`);
  },

  async getAll(): Promise<Appointment[]> {
    const data = await apiClient.get<Appointment[]>('/appointments');
    if (Array.isArray(data)) {
      fastCache.set('appointments_all', data);
    }
    return data;
  },

  async getByCustomer(email: string): Promise<Appointment[]> {
    const data = await apiClient.get<Appointment[]>(`/appointments?customer=${encodeURIComponent(email)}`);
    if (Array.isArray(data)) {
      fastCache.set(`appointments_cust_${email}`, data);
    }
    return data;
  },

  async getHistory(id: string): Promise<AppointmentRescheduleHistory[]> {
    const data = await apiClient.get<AppointmentRescheduleHistory[]>(`/appointments/${id}/history`);
    return Array.isArray(data) ? data : [];
  },

  async create(appointment: Omit<Appointment, 'id' | 'createdAt' | 'status'>): Promise<Appointment> {
    const res = await apiClient.post<Appointment>('/appointments', appointment);
    fastCache.invalidate('appointments');
    fastCache.invalidate('dashboard');
    return res;
  },

  async proposeReschedule(
    id: string,
    proposal: { date: string; timeSlot: string; reason: string }
  ): Promise<Appointment> {
    const res = await apiClient.post<Appointment>(`/appointments/${id}/reschedule-proposal`, proposal);
    fastCache.invalidate('appointments');
    fastCache.invalidate('dashboard');
    return res;
  },

  async acceptReschedule(id: string): Promise<Appointment> {
    const res = await apiClient.post<Appointment>(`/appointments/${id}/reschedule-accept`, {});
    fastCache.invalidate('appointments');
    fastCache.invalidate('dashboard');
    return res;
  },

  async rejectReschedule(id: string, reason?: string): Promise<Appointment> {
    const url = reason
      ? `/appointments/${id}/reschedule-reject?reason=${encodeURIComponent(reason)}`
      : `/appointments/${id}/reschedule-reject`;
    const res = await apiClient.post<Appointment>(url, {});
    fastCache.invalidate('appointments');
    fastCache.invalidate('dashboard');
    return res;
  },

  async completeAppointment(id: string): Promise<Appointment> {
    const res = await apiClient.post<Appointment>(`/appointments/${id}/complete`, {});
    fastCache.invalidate('appointments');
    fastCache.invalidate('dashboard');
    return res;
  },

  async updateStatus(
    id: string,
    status: AppointmentStatus,
    rescheduleData?: { date?: string; timeSlot?: string; reason?: string }
  ): Promise<Appointment> {
    const res = await apiClient.patch<Appointment>(`/appointments/${id}/status`, {
      status,
      ...rescheduleData,
    });
    fastCache.invalidate('appointments');
    fastCache.invalidate('dashboard');
    return res;
  },
};
