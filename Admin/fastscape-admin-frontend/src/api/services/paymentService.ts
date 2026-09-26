import apiClient from '../client';

export interface PaymentFilters {
  bookingId?: string;
  userId?: string;
  paymentType?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string;
  paymentType: 'DEPOSIT' | 'FULL_PAYMENT' | 'REFUND';
  transactionId?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface RefundRequest {
  refundAmount: number;
  reason: string;
  stripeRefundId?: string;
}

export const paymentService = {
  getAllPayments: async (filters: PaymentFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<any>(`/payments?${params.toString()}`);
    // Controller: res.json({ success: true, data: result.payments, pagination: result.pagination })
    return {
      payments: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getPaymentById: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: Payment }>(`/payments/${id}`);
    return response.data.data;
  },

  getPaymentSummary: async (bookingId: string) => {
    const response = await apiClient.get<{ success: boolean; data: any }>(`/payments/summary/${bookingId}`);
    return response.data.data;
  },

  getOverduePayments: async () => {
    const response = await apiClient.get<{ success: boolean; data: Payment[] }>(`/payments/overdue`);
    return response.data.data;
  },

  markPaymentPaid: async (id: string, data: { paidAt?: string; notes?: string }) => {
    const response = await apiClient.put<{ success: boolean; data: Payment }>(`/payments/${id}/mark-paid`, data);
    return response.data.data;
  },

  processRefund: async (bookingId: string, data: RefundRequest) => {
    const response = await apiClient.post<{ success: boolean; data: any }>(`/payments/refund/${bookingId}`, data);
    return response.data.data;
  },
};
