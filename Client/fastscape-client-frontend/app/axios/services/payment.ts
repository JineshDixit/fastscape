import { BaseApiService } from '../base';
import type {
  ApiResponse,
  PaymentBreakdown,
  ProcessPaymentRequest,
  PaymentSummary,
  Payment,
} from '../../../common/interfaces';

export class PaymentService extends BaseApiService {
  constructor() {
    super('/payments');
  }

  /**
   * Calculate payment breakdown for a booking
   */
  async calculatePaymentBreakdown(bookingId: string, delayHours?: number): Promise<ApiResponse<PaymentBreakdown>> {
    console.log('[PaymentService] Calculating breakdown for booking:', bookingId, 'delayHours:', delayHours);
    const params = delayHours ? { delayHours } : undefined;
    try {
      const result = await this.get<PaymentBreakdown>(`/calculate/${bookingId}`, { params });
      console.log('[PaymentService] Breakdown result:', result);
      return result;
    } catch (error) {
      console.error('[PaymentService] Error calculating breakdown:', error);
      throw error;
    }
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

  /**
   * Initiate a Stripe PaymentIntent for a booking
   */
  async initiatePaymentIntent(
    bookingId: string,
    paymentType: 'DEPOSIT' | 'BALANCE' | 'FULL',
  ): Promise<ApiResponse<any>> {
    return this.post<any>(`/intent/${bookingId}`, { paymentType });
  }
}

export const paymentService = new PaymentService();
