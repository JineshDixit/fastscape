"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireActiveUser = exports.requireOwnershipOrRole = exports.requireAllPermissions = exports.requireAnyPermission = exports.requirePermission = exports.requireAnyRole = exports.requireRole = void 0;
const errorHandler_1 = require("./errorHandler");
/**
 * Helper to ensure user is authenticated and return user object
 */
const ensureAuthenticated = (req) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    return req.user;
};
/**
 * Middleware to check if admin user has required role
 */
const requireRole = (requiredRole) => {
    return (req, res, next) => {
        var _a;
        try {
            const user = ensureAuthenticated(req);
            if (!((_a = user.roles) === null || _a === void 0 ? void 0 : _a.length)) {
                throw (0, errorHandler_1.createError)('No roles assigned to user', 403);
            }
            const hasRole = user.roles.some((role) => role.name === requiredRole && role.isActive);
            if (!hasRole) {
                throw (0, errorHandler_1.createError)(`Access denied. Required role: ${requiredRole}`, 403);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireRole = requireRole;
/**
 * Middleware to check if admin user has any of the required roles
 */
const requireAnyRole = (requiredRoles) => {
    return (req, res, next) => {
        var _a;
        try {
            const user = ensureAuthenticated(req);
            if (!((_a = user.roles) === null || _a === void 0 ? void 0 : _a.length)) {
                throw (0, errorHandler_1.createError)('No roles assigned to user', 403);
            }
            const hasAnyRole = user.roles.some((role) => requiredRoles.includes(role.name) && role.isActive);
            if (!hasAnyRole) {
                throw (0, errorHandler_1.createError)(`Access denied. Required roles: ${requiredRoles.join(', ')}`, 403);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireAnyRole = requireAnyRole;
/**
 * Middleware to check if admin user has required permission
 */
const requirePermission = (requiredPermission) => {
    return (req, res, next) => {
        var _a;
        try {
            const user = ensureAuthenticated(req);
            if (!((_a = user.permissions) === null || _a === void 0 ? void 0 : _a.length)) {
                throw (0, errorHandler_1.createError)('No permissions assigned to user', 403);
            }
            if (!user.permissions.includes(requiredPermission)) {
                throw (0, errorHandler_1.createError)(`Access denied. Required permission: ${requiredPermission}`, 403);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requirePermission = requirePermission;
/**
 * Middleware to check if admin user has any of the required permissions
 */
const requireAnyPermission = (requiredPermissions) => {
    return (req, res, next) => {
        var _a;
        try {
            const user = ensureAuthenticated(req);
            if (!((_a = user.permissions) === null || _a === void 0 ? void 0 : _a.length)) {
                throw (0, errorHandler_1.createError)('No permissions assigned to user', 403);
            }
            const hasAnyPermission = requiredPermissions.some((permission) => user.permissions.includes(permission));
            if (!hasAnyPermission) {
                throw (0, errorHandler_1.createError)(`Access denied. Required permissions: ${requiredPermissions.join(', ')}`, 403);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireAnyPermission = requireAnyPermission;
/**
 * Middleware to check if admin user has all required permissions
 */
const requireAllPermissions = (requiredPermissions) => {
    return (req, res, next) => {
        var _a;
        try {
            const user = ensureAuthenticated(req);
            if (!((_a = user.permissions) === null || _a === void 0 ? void 0 : _a.length)) {
                throw (0, errorHandler_1.createError)('No permissions assigned to user', 403);
            }
            const hasAllPermissions = requiredPermissions.every((permission) => user.permissions.includes(permission));
            if (!hasAllPermissions) {
                const missingPermissions = requiredPermissions.filter((permission) => !user.permissions.includes(permission));
                throw (0, errorHandler_1.createError)(`Access denied. Missing permissions: ${missingPermissions.join(', ')}`, 403);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireAllPermissions = requireAllPermissions;
/**
 * Middleware to check if admin user can access their own resource or has admin privileges
 */
const requireOwnershipOrRole = (roleForBypass) => {
    return (req, res, next) => {
        var _a;
        try {
            const user = ensureAuthenticated(req);
            const targetUserId = req.params.id || req.params.adminUserId || req.body.adminUserId;
            // Allow if user is accessing their own resource or has bypass role
            if (user.userId === targetUserId || ((_a = user.roles) === null || _a === void 0 ? void 0 : _a.some((role) => role.name === roleForBypass && role.isActive))) {
                return next();
            }
            throw (0, errorHandler_1.createError)('Access denied. You can only access your own resources or need admin privileges', 403);
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireOwnershipOrRole = requireOwnershipOrRole;
/**
 * Middleware to check if admin user is active
 */
const requireActiveUser = (req, res, next) => {
    try {
        const user = ensureAuthenticated(req);
        if (!user.isActive) {
            throw (0, errorHandler_1.createError)('Account is inactive', 403);
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireActiveUser = requireActiveUser;
//# sourceMappingURL=authorization.js.map