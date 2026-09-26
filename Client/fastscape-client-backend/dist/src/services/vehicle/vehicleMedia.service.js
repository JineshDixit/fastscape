"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVehicleImageStats = exports.validateVehicleImages = exports.countVehicleImages = exports.getPrimaryImageUrl = exports.transformVehicleImages = exports.getVehicleMediaByVehicleId = void 0;
const models_1 = require("../../models");
const errorHandler_1 = require("../middleware/errorHandler");
const vehicleMediaTypes_1 = require("../../common/types/vehicleMediaTypes");
/**
 * Get vehicle media by vehicle ID
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<VehicleMedia[]>} - Array of media records
 */
const getVehicleMediaByVehicleId = (vehicleId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!vehicleId) {
        throw (0, errorHandler_1.createError)('Vehicle ID is required', 400);
    }
    const mediaRecords = yield models_1.VehicleMedia.findAll({
        where: { vehicleId },
        order: [['isPrimary', 'DESC'], ['createdAt', 'ASC']]
    });
    return mediaRecords;
});
exports.getVehicleMediaByVehicleId = getVehicleMediaByVehicleId;
/**
 * Transform vehicle media to structured image URLs
 * @param {VehicleMedia[]} mediaRecords - Array of vehicle media records
 * @returns {VehicleImageUrls} - Structured image URLs object
 */
const transformVehicleImages = (mediaRecords) => {
    const images = {};
    // Find primary media record first
    const primaryMedia = mediaRecords.find(media => media.isPrimary);
    const mediaToUse = primaryMedia || mediaRecords[0];
    if (mediaToUse) {
        if (mediaToUse.frontImage)
            images.frontImage = mediaToUse.frontImage;
        if (mediaToUse.backImage)
            images.backImage = mediaToUse.backImage;
        if (mediaToUse.leftSideImage)
            images.leftSideImage = mediaToUse.leftSideImage;
        if (mediaToUse.rightSideImage)
            images.rightSideImage = mediaToUse.rightSideImage;
        if (mediaToUse.frontLeftImage)
            images.frontLeftImage = mediaToUse.frontLeftImage;
        if (mediaToUse.frontRightImage)
            images.frontRightImage = mediaToUse.frontRightImage;
        if (mediaToUse.interiorFrontImage)
            images.interiorFrontImage = mediaToUse.interiorFrontImage;
        if (mediaToUse.interiorBackImage)
            images.interiorBackImage = mediaToUse.interiorBackImage;
        if (mediaToUse.dashboardImage)
            images.dashboardImage = mediaToUse.dashboardImage;
        if (mediaToUse.engineImage)
            images.engineImage = mediaToUse.engineImage;
    }
    return images;
};
exports.transformVehicleImages = transformVehicleImages;
/**
 * Get primary image URL for a vehicle
 * @param {VehicleMedia[]} mediaRecords - Array of vehicle media records
 * @returns {string | undefined} - Primary image URL
 */
const getPrimaryImageUrl = (mediaRecords) => {
    const primaryMedia = mediaRecords.find(media => media.isPrimary);
    const mediaToUse = primaryMedia || mediaRecords[0];
    if (!mediaToUse)
        return undefined;
    // Priority order for primary image
    return mediaToUse.frontImage ||
        mediaToUse.frontLeftImage ||
        mediaToUse.frontRightImage ||
        mediaToUse.leftSideImage ||
        mediaToUse.rightSideImage ||
        mediaToUse.backImage ||
        mediaToUse.interiorFrontImage;
};
exports.getPrimaryImageUrl = getPrimaryImageUrl;
/**
 * Count total images for a vehicle
 * @param {VehicleMedia[]} mediaRecords - Array of vehicle media records
 * @returns {number} - Total number of images
 */
const countVehicleImages = (mediaRecords) => {
    let count = 0;
    mediaRecords.forEach(media => {
        if (media.frontImage)
            count++;
        if (media.backImage)
            count++;
        if (media.leftSideImage)
            count++;
        if (media.rightSideImage)
            count++;
        if (media.frontLeftImage)
            count++;
        if (media.frontRightImage)
            count++;
        if (media.interiorFrontImage)
            count++;
        if (media.interiorBackImage)
            count++;
        if (media.dashboardImage)
            count++;
        if (media.engineImage)
            count++;
    });
    return count;
};
exports.countVehicleImages = countVehicleImages;
/**
 * Validate vehicle has required images
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<{ isValid: boolean; missingImages: VehicleImageType[] }>} - Validation result
 */
const validateVehicleImages = (vehicleId) => __awaiter(void 0, void 0, void 0, function* () {
    const mediaRecords = yield (0, exports.getVehicleMediaByVehicleId)(vehicleId);
    const missingImages = [];
    if (mediaRecords.length === 0) {
        return {
            isValid: false,
            missingImages: [...vehicleMediaTypes_1.REQUIRED_IMAGES]
        };
    }
    const primaryMedia = mediaRecords.find(media => media.isPrimary) || mediaRecords[0];
    // Check required images
    vehicleMediaTypes_1.REQUIRED_IMAGES.forEach(imageType => {
        const fieldName = (0, vehicleMediaTypes_1.getImageFieldName)(imageType);
        if (!primaryMedia[fieldName]) {
            missingImages.push(imageType);
        }
    });
    return {
        isValid: missingImages.length === 0,
        missingImages
    };
});
exports.validateVehicleImages = validateVehicleImages;
/**
 * Get vehicle image statistics
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<{ totalImages: number; requiredImages: number; optionalImages: number; completionPercentage: number }>} - Image statistics
 */
const getVehicleImageStats = (vehicleId) => __awaiter(void 0, void 0, void 0, function* () {
    const mediaRecords = yield (0, exports.getVehicleMediaByVehicleId)(vehicleId);
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
        if (primaryMedia[field]) {
            totalImages++;
            // Check if it's a required image
            const imageType = field.replace('Image', '').replace(/([A-Z])/g, (match, letter, offset) => offset > 0 ? letter.toLowerCase() : letter.toLowerCase());
            if (vehicleMediaTypes_1.REQUIRED_IMAGES.includes(imageType)) {
                requiredImages++;
            }
            else {
                optionalImages++;
            }
        }
    });
    const completionPercentage = Math.round((requiredImages / vehicleMediaTypes_1.REQUIRED_IMAGES.length) * 100);
    return {
        totalImages,
        requiredImages,
        optionalImages,
        completionPercentage
    };
});
exports.getVehicleImageStats = getVehicleImageStats;
//# sourceMappingURL=vehicleMedia.service.js.map