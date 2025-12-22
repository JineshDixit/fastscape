/**
 * Vehicle Media Types - Read-Only Client Backend
 * Defines types for fetching structured vehicle photo data
 */

export interface VehicleMediaData {
  id?: string;
  vehicleId: string;
  frontImage?: string;
  backImage?: string;
  leftSideImage?: string;
  rightSideImage?: string;
  frontLeftImage?: string;
  frontRightImage?: string;
  interiorFrontImage?: string;
  interiorBackImage?: string;
  dashboardImage?: string;
  engineImage?: string;
  isPrimary?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VehicleImageUrls {
  frontImage?: string;
  backImage?: string;
  leftSideImage?: string;
  rightSideImage?: string;
  frontLeftImage?: string;
  frontRightImage?: string;
  interiorFrontImage?: string;
  interiorBackImage?: string;
  dashboardImage?: string;
  engineImage?: string;
}

export interface VehicleWithImages {
  id: string;
  make: string;
  model: string;
  year: number;
  bodyType: string;
  pricePerDay: number;
  currency: string;
  isAvailable: boolean;
  images: VehicleImageUrls;
  primaryImage?: string;
  imageCount: number;
  hasImages: boolean;
}

export interface VehicleImagesResponse {
  success: boolean;
  message: string;
  data: {
    vehicleId: string;
    images: VehicleImageUrls;
    primaryImage?: string;
    imageCount: number;
  };
}

export type VehicleImageType = 
  | 'front'
  | 'back'
  | 'leftSide'
  | 'rightSide'
  | 'frontLeft'
  | 'frontRight'
  | 'interiorFront'
  | 'interiorBack'
  | 'dashboard'
  | 'engine';

// Validation schemas
export const VEHICLE_IMAGE_TYPES: VehicleImageType[] = [
  'front',
  'back',
  'leftSide',
  'rightSide',
  'frontLeft',
  'frontRight',
  'interiorFront',
  'interiorBack',
  'dashboard',
  'engine',
];

export const REQUIRED_IMAGES: VehicleImageType[] = [
  'front',
  'back',
  'leftSide',
  'rightSide',
];

export const OPTIONAL_IMAGES: VehicleImageType[] = [
  'frontLeft',
  'frontRight',
  'interiorFront',
  'interiorBack',
  'dashboard',
  'engine',
];

// Helper functions for type checking
export const isValidImageType = (type: string): type is VehicleImageType => {
  return VEHICLE_IMAGE_TYPES.includes(type as VehicleImageType);
};

export const isRequiredImage = (type: VehicleImageType): boolean => {
  return REQUIRED_IMAGES.includes(type);
};

export const getImageTypeDisplayName = (type: VehicleImageType): string => {
  const displayNames: Record<VehicleImageType, string> = {
    front: 'Front View',
    back: 'Back View',
    leftSide: 'Left Side View',
    rightSide: 'Right Side View',
    frontLeft: 'Front Left Diagonal',
    frontRight: 'Front Right Diagonal',
    interiorFront: 'Interior Front',
    interiorBack: 'Interior Back',
    dashboard: 'Dashboard',
    engine: 'Engine Bay',
  };
  return displayNames[type];
};

export const getImageFieldName = (type: VehicleImageType): keyof VehicleImageUrls => {
  const fieldNames: Record<VehicleImageType, keyof VehicleImageUrls> = {
    front: 'frontImage',
    back: 'backImage',
    leftSide: 'leftSideImage',
    rightSide: 'rightSideImage',
    frontLeft: 'frontLeftImage',
    frontRight: 'frontRightImage',
    interiorFront: 'interiorFrontImage',
    interiorBack: 'interiorBackImage',
    dashboard: 'dashboardImage',
    engine: 'engineImage',
  };
  return fieldNames[type];
};