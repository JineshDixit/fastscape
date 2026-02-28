"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenLimiter = exports.generalLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Factory function to create rate limiters
const createRateLimiter = (options) => {
    return (0, express_rate_limit_1.default)(Object.assign(Object.assign({ windowMs: 15 * 60 * 1000, standardHeaders: true, legacyHeaders: false }, options), { message: {
            success: false,
            message: options.messageStr,
        } }));
};
// Rate limiter for authentication endpoints
exports.authLimiter = createRateLimiter({
    max: 500,
    messageStr: 'Too many authentication attempts, please try again later.',
});
// Rate limiter for general API endpoints
exports.generalLimiter = createRateLimiter({
    max: 500,
    messageStr: 'Too many requests, please try again later.',
});
// Rate limiter for refresh token endpoint
exports.refreshTokenLimiter = createRateLimiter({
    max: 100,
    messageStr: 'Too many token refresh attempts, please try again later.',
});
//# sourceMappingURL=rateLimiter.js.map