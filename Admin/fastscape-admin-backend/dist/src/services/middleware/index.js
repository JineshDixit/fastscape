"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenLimiter = exports.generalLimiter = exports.authLimiter = exports.handleValidationErrors = exports.sanitizeInput = exports.preventParameterPollution = exports.securityHeaders = exports.createError = exports.notFoundHandler = exports.errorHandler = exports.requireActiveUser = exports.requireOwnershipOrRole = exports.requireAllPermissions = exports.requireAnyPermission = exports.requirePermission = exports.requireAnyRole = exports.requireRole = exports.authenticateUser = void 0;
// Authentication middleware
var authenticateUser_1 = require("./authenticateUser");
Object.defineProperty(exports, "authenticateUser", { enumerable: true, get: function () { return authenticateUser_1.authenticateUser; } });
// Authorization middleware
var authorization_1 = require("./authorization");
Object.defineProperty(exports, "requireRole", { enumerable: true, get: function () { return authorization_1.requireRole; } });
Object.defineProperty(exports, "requireAnyRole", { enumerable: true, get: function () { return authorization_1.requireAnyRole; } });
Object.defineProperty(exports, "requirePermission", { enumerable: true, get: function () { return authorization_1.requirePermission; } });
Object.defineProperty(exports, "requireAnyPermission", { enumerable: true, get: function () { return authorization_1.requireAnyPermission; } });
Object.defineProperty(exports, "requireAllPermissions", { enumerable: true, get: function () { return authorization_1.requireAllPermissions; } });
Object.defineProperty(exports, "requireOwnershipOrRole", { enumerable: true, get: function () { return authorization_1.requireOwnershipOrRole; } });
Object.defineProperty(exports, "requireActiveUser", { enumerable: true, get: function () { return authorization_1.requireActiveUser; } });
// Error handling middleware
var errorHandler_1 = require("./errorHandler");
Object.defineProperty(exports, "errorHandler", { enumerable: true, get: function () { return errorHandler_1.errorHandler; } });
Object.defineProperty(exports, "notFoundHandler", { enumerable: true, get: function () { return errorHandler_1.notFoundHandler; } });
Object.defineProperty(exports, "createError", { enumerable: true, get: function () { return errorHandler_1.createError; } });
// Security middleware
var security_1 = require("./security");
Object.defineProperty(exports, "securityHeaders", { enumerable: true, get: function () { return security_1.securityHeaders; } });
Object.defineProperty(exports, "preventParameterPollution", { enumerable: true, get: function () { return security_1.preventParameterPollution; } });
Object.defineProperty(exports, "sanitizeInput", { enumerable: true, get: function () { return security_1.sanitizeInput; } });
// Validation middleware
var validation_1 = require("./validation");
Object.defineProperty(exports, "handleValidationErrors", { enumerable: true, get: function () { return validation_1.handleValidationErrors; } });
// Rate limiting middleware
var rateLimiter_1 = require("./rateLimiter");
Object.defineProperty(exports, "authLimiter", { enumerable: true, get: function () { return rateLimiter_1.authLimiter; } });
Object.defineProperty(exports, "generalLimiter", { enumerable: true, get: function () { return rateLimiter_1.generalLimiter; } });
Object.defineProperty(exports, "refreshTokenLimiter", { enumerable: true, get: function () { return rateLimiter_1.refreshTokenLimiter; } });
//# sourceMappingURL=index.js.map