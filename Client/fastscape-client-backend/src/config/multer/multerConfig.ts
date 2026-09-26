import multer from 'multer';

// Allowed image types
const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Maximum file size (5MB)
const maxFileSize = 5 * 1024 * 1024;

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

// Memory storage configuration (we'll handle file saving manually)
const storage = multer.memoryStorage();

// User identity document upload configuration
export const userIdentityDocUpload = multer({
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
export const singleImageUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 1,
  },
}).single('image');

// Multiple images upload (up to 10 files)
export const multipleImageUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 10,
  },
}).array('images', 10);

// Error handling middleware for multer
export const handleMulterError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
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
