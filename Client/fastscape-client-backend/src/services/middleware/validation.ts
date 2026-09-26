import { Request, Response, NextFunction } from 'express';
import { body, validationResult, query, param } from 'express-validator';
import { dbEnums } from '../../common/enum/dbEnums';

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])[^\s]{8,}$/;
const STRONG_PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include one uppercase letter, one lowercase letter, one number, and one special character (e.g. #, @, !). Spaces are not allowed.';

// Validation middleware to check for validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array();
    const firstErrorMessage = extractedErrors[0]?.msg;

    return res.status(400).json({
      success: false,
      message: typeof firstErrorMessage === 'string' ? firstErrorMessage : 'Validation failed',
      errors: extractedErrors,
    });
  }
  next();
};

// Registration validation rules
export const validateRegistration = [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),

  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),

  body('password')
    .matches(STRONG_PASSWORD_REGEX)
    .withMessage(STRONG_PASSWORD_MESSAGE),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/)
    .withMessage('Please provide a valid phone number'),

  body('nationality')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nationality must be between 2 and 100 characters'),

  body('dateOfBirth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        throw new Error('You must be at least 18 years old');
      }
      return true;
    }),

  body('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),

  body('state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),

  body('zipCode')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Zip code must be between 3 and 20 characters'),

  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),

  handleValidationErrors,
];

// Login validation rules
export const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),

  body('password').notEmpty().withMessage('Password is required'),

  handleValidationErrors,
];

// Refresh token validation rules
export const validateRefreshToken = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),

  handleValidationErrors,
];

// Update user profile validation rules
export const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('phone')
    .optional()
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Please provide a valid phone number'),

  body('nationality')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nationality must be between 2 and 100 characters'),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      if (value) {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) {
          throw new Error('You must be at least 18 years old');
        }
      }
      return true;
    }),

  body('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),

  body('state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),

  body('zipCode')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Zip code must be between 3 and 20 characters'),

  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be between 2 and 100 characters'),

  // Driving info validation
  body('licenseIssuingCountry')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('License issuing country must be between 2 and 100 characters'),

  body('licenseExpiryDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid license expiry date')
    .custom((value) => {
      if (value) {
        const expiryDate = new Date(value);
        const today = new Date();
        if (expiryDate <= today) {
          throw new Error('License expiry date must be in the future');
        }
      }
      return true;
    }),

  body('drivingExperienceYears')
    .optional()
    .isInt({ min: 0, max: 80 })
    .withMessage('Driving experience must be between 0 and 80 years'),

  body('visaStatus').optional().isIn(['Resident', 'Tourist', 'Visit']).withMessage('Invalid visa status'),

  handleValidationErrors,
];

export const validateForgotPassword = [
  body('email').isEmail().withMessage('Valid email is required'),
  handleValidationErrors,
];

export const validateVerifyOtp = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  handleValidationErrors,
];

export const validateResetPassword = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword')
    .matches(STRONG_PASSWORD_REGEX)
    .withMessage(
      'New password must be at least 8 characters and include one uppercase letter, one lowercase letter, one number, and one special character (e.g. #, @, !). Spaces are not allowed.',
    ),
  handleValidationErrors,
];

export const validateContactUs = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 7, max: 20 })
    .withMessage('Phone number must be between 7 and 20 characters')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Please provide a valid phone number'),

  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Message must be between 10 and 5000 characters'),

  handleValidationErrors,
];

export const vehicleQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .isIn(['make', 'model', 'year', 'pricePerDay', 'createdAt', 'updatedAt'])
    .withMessage('sortBy must be one of: make, model, year, pricePerDay, createdAt, updatedAt'),

  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('sortOrder must be ASC or DESC'),

  query('bodyType')
    .optional()
    .isIn(dbEnums.VEHICLE_BODY_TYPE)
    .withMessage(`Body type must be one of: ${dbEnums.VEHICLE_BODY_TYPE.join(', ')}`),

  query('transmission')
    .optional()
    .isIn(dbEnums.TRANSMISSION_TYPE)
    .withMessage(`Transmission must be one of: ${dbEnums.TRANSMISSION_TYPE.join(', ')}`),

  query('fuelType')
    .optional()
    .isIn(dbEnums.FUEL_TYPE)
    .withMessage(`Fuel type must be one of: ${dbEnums.FUEL_TYPE.join(', ')}`),

  query('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),

  query('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice must be a non-negative number'),

  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice must be a non-negative number'),

  query('year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 2 })
    .withMessage(`Year must be between 1900 and ${new Date().getFullYear() + 2}`),

  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
];

export const vehicleIdValidation = [param('id').isUUID().withMessage('Vehicle ID must be a valid UUID')];
