"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRefreshToken = exports.validateLogin = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
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
//# sourceMappingURL=validation.js.map