"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.notFoundHandler = exports.errorHandler = void 0;
require("../../config/env/envConfig");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Handle Sequelize validation errors
 */
const handleSequelizeError = (error) => {
    var _a;
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map((err) => err.message);
        return (0, exports.createError)(`Validation error: ${messages.join(', ')}`, 400, 'VALIDATION_ERROR');
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
        const field = ((_a = error.errors[0]) === null || _a === void 0 ? void 0 : _a.path) || 'field';
        return (0, exports.createError)(`${field} already exists`, 409, 'DUPLICATE_ERROR');
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        return (0, exports.createError)('Referenced record does not exist', 400, 'FOREIGN_KEY_ERROR');
    }
    if (error.name === 'SequelizeOptimisticLockError') {
        return (0, exports.createError)('Record was modified by another user. Please refresh and try again.', 409, 'OPTIMISTIC_LOCK_ERROR');
    }
    if (error.name === 'SequelizeTimeoutError') {
        return (0, exports.createError)('Database operation timed out', 408, 'TIMEOUT_ERROR');
    }
    return (0, exports.createError)('Database error occurred', 500, 'DATABASE_ERROR', error.message);
};
/**
 * Handle JWT errors
 */
const handleJWTError = (error) => {
    if (error.name === 'JsonWebTokenError') {
        return (0, exports.createError)('Invalid token', 401, 'INVALID_TOKEN');
    }
    if (error.name === 'TokenExpiredError') {
        return (0, exports.createError)('Token expired', 401, 'TOKEN_EXPIRED');
    }
    return (0, exports.createError)('Authentication error', 401, 'AUTH_ERROR');
};
/**
 * Global error handling middleware
 */
const errorHandler = (error, req, res, next) => {
    var _a, _b, _c;
    let processedError;
    // Handle different types of errors
    if ((_a = error.name) === null || _a === void 0 ? void 0 : _a.startsWith('Sequelize')) {
        processedError = handleSequelizeError(error);
    }
    else if (((_b = error.name) === null || _b === void 0 ? void 0 : _b.includes('JsonWebToken')) || error.name === 'TokenExpiredError') {
        processedError = handleJWTError(error);
    }
    else if (error.isOperational) {
        processedError = error;
    }
    else {
        // Unhandled error
        processedError = (0, exports.createError)('Internal server error', 500, 'INTERNAL_ERROR');
    }
    let { statusCode = 500, message } = processedError;
    // If status code is 500, change message to generic error for production users
    if (statusCode === 500 && process.env.NODE_ENV === 'production' && !processedError.isOperational) {
        message = 'Something went wrong on the server';
    }
    // Log error details
    const errorLog = {
        message: processedError.message,
        statusCode: processedError.statusCode,
        code: processedError.code,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (_c = req.user) === null || _c === void 0 ? void 0 : _c.id,
        timestamp: new Date().toISOString(),
    };
    if (statusCode >= 500) {
        logger_1.default.error('Server error occurred', errorLog);
    }
    else {
        logger_1.default.warn('Client error occurred', errorLog);
    }
    // Send error response
    const response = {
        success: false,
        message,
        code: processedError.code,
    };
    // Include details in development
    if (process.env.NODE_ENV === 'development') {
        response.details = processedError.details;
        response.stack = error.stack;
    }
    // Include error ID for tracking
    response.errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
/**
 * Handle 404 errors
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        code: 'NOT_FOUND',
    });
};
exports.notFoundHandler = notFoundHandler;
/**
 * Create operational error
 */
const createError = (message, statusCode = 500, code, details) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    error.code = code;
    error.details = details;
    return error;
};
exports.createError = createError;
//# sourceMappingURL=errorHandler.js.map