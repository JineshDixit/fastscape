"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireSelfOrPermission = exports.optionalAuth = exports.requireAnyPermission = exports.requirePermission = exports.authenticateAdmin = void 0;
const passport_1 = __importDefault(require("passport"));
const response_utils_1 = require("../../utils/response.utils");
const logger_utils_1 = require("../../utils/logger.utils");
/**
 * Custom authentication middleware with better error handling
 */
const authenticateAdmin = (req, res, next) => {
    passport_1.default.authenticate('admin-jwt', { session: false }, (err, user, info) => {
        var _a;
        if (err) {
            logger_utils_1.authLogger.error('Authentication error occurred', {
                error: err.message,
                url: req.originalUrl,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
            });
            return (0, response_utils_1.sendUnauthorized)(res, 'Authentication failed');
        }
        if (!user) {
            const message = (info === null || info === void 0 ? void 0 : info.message) || 'Invalid or expired token';
            (0, logger_utils_1.logSecurityEvent)('authentication_failed', 'medium', {
                reason: message,
                url: req.originalUrl,
                method: req.method,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
            });
            return (0, response_utils_1.sendUnauthorized)(res, message);
        }
        // Log successful authentication
        logger_utils_1.authLogger.debug('User authenticated successfully', {
            userId: user.id,
            email: user.email,
            url: req.originalUrl,
            method: req.method,
            permissionCount: ((_a = user.permissions) === null || _a === void 0 ? void 0 : _a.length) || 0,
        });
        req.adminUser = user;
        next();
    })(req, res, next);
};
exports.authenticateAdmin = authenticateAdmin;
/**
 * Middleware to check if user has required permission
 * Now uses the permissions from the authenticated user object for better performance
 */
const requirePermission = (permission) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        if (!req.adminUser) {
            (0, logger_utils_1.logSecurityEvent)('permission_check_no_user', 'high', {
                requiredPermission: permission,
                url: req.originalUrl,
                method: req.method,
                ip: req.ip,
            });
            return (0, response_utils_1.sendUnauthorized)(res, 'Authentication required');
        }
        // Check permissions directly from the authenticated user object (optimized)
        if (!req.adminUser.permissions.includes(permission)) {
            (0, logger_utils_1.logSecurityEvent)('permission_denied', 'medium', {
                userId: req.adminUser.id,
                email: req.adminUser.email,
                requiredPermission: permission,
                userPermissions: req.adminUser.permissions,
                url: req.originalUrl,
                method: req.method,
                ip: req.ip,
            });
            return (0, response_utils_1.sendForbidden)(res, `Permission '${permission}' required`);
        }
        logger_utils_1.authLogger.debug('Permission check passed', {
            userId: req.adminUser.id,
            permission,
            url: req.originalUrl,
            method: req.method,
        });
        next();
    });
};
exports.requirePermission = requirePermission;
/**
 * Middleware to check if user has any of the required permissions
 * Now uses the permissions from the authenticated user object for better performance
 */
const requireAnyPermission = (permissions) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        if (!req.adminUser) {
            (0, logger_utils_1.logSecurityEvent)('permission_check_no_user', 'high', {
                requiredPermissions: permissions,
                url: req.originalUrl,
                method: req.method,
                ip: req.ip,
            });
            return (0, response_utils_1.sendUnauthorized)(res, 'Authentication required');
        }
        // Check permissions directly from the authenticated user object (optimized)
        const hasAnyPermission = permissions.some(permission => req.adminUser.permissions.includes(permission));
        if (!hasAnyPermission) {
            (0, logger_utils_1.logSecurityEvent)('permission_denied_any', 'medium', {
                userId: req.adminUser.id,
                email: req.adminUser.email,
                requiredPermissions: permissions,
                userPermissions: req.adminUser.permissions,
                url: req.originalUrl,
                method: req.method,
                ip: req.ip,
            });
            return (0, response_utils_1.sendForbidden)(res, `One of these permissions required: ${permissions.join(', ')}`);
        }
        logger_utils_1.authLogger.debug('Any permission check passed', {
            userId: req.adminUser.id,
            requiredPermissions: permissions,
            url: req.originalUrl,
            method: req.method,
        });
        next();
    });
};
exports.requireAnyPermission = requireAnyPermission;
/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = (req, res, next) => {
    passport_1.default.authenticate('admin-jwt', { session: false }, (err, user, info) => {
        if (err) {
            console.warn('Optional auth error:', err);
        }
        if (user) {
            req.adminUser = user;
        }
        // Continue regardless of authentication result
        next();
    })(req, res, next);
};
exports.optionalAuth = optionalAuth;
/**
 * Middleware to ensure user can only access their own resources
 */
const requireSelfOrPermission = (permission) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        if (!req.adminUser) {
            return (0, response_utils_1.sendUnauthorized)(res, 'Authentication required');
        }
        const targetUserId = parseInt(req.params.userId || req.params.id, 10);
        // Allow if accessing own resources
        if (req.adminUser.id === targetUserId) {
            return next();
        }
        // Check permissions directly from the authenticated user object (optimized)
        if (!req.adminUser.permissions.includes(permission)) {
            return (0, response_utils_1.sendForbidden)(res, 'Access denied');
        }
        next();
    });
};
exports.requireSelfOrPermission = requireSelfOrPermission;
//# sourceMappingURL=authMiddleware.js.map