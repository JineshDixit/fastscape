// Common API response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

// Common request types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  search?: string;
  filters?: Record<string, any>;
}

// HTTP method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Request configuration
export interface RequestConfig {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  data?: any;
}

export interface CookieOptions {
  expires?: Date | number;
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export type UnitStatus = 'Available' | 'Unavailable' | 'Maintenance';
export type TransmissionType = 'Automatic' | 'Manual';
export type FuelType = 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric';
export type DrivetrainType = 'FWD' | 'RWD' | 'AWD' | '4x4';
export type BodyType = 'SUV' | 'Sedan' | 'Coupe' | 'Supercar' | 'Pickup' | 'Hatchback';

export interface VehicleMedia {
  id: string;
  vehicleId: string;
  frontImage: string | null;
  backImage: string | null;
  leftSideImage: string | null;
  rightSideImage: string | null;
  frontLeftImage: string | null;
  frontRightImage: string | null;
  interiorFrontImage: string | null;
  interiorBackImage: string | null;
  dashboardImage: string | null;
  engineImage: string | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  trim?: string;
  year: number;
  exteriorColor: string;
  interiorColor: string;
  bodyType: BodyType;
  transmission: TransmissionType;
  drivetrain: DrivetrainType;
  engine: string;
  horsepower: number;
  fuelType: FuelType;
  fuelConsumption: string;
  pricePerDay: string;
  delayChargePerHour?: string;
  depositPercentage?: string;
  currency?: string;
  isAvailable: boolean;
  passengerCapacity: number;
  city: string;

  media: VehicleMedia[];

  createdAt: string;
  updatedAt: string;
}

export interface VehicleListResponse {
  vehicles: Vehicle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VehicleStats {
  total: number;
  available: number;
  unavailable: number;
  byBodyType?: Record<string, number>;
  byFuelType?: Record<string, number>;
  byTransmission?: Record<string, number>;
}

export interface VehicleEnums {
  bodyTypes: string[];
  transmissionTypes: string[];
  drivetrainTypes: string[];
  fuelTypes: string[];
}

export interface VehicleFilters {
  page?: number;
  limit?: number;
  sortBy?: keyof Vehicle | 'createdAt' | 'updatedAt';
  sortOrder?: 'ASC' | 'DESC';
  search?: string;
  make?: string | string[];
  model?: string | string[];
  bodyType?: BodyType | BodyType[];
  transmission?: TransmissionType;
  fuelType?: FuelType;
  isAvailable?: boolean | string;
  minPrice?: number;
  maxPrice?: number;
  year?: number;
}

export interface VehicleBulkUpdate {
  vehicleIds: string[];
  isAvailable: boolean;
}

export interface VehicleBulkUpdateResponse {
  affectedCount: number;
}

export interface Unit {
  id: string;
  make: string;
  model: string;
  type: string;
  pricePerDay: number;
  image: string;
  status: UnitStatus;
  availableUnits?: number;
  transmission: TransmissionType;
  drivetrain: DrivetrainType;
  fuelType: FuelType;
}

// Address Type
export interface Address {
  id?: string;
  type: string; // 'Home' | 'Work' | 'Other'
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface Location {
  id: string;
  name: string;
  type: 'AIRPORT' | 'CITY' | 'HOTEL' | 'BRANCH' | 'OTHER';
  address: string;
  city: string;
  code: string;
  isActive: boolean;
}

// Auth Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'USER' | 'ADMIN';
  avatar?: string;
  dateOfBirth?: string;
  nationality?: string;
  addresses?: Address[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  nationality: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ContactUsRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface ContactUsResponse {
  queued: boolean;
  messageId?: string;
}

export interface VehicleSearchParams {
  pickupLocation: string;
  pickupDate: string; // ISO string format
  dropoffDate: string; // ISO string format
  bookingType?: 'SELF_DRIVE' | 'CHAUFFEUR';
  make?: string | string[];
  model?: string | string[];
  bodyType?: BodyType | BodyType[];
  transmission?: TransmissionType;
  page?: number;
  limit?: number;
}

// User Profile Types
export interface UserProfile extends User {
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  address?: string;
  licenseIssuingCountry?: string;
  licenseExpiryDate?: string;
  drivingExperienceYears?: number;
  visaStatus?: 'Resident' | 'Tourist' | 'Visit';
  // Document URLs after upload
  driverLicenseFront?: string;
  driverLicenseBack?: string;
  passportPhoto?: string;
  internationalDrivingPermit?: string;
  selfieWithLicense?: string;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  licenseIssuingCountry?: string;
  licenseExpiryDate?: string;
  drivingExperienceYears?: number;
  visaStatus?: 'Resident' | 'Tourist' | 'Visit';
  // Files for document upload
  driverLicenseFront?: File;
  driverLicenseBack?: File;
  passportPhoto?: File;
  internationalDrivingPermit?: File;
  selfieWithLicense?: File;
}

export interface LogoutRequest {
  refreshToken: string;
}

// Booking Types (matching backend exactly)
export type BookingType = 'SELF_DRIVE' | 'CHAUFFEUR';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'PICKED_UP' | 'DROPPED_OFF' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED' | 'OVERDUE';
export type PaymentMethod = 'PICKUP' | 'DROPOFF' | 'ONLINE';

export interface Booking {
  id: string;
  userId: string;
  vehicleId: string;
  chauffeurId?: string;
  startDatetime: string;
  endDatetime: string;
  actualPickupDatetime?: string;
  actualDropoffDatetime?: string;
  pickupLocation: string;
  dropoffLocation: string;
  bookingType: BookingType;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  delayChargeApplied: boolean;
  delayHours: number;
  chauffeurInstructions?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Relations (only what client needs to see)
  vehicle?: Vehicle;
  chauffeur?: {
    id: string;
    fullName: string;
    phone: string;
    rating: number;
    totalTrips?: number;
    experienceLevel?: string;
    languages?: string[];
  };
  BookingFinancial?: BookingFinancial; // Backend uses this exact name
}

export interface BookingFinancial {
  id: string;
  bookingId: string;
  baseAmount: string;
  depositAmount: string;
  balanceAmount: string;
  taxAmount: string;
  totalAmount: string;
  currency: string;
  depositPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: string;
  currency: string;
  paymentType: 'DEPOSIT' | 'BALANCE' | 'DELAY_CHARGE' | 'REFUND' | 'FULL';
  paymentMethod: PaymentMethod;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  stripePaymentIntentId?: string;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Client-focused Booking Request Types
export interface CreateBookingRequest {
  vehicleId: string;
  startDatetime: string;
  endDatetime: string;
  pickupLocation: string;
  dropoffLocation: string;
  bookingType: BookingType;
  paymentMethod: PaymentMethod;
  notes?: string;
  chauffeurInstructions?: string; // Only used if bookingType is CHAUFFEUR
}

export interface UpdateBookingRequest {
  startDatetime?: string;
  endDatetime?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  notes?: string;
  chauffeurInstructions?: string;
  actualPickupDatetime?: string;
  actualDropoffDatetime?: string;
}

export interface CheckAvailabilityRequest {
  vehicleId: string;
  startDatetime: string;
  endDatetime: string;
}

export interface ExtendBookingRequest {
  newEndDatetime: string;
}

export interface CancelBookingRequest {
  cancellationReason?: string;
}

// Backend availability response structure
export interface AvailabilityResponse {
  isAvailable: boolean;
  vehicle: {
    id: string;
    make: string;
    model: string;
    isAvailable: boolean;
  };
  conflictingBookings: Array<{
    id: string;
    startDatetime: string;
    endDatetime: string;
    status: string;
  }>;
  requestedPeriod: {
    start: string;
    end: string;
    durationHours: number;
    durationDays: number;
  };
}

// Client-focused Filter Types
export interface BookingFilters extends PaginationParams {
  status?: BookingStatus;
  vehicleType?: BodyType;
  startDate?: string;
  endDate?: string;
  bookingType?: BookingType;
  paymentStatus?: PaymentStatus;
}

export interface BookingListResponse {
  bookings: Booking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

// Payment Types (Client-focused)
export interface PaymentBreakdown {
  baseAmount: string;
  depositAmount: string;
  balanceAmount: string;
  taxAmount: string;
  delayCharges?: string;
  totalAmount: string;
  currency: string;
  daysCount: number;
  delayHours?: number;
  depositPercentage: number;
}

export interface ProcessPaymentRequest {
  paymentMethod: PaymentMethod;
  stripePaymentIntentId?: string;
  paymentType?: 'DEPOSIT' | 'FULL';
}

export interface PaymentSummary {
  booking: Booking;
  financial: BookingFinancial;
  payments: Payment[];
  totalPaid: string;
  remainingBalance: string;
  nextPaymentDue?: string;
}

// Extend booking response
export interface ExtendBookingResponse {
  booking: Booking;
  additionalCost: number;
}

// Cancel booking response
export interface CancelBookingResponse {
  booking: Booking;
  refundAmount: number;
  refundPolicy: string;
}

export interface AssignmentStatusResponse {
  bookingId: string;
  bookingType: BookingType;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  chauffeurId?: string;
  chauffeur?: {
    id: string;
    fullName: string;
    phone: string;
    rating: number;
    experienceLevel?: string;
  };
  isEligibleForAssignment: boolean;
}
