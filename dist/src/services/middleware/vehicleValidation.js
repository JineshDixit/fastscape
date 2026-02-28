"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehicleQueryValidation = exports.bulkUpdateAvailabilityValidation = exports.vehicleIdValidation = exports.updateVehicleValidation = exports.createVehicleValidation = void 0;
const express_validator_1 = require("express-validator");
const dbEnums_1 = require("../../common/enum/dbEnums");
exports.createVehicleValidation = [
    (0, express_validator_1.body)('make')
        .notEmpty()
        .withMessage('Make is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('Make must be between 1 and 50 characters'),
    (0, express_validator_1.body)('model')
        .notEmpty()
        .withMessage('Model is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('Model must be between 1 and 50 characters'),
    (0, express_validator_1.body)('trim').optional().isLength({ max: 50 }).withMessage('Trim must be less than 50 characters'),
    (0, express_validator_1.body)('year')
        .isInt({ min: 1900, max: new Date().getFullYear() + 2 })
        .withMessage(`Year must be between 1900 and ${new Date().getFullYear() + 2}`),
    (0, express_validator_1.body)('exteriorColor')
        .notEmpty()
        .withMessage('Exterior color is required')
        .isLength({ min: 1, max: 30 })
        .withMessage('Exterior color must be between 1 and 30 characters'),
    (0, express_validator_1.body)('interiorColor')
        .notEmpty()
        .withMessage('Interior color is required')
        .isLength({ min: 1, max: 30 })
        .withMessage('Interior color must be between 1 and 30 characters'),
    (0, express_validator_1.body)('bodyType')
        .isIn(dbEnums_1.dbEnums.VEHICLE_BODY_TYPE)
        .withMessage(`Body type must be one of: ${dbEnums_1.dbEnums.VEHICLE_BODY_TYPE.join(', ')}`),
    (0, express_validator_1.body)('transmission')
        .isIn(dbEnums_1.dbEnums.TRANSMISSION_TYPE)
        .withMessage(`Transmission must be one of: ${dbEnums_1.dbEnums.TRANSMISSION_TYPE.join(', ')}`),
    (0, express_validator_1.body)('drivetrain')
        .isIn(dbEnums_1.dbEnums.DRIVETRAIN_TYPE)
        .withMessage(`Drivetrain must be one of: ${dbEnums_1.dbEnums.DRIVETRAIN_TYPE.join(', ')}`),
    (0, express_validator_1.body)('engine')
        .notEmpty()
        .withMessage('Engine is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Engine must be between 1 and 100 characters'),
    (0, express_validator_1.body)('horsepower').isInt({ min: 50, max: 2000 }).withMessage('Horsepower must be between 50 and 2000'),
    (0, express_validator_1.body)('fuelType')
        .isIn(dbEnums_1.dbEnums.FUEL_TYPE)
        .withMessage(`Fuel type must be one of: ${dbEnums_1.dbEnums.FUEL_TYPE.join(', ')}`),
    (0, express_validator_1.body)('fuelConsumption')
        .notEmpty()
        .withMessage('Fuel consumption is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('Fuel consumption must be between 1 and 50 characters'),
    (0, express_validator_1.body)('pricePerDay').isFloat({ min: 0.01 }).withMessage('Price per day must be a positive number'),
    (0, express_validator_1.body)('delayChargePerHour')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Delay charge per hour must be a non-negative number'),
    (0, express_validator_1.body)('depositPercentage')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Deposit percentage must be between 0 and 100'),
    (0, express_validator_1.body)('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-character code'),
    (0, express_validator_1.body)('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
    (0, express_validator_1.body)('passengerCapacity')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Passenger capacity must be between 1 and 100'),
    (0, express_validator_1.body)('city').optional().isLength({ min: 1, max: 100 }).withMessage('City must be between 1 and 100 characters'),
];
exports.updateVehicleValidation = [
    (0, express_validator_1.param)('id').isUUID().withMessage('Vehicle ID must be a valid UUID'),
    (0, express_validator_1.body)('make').optional().isLength({ min: 1, max: 50 }).withMessage('Make must be between 1 and 50 characters'),
    (0, express_validator_1.body)('model').optional().isLength({ min: 1, max: 50 }).withMessage('Model must be between 1 and 50 characters'),
    (0, express_validator_1.body)('trim').optional().isLength({ max: 50 }).withMessage('Trim must be less than 50 characters'),
    (0, express_validator_1.body)('year')
        .optional()
        .isInt({ min: 1900, max: new Date().getFullYear() + 2 })
        .withMessage(`Year must be between 1900 and ${new Date().getFullYear() + 2}`),
    (0, express_validator_1.body)('exteriorColor')
        .optional()
        .isLength({ min: 1, max: 30 })
        .withMessage('Exterior color must be between 1 and 30 characters'),
    (0, express_validator_1.body)('interiorColor')
        .optional()
        .isLength({ min: 1, max: 30 })
        .withMessage('Interior color must be between 1 and 30 characters'),
    (0, express_validator_1.body)('bodyType')
        .optional()
        .isIn(dbEnums_1.dbEnums.VEHICLE_BODY_TYPE)
        .withMessage(`Body type must be one of: ${dbEnums_1.dbEnums.VEHICLE_BODY_TYPE.join(', ')}`),
    (0, express_validator_1.body)('transmission')
        .optional()
        .isIn(dbEnums_1.dbEnums.TRANSMISSION_TYPE)
        .withMessage(`Transmission must be one of: ${dbEnums_1.dbEnums.TRANSMISSION_TYPE.join(', ')}`),
    (0, express_validator_1.body)('drivetrain')
        .optional()
        .isIn(dbEnums_1.dbEnums.DRIVETRAIN_TYPE)
        .withMessage(`Drivetrain must be one of: ${dbEnums_1.dbEnums.DRIVETRAIN_TYPE.join(', ')}`),
    (0, express_validator_1.body)('engine').optional().isLength({ min: 1, max: 100 }).withMessage('Engine must be between 1 and 100 characters'),
    (0, express_validator_1.body)('horsepower').optional().isInt({ min: 50, max: 2000 }).withMessage('Horsepower must be between 50 and 2000'),
    (0, express_validator_1.body)('fuelType')
        .optional()
        .isIn(dbEnums_1.dbEnums.FUEL_TYPE)
        .withMessage(`Fuel type must be one of: ${dbEnums_1.dbEnums.FUEL_TYPE.join(', ')}`),
    (0, express_validator_1.body)('fuelConsumption')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('Fuel consumption must be between 1 and 50 characters'),
    (0, express_validator_1.body)('pricePerDay').optional().isFloat({ min: 0.01 }).withMessage('Price per day must be a positive number'),
    (0, express_validator_1.body)('delayChargePerHour')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Delay charge per hour must be a non-negative number'),
    (0, express_validator_1.body)('depositPercentage')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Deposit percentage must be between 0 and 100'),
    (0, express_validator_1.body)('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-character code'),
    (0, express_validator_1.body)('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
    (0, express_validator_1.body)('passengerCapacity')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Passenger capacity must be between 1 and 100'),
    (0, express_validator_1.body)('city').optional().isLength({ min: 1, max: 100 }).withMessage('City must be between 1 and 100 characters'),
];
exports.vehicleIdValidation = [(0, express_validator_1.param)('id').isUUID().withMessage('Vehicle ID must be a valid UUID')];
exports.bulkUpdateAvailabilityValidation = [
    (0, express_validator_1.body)('vehicleIds').isArray({ min: 1 }).withMessage('vehicleIds must be a non-empty array'),
    (0, express_validator_1.body)('vehicleIds.*').isUUID().withMessage('Each vehicle ID must be a valid UUID'),
    (0, express_validator_1.body)('isAvailable').isBoolean().withMessage('isAvailable must be a boolean'),
];
exports.vehicleQueryValidation = [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('sortBy')
        .optional()
        .isIn(['make', 'model', 'year', 'pricePerDay', 'createdAt', 'updatedAt'])
        .withMessage('sortBy must be one of: make, model, year, pricePerDay, createdAt, updatedAt'),
    (0, express_validator_1.query)('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('sortOrder must be ASC or DESC'),
    (0, express_validator_1.query)('bodyType')
        .optional()
        .isIn(dbEnums_1.dbEnums.VEHICLE_BODY_TYPE)
        .withMessage(`Body type must be one of: ${dbEnums_1.dbEnums.VEHICLE_BODY_TYPE.join(', ')}`),
    (0, express_validator_1.query)('transmission')
        .optional()
        .isIn(dbEnums_1.dbEnums.TRANSMISSION_TYPE)
        .withMessage(`Transmission must be one of: ${dbEnums_1.dbEnums.TRANSMISSION_TYPE.join(', ')}`),
    (0, express_validator_1.query)('fuelType')
        .optional()
        .isIn(dbEnums_1.dbEnums.FUEL_TYPE)
        .withMessage(`Fuel type must be one of: ${dbEnums_1.dbEnums.FUEL_TYPE.join(', ')}`),
    (0, express_validator_1.query)('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
    (0, express_validator_1.query)('minPrice').optional().isFloat({ min: 0 }).withMessage('minPrice must be a non-negative number'),
    (0, express_validator_1.query)('maxPrice').optional().isFloat({ min: 0 }).withMessage('maxPrice must be a non-negative number'),
    (0, express_validator_1.query)('year')
        .optional()
        .isInt({ min: 1900, max: new Date().getFullYear() + 2 })
        .withMessage(`Year must be between 1900 and ${new Date().getFullYear() + 2}`),
    (0, express_validator_1.query)('search')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search term must be between 1 and 100 characters'),
    (0, express_validator_1.query)('city').optional().isLength({ min: 1, max: 100 }).withMessage('City must be between 1 and 100 characters'),
    (0, express_validator_1.query)('passengerCapacity').optional().isInt({ min: 1 }).withMessage('Passenger capacity must be a positive integer'),
];
//# sourceMappingURL=vehicleValidation.js.map