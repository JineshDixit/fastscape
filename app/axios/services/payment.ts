import { BaseApiService } from '../base';
import type { 
  ApiResponse, 
  PaymentBreakdown,
  ProcessPaymentRequest,
  PaymentSummary,
  Payment
} from '../../../common/interfaces';

export class PaymentService extends BaseApiService {
  constructor() {
    super('/payments');
  }

  /**
   * Calculate payment breakdown for a booking
   */
  async calculatePaymentBreakdown(bookingId: string, delayHours?: number): Promise<ApiResponse<PaymentBreakdown>> {
    const params = delayHours ? { delayHours } : undefined;
    return this.get<PaymentBreakdown>(`/calculate/${bookingId}`, { params });
  }

  /**
   * Process deposit payment
   */
  async processDepositPayment(bookingId: string, data: ProcessPaymentRequest): Promise<ApiResponse<Payment>> {
    return this.post<Payment>(`/deposit/${bookingId}`, data);
  }

  /**
   * Process balance payment (remaining amount)
   */
  async processBalancePayment(bookingId: string, data: ProcessPaymentRequest): Promise<ApiResponse<Payment>> {
    return this.post<Payment>(`/balance/${bookingId}`, data);
  }

  /**
   * Get payment summary for a booking
   */
  async getPaymentSummary(bookingId: string): Promise<ApiResponse<PaymentSummary>> {
    return this.get<PaymentSummary>(`/summary/${bookingId}`);
  }

  /**
   * Get overdue payments for the user
   */
  async getOverduePayments(): Promise<ApiResponse<Payment[]>> {
    return this.get<Payment[]>('/overdue');
  }
}

export const paymentService = new PaymentService();