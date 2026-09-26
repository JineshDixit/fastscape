"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehicleIdValidation = exports.vehicleQueryValidation = exports.validateResetPassword = exports.validateVerifyOtp = exports.validateForgotPassword = exports.validateUserUpdate = exports.validateRefreshToken = exports.validateLogin = exports.validateRegistration = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const dbEnums_1 = require("../../common/enum/dbEnums");
// Validation middleware to check for validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array(),
        });
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
// Registration validation rules
exports.validateRegistration = [
    (0, express_validator_1.body)('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    (0, express_validator_1.body)('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .isLength({ min: 10, max: 20 })
        .withMessage('Phone number must be between 10 and 20 characters')
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/)
        .withMessage('Please provide a valid phone number'),
    (0, express_validator_1.body)('nationality')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nationality must be between 2 and 100 characters'),
    (0, express_validator_1.body)('dateOfBirth')
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
    (0, express_validator_1.body)('city')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters'),
    (0, express_validator_1.body)('state')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('State must be between 2 and 100 characters'),
    (0, express_validator_1.body)('zipCode')
        .optional()
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Zip code must be between 3 and 20 characters'),
    (0, express_validator_1.body)('country')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Country must be between 2 and 100 characters'),
    exports.handleValidationErrors,
];
// Login validation rules
exports.validateLogin = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
    exports.handleValidationErrors,
];
// Refresh token validation rules
exports.validateRefreshToken = [
    (0, express_validator_1.body)('refreshToken').notEmpty().withMessage('Refresh token is required'),
    exports.handleValidationErrors,
];
// Update user profile validation rules
exports.validateUserUpdate = [
    (0, express_validator_1.body)('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    (0, express_validator_1.body)('phone')
        .optional()
        .trim()
        .isLength({ min: 10, max: 20 })
        .withMessage('Phone number must be between 10 and 20 characters')
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
        .withMessage('Please provide a valid phone number'),
    (0, express_validator_1.body)('nationality')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nationality must be between 2 and 100 characters'),
    (0, express_validator_1.body)('dateOfBirth')
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
    (0, express_validator_1.body)('city')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('City must be between 2 and 100 characters'),
    (0, express_validator_1.body)('state')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('State must be between 2 and 100 characters'),
    (0, express_validator_1.body)('zipCode')
        .optional()
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('Zip code must be between 3 and 20 characters'),
    (0, express_validator_1.body)('country')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Country must be between 2 and 100 characters'),
    // Driving info validation
    (0, express_validator_1.body)('licenseIssuingCountry')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('License issuing country must be between 2 and 100 characters'),
    (0, express_validator_1.body)('licenseExpiryDate')
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
    (0, express_validator_1.body)('drivingExperienceYears')
        .optional()
        .isInt({ min: 0, max: 80 })
        .withMessage('Driving experience must be between 0 and 80 years'),
    (0, express_validator_1.body)('visaStatus').optional().isIn(['Resident', 'Tourist', 'Visit']).withMessage('Invalid visa status'),
    exports.handleValidationErrors,
];
exports.validateForgotPassword = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    exports.handleValidationErrors,
];
exports.validateVerifyOtp = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    exports.handleValidationErrors,
];
exports.validateResetPassword = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    (0, express_validator_1.body)('newPassword').isLength({ min: 6 }).withMessage('New Password must be at least 6 characters long'),
    exports.handleValidationErrors,
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
];
exports.vehicleIdValidation = [(0, express_validator_1.param)('id').isUUID().withMessage('Vehicle ID must be a valid UUID')];
//# sourceMappingURL=validation.js.map