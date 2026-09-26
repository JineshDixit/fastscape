"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDocumentRequirements = exports.performBasicMalwareCheck = exports.generateSecureFilePath = exports.validateDocumentUpload = exports.validateUploadedFile = void 0;
const logger_1 = __importDefault(require("../../utils/logger"));
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
};
// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Minimum file size (1KB)
const MIN_FILE_SIZE = 1024;
// Document type requirements
const DOCUMENT_REQUIREMENTS = {
    driverLicenseFront: {
        required: true,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSize: MAX_FILE_SIZE,
        description: 'Driver License Front',
    },
    driverLicenseBack: {
        required: true,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSize: MAX_FILE_SIZE,
        description: 'Driver License Back',
    },
    passportPhoto: {
        required: true,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSize: MAX_FILE_SIZE,
        description: 'Passport Photo',
    },
    internationalDrivingPermit: {
        required: false,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        maxSize: MAX_FILE_SIZE,
        description: 'International Driving Permit',
    },
    selfieWithLicense: {
        required: true,
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSize: MAX_FILE_SIZE,
        description: 'Selfie with License',
    },
};
/**
 * Validate uploaded file
 */
const validateUploadedFile = (file, documentType) => {
    var _a;
    const errors = [];
    const requirements = DOCUMENT_REQUIREMENTS[documentType];
    if (!requirements) {
        errors.push(`Unknown document type: ${documentType}`);
        return { isValid: false, errors };
    }
    // Check file size
    if (file.size > requirements.maxSize) {
        errors.push(`File size exceeds maximum allowed size of ${requirements.maxSize / (1024 * 1024)}MB`);
    }
    if (file.size < MIN_FILE_SIZE) {
        errors.push(`File size is too small (minimum ${MIN_FILE_SIZE / 1024}KB)`);
    }
    // Check MIME type
    if (!requirements.allowedTypes.includes(file.mimetype)) {
        errors.push(`Invalid file type. Allowed types: ${requirements.allowedTypes.join(', ')}`);
    }
    // Check file extension matches MIME type
    const fileExtension = path_1.default.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;
    const allowedExtensions = ALLOWED_FILE_TYPES[mimeType];
    if (!allowedExtensions) {
        errors.push(`Unsupported MIME type: ${file.mimetype}`);
    }
    else {
        const extensionMatches = allowedExtensions.some((ext) => ext === fileExtension);
        if (!extensionMatches) {
            errors.push(`File extension ${fileExtension} does not match MIME type ${file.mimetype}`);
        }
    }
    // Validate filename (prevent path traversal)
    if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
        errors.push('Invalid filename - path traversal detected');
    }
    // Check for null bytes
    if (file.originalname.includes('\0') || ((_a = file.buffer) === null || _a === void 0 ? void 0 : _a.includes(0))) {
        errors.push('Invalid file - null bytes detected');
    }
    // Generate file hash for deduplication
    let fileHash;
    let sanitizedFilename;
    if (errors.length === 0) {
        // Generate SHA-256 hash of file content
        fileHash = crypto_1.default.createHash('sha256').update(file.buffer).digest('hex');
        // Generate sanitized filename
        const timestamp = Date.now();
        const randomSuffix = crypto_1.default.randomBytes(4).toString('hex');
        sanitizedFilename = `${timestamp}_${randomSuffix}${fileExtension}`;
    }
    return {
        isValid: errors.length === 0,
        errors,
        sanitizedFilename,
        fileHash,
    };
};
exports.validateUploadedFile = validateUploadedFile;
/**
 * Validate multiple document files
 */
const validateDocumentUpload = (files, requiredDocuments) => {
    var _a;
    const errors = [];
    const validatedFiles = {};
    // Check required documents
    if (requiredDocuments) {
        for (const docType of requiredDocuments) {
            const requirement = DOCUMENT_REQUIREMENTS[docType];
            if (requirement.required && (!files[docType] || files[docType].length === 0)) {
                errors.push(`${requirement.description} is required`);
            }
        }
    }
    // Validate each uploaded file
    for (const [fieldName, fileArray] of Object.entries(files)) {
        if (fileArray && fileArray.length > 0) {
            const file = fileArray[0]; // Take first file only
            const docType = fieldName;
            const validation = (0, exports.validateUploadedFile)(file, docType);
            validatedFiles[fieldName] = validation;
            if (!validation.isValid) {
                errors.push(`${((_a = DOCUMENT_REQUIREMENTS[docType]) === null || _a === void 0 ? void 0 : _a.description) || fieldName}: ${validation.errors.join(', ')}`);
            }
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
        validatedFiles,
    };
};
exports.validateDocumentUpload = validateDocumentUpload;
/**
 * Generate secure file path for user documents
 */
const generateSecureFilePath = (userId, documentType, sanitizedFilename) => {
    // Create user-scoped directory structure
    const userDir = userId.replace(/-/g, ''); // Remove hyphens for cleaner path
    const docTypeDir = documentType;
    return path_1.default.join('uploads', 'documents', userDir, docTypeDir, sanitizedFilename);
};
exports.generateSecureFilePath = generateSecureFilePath;
/**
 * Check if file content appears to be malicious
 */
const performBasicMalwareCheck = (file) => {
    const buffer = file.buffer;
    // Check for common malware signatures (basic check)
    const maliciousPatterns = [
        // Executable signatures
        Buffer.from([0x4d, 0x5a]), // MZ (PE executable)
        Buffer.from([0x7f, 0x45, 0x4c, 0x46]), // ELF executable
        // Script patterns
        Buffer.from('<?php', 'utf8'),
        Buffer.from('<script', 'utf8'),
        Buffer.from('javascript:', 'utf8'),
        Buffer.from('vbscript:', 'utf8'),
    ];
    for (const pattern of maliciousPatterns) {
        if (buffer.includes(pattern)) {
            logger_1.default.warn('Potential malicious file detected', {
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
            });
            return true;
        }
    }
    return false;
};
exports.performBasicMalwareCheck = performBasicMalwareCheck;
/**
 * Get document requirements for frontend
 */
const getDocumentRequirements = () => {
    return Object.entries(DOCUMENT_REQUIREMENTS).map(([type, req]) => ({
        type,
        required: req.required,
        allowedTypes: req.allowedTypes,
        maxSizeMB: req.maxSize / (1024 * 1024),
        description: req.description,
    }));
};
exports.getDocumentRequirements = getDocumentRequirements;
//# sourceMappingURL=documentValidation.service.js.map