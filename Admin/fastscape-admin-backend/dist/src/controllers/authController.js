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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const authService_1 = require("../services/auth/authService");
const response_utils_1 = require("../utils/response.utils");
const security_utils_1 = require("../utils/security.utils");
const errorHandler_1 = require("../services/middleware/errorHandler");
class AuthController {
}
exports.AuthController = AuthController;
_a = AuthController;
/**
 * Login endpoint - Only way for users to authenticate
 */
AuthController.login = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const loginData = req.body;
    // Get device info for tracking
    const deviceInfo = {
        userAgent: (0, security_utils_1.getUserAgent)(req),
        ipAddress: (0, security_utils_1.getClientIP)(req),
    };
    const result = yield authService_1.AuthService.login(loginData, deviceInfo);
    (0, response_utils_1.sendSuccess)(res, 'Login successful', result);
}));
/**
 * Refresh token endpoint
 */
AuthController.refreshToken = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshTokenData = req.body;
    // Get device info for tracking
    const deviceInfo = {
        userAgent: (0, security_utils_1.getUserAgent)(req),
        ipAddress: (0, security_utils_1.getClientIP)(req),
    };
    const tokens = yield authService_1.AuthService.refreshToken(refreshTokenData, deviceInfo);
    (0, response_utils_1.sendSuccess)(res, 'Tokens refreshed successfully', { tokens });
}));
/**
 * Logout endpoint
 */
AuthController.logout = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshTokenData = req.body;
    yield authService_1.AuthService.logout(refreshTokenData);
    (0, response_utils_1.sendSuccess)(res, 'Logout successful');
}));
/**
 * Logout from all devices endpoint
 */
AuthController.logoutAllDevices = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.adminUser) {
        return (0, response_utils_1.sendUnauthorized)(res, 'Authentication required');
    }
    yield authService_1.AuthService.logoutAllDevices(req.adminUser.id);
    (0, response_utils_1.sendSuccess)(res, 'Logged out from all devices successfully');
}));
/**
 * Get current user profile endpoint - Optimized to return complete user data
 * No need for additional API calls to get roles and policies
 */
AuthController.getProfile = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.adminUser) {
        return (0, response_utils_1.sendUnauthorized)(res, 'Authentication required');
    }
    // Return the complete user data that's already loaded by Passport
    // This includes roles and policies, eliminating the need for additional API calls
    const user = {
        id: req.adminUser.id,
        firstName: req.adminUser.firstName,
        lastName: req.adminUser.lastName,
        email: req.adminUser.email,
        isActive: req.adminUser.isActive,
        permissions: req.adminUser.permissions,
        roles: req.adminUser.roles,
    };
    (0, response_utils_1.sendSuccess)(res, 'Profile retrieved successfully', { user });
}));
/**
 * Create admin user endpoint - Only admins can create other admin users
 */
AuthController.createAdminUser = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.body;
    const user = yield authService_1.AuthService.createAdminUser(userData);
    (0, response_utils_1.sendCreated)(res, 'Admin user created successfully', { user });
}));
/**
 * Change password endpoint
 */
AuthController.changePassword = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.adminUser) {
        return (0, response_utils_1.sendUnauthorized)(res, 'Authentication required');
    }
    const { currentPassword, newPassword } = req.body;
    yield authService_1.AuthService.changePassword(req.adminUser.id, currentPassword, newPassword);
    (0, response_utils_1.sendSuccess)(res, 'Password changed successfully');
}));
/**
 * Check permissions endpoint - Optimized to use cached permissions
 */
AuthController.checkPermissions = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.adminUser) {
        return (0, response_utils_1.sendUnauthorized)(res, 'Authentication required');
    }
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
        return (0, response_utils_1.sendError)(res, 'Permissions must be an array', 400);
    }
    // Use cached permissions from the authenticated user object for better performance
    const results = {};
    for (const permission of permissions) {
        results[permission] = req.adminUser.permissions.includes(permission);
    }
    (0, response_utils_1.sendSuccess)(res, 'Permissions checked successfully', { permissions: results });
}));
/**
 * Get user sessions endpoint (refresh tokens)
 */
AuthController.getUserSessions = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.adminUser) {
        return (0, response_utils_1.sendUnauthorized)(res, 'Authentication required');
    }
    // This would require additional implementation in AuthService
    // For now, return a placeholder response
    (0, response_utils_1.sendSuccess)(res, 'Sessions retrieved successfully', { sessions: [] });
}));
/**
 * Revoke specific session endpoint
 */
AuthController.revokeSession = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.adminUser) {
        return (0, response_utils_1.sendUnauthorized)(res, 'Authentication required');
    }
    const { tokenId } = req.params;
    // This would require additional implementation in AuthService
    // For now, return a placeholder response
    (0, response_utils_1.sendSuccess)(res, 'Session revoked successfully');
}));
//# sourceMappingURL=authController.js.map