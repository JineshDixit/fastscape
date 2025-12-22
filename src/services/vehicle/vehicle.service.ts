import { VehicleFilters } from '../../common/types/vehicalType';
import { Vehicle, VehicleMedia, Booking } from '../../models';
import { createError } from '../middleware/errorHandler';
import { 
  VehicleWithImages, 
  VehicleImageUrls, 
  VehicleImagesResponse 
} from '../../common/types/vehicleMediaTypes';
import { 
  buildSearchConditions, 
  buildDateConflictConditions, 
  buildNumericRangeConditions,
  mergeWhereConditions,
  VEHICLE_LIST_ATTRIBUTES
} from '../../utils/database.utils';
import { validateDateRange } from '../../utils/validation.utils';
import { Op } from 'sequelize';

/**
 * Standard vehicle media include configuration
 */
const VEHICLE_MEDIA_INCLUDE = {
  model: VehicleMedia,
  attributes: [
    'id', 'vehicleId', 'frontImage', 'backImage', 'leftSideImage', 
    'rightSideImage', 'frontLeftImage', 'frontRightImage', 
    'interiorFrontImage', 'interiorBackImage', 'dashboardImage', 
    'engineImage', 'isPrimary'
  ]
};

/**
 * Build vehicle filter conditions
 */
const buildVehicleFilters = (filters: VehicleFilters) => {
  const conditions: any = {
    isAvailable: true
  };

  if (filters.bodyType) {
    conditions.bodyType = filters.bodyType;
  }
  
  if (filters.fuelType) {
    conditions.fuelType = filters.fuelType;
  }
  
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceConditions = buildNumericRangeConditions('pricePerDay', filters.minPrice, filters.maxPrice);
    Object.assign(conditions, priceConditions);
  }

  return conditions;
};

/**
 * Get available vehicles with date availability check
 */
export const getAvailableVehicles = async (filters: VehicleFilters): Promise<Vehicle[]> => {
  let whereClause = buildVehicleFilters(filters);

  // Check availability for specific dates
  if (filters.startDate && filters.endDate) {
    const { start, end } = validateDateRange(filters.startDate, filters.endDate);

    // Find vehicles that are NOT booked during the requested period
    const bookedVehicles = await Booking.findAll({
      where: {
        bookingStatus: ['PENDING', 'CONFIRMED'],
        ...buildDateConflictConditions(start, end)
      },
      attributes: ['vehicleId']
    });

    const bookedVehicleIds = bookedVehicles.map(booking => booking.vehicleId);
    
    if (bookedVehicleIds.length > 0) {
      whereClause = mergeWhereConditions(whereClause, {
        id: { [Op.notIn]: bookedVehicleIds }
      });
    }
  }

  return Vehicle.findAll({
    where: whereClause,
    attributes: VEHICLE_LIST_ATTRIBUTES,
    include: [VEHICLE_MEDIA_INCLUDE],
    order: [['pricePerDay', 'ASC']]
  });
};

/**
 * Retrieves a vehicle by ID
 */
export const getVehicleById = async (vehicleId: string): Promise<Vehicle> => {
  if (!vehicleId) {
    throw createError('Vehicle ID is required', 400);
  }

  const vehicle = await Vehicle.findByPk(vehicleId, {
    include: [VEHICLE_MEDIA_INCLUDE]
  });

  if (!vehicle) {
    throw createError('Vehicle not found', 404);
  }

  return vehicle;
};

/**
 * Searches for vehicles based on the provided query and filters
 */
export const searchVehicles = async (query: string, filters: any): Promise<Vehicle[]> => {
  if (!query || query.trim().length < 2) {
    throw createError('Search query must be at least 2 characters long', 400);
  }

  const searchConditions = buildSearchConditions(query, [
    'make', 'model', 'trim', 'bodyType', 'fuelType'
  ]);

  const filterConditions = buildVehicleFilters(filters);
  const whereClause = mergeWhereConditions(searchConditions, filterConditions);

  return Vehicle.findAll({
    where: whereClause,
    attributes: VEHICLE_LIST_ATTRIBUTES,
    include: [VEHICLE_MEDIA_INCLUDE],
    order: [['pricePerDay', 'ASC']],
    limit: 20
  });
};

/**
 * Transform vehicle media to structured image URLs
 */
export const transformVehicleImages = (mediaRecords: VehicleMedia[]): VehicleImageUrls => {
  const images: VehicleImageUrls = {};
  
  // Find primary media record first
  const primaryMedia = mediaRecords.find(media => media.isPrimary);
  const mediaToUse = primaryMedia || mediaRecords[0];
  
  if (mediaToUse) {
    const imageFields = [
      'frontImage', 'backImage', 'leftSideImage', 'rightSideImage',
      'frontLeftImage', 'frontRightImage', 'interiorFrontImage', 
      'interiorBackImage', 'dashboardImage', 'engineImage'
    ] as const;

    imageFields.forEach(field => {
      if (mediaToUse[field]) {
        images[field] = mediaToUse[field];
      }
    });
  }
  
  return images;
};

/**
 * Get primary image URL for a vehicle
 */
export const getPrimaryImageUrl = (mediaRecords: VehicleMedia[]): string | undefined => {
  const primaryMedia = mediaRecords.find(media => media.isPrimary);
  const mediaToUse = primaryMedia || mediaRecords[0];
  
  if (!mediaToUse) return undefined;
  
  // Priority order for primary image
  const priorityOrder = [
    'frontImage', 'frontLeftImage', 'frontRightImage', 
    'leftSideImage', 'rightSideImage', 'backImage', 'interiorFrontImage'
  ] as const;

  for (const field of priorityOrder) {
    if (mediaToUse[field]) {
      return mediaToUse[field];
    }
  }

  return undefined;
};

/**
 * Count total images for a vehicle
 */
export const countVehicleImages = (mediaRecords: VehicleMedia[]): number => {
  let count = 0;
  
  const imageFields = [
    'frontImage', 'backImage', 'leftSideImage', 'rightSideImage',
    'frontLeftImage', 'frontRightImage', 'interiorFrontImage', 
    'interiorBackImage', 'dashboardImage', 'engineImage'
  ] as const;

  mediaRecords.forEach(media => {
    imageFields.forEach(field => {
      if (media[field]) count++;
    });
  });
  
  return count;
};

/**
 * Transform vehicle with media to VehicleWithImages format
 */
export const transformVehicleWithImages = (vehicle: any): VehicleWithImages => {
  const mediaRecords = vehicle.VehicleMedia || [];
  const images = transformVehicleImages(mediaRecords);
  const primaryImage = getPrimaryImageUrl(mediaRecords);
  const imageCount = countVehicleImages(mediaRecords);
  
  return {
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    bodyType: vehicle.bodyType,
    pricePerDay: vehicle.pricePerDay,
    currency: vehicle.currency,
    isAvailable: vehicle.isAvailable,
    images,
    primaryImage,
    imageCount,
    hasImages: imageCount > 0
  };
};

/**
 * Get vehicle images by vehicle ID
 */
export const getVehicleImages = async (vehicleId: string): Promise<VehicleImagesResponse> => {
  if (!vehicleId) {
    throw createError('Vehicle ID is required', 400);
  }

  const mediaRecords = await VehicleMedia.findAll({
    where: { vehicleId },
    order: [['isPrimary', 'DESC'], ['createdAt', 'ASC']]
  });

  const images = transformVehicleImages(mediaRecords);
  const primaryImage = getPrimaryImageUrl(mediaRecords);
  const imageCount = countVehicleImages(mediaRecords);

  return {
    success: true,
    message: 'Vehicle images retrieved successfully',
    data: {
      vehicleId,
      images,
      primaryImage,
      imageCount
    }
  };
};

/**
 * Get vehicles with structured images
 */
export const getVehiclesWithImages = async (filters: VehicleFilters): Promise<VehicleWithImages[]> => {
  const vehicles = await getAvailableVehicles(filters);
  return vehicles.map(transformVehicleWithImages);
};