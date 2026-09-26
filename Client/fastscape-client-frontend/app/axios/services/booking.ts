import { BaseApiService } from '../base';
import type { 
  ApiResponse, 
  Booking, 
  BookingListResponse,
  BookingStats,
  BookingFilters,
  CreateBookingRequest,
  UpdateBookingRequest,
  CheckAvailabilityRequest,
  ExtendBookingRequest,
  CancelBookingRequest,
  AvailabilityResponse,
  PaymentBreakdown,
  ExtendBookingResponse,
  CancelBookingResponse
} from '../../../common/interfaces';

export class BookingService extends BaseApiService {
  constructor() {
    super('/bookings');
  }

  /**
   * Check vehicle availability for booking dates
   */
  async checkAvailability(data: CheckAvailabilityRequest): Promise<ApiResponse<AvailabilityResponse>> {
    return this.post<AvailabilityResponse>('/check-availability', data);
  }

  /**
   * Get booking quote (availability + price)
   */
  async getBookingQuote(data: CreateBookingRequest): Promise<ApiResponse<{ availability: AvailabilityResponse, calculation: PaymentBreakdown }>> {
    return this.post<{ availability: AvailabilityResponse, calculation: PaymentBreakdown }>('/quote', data);
  }

  /**
   * Create a new booking (backend will auto-assign chauffeur if needed)
   */
  async createBooking(data: CreateBookingRequest): Promise<ApiResponse<Booking>> {
    return this.post<Booking>('', data);
  }

  /**
   * Get user's bookings with filtering
   */
  async getUserBookings(params?: BookingFilters): Promise<ApiResponse<BookingListResponse>> {
    return this.get<BookingListResponse>('', { params });
  }

  /**
   * Get upcoming bookings (next 30 days)
   */
  async getUpcomingBookings(): Promise<ApiResponse<Booking[]>> {
    return this.get<Booking[]>('/upcoming');
  }

  /**
   * Get active bookings (currently ongoing)
   */
  async getActiveBookings(): Promise<ApiResponse<Booking[]>> {
    return this.get<Booking[]>('/active');
  }

  /**
   * Get booking statistics for the user
   */
  async getBookingStats(): Promise<ApiResponse<BookingStats>> {
    return this.get<BookingStats>('/stats');
  }

  /**
   * Get booking history with optional filters
   */
  async getBookingHistory(params?: { 
    year?: number; 
    month?: number; 
    status?: string; 
    vehicleType?: string; 
  }): Promise<ApiResponse<Booking[]>> {
    return this.get<Booking[]>('/history', { params });
  }

  /**
   * Get booking by ID
   */
  async getBookingById(bookingId: string): Promise<ApiResponse<Booking>> {
    return this.getById<Booking>(bookingId);
  }

  /**
   * Confirm a booking (after payment)
   */
  async confirmBooking(bookingId: string, data?: { paymentIntentId?: string; actualPickupDatetime?: string }): Promise<ApiResponse<Booking>> {
    return this.post<Booking>(`/${bookingId}/confirm`, data);
  }

  /**
   * Start a booking (vehicle pickup)
   */
  async startBooking(bookingId: string): Promise<ApiResponse<Booking>> {
    return this.post<Booking>(`/${bookingId}/start`);
  }

  /**
   * Complete a booking (vehicle dropoff)
   */
  async completeBooking(bookingId: string, data?: { actualDropoffDatetime?: string }): Promise<ApiResponse<Booking>> {
    return this.post<Booking>(`/${bookingId}/complete`, data);
  }

  /**
   * Extend a booking (change end date)
   */
  async extendBooking(bookingId: string, data: ExtendBookingRequest): Promise<ApiResponse<ExtendBookingResponse>> {
    return this.post<ExtendBookingResponse>(`/${bookingId}/extend`, data);
  }

  /**
   * Update booking details (locations, notes, instructions)
   */
  async updateBooking(bookingId: string, data: UpdateBookingRequest): Promise<ApiResponse<Booking>> {
    return this.put<Booking>(`/${bookingId}`, data);
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, data?: CancelBookingRequest): Promise<ApiResponse<CancelBookingResponse>> {
    return this.delete<CancelBookingResponse>(`/${bookingId}`, { data });
  }
}

export const bookingService = new BookingService();