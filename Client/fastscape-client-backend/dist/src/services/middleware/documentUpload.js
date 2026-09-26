"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentUploadLimiter = exports.validateDocuments = exports.uploadDocuments = exports.handleMulterError = void 0;
const multer_1 = __importDefault(require("multer"));
const documentValidation_service_1 = require("../document/documentValidation.service");
const errorHandler_1 = require("./errorHandler");
const logger_1 = __importDefault(require("../../utils/logger"));
// Configure multer for memory storage (we'll validate before saving to disk)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
        files: 5, // Maximum 5 files per request
    },
    fileFilter: (req, file, cb) => {
        // Basic file type check (will be validated more thoroughly later)
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Invalid file type: ${file.mimetype}`));
        }
    },
});
// Multer error handler
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer_1.default.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return next((0, errorHandler_1.createError)('File size exceeds 5MB limit', 400));
            case 'LIMIT_FILE_COUNT':
                return next((0, errorHandler_1.createError)('Too many files uploaded (maximum 5)', 400));
            case 'LIMIT_UNEXPECTED_FILE':
                return next((0, errorHandler_1.createError)('Unexpected file field', 400));
            default:
                return next((0, errorHandler_1.createError)(`Upload error: ${error.message}`, 400));
        }
    }
    if (error.message.includes('Invalid file type')) {
        return next((0, errorHandler_1.createError)(error.message, 400));
    }
    next(error);
};
exports.handleMulterError = handleMulterError;
// Document upload middleware
exports.uploadDocuments = upload.fields([
    { name: 'driverLicenseFront', maxCount: 1 },
    { name: 'driverLicenseBack', maxCount: 1 },
    { name: 'passportPhoto', maxCount: 1 },
    { name: 'internationalDrivingPermit', maxCount: 1 },
    { name: 'selfieWithLicense', maxCount: 1 },
]);
// Validation middleware (use after multer)
const validateDocuments = (req, res, next) => {
    try {
        const files = req.files;
        if (!files || Object.keys(files).length === 0) {
            return next((0, errorHandler_1.createError)('No files uploaded', 400));
        }
        // Perform malware check on all files
        for (const [fieldName, fileArray] of Object.entries(files)) {
            if (fileArray && fileArray.length > 0) {
                const file = fileArray[0];
                if ((0, documentValidation_service_1.performBasicMalwareCheck)(file)) {
                    logger_1.default.warn('Malicious file detected and blocked', {
                        fieldName,
                        filename: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size,
                    });
                    return next((0, errorHandler_1.createError)('File appears to contain malicious content', 400));
                }
            }
        }
        // Validate documents
        const validation = (0, documentValidation_service_1.validateDocumentUpload)(files);
        if (!validation.isValid) {
            return next((0, errorHandler_1.createError)(`Document validation failed: ${validation.errors.join(', ')}`, 400));
        }
        // Attach validation results to request for use in controller
        req.documentValidation = validation;
        next();
    }
    catch (error) {
        logger_1.default.error('Document validation middleware error', { error });
        next((0, errorHandler_1.createError)('Document validation failed', 500));
    }
};
exports.validateDocuments = validateDocuments;
// Rate limiting for document uploads (stricter than general API)
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.documentUploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 document upload requests per windowMs
    message: {
        error: 'Too many document upload attempts, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
//# sourceMappingURL=documentUpload.js.map