"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMulterError = exports.multipleImageUpload = exports.singleImageUpload = exports.userIdentityDocUpload = void 0;
const multer_1 = __importDefault(require("multer"));
// Allowed image types
const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
// Maximum file size (5MB)
const maxFileSize = 5 * 1024 * 1024;
// File filter function
const fileFilter = (req, file, cb) => {
    if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
};
// Memory storage configuration (we'll handle file saving manually)
const storage = multer_1.default.memoryStorage();
// User identity document upload configuration
exports.userIdentityDocUpload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: maxFileSize,
        files: 10, // Maximum 10 files per request
    },
}).fields([
    { name: 'driverLicenseFront', maxCount: 1 },
    { name: 'driverLicenseBack', maxCount: 1 },
    { name: 'passportPhoto', maxCount: 1 },
    { name: 'internationalDrivingPermit', maxCount: 1 },
    { name: 'selfieWithLicense', maxCount: 1 },
]);
// Single image upload for general purposes
exports.singleImageUpload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: maxFileSize,
        files: 1,
    },
}).single('image');
// Multiple images upload (up to 10 files)
exports.multipleImageUpload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: maxFileSize,
        files: 10,
    },
}).array('images', 10);
// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer_1.default.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size is 5MB.',
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    message: 'Too many files. Maximum 10 files allowed.',
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    message: 'Unexpected field name in file upload.',
                });
            default:
                return res.status(400).json({
                    success: false,
                    message: 'File upload error.',
                });
        }
    }
    if (error.message === 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.') {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
    next(error);
};
exports.handleMulterError = handleMulterError;
//# sourceMappingURL=multerConfig.js.map