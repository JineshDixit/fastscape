"use strict";
/**
 * Vehicle Media Types - Read-Only Client Backend
 * Defines types for fetching structured vehicle photo data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageFieldName = exports.getImageTypeDisplayName = exports.isRequiredImage = exports.isValidImageType = exports.OPTIONAL_IMAGES = exports.REQUIRED_IMAGES = exports.VEHICLE_IMAGE_TYPES = void 0;
// Validation schemas
exports.VEHICLE_IMAGE_TYPES = [
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
exports.REQUIRED_IMAGES = [
    'front',
    'back',
    'leftSide',
    'rightSide',
];
exports.OPTIONAL_IMAGES = [
    'frontLeft',
    'frontRight',
    'interiorFront',
    'interiorBack',
    'dashboard',
    'engine',
];
// Helper functions for type checking
const isValidImageType = (type) => {
    return exports.VEHICLE_IMAGE_TYPES.includes(type);
};
exports.isValidImageType = isValidImageType;
const isRequiredImage = (type) => {
    return exports.REQUIRED_IMAGES.includes(type);
};
exports.isRequiredImage = isRequiredImage;
const getImageTypeDisplayName = (type) => {
    const displayNames = {
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
exports.getImageTypeDisplayName = getImageTypeDisplayName;
const getImageFieldName = (type) => {
    const fieldNames = {
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
exports.getImageFieldName = getImageFieldName;
//# sourceMappingURL=vehicleMediaTypes.js.map