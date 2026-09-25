import { apiClient } from './api';
import { fastCache } from './cache';
import type { Apartment, PurchasedApartment } from '@/shared/types';

export const apartmentService = {
  getCachedAll(key = 'apartments_all'): Apartment[] | null {
    return fastCache.get<Apartment[]>(key);
  },

  getCached(key = 'apartments_all'): Apartment[] | null {
    return fastCache.get<Apartment[]>(key);
  },

  async getAll(params?: {
    search?: string;
    type?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    district?: string;
    bedrooms?: number;
    includeSold?: boolean;
  }): Promise<Apartment[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.type && params.type !== 'all') query.append('type', params.type);
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.district && params.district !== 'all') query.append('district', params.district);
    if (params?.minPrice !== undefined) query.append('minPrice', String(params.minPrice));
    if (params?.maxPrice !== undefined) query.append('maxPrice', String(params.maxPrice));
    if (params?.bedrooms !== undefined && params.bedrooms > 0) query.append('bedrooms', String(params.bedrooms));
    if (params?.includeSold) query.append('includeSold', 'true');
    const qs = query.toString();
    const data = await apiClient.get<Apartment[]>(`/apartments${qs ? `?${qs}` : ''}`);
    if (Array.isArray(data) && !qs) {
      fastCache.set('apartments_all', data);
    }
    return data;
  },

  async getById(id: string): Promise<Apartment | null> {
    return apiClient.get<Apartment>(`/apartments/${id}`);
  },

  async getFeatured(): Promise<Apartment[]> {
    return apiClient.get<Apartment[]>('/apartments?featured=true');
  },

  async create(apartment: Omit<Apartment, 'id' | 'createdAt'>): Promise<Apartment> {
    const result = await apiClient.post<Apartment>('/apartments', apartment);
    fastCache.invalidate('apartments');
    fastCache.invalidate('dashboard');
    return result;
  },

  async update(id: string, apartment: Partial<Apartment>): Promise<Apartment> {
    const result = await apiClient.put<Apartment>(`/apartments/${id}`, apartment);
    fastCache.invalidate('apartments');
    fastCache.invalidate('dashboard');
    return result;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(`/apartments/${id}`);
    fastCache.invalidate('apartments');
    fastCache.invalidate('dashboard');
  },

  async getMyPurchased(): Promise<PurchasedApartment[]> {
    return apiClient.get<PurchasedApartment[]>('/sales/my-apartments');
  },
};
