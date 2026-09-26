import { apiClient } from './api';
import type { Review, EligibleApartment, ReviewEligibility } from '@/shared/types';
import { reviews as mockReviews } from '@/shared/mockData';

const USE_MOCK = false;

export const reviewService = {
  async getAll(): Promise<Review[]> {
    if (USE_MOCK) return [...mockReviews];
    return apiClient.get<Review[]>('/reviews');
  },

  async getPublic(): Promise<Review[]> {
    if (USE_MOCK) return mockReviews.filter(r => r.status === 'Published');
    return apiClient.get<Review[]>('/reviews/public');
  },

  async getByApartment(apartmentId: string): Promise<Review[]> {
    if (USE_MOCK) return mockReviews.filter(r => r.apartmentId === apartmentId && r.status === 'Published');
    return apiClient.get<Review[]>(`/apartments/${apartmentId}/reviews`);
  },

  async create(review: Omit<Review, 'id' | 'createdAt' | 'status'>): Promise<Review> {
    if (USE_MOCK) {
      const newRev: Review = {
        ...review,
        id: `REV-${String(mockReviews.length + 1).padStart(3, '0')}`,
        status: 'Pending',
        createdAt: new Date().toISOString(),
      };
      mockReviews.push(newRev);
      return newRev;
    }
    return apiClient.post<Review>('/reviews', review);
  },

  async moderate(id: string, status: 'Published' | 'Hidden'): Promise<Review> {
    if (USE_MOCK) {
      const idx = mockReviews.findIndex(r => r.id === id);
      if (idx >= 0) {
        mockReviews[idx] = { ...mockReviews[idx], status };
        return mockReviews[idx];
      }
      throw new Error('Review not found');
    }
    return apiClient.patch<Review>(`/reviews/${id}/moderate`, { status });
  },

  async getEligibleApartments(): Promise<EligibleApartment[]> {
    return apiClient.get<EligibleApartment[]>('/reviews/eligible-apartments');
  },

  async checkEligibility(apartmentId: string): Promise<ReviewEligibility> {
    return apiClient.get<ReviewEligibility>(`/apartments/${apartmentId}/review-eligibility`);
  },
};
