import type { PaymentPlan } from '../types';
import apiClient from './api';
import { fastCache } from './cache';

export interface CreatePaymentPlanRequest {
  reservationId: string;
  planType: 'INSTALLMENT' | 'PART_PAYMENT';
  numberOfPayments: number;
  paymentAmount: number;
  startDate?: string;
  notes?: string;
}

export const paymentPlanService = {

  getCachedAll(customerEmail?: string): PaymentPlan[] | null {
    return fastCache.get<PaymentPlan[]>(`plans_${customerEmail || 'all'}`);
  },

  // =========================================================
  // GET PAYMENT PLANS
  // =========================================================

  async getAll(
    customerEmail?: string
  ): Promise<PaymentPlan[]> {

    const endpoint = customerEmail
      ? `/payment-plans?customer=${encodeURIComponent(customerEmail)}`
      : '/payment-plans';

    const data = await apiClient.get<PaymentPlan[]>(endpoint);
    if (Array.isArray(data)) {
      fastCache.set(`plans_${customerEmail || 'all'}`, data);
    }
    return data;
  },

  // =========================================================
  // GET ONE PAYMENT PLAN
  // =========================================================

  async getById(
    id: string
  ): Promise<PaymentPlan> {

    return apiClient.get<PaymentPlan>(
      `/payment-plans/${id}`
    );
  },

  // =========================================================
  // CUSTOMER - CREATE PAYMENT PLAN REQUEST
  // =========================================================

  async create(
    data: CreatePaymentPlanRequest
  ): Promise<PaymentPlan> {

    return apiClient.post<PaymentPlan>(
      '/payment-plans',
      data
    );
  },

  // =========================================================
  // ADMIN / STAFF - APPROVE / PROPOSE PAYMENT PLAN TERMS
  // =========================================================

  async approve(
    id: string,
    decisionOrNotes?: string | {
      notes?: string;
      annualInterestRate?: number;
      additionalAmount?: number;
    }
  ): Promise<PaymentPlan> {
    const payload = typeof decisionOrNotes === 'string'
      ? { notes: decisionOrNotes }
      : decisionOrNotes || {};

    return apiClient.patch<PaymentPlan>(
      `/payment-plans/${id}/approve`,
      payload
    );
  },

  // =========================================================
  // ADMIN / STAFF - REJECT PAYMENT PLAN
  // =========================================================

  async reject(
    id: string,
    notes?: string
  ): Promise<PaymentPlan> {

    return apiClient.patch<PaymentPlan>(
      `/payment-plans/${id}/reject`,
      {
        notes: notes || '',
      }
    );
  },

  // =========================================================
  // CUSTOMER - ACCEPT PROPOSED PAYMENT TERMS
  // =========================================================

  async customerAccept(
    id: string
  ): Promise<PaymentPlan> {
    return apiClient.patch<PaymentPlan>(
      `/payment-plans/${id}/accept`,
      {}
    );
  },

  // =========================================================
  // CUSTOMER - DECLINE PROPOSED PAYMENT TERMS
  // =========================================================

  async customerDecline(
    id: string
  ): Promise<PaymentPlan> {
    return apiClient.patch<PaymentPlan>(
      `/payment-plans/${id}/decline`,
      {}
    );
  },
};

export default paymentPlanService;