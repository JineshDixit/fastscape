"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.notFoundHandler = exports.errorHandler = void 0;
require("../../config/env/envConfig");
const logger_1 = __importDefault(require("../../config/logger"));
/**
 * Global error handler middleware
 */
const errorHandler = (error, req, res, next) => {
    let { statusCode = 500, message } = error;
    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && !error.isOperational) {
        message = 'Something went wrong';
    }
    // Log error with full context
    logger_1.default.error('Request error', {
        message: error.message,
        statusCode,
        isOperational: error.isOperational,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        stack: error.stack,
    });
    res.status(statusCode).json(Object.assign({ success: false, message }, (process.env.NODE_ENV === 'development' && { stack: error.stack })));
};
exports.errorHandler = errorHandler;
/**
 * Handle 404 errors
 */
const notFoundHandler = (req, res) => {
    logger_1.default.warn('Route not found', {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
    });
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
};
exports.notFoundHandler = notFoundHandler;
/**
 * Create operational error
 */
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
//# sourceMappingURL=errorHandler.js.map