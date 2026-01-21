import { dbEnums } from '../enum/dbEnums';

export interface CreateBookingData {
  userId: string;
  vehicleId: string;
  startDatetime: Date;
  endDatetime: Date;
  pickupLocation: string;
  dropoffLocation: string;
  bookingType?: (typeof dbEnums.BOOKING_TYPE)[number];
  paymentMethod?: (typeof dbEnums.PAYMENT_METHOD)[number];
  chauffeurInstructions?: string;
  notes?: string;
}

export interface UpdateBookingData {
  startDatetime?: Date;
  endDatetime?: Date;
  actualPickupDatetime?: Date;
  actualDropoffDatetime?: Date;
  pickupLocation?: string;
  dropoffLocation?: string;
  bookingType?: (typeof dbEnums.BOOKING_TYPE)[number];
  bookingStatus?: (typeof dbEnums.BOOKING_STATUS)[number];
  paymentStatus?: (typeof dbEnums.PAYMENT_STATUS)[number];
  paymentMethod?: (typeof dbEnums.PAYMENT_METHOD)[number];
  delayChargeApplied?: boolean;
  delayHours?: number;
  chauffeurInstructions?: string;
  notes?: string;
}

export interface BookingConfirmationData {
  userId: string;
  paymentIntentId?: string;
  actualPickupDatetime?: Date;
}

export interface BookingAvailabilityCheck {
  isAvailable: boolean;
  vehicle: {
    id: string;
    make: string;
    model: string;
    isAvailable: boolean;
  };
  conflictingBookings: Array<{
    id: string;
    startDatetime: Date;
    endDatetime: Date;
    status: string;
  }>;
  requestedPeriod: {
    start: Date;
    end: Date;
    durationHours: number;
    durationDays: number;
  };
}

export interface BookingFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  vehicleType?: string;
  page?: number;
  limit?: number;
}

export interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  active: number;
  completed: number;
  cancelled: number;
  totalSpent: number;
  averageRating: number;
}
