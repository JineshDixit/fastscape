import { useState, useCallback } from 'react';
import { bookingService } from '../services/booking';
import { paymentService } from '../services/payment';
import type {
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
  ExtendBookingResponse,
  CancelBookingResponse,
  PaymentBreakdown,
  ProcessPaymentRequest,
  PaymentSummary,
  ApiResponse,
} from '../../../common/interfaces';

export const useBooking = () => {
  // Booking State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [bookingHistory, setBookingHistory] = useState<Booking[]>([]);

  // Payment State
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);

  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Error State
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentId, setIntentId] = useState<string | null>(null);

  // Helper function to handle API calls with enhanced error handling
  const handleApiCall = useCallback(
    async <T>(
      apiCall: () => Promise<ApiResponse<T>>,
      onSuccess?: (data: T) => void,
      setLoadingState?: (loading: boolean) => void,
      silent: boolean = false,
    ): Promise<ApiResponse<T> | null> => {
      try {
        setError(null);
        if (setLoadingState && !silent) setLoadingState(true);

        const response = await apiCall();

        if (response.success && response.data && onSuccess) {
          onSuccess(response.data);
        } else if (!response.success) {
          // Handle API errors properly
          const errorMessage = response.message || 'An error occurred';
          setError(errorMessage);
          return { success: false, message: errorMessage, data: null as any };
        }

        return response;
      } catch (err: any) {
        // Enhanced error handling
        let errorMessage = 'An unexpected error occurred';

        if (err?.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err?.message) {
          errorMessage = err.message;
        }

        // Handle specific error codes
        if (err?.response?.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
          // Could trigger logout here
        } else if (err?.response?.status === 403) {
          errorMessage = 'You do not have permission to perform this action.';
        } else if (err?.response?.status === 409) {
          errorMessage = 'Conflict: ' + errorMessage;
        } else if (err?.response?.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }

        setError(errorMessage);
        return { success: false, message: errorMessage, data: null as any };
      } finally {
        if (setLoadingState && !silent) setLoadingState(false);
      }
    },
    [],
  );

  // Booking Operations
  const checkAvailability = useCallback(
    async (data: CheckAvailabilityRequest) => {
      return handleApiCall(() => bookingService.checkAvailability(data));
    },
    [handleApiCall],
  );

  const createBooking = useCallback(
    async (data: CreateBookingRequest) => {
      return handleApiCall(
        () => bookingService.createBooking(data),
        (booking) => setCurrentBooking(booking),
        setIsCreatingBooking,
      );
    },
    [handleApiCall],
  );

  const fetchUserBookings = useCallback(
    async (params?: BookingFilters) => {
      return handleApiCall(
        () => bookingService.getUserBookings(params),
        (data) => setBookings(data.bookings),
        setIsLoading,
      );
    },
    [handleApiCall],
  );

  const fetchUpcomingBookings = useCallback(async () => {
    return handleApiCall(
      () => bookingService.getUpcomingBookings(),
      (bookings) => setUpcomingBookings(bookings),
      setIsLoading,
    );
  }, [handleApiCall]);

  const fetchActiveBookings = useCallback(async () => {
    return handleApiCall(
      () => bookingService.getActiveBookings(),
      (bookings) => setActiveBookings(bookings),
      setIsLoading,
    );
  }, [handleApiCall]);

  const fetchBookingStats = useCallback(async () => {
    return handleApiCall(
      () => bookingService.getBookingStats(),
      (stats) => setBookingStats(stats),
      setIsLoading,
    );
  }, [handleApiCall]);

  const fetchBookingHistory = useCallback(
    async (params?: { year?: number; month?: number; status?: string; vehicleType?: string }) => {
      return handleApiCall(
        () => bookingService.getBookingHistory(params),
        (history) => setBookingHistory(history),
        setIsLoading,
      );
    },
    [handleApiCall],
  );

  const fetchBookingById = useCallback(
    async (bookingId: string, silent: boolean = false) => {
      return handleApiCall(
        () => bookingService.getBookingById(bookingId),
        (booking) => setCurrentBooking(booking),
        setIsLoading,
        silent,
      );
    },
    [handleApiCall],
  );

  const extendBooking = useCallback(
    async (bookingId: string, data: ExtendBookingRequest) => {
      return handleApiCall(
        () => bookingService.extendBooking(bookingId, data),
        (response) => setCurrentBooking(response.booking),
      );
    },
    [handleApiCall],
  );

  const updateBooking = useCallback(
    async (bookingId: string, data: UpdateBookingRequest) => {
      return handleApiCall(
        () => bookingService.updateBooking(bookingId, data),
        (booking) => setCurrentBooking(booking),
      );
    },
    [handleApiCall],
  );

  const cancelBooking = useCallback(
    async (bookingId: string, data?: CancelBookingRequest) => {
      return handleApiCall(() => bookingService.cancelBooking(bookingId, data));
    },
    [handleApiCall],
  );

  // Payment Operations
  const calculatePaymentBreakdown = useCallback(
    async (bookingId: string, delayHours?: number) => {
      console.log('[useBooking] Calculating payment breakdown for booking:', bookingId);
      const result = await handleApiCall(
        () => paymentService.calculatePaymentBreakdown(bookingId, delayHours),
        (breakdown) => {
          console.log('[useBooking] Payment breakdown received:', breakdown);
          setPaymentBreakdown(breakdown);
        },
        setIsLoading,
      );

      if (!result?.success) {
        console.error('[useBooking] Failed to calculate payment breakdown:', result?.message);
      }

      return result;
    },
    [handleApiCall],
  );

  const processDepositPayment = useCallback(
    async (bookingId: string, data: ProcessPaymentRequest) => {
      return handleApiCall(
        () => paymentService.processDepositPayment(bookingId, data),
        undefined,
        setIsProcessingPayment,
      );
    },
    [handleApiCall],
  );

  const processBalancePayment = useCallback(
    async (bookingId: string, data: ProcessPaymentRequest) => {
      return handleApiCall(
        () => paymentService.processBalancePayment(bookingId, data),
        undefined,
        setIsProcessingPayment,
      );
    },
    [handleApiCall],
  );

  const fetchPaymentSummary = useCallback(
    async (bookingId: string) => {
      return handleApiCall(
        () => paymentService.getPaymentSummary(bookingId),
        (summary) => setPaymentSummary(summary),
        setIsLoading,
      );
    },
    [handleApiCall],
  );

  const initiatePaymentIntent = useCallback(
    async (bookingId: string, paymentType: 'DEPOSIT' | 'BALANCE' | 'FULL') => {
      return handleApiCall(
        () => paymentService.initiatePaymentIntent(bookingId, paymentType),
        (data) => {
          if (data.client_secret) {
            setClientSecret(data.client_secret);
          }
          if (data.id) {
            setIntentId(data.id);
          }
        },
        setIsLoading,
      );
    },
    [handleApiCall],
  );

  const fetchOverduePayments = useCallback(async () => {
    return handleApiCall(() => paymentService.getOverduePayments());
  }, [handleApiCall]);

  // Clear functions
  const clearError = useCallback(() => setError(null), []);
  const clearCurrentBooking = useCallback(() => setCurrentBooking(null), []);
  const clearPaymentBreakdown = useCallback(() => setPaymentBreakdown(null), []);
  const clearPaymentSummary = useCallback(() => setPaymentSummary(null), []);

  return {
    // State
    bookings,
    currentBooking,
    upcomingBookings,
    activeBookings,
    bookingStats,
    bookingHistory,
    paymentBreakdown,
    paymentSummary,

    // Loading States
    isLoading,
    isCreatingBooking,
    isProcessingPayment,
    error,

    // Booking Operations
    checkAvailability,
    createBooking,
    fetchUserBookings,
    fetchUpcomingBookings,
    fetchActiveBookings,
    fetchBookingStats,
    fetchBookingHistory,
    fetchBookingById,
    extendBooking,
    updateBooking,
    cancelBooking,

    // Payment Operations
    calculatePaymentBreakdown,
    processDepositPayment,
    processBalancePayment,
    fetchPaymentSummary,
    fetchOverduePayments,
    initiatePaymentIntent,

    // Intent related state
    clientSecret,
    intentId,
    setClientSecret,
    setIntentId,

    // Utility Functions
    clearError,
    clearCurrentBooking,
    clearPaymentBreakdown,
    clearPaymentSummary,
  };
};
