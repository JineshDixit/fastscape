import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { validateDocumentUpload, performBasicMalwareCheck } from '../document/documentValidation.service';
import { createError } from './errorHandler';
import Logger from '../../utils/logger';

// Configure multer for memory storage (we'll validate before saving to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 5, // Maximum 5 files per request
  },
  fileFilter: (req, file, cb) => {
    // Basic file type check (will be validated more thoroughly later)
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png', 
      'image/webp',
      'application/pdf'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  },
});

// Multer error handler
export const handleMulterError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return next(createError('File size exceeds 5MB limit', 400));
      case 'LIMIT_FILE_COUNT':
        return next(createError('Too many files uploaded (maximum 5)', 400));
      case 'LIMIT_UNEXPECTED_FILE':
        return next(createError('Unexpected file field', 400));
      default:
        return next(createError(`Upload error: ${error.message}`, 400));
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return next(createError(error.message, 400));
  }
  
  next(error);
};

// Document upload middleware
export const uploadDocuments = upload.fields([
  { name: 'driverLicenseFront', maxCount: 1 },
  { name: 'driverLicenseBack', maxCount: 1 },
  { name: 'passportPhoto', maxCount: 1 },
  { name: 'internationalDrivingPermit', maxCount: 1 },
  { name: 'selfieWithLicense', maxCount: 1 },
]);

// Validation middleware (use after multer)
export const validateDocuments = (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    if (!files || Object.keys(files).length === 0) {
      return next(createError('No files uploaded', 400));
    }

    // Perform malware check on all files
    for (const [fieldName, fileArray] of Object.entries(files)) {
      if (fileArray && fileArray.length > 0) {
        const file = fileArray[0];
        
        if (performBasicMalwareCheck(file)) {
          Logger.warn('Malicious file detected and blocked', {
            fieldName,
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          });
          return next(createError('File appears to contain malicious content', 400));
        }
      }
    }

    // Validate documents
    const validation = validateDocumentUpload(files);
    
    if (!validation.isValid) {
      return next(createError(`Document validation failed: ${validation.errors.join(', ')}`, 400));
    }

    // Attach validation results to request for use in controller
    req.documentValidation = validation;
    
    next();
  } catch (error) {
    Logger.error('Document validation middleware error', { error });
    next(createError('Document validation failed', 500));
  }
};

// Rate limiting for document uploads (stricter than general API)
import rateLimit from 'express-rate-limit';

export const documentUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 document upload requests per windowMs
  message: {
    error: 'Too many document upload attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      documentValidation?: {
        isValid: boolean;
        errors: string[];
        validatedFiles: Record<string, any>;
      };
    }
  }
}