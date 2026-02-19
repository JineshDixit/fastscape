import apiClient from '../client';

export const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PICKED_UP: 'PICKED_UP',
  DROPPED_OFF: 'DROPPED_OFF',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const PaymentStatus = {
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
  OVERDUE: 'OVERDUE',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const BookingType = {
  ONE_WAY: 'ONE_WAY',
  HOURLY: 'HOURLY',
  AIRPORT_TRANSFER: 'AIRPORT_TRANSFER',
} as const;

export type BookingType = (typeof BookingType)[keyof typeof BookingType];

export interface BookingFilters {
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  bookingType?: BookingType;
  userId?: string;
  vehicleId?: string;
  chauffeurId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface VehicleInfo {
  id: string;
  make: string;
  model: string;
  year: number;
  bodyType: string;
}

export interface BookingFinancial {
  id: string;
  bookingId: string;
  baseAmount: string; // API returns string "1200.00"
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
}

export interface PaymentInfo {
  id: string;
  bookingId: string;
  userId: string;
  amount: string;
  paymentType: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  vehicleId: string;
  chauffeurId?: string | null;
  status: BookingStatus; // Mapped from bookingStatus? No, JSON has "bookingStatus"
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  bookingType: BookingType;
  pickupLocation: string;
  dropoffLocation: string;
  startDatetime: string;
  endDatetime: string;
  actualPickupDatetime?: string | null;
  actualDropoffDatetime?: string | null;

  // These seem to be missing or mapped differently, sticking to JSON
  passengerCount?: number;
  luggageCount?: number;
  notes?: string | null;
  chauffeurInstructions?: string | null;

  User?: UserInfo;
  Vehicle?: VehicleInfo;
  Chauffeur?: any; // Define properly if needed
  BookingFinancial?: BookingFinancial;
  Payments?: PaymentInfo[];

  createdAt: string;
  updatedAt: string;
}

export interface BookingListResponse {
  bookings: Booking[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number; // API has totalPages
    totalPages?: number;
  };
}

export const bookingService = {
  getAllBookings: async (filters: BookingFilters = {}): Promise<BookingListResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<any>(`/bookings?${params.toString()}`);
    // API returns { success: true, data: Booking[], pagination: {...} }
    return {
      bookings: response.data.data,
      pagination: response.data.pagination,
    };
  },

  getBookingById: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: Booking }>(`/bookings/${id}`);
    return response.data.data;
  },

  updateBookingStatus: async (id: string, status: BookingStatus) => {
    const response = await apiClient.put<{ success: boolean; data: Booking }>(`/bookings/${id}/status`, {
      bookingStatus: status,
    });
    return response.data.data;
  },

  cancelBooking: async (id: string, reason: string) => {
    const response = await apiClient.put<{ success: boolean; data: Booking }>(`/bookings/${id}/cancel`, {
      reason,
    });
    return response.data.data;
  },

  cleanupExpiredBooking: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/bookings/${id}/cleanup`);
    return response.data;
  },

  getExpiredBookings: async () => {
    const response = await apiClient.get<{ success: boolean; data: Booking[] }>(`/bookings/expired`);
    return response.data.data;
  },

  exportBookings: async (filters: BookingFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/bookings/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

