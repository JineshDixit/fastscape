import { Request, Response, NextFunction } from 'express';
import { body, validationResult, query, param } from 'express-validator';
import { dbEnums } from '../../common/enum/dbEnums';

// Validation middleware to check for validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Registration validation rules
export const validateRegistration = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Full name must be between 2 and 150 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
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

  body('homeAddress')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Home address must be between 10 and 500 characters'),

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
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors,
];

// Refresh token validation rules
export const validateRefreshToken = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  
  handleValidationErrors,
];

// Update user profile validation rules
export const validateUserUpdate = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Full name must be between 2 and 150 characters'),

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

  body('homeAddress')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Home address must be between 10 and 500 characters'),

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

export const vehicleQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sortBy')
    .optional()
    .isIn(['make', 'model', 'year', 'pricePerDay', 'createdAt', 'updatedAt'])
    .withMessage('sortBy must be one of: make, model, year, pricePerDay, createdAt, updatedAt'),

  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('sortOrder must be ASC or DESC'),

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

  query('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean'),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('minPrice must be a non-negative number'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('maxPrice must be a non-negative number'),

  query('year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 2 })
    .withMessage(`Year must be between 1900 and ${new Date().getFullYear() + 2}`),

  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
];

export const vehicleIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Vehicle ID must be a valid UUID'),
];