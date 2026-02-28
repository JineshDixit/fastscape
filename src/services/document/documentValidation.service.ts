import Logger from '../../utils/logger';
import crypto from 'crypto';
import path from 'path';

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
} as const;

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
} as const;

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedFilename?: string;
  fileHash?: string;
}

/**
 * Validate uploaded file
 */
export const validateUploadedFile = (
  file: Express.Multer.File,
  documentType: keyof typeof DOCUMENT_REQUIREMENTS,
): FileValidationResult => {
  const errors: string[] = [];
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
  if (!requirements.allowedTypes.includes(file.mimetype as any)) {
    errors.push(`Invalid file type. Allowed types: ${requirements.allowedTypes.join(', ')}`);
  }

  // Check file extension matches MIME type
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype as keyof typeof ALLOWED_FILE_TYPES;
  const allowedExtensions = ALLOWED_FILE_TYPES[mimeType];

  if (!allowedExtensions) {
    errors.push(`Unsupported MIME type: ${file.mimetype}`);
  } else {
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
  if (file.originalname.includes('\0') || file.buffer?.includes(0)) {
    errors.push('Invalid file - null bytes detected');
  }

  // Generate file hash for deduplication
  let fileHash: string | undefined;
  let sanitizedFilename: string | undefined;

  if (errors.length === 0) {
    // Generate SHA-256 hash of file content
    fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Generate sanitized filename
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    sanitizedFilename = `${timestamp}_${randomSuffix}${fileExtension}`;
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedFilename,
    fileHash,
  };
};

/**
 * Validate multiple document files
 */
export const validateDocumentUpload = (
  files: { [fieldname: string]: Express.Multer.File[] },
  requiredDocuments?: (keyof typeof DOCUMENT_REQUIREMENTS)[],
): { isValid: boolean; errors: string[]; validatedFiles: Record<string, FileValidationResult> } => {
  const errors: string[] = [];
  const validatedFiles: Record<string, FileValidationResult> = {};

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
      const docType = fieldName as keyof typeof DOCUMENT_REQUIREMENTS;

      const validation = validateUploadedFile(file, docType);
      validatedFiles[fieldName] = validation;

      if (!validation.isValid) {
        errors.push(`${DOCUMENT_REQUIREMENTS[docType]?.description || fieldName}: ${validation.errors.join(', ')}`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    validatedFiles,
  };
};

/**
 * Generate secure file path for user documents
 */
export const generateSecureFilePath = (
  userId: string,
  documentType: keyof typeof DOCUMENT_REQUIREMENTS,
  sanitizedFilename: string,
): string => {
  // Create user-scoped directory structure
  const userDir = userId.replace(/-/g, ''); // Remove hyphens for cleaner path
  const docTypeDir = documentType;

  return path.join('uploads', 'documents', userDir, docTypeDir, sanitizedFilename);
};

/**
 * Check if file content appears to be malicious
 */
export const performBasicMalwareCheck = (file: Express.Multer.File): boolean => {
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
      Logger.warn('Potential malicious file detected', {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });
      return true;
    }
  }

  return false;
};

/**
 * Get document requirements for frontend
 */
export const getDocumentRequirements = () => {
  return Object.entries(DOCUMENT_REQUIREMENTS).map(([type, req]) => ({
    type,
    required: req.required,
    allowedTypes: req.allowedTypes,
    maxSizeMB: req.maxSize / (1024 * 1024),
    description: req.description,
  }));
};
