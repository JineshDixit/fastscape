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
  notes?: string;
}
