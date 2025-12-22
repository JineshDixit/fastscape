import { VehicleMedia } from '../../models';
import { createError } from '../middleware/errorHandler';
import { 
  VehicleImageUrls,
  VehicleImageType,
  REQUIRED_IMAGES,
  getImageFieldName
} from '../../common/types/vehicleMediaTypes';

/**
 * Get vehicle media by vehicle ID
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<VehicleMedia[]>} - Array of media records
 */
export const getVehicleMediaByVehicleId = async (vehicleId: string): Promise<VehicleMedia[]> => {
  if (!vehicleId) {
    throw createError('Vehicle ID is required', 400);
  }

  const mediaRecords = await VehicleMedia.findAll({
    where: { vehicleId },
    order: [['isPrimary', 'DESC'], ['createdAt', 'ASC']]
  });

  return mediaRecords;
};

/**
 * Transform vehicle media to structured image URLs
 * @param {VehicleMedia[]} mediaRecords - Array of vehicle media records
 * @returns {VehicleImageUrls} - Structured image URLs object
 */
export const transformVehicleImages = (mediaRecords: VehicleMedia[]): VehicleImageUrls => {
  const images: VehicleImageUrls = {};
  
  // Find primary media record first
  const primaryMedia = mediaRecords.find(media => media.isPrimary);
  const mediaToUse = primaryMedia || mediaRecords[0];
  
  if (mediaToUse) {
    if (mediaToUse.frontImage) images.frontImage = mediaToUse.frontImage;
    if (mediaToUse.backImage) images.backImage = mediaToUse.backImage;
    if (mediaToUse.leftSideImage) images.leftSideImage = mediaToUse.leftSideImage;
    if (mediaToUse.rightSideImage) images.rightSideImage = mediaToUse.rightSideImage;
    if (mediaToUse.frontLeftImage) images.frontLeftImage = mediaToUse.frontLeftImage;
    if (mediaToUse.frontRightImage) images.frontRightImage = mediaToUse.frontRightImage;
    if (mediaToUse.interiorFrontImage) images.interiorFrontImage = mediaToUse.interiorFrontImage;
    if (mediaToUse.interiorBackImage) images.interiorBackImage = mediaToUse.interiorBackImage;
    if (mediaToUse.dashboardImage) images.dashboardImage = mediaToUse.dashboardImage;
    if (mediaToUse.engineImage) images.engineImage = mediaToUse.engineImage;
  }
  
  return images;
};

/**
 * Get primary image URL for a vehicle
 * @param {VehicleMedia[]} mediaRecords - Array of vehicle media records
 * @returns {string | undefined} - Primary image URL
 */
export const getPrimaryImageUrl = (mediaRecords: VehicleMedia[]): string | undefined => {
  const primaryMedia = mediaRecords.find(media => media.isPrimary);
  const mediaToUse = primaryMedia || mediaRecords[0];
  
  if (!mediaToUse) return undefined;
  
  // Priority order for primary image
  return mediaToUse.frontImage || 
         mediaToUse.frontLeftImage || 
         mediaToUse.frontRightImage || 
         mediaToUse.leftSideImage || 
         mediaToUse.rightSideImage || 
         mediaToUse.backImage ||
         mediaToUse.interiorFrontImage;
};

/**
 * Count total images for a vehicle
 * @param {VehicleMedia[]} mediaRecords - Array of vehicle media records
 * @returns {number} - Total number of images
 */
export const countVehicleImages = (mediaRecords: VehicleMedia[]): number => {
  let count = 0;
  
  mediaRecords.forEach(media => {
    if (media.frontImage) count++;
    if (media.backImage) count++;
    if (media.leftSideImage) count++;
    if (media.rightSideImage) count++;
    if (media.frontLeftImage) count++;
    if (media.frontRightImage) count++;
    if (media.interiorFrontImage) count++;
    if (media.interiorBackImage) count++;
    if (media.dashboardImage) count++;
    if (media.engineImage) count++;
  });
  
  return count;
};

/**
 * Validate vehicle has required images
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<{ isValid: boolean; missingImages: VehicleImageType[] }>} - Validation result
 */
export const validateVehicleImages = async (vehicleId: string): Promise<{
  isValid: boolean;
  missingImages: VehicleImageType[];
}> => {
  const mediaRecords = await getVehicleMediaByVehicleId(vehicleId);
  const missingImages: VehicleImageType[] = [];

  if (mediaRecords.length === 0) {
    return {
      isValid: false,
      missingImages: [...REQUIRED_IMAGES]
    };
  }

  const primaryMedia = mediaRecords.find(media => media.isPrimary) || mediaRecords[0];

  // Check required images
  REQUIRED_IMAGES.forEach(imageType => {
    const fieldName = getImageFieldName(imageType);
    if (!primaryMedia[fieldName as keyof VehicleMedia]) {
      missingImages.push(imageType);
    }
  });

  return {
    isValid: missingImages.length === 0,
    missingImages
  };
};

/**
 * Get vehicle image statistics
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<{ totalImages: number; requiredImages: number; optionalImages: number; completionPercentage: number }>} - Image statistics
 */
export const getVehicleImageStats = async (vehicleId: string): Promise<{
  totalImages: number;
  requiredImages: number;
  optionalImages: number;
  completionPercentage: number;
}> => {
  const mediaRecords = await getVehicleMediaByVehicleId(vehicleId);
  
  if (mediaRecords.length === 0) {
    return {
      totalImages: 0,
      requiredImages: 0,
      optionalImages: 0,
      completionPercentage: 0
    };
  }

  const primaryMedia = mediaRecords.find(media => media.isPrimary) || mediaRecords[0];
  
  let totalImages = 0;
  let requiredImages = 0;
  let optionalImages = 0;

  // Count images
  const imageFields = [
    'frontImage', 'backImage', 'leftSideImage', 'rightSideImage',
    'frontLeftImage', 'frontRightImage', 'interiorFrontImage', 
    'interiorBackImage', 'dashboardImage', 'engineImage'
  ];

  imageFields.forEach(field => {
    if (primaryMedia[field as keyof VehicleMedia]) {
      totalImages++;
      
      // Check if it's a required image
      const imageType = field.replace('Image', '').replace(/([A-Z])/g, (match, letter, offset) => 
        offset > 0 ? letter.toLowerCase() : letter.toLowerCase()
      );
      
      if (REQUIRED_IMAGES.includes(imageType as VehicleImageType)) {
        requiredImages++;
      } else {
        optionalImages++;
      }
    }
  });

  const completionPercentage = Math.round((requiredImages / REQUIRED_IMAGES.length) * 100);

  return {
    totalImages,
    requiredImages,
    optionalImages,
    completionPercentage
  };
};