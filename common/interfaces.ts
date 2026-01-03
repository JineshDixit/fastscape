// Common API response types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
  make?: string;
  model?: string;
  bodyType?: BodyType;
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

// Auth Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'USER' | 'ADMIN';
  dateOfBirth?: string;
  nationality?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
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
  fullName: string;
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

export interface LogoutRequest {
  refreshToken: string;
}
