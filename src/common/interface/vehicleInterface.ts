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
  pricePerDay: string; // API returns string
  delayChargePerHour?: string; // API returns string
  depositPercentage?: string; // API returns string
  currency?: string;
  passengerCapacity?: number;
  city?: string;
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
  isAvailable?: boolean | string; // API might accept "true"/"false" strings
  minPrice?: number;
  maxPrice?: number;
  year?: number;
  passengerCapacity?: number;
  locationId?: string;
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
