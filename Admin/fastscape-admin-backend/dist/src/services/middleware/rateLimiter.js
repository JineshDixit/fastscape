"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenLimiter = exports.generalLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/**
 * Factory function to create a rate limiter
 */
const createLimiter = (max, message, windowMs = 15 * 60 * 1000) => (0, express_rate_limit_1.default)({
    windowMs,
    max,
    message: {
        success: false,
        message,
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Rate limiter for authentication endpoints
exports.authLimiter = createLimiter(10, 'Too many authentication attempts, please try again later.');
// Rate limiter for general API endpoints
exports.generalLimiter = createLimiter(100, 'Too many requests, please try again later.');
// Rate limiter for refresh token endpoint
exports.refreshTokenLimiter = createLimiter(10, 'Too many token refresh attempts, please try again later.');
//# sourceMappingURL=rateLimiter.js.map