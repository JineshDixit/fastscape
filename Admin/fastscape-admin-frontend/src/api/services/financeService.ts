import apiClient from '../client';
import type { PaymentStatus } from './bookingService';

export interface FinanceFilters {
  paymentStatus?: PaymentStatus;
  bookingStatus?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface FinancialRecord {
  id: string;
  bookingId: string;
  baseAmount: string;
  chauffeurAmount: string;
  chauffeurHours: string;
  depositAmount: string;
  balanceAmount: string;
  delayChargeAmount: string;
  delayChargeRate: string;
  taxAmount: string;
  platformChargeAmount: string;
  platformChargeRate: string;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
  currency: string;
  refundPolicy?: string | null;
  refundableUntil?: string | null;
  depositPercentage: string;
  createdAt: string;
  updatedAt: string;
  Booking?: {
    id: string;
    bookingStatus: string;
    paymentStatus: PaymentStatus;
    startDatetime: string;
    endDatetime: string;
    User?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
    Vehicle?: {
      id: string;
      make: string;
      model: string;
      year: number;
      bodyType: string;
    };
  };
  Payments?: Array<{
    id: string;
    amount: string;
    paymentType: string;
    paymentStatus: string;
    paymentMethod: string;
    createdAt: string;
  }>;
}

export interface FinanceStats {
  completed: {
    count: number;
    amount: number;
  };
  awaiting: {
    count: number;
    amount: number;
  };
  overdue: {
    count: number;
    amount: number;
  };
}

export const financeService = {
  getAllFinancials: async (filters: FinanceFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<any>(`/finance?${params.toString()}`);
    return {
      financials: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getFinancialById: async (bookingId: string): Promise<FinancialRecord> => {
    const response = await apiClient.get<{ success: boolean; data: FinancialRecord }>(`/finance/${bookingId}`);
    return response.data.data;
  },

  getFinancialStats: async (): Promise<FinanceStats> => {
    const response = await apiClient.get<{ success: boolean; data: FinanceStats }>('/finance/stats');
    return response.data.data;
  },

  downloadInvoice: async (bookingId: string): Promise<Blob> => {
    const response = await apiClient.get(`/finance/invoice/${bookingId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  downloadBulkInvoices: async (bookingIds: string[]): Promise<Blob> => {
    const response = await apiClient.post(
      '/finance/invoices/bulk',
      { bookingIds },
      {
        responseType: 'blob',
      },
    );
    return response.data;
  },

  exportFinancials: async (filters: FinanceFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/finance/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
