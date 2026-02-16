/**
 * Email template types
 */
export enum EmailTemplate {
  WELCOME = 'WELCOME',
  PASSWORD_RESET = 'PASSWORD_RESET',
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_REMINDER = 'BOOKING_REMINDER',
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
  PAYMENT_RECEIPT = 'PAYMENT_RECEIPT',
  VERIFICATION_APPROVED = 'VERIFICATION_APPROVED',
  VERIFICATION_REJECTED = 'VERIFICATION_REJECTED',
  CHAUFFEUR_ASSIGNED = 'CHAUFFEUR_ASSIGNED',
}

/**
 * Base email options
 */
export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: EmailTemplate;
  context: Record<string, any>;
  attachments?: EmailAttachment[];
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Email attachment interface
 */
export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

/**
 * Email send result
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Welcome email context
 */
export interface WelcomeEmailContext {
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Password reset email context
 */
export interface PasswordResetEmailContext {
  firstName: string;
  otp: string;
  expiryMinutes: number;
}

/**
 * Booking confirmation email context
 */
export interface BookingConfirmationEmailContext {
  firstName: string;
  bookingId: string;
  vehicleName: string;
  vehicleImage?: string;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  totalAmount: string;
  currency: string;
  bookingType: string;
}

/**
 * Booking cancelled email context
 */
export interface BookingCancelledEmailContext {
  firstName: string;
  bookingId: string;
  vehicleName: string;
  cancellationDate: string;
  refundAmount?: string;
  currency?: string;
}

/**
 * Booking reminder email context
 */
export interface BookingReminderEmailContext {
  firstName: string;
  bookingId: string;
  vehicleName: string;
  startDate: string;
  pickupLocation: string;
  hoursUntilPickup: number;
}

/**
 * Payment confirmation email context
 */
export interface PaymentConfirmationEmailContext {
  firstName: string;
  bookingId: string;
  paymentType: string;
  amount: string;
  currency: string;
  paymentDate: string;
  paymentMethod: string;
}

/**
 * Verification status email context
 */
export interface VerificationEmailContext {
  firstName: string;
  status: 'APPROVED' | 'REJECTED';
  reason?: string;
  nextSteps?: string;
}

/**
 * Chauffeur assignment email context
 */
export interface ChauffeurAssignmentEmailContext {
  firstName: string;
  bookingId: string;
  vehicleName: string;
  chauffeurName: string;
  chauffeurPhone: string;
  chauffeurRating?: number;
  chauffeurExperience?: string;
  chauffeurLanguages?: string;
  startDate: string;
  pickupLocation: string;
}
