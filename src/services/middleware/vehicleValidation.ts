import { body, param, query } from 'express-validator';
import { dbEnums } from '../../common/enum/dbEnums';

export const createVehicleValidation = [
  body('make')
    .notEmpty()
    .withMessage('Make is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Make must be between 1 and 50 characters'),

  body('model')
    .notEmpty()
    .withMessage('Model is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Model must be between 1 and 50 characters'),

  body('trim')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Trim must be less than 50 characters'),

  body('year')
    .isInt({ min: 1900, max: new Date().getFullYear() + 2 })
    .withMessage(`Year must be between 1900 and ${new Date().getFullYear() + 2}`),

  body('exteriorColor')
    .notEmpty()
    .withMessage('Exterior color is required')
    .isLength({ min: 1, max: 30 })
    .withMessage('Exterior color must be between 1 and 30 characters'),

  body('interiorColor')
    .notEmpty()
    .withMessage('Interior color is required')
    .isLength({ min: 1, max: 30 })
    .withMessage('Interior color must be between 1 and 30 characters'),

  body('bodyType')
    .isIn(dbEnums.VEHICLE_BODY_TYPE)
    .withMessage(`Body type must be one of: ${dbEnums.VEHICLE_BODY_TYPE.join(', ')}`),

  body('transmission')
    .isIn(dbEnums.TRANSMISSION_TYPE)
    .withMessage(`Transmission must be one of: ${dbEnums.TRANSMISSION_TYPE.join(', ')}`),

  body('drivetrain')
    .isIn(dbEnums.DRIVETRAIN_TYPE)
    .withMessage(`Drivetrain must be one of: ${dbEnums.DRIVETRAIN_TYPE.join(', ')}`),

  body('engine')
    .notEmpty()
    .withMessage('Engine is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Engine must be between 1 and 100 characters'),

  body('horsepower')
    .isInt({ min: 50, max: 2000 })
    .withMessage('Horsepower must be between 50 and 2000'),

  body('fuelType')
    .isIn(dbEnums.FUEL_TYPE)
    .withMessage(`Fuel type must be one of: ${dbEnums.FUEL_TYPE.join(', ')}`),

  body('fuelConsumption')
    .notEmpty()
    .withMessage('Fuel consumption is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Fuel consumption must be between 1 and 50 characters'),

  body('pricePerDay')
    .isFloat({ min: 0.01 })
    .withMessage('Price per day must be a positive number'),

  body('delayChargePerHour')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Delay charge per hour must be a non-negative number'),

  body('depositPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Deposit percentage must be between 0 and 100'),

  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-character code'),

  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean'),

  body('city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),
];

export const updateVehicleValidation = [
  param('id')
    .isUUID()
    .withMessage('Vehicle ID must be a valid UUID'),

  body('make')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Make must be between 1 and 50 characters'),

  body('model')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Model must be between 1 and 50 characters'),

  body('trim')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Trim must be less than 50 characters'),

  body('year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() + 2 })
    .withMessage(`Year must be between 1900 and ${new Date().getFullYear() + 2}`),

  body('exteriorColor')
    .optional()
    .isLength({ min: 1, max: 30 })
    .withMessage('Exterior color must be between 1 and 30 characters'),

  body('interiorColor')
    .optional()
    .isLength({ min: 1, max: 30 })
    .withMessage('Interior color must be between 1 and 30 characters'),

  body('bodyType')
    .optional()
    .isIn(dbEnums.VEHICLE_BODY_TYPE)
    .withMessage(`Body type must be one of: ${dbEnums.VEHICLE_BODY_TYPE.join(', ')}`),

  body('transmission')
    .optional()
    .isIn(dbEnums.TRANSMISSION_TYPE)
    .withMessage(`Transmission must be one of: ${dbEnums.TRANSMISSION_TYPE.join(', ')}`),

  body('drivetrain')
    .optional()
    .isIn(dbEnums.DRIVETRAIN_TYPE)
    .withMessage(`Drivetrain must be one of: ${dbEnums.DRIVETRAIN_TYPE.join(', ')}`),

  body('engine')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Engine must be between 1 and 100 characters'),

  body('horsepower')
    .optional()
    .isInt({ min: 50, max: 2000 })
    .withMessage('Horsepower must be between 50 and 2000'),

  body('fuelType')
    .optional()
    .isIn(dbEnums.FUEL_TYPE)
    .withMessage(`Fuel type must be one of: ${dbEnums.FUEL_TYPE.join(', ')}`),

  body('fuelConsumption')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Fuel consumption must be between 1 and 50 characters'),

  body('pricePerDay')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Price per day must be a positive number'),

  body('delayChargePerHour')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Delay charge per hour must be a non-negative number'),

  body('depositPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Deposit percentage must be between 0 and 100'),

  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-character code'),

  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean'),

  body('city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),
];

export const vehicleIdValidation = [
  param('id')
    .isUUID()
    .withMessage('Vehicle ID must be a valid UUID'),
];

export const bulkUpdateAvailabilityValidation = [
  body('vehicleIds')
    .isArray({ min: 1 })
    .withMessage('vehicleIds must be a non-empty array'),

  body('vehicleIds.*')
    .isUUID()
    .withMessage('Each vehicle ID must be a valid UUID'),

  body('isAvailable')
    .isBoolean()
    .withMessage('isAvailable must be a boolean'),
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

  query('city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),
];