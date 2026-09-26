import { BaseApiService } from '../base';
import apiClient from '../client';
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
  CancelBookingResponse,
  Vehicle,
} from '../../../common/interfaces';

export class BookingService extends BaseApiService {
  constructor() {
    super('/bookings');
  }

  /**
   * Check vehicle availability for booking dates
   */
  async checkAvailability(data: CheckAvailabilityRequest): Promise<ApiResponse<AvailabilityResponse>> {
    const availabilityResponse = await apiClient.get<ApiResponse<{ isAvailable: boolean }>>(
      `/vehicles/${data.vehicleId}/availability`,
      {
        params: {
          pickupDate: data.startDatetime,
          dropoffDate: data.endDatetime,
        },
      },
    );

    const start = new Date(data.startDatetime);
    const end = new Date(data.endDatetime);
    const durationMs = Math.max(0, end.getTime() - start.getTime());
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
    const durationDays = Math.max(1, Math.ceil(durationHours / 24));

    return {
      success: availabilityResponse.data.success,
      message: availabilityResponse.data.message,
      data: {
        isAvailable: availabilityResponse.data.data?.isAvailable ?? false,
        vehicle: {
          id: data.vehicleId,
          make: '',
          model: '',
          isAvailable: availabilityResponse.data.data?.isAvailable ?? false,
        },
        conflictingBookings: [],
        requestedPeriod: {
          start: data.startDatetime,
          end: data.endDatetime,
          durationHours,
          durationDays,
        },
      },
    };
  }

  /**
   * Get booking quote (availability + price)
   */
  async getBookingQuote(
    data: CreateBookingRequest,
  ): Promise<ApiResponse<{ availability: AvailabilityResponse; calculation: PaymentBreakdown }>> {
    const availability = await this.checkAvailability({
      vehicleId: data.vehicleId,
      startDatetime: data.startDatetime,
      endDatetime: data.endDatetime,
    });

    if (!availability.success || !availability.data?.isAvailable) {
      return {
        success: false,
        message: availability.message || 'Vehicle is not available for the selected dates',
        data: null as any,
      };
    }

    const vehicleResponse = await apiClient.get<ApiResponse<Vehicle>>(`/vehicles/${data.vehicleId}`);
    const vehicle = vehicleResponse.data.data;

    const start = new Date(data.startDatetime);
    const end = new Date(data.endDatetime);
    const durationMs = Math.max(0, end.getTime() - start.getTime());
    const daysCount = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));

    const pricePerDay = Number(vehicle?.pricePerDay || 0);
    const baseAmount = pricePerDay * daysCount;
    const depositPercentage = Number(vehicle?.depositPercentage || 30);
    const depositAmount = (baseAmount * depositPercentage) / 100;
    const balanceAmount = baseAmount - depositAmount;
    const taxAmount = 0;
    const totalAmount = baseAmount + taxAmount;

    return {
      success: true,
      message: 'Booking quote calculated successfully',
      data: {
        availability: availability.data,
        calculation: {
          baseAmount: baseAmount.toFixed(2),
          depositAmount: depositAmount.toFixed(2),
          balanceAmount: balanceAmount.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          currency: vehicle?.currency || 'USD',
          daysCount,
          depositPercentage,
        },
      },
    };
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
  async confirmBooking(
    bookingId: string,
    data?: { paymentIntentId?: string; actualPickupDatetime?: string },
  ): Promise<ApiResponse<Booking>> {
    return this.put<Booking>(`/${bookingId}`, {
      bookingStatus: 'CONFIRMED',
      ...(data?.actualPickupDatetime ? { actualPickupDatetime: data.actualPickupDatetime } : {}),
    } as any);
  }

  /**
   * Start a booking (vehicle pickup)
   */
  async startBooking(bookingId: string): Promise<ApiResponse<Booking>> {
    const response = await apiClient.put<ApiResponse<Booking>>(`/payments/pickup/${bookingId}`, {});
    return response.data;
  }

  /**
   * Complete a booking (vehicle dropoff)
   */
  async completeBooking(bookingId: string, data?: { actualDropoffDatetime?: string }): Promise<ApiResponse<Booking>> {
    const response = await apiClient.put<ApiResponse<{ booking?: Booking }>>(`/payments/dropoff/${bookingId}`, {
      ...(data?.actualDropoffDatetime ? { actualDropoffTime: data.actualDropoffDatetime } : {}),
    });

    if (!response.data.success) {
      return {
        success: false,
        message: response.data.message,
        data: null as any,
      };
    }

    return {
      success: true,
      message: response.data.message,
      data: response.data.data?.booking as Booking,
    };
  }

  /**
   * Extend a booking (change end date)
   */
  async extendBooking(bookingId: string, data: ExtendBookingRequest): Promise<ApiResponse<ExtendBookingResponse>> {
    const updateResponse = await this.put<Booking>(`/${bookingId}`, {
      endDatetime: data.newEndDatetime,
    });

    if (!updateResponse.success || !updateResponse.data) {
      return {
        success: false,
        message: updateResponse.message || 'Failed to extend booking',
        data: null as any,
      };
    }

    return {
      success: true,
      message: updateResponse.message || 'Booking extended successfully',
      data: {
        booking: updateResponse.data,
        additionalCost: 0,
      },
    };
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
