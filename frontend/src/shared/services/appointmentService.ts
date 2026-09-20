import { apiClient } from './api';
import { fastCache } from './cache';
import type { Appointment, AppointmentStatus } from '@/shared/types';

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

  async create(appointment: Omit<Appointment, 'id' | 'createdAt' | 'status'>): Promise<Appointment> {
    const res = await apiClient.post<Appointment>('/appointments', appointment);
    fastCache.invalidate('appointments');
    fastCache.invalidate('dashboard');
    return res;
  },

  async updateStatus(id: string, status: AppointmentStatus, rescheduleData?: { date?: string; timeSlot?: string }): Promise<Appointment> {
    const res = await apiClient.patch<Appointment>(`/appointments/${id}/status`, {
      status,
      ...rescheduleData,
    });
    fastCache.invalidate('appointments');
    fastCache.invalidate('dashboard');
    return res;
  },
};
