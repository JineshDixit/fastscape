import { dbEnums } from '../enum/dbEnums';

export interface VehicleFilterOptions {
  make?: string | string[];
  model?: string | string[];
  bodyType?: (typeof dbEnums.VEHICLE_BODY_TYPE)[number] | (typeof dbEnums.VEHICLE_BODY_TYPE)[number][];
  transmission?: (typeof dbEnums.TRANSMISSION_TYPE)[number];
  fuelType?: (typeof dbEnums.FUEL_TYPE)[number];
  isAvailable?: boolean;
  minPrice?: number;
  maxPrice?: number;
  year?: number;
  search?: string;
  city?: string;
}

export interface VehicleSearchQuery extends VehicleFilterOptions {
  pickupLocation: string;
  pickupDate: string | Date;
  dropoffDate: string | Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface VehicleImageFiles {
  frontImage?: Express.Multer.File[];
  backImage?: Express.Multer.File[];
  leftSideImage?: Express.Multer.File[];
  rightSideImage?: Express.Multer.File[];
  frontLeftImage?: Express.Multer.File[];
  frontRightImage?: Express.Multer.File[];
  interiorFrontImage?: Express.Multer.File[];
  interiorBackImage?: Express.Multer.File[];
  dashboardImage?: Express.Multer.File[];
  engineImage?: Express.Multer.File[];
}
