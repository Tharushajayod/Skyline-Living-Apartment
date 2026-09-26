import { apiClient } from './api';
import { fastCache } from './cache';
import type { Inquiry, InquiryStatus, InquiryReply } from '@/shared/types';
import { inquiries as mockInquiries } from '@/shared/mockData';

const USE_MOCK = false;

export const inquiryService = {
  getCachedAll(): Inquiry[] | null {
    return fastCache.get<Inquiry[]>('inquiries_all');
  },

  getCachedByCustomer(email: string): Inquiry[] | null {
    return fastCache.get<Inquiry[]>(`inquiries_cust_${email}`);
  },

  async getAll(): Promise<Inquiry[]> {
    if (USE_MOCK) return [...mockInquiries];
    const data = await apiClient.get<Inquiry[]>('/inquiries');
    if (Array.isArray(data)) {
      fastCache.set('inquiries_all', data);
    }
    return data;
  },

  async getByCustomer(email: string): Promise<Inquiry[]> {
    if (USE_MOCK) return mockInquiries.filter(i => i.customerEmail === email);
    const data = await apiClient.get<Inquiry[]>(`/inquiries?customer=${encodeURIComponent(email)}`);
    if (Array.isArray(data)) {
      fastCache.set(`inquiries_cust_${email}`, data);
    }
    return data;
  },

  async create(inquiry: Omit<Inquiry, 'id' | 'createdAt' | 'status' | 'replies'>): Promise<Inquiry> {
    if (USE_MOCK) {
      const newInq: Inquiry = {
        ...inquiry,
        id: `INQ-${String(mockInquiries.length + 1).padStart(3, '0')}`,
        status: 'Pending',
        replies: [],
        createdAt: new Date().toISOString(),
      };
      mockInquiries.push(newInq);
      return newInq;
    }
    const res = await apiClient.post<Inquiry>('/inquiries', inquiry);
    fastCache.invalidate('inquiries');
    fastCache.invalidate('dashboard');
    return res;
  },

  async updateStatus(id: string, status: InquiryStatus): Promise<Inquiry> {
    if (USE_MOCK) {
      const idx = mockInquiries.findIndex(i => i.id === id);
      if (idx >= 0) {
        mockInquiries[idx] = { ...mockInquiries[idx], status };
        return mockInquiries[idx];
      }
      throw new Error('Inquiry not found');
    }
    const res = await apiClient.patch<Inquiry>(`/inquiries/${id}/status`, { status });
    fastCache.invalidate('inquiries');
    fastCache.invalidate('dashboard');
    return res;
  },

  async addReply(id: string, reply: Omit<InquiryReply, 'id' | 'createdAt'>): Promise<Inquiry> {
    if (USE_MOCK) {
      const idx = mockInquiries.findIndex(i => i.id === id);
      if (idx >= 0) {
        const newReply: InquiryReply = {
          ...reply,
          id: `REP-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        mockInquiries[idx].replies.push(newReply);
        return mockInquiries[idx];
      }
      throw new Error('Inquiry not found');
    }
    const res = await apiClient.post<Inquiry>(`/inquiries/${id}/replies`, reply);
    fastCache.invalidate('inquiries');
    fastCache.invalidate('dashboard');
    return res;
  },
};
