import { dbEnums } from '../enum/dbEnums';

export interface PaymentCalculation {
  baseAmount: number;
  depositAmount: number;
  balanceAmount: number;
  delayChargeAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
}

export interface DelayChargeCalculation {
  delayHours: number;
  delayChargeRate: number;
  delayChargeAmount: number;
  totalDelayCharge: number;
}

export interface CreatePaymentData {
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentType: (typeof dbEnums.PAYMENT_TYPE)[number];
  paymentMethod: (typeof dbEnums.PAYMENT_METHOD)[number];
  stripePaymentIntentId?: string;
  metadata?: Record<string, any>;
}

export interface UpdatePaymentData {
  paymentStatus?: (typeof dbEnums.PAYMENT_STATUS)[number];
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeRefundId?: string;
  paidAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export interface PaymentSummary {
  booking: {
    id: string;
    startDatetime: Date;
    endDatetime: Date;
    actualPickupDatetime?: Date;
    actualDropoffDatetime?: Date;
    bookingStatus: (typeof dbEnums.BOOKING_STATUS)[number];
    paymentStatus: (typeof dbEnums.PAYMENT_STATUS)[number];
    paymentMethod: (typeof dbEnums.PAYMENT_METHOD)[number];
    delayChargeApplied: boolean;
    delayHours: number;
  };
  financial: {
    baseAmount: number;
    depositAmount: number;
    balanceAmount: number;
    delayChargeAmount: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    currency: string;
  } | null;
  payments: Array<{
    id: string;
    amount: number;
    paymentType: (typeof dbEnums.PAYMENT_TYPE)[number];
    paymentStatus: (typeof dbEnums.PAYMENT_STATUS)[number];
    paymentMethod: (typeof dbEnums.PAYMENT_METHOD)[number];
    paidAt?: Date;
    createdAt: Date;
  }>;
  vehicle: {
    make: string;
    model: string;
    year: number;
    pricePerDay: number;
    delayChargePerHour: number;
  };
}

export interface ProcessDepositRequest {
  paymentMethod?: (typeof dbEnums.PAYMENT_METHOD)[number];
  stripePaymentIntentId?: string;
}

export interface ProcessBalanceRequest {
  paymentMethod?: (typeof dbEnums.PAYMENT_METHOD)[number];
  stripePaymentIntentId?: string;
}

export interface ApplyDelayChargeRequest {
  actualDropoffTime: string; // ISO 8601 date string
}

export interface CompletePaymentRequest {
  stripePaymentIntentId?: string;
}

export interface MarkPickupRequest {
  actualPickupTime?: string; // ISO 8601 date string
}

export interface MarkDropoffRequest {
  actualDropoffTime?: string; // ISO 8601 date string
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data: any;
}

export interface OverduePayment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentType: (typeof dbEnums.PAYMENT_TYPE)[number];
  paymentStatus: (typeof dbEnums.PAYMENT_STATUS)[number];
  paymentMethod: (typeof dbEnums.PAYMENT_METHOD)[number];
  createdAt: Date;
  booking: {
    id: string;
    bookingStatus: (typeof dbEnums.BOOKING_STATUS)[number];
    endDatetime: Date;
  };
}

export interface EnhancedBookingData {
  id: string;
  userId: string;
  vehicleId: string;
  startDatetime: Date;
  endDatetime: Date;
  actualPickupDatetime?: Date;
  actualDropoffDatetime?: Date;
  pickupLocation: string;
  dropoffLocation: string;
  bookingType: (typeof dbEnums.BOOKING_TYPE)[number];
  bookingStatus: (typeof dbEnums.BOOKING_STATUS)[number];
  paymentStatus: (typeof dbEnums.PAYMENT_STATUS)[number];
  paymentMethod: (typeof dbEnums.PAYMENT_METHOD)[number];
  delayChargeApplied: boolean;
  delayHours: number;
  notes?: string;
}

export interface EnhancedBookingFinancialData {
  id: string;
  bookingId: string;
  baseAmount: number;
  depositAmount: number;
  balanceAmount: number;
  delayChargeAmount: number;
  delayChargeRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  refundPolicy?: string;
  refundableUntil?: Date;
  depositPercentage: number;
}

export interface EnhancedPaymentData {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeRefundId?: string;
  paymentType: (typeof dbEnums.PAYMENT_TYPE)[number];
  paymentStatus: (typeof dbEnums.PAYMENT_STATUS)[number];
  paymentMethod: (typeof dbEnums.PAYMENT_METHOD)[number];
  metadata?: Record<string, any>;
  paidAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentCalculation {
  baseAmount: number;
  depositAmount: number;
  balanceAmount: number;
  delayChargeAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
}

export interface DelayChargeCalculation {
  delayHours: number;
  delayChargeRate: number;
  delayChargeAmount: number;
  totalDelayCharge: number;
}
