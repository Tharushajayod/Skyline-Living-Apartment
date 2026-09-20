import { apiClient } from './api';
import type { Inquiry, InquiryStatus, InquiryReply } from '@/shared/types';
import { inquiries as mockInquiries } from '@/shared/mockData';

const USE_MOCK = false;

export const inquiryService = {
  async getAll(): Promise<Inquiry[]> {
    if (USE_MOCK) return [...mockInquiries];
    return apiClient.get<Inquiry[]>('/inquiries');
  },

  async getByCustomer(email: string): Promise<Inquiry[]> {
    if (USE_MOCK) return mockInquiries.filter(i => i.customerEmail === email);
    return apiClient.get<Inquiry[]>(`/inquiries?customer=${encodeURIComponent(email)}`);
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
    return apiClient.post<Inquiry>('/inquiries', inquiry);
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
    return apiClient.patch<Inquiry>(`/inquiries/${id}/status`, { status });
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
    return apiClient.post<Inquiry>(`/inquiries/${id}/replies`, reply);
  },
};
