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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const models_1 = require("../../models");
const AdminRefreshToken_1 = require("../../models/AdminRefreshToken");
const jwt_utils_1 = require("../../utils/jwt.utils");
const password_utils_1 = require("../../utils/password.utils");
const security_utils_1 = require("../../utils/security.utils");
const permission_utils_1 = require("../../utils/permission.utils");
const logger_utils_1 = require("../../utils/logger.utils");
const errorHandler_1 = require("../middleware/errorHandler");
class AuthService {
    /**
     * Create a new admin user
     */
    static createAdminUser(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            const { firstName, lastName, email, password, roleIds = [] } = userData;
            logger_utils_1.authLogger.info('Admin user creation started', {
                email: (0, security_utils_1.sanitizeEmail)(email),
                roleCount: roleIds.length,
                timestamp: new Date().toISOString(),
            });
            try {
                // Sanitize email
                const sanitizedEmail = (0, security_utils_1.sanitizeEmail)(email);
                // Check if user already exists
                const existingUser = yield models_1.AdminUser.findOne({ where: { email: sanitizedEmail } });
                if (existingUser) {
                    (0, logger_utils_1.logSecurityEvent)('duplicate_admin_creation_attempt', 'medium', {
                        email: sanitizedEmail,
                        existingUserId: existingUser.id,
                    });
                    throw new errorHandler_1.AppError('User with this email already exists', 409);
                }
                // Hash password
                const passwordHash = yield (0, password_utils_1.hashPassword)(password);
                // Create user
                const adminUser = yield models_1.AdminUser.create({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: sanitizedEmail,
                    passwordHash,
                });
                // Assign roles if provided
                if (roleIds.length > 0) {
                    const roles = yield models_1.Role.findAll({
                        where: {
                            id: roleIds,
                            isActive: true
                        }
                    });
                    if (roles.length !== roleIds.length) {
                        logger_utils_1.authLogger.warn('Invalid roles provided during admin creation', {
                            requestedRoles: roleIds,
                            foundRoles: roles.map(r => r.id),
                            userId: adminUser.id,
                        });
                        throw new errorHandler_1.AppError('One or more roles not found or inactive', 400);
                    }
                    yield adminUser.setRoles(roles);
                    logger_utils_1.authLogger.info('Roles assigned to new admin user', {
                        userId: adminUser.id,
                        roleIds: roles.map(r => r.id),
                        roleNames: roles.map(r => r.name),
                    });
                }
                const result = yield this.getUserWithPermissions(adminUser.id);
                (0, logger_utils_1.logAuthEvent)('admin_user_created', adminUser.id, {
                    email: sanitizedEmail,
                    roleCount: roleIds.length,
                    permissionCount: result.permissions.length,
                });
                (0, logger_utils_1.logPerformance)('create_admin_user', Date.now() - startTime, {
                    userId: adminUser.id,
                    roleCount: roleIds.length,
                });
                return result;
            }
            catch (error) {
                logger_utils_1.authLogger.error('Admin user creation failed', {
                    email: (0, security_utils_1.sanitizeEmail)(email),
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: Date.now() - startTime,
                });
                throw error;
            }
        });
    }
    /**
     * Authenticate user login
     */
    static login(loginData, deviceInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const startTime = Date.now();
            const { email, password } = loginData;
            const sanitizedEmail = (0, security_utils_1.sanitizeEmail)(email);
            logger_utils_1.authLogger.info('Login attempt started', {
                email: sanitizedEmail,
                userAgent: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.userAgent,
                ipAddress: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.ipAddress,
                timestamp: new Date().toISOString(),
            });
            try {
                // Find user with roles and policies
                const adminUser = yield models_1.AdminUser.findOne({
                    where: { email: sanitizedEmail, isActive: true },
                    include: [
                        {
                            model: models_1.Role,
                            as: 'roles',
                            where: { isActive: true },
                            required: false,
                            include: [
                                {
                                    model: models_1.Policy,
                                    as: 'policies',
                                    where: { isActive: true },
                                    required: false,
                                },
                            ],
                        },
                    ],
                });
                if (!adminUser) {
                    (0, logger_utils_1.logSecurityEvent)('login_attempt_invalid_user', 'medium', {
                        email: sanitizedEmail,
                        ipAddress: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.ipAddress,
                        userAgent: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.userAgent,
                    });
                    throw new errorHandler_1.AppError('Invalid credentials', 401);
                }
                // Verify password
                const isPasswordValid = yield (0, password_utils_1.comparePassword)(password, adminUser.passwordHash);
                if (!isPasswordValid) {
                    (0, logger_utils_1.logSecurityEvent)('login_attempt_invalid_password', 'high', {
                        userId: adminUser.id,
                        email: sanitizedEmail,
                        ipAddress: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.ipAddress,
                        userAgent: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.userAgent,
                    });
                    throw new errorHandler_1.AppError('Invalid credentials', 401);
                }
                // Revoke old refresh tokens for security
                const revokedCount = yield this.logoutAllDevices(adminUser.id);
                if (revokedCount > 0) {
                    logger_utils_1.authLogger.info('Previous sessions revoked on login', {
                        userId: adminUser.id,
                        revokedTokens: revokedCount,
                    });
                }
                // Get user permissions
                const permissions = (0, permission_utils_1.extractPermissionsFromRoles)(adminUser.roles || []);
                // Generate tokens
                const tokenPayload = {
                    userId: adminUser.id,
                    email: adminUser.email,
                    permissions,
                };
                const tokens = (0, jwt_utils_1.generateTokenPair)(tokenPayload);
                // Store refresh token
                yield this.storeRefreshToken(adminUser.id, tokens.refreshToken, tokens.refreshTokenExpiresAt, deviceInfo);
                // Format user data
                const userData = yield this.getUserWithPermissions(adminUser.id);
                (0, logger_utils_1.logAuthEvent)('login_successful', adminUser.id, {
                    email: sanitizedEmail,
                    permissionCount: permissions.length,
                    roleCount: ((_a = adminUser.roles) === null || _a === void 0 ? void 0 : _a.length) || 0,
                    ipAddress: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.ipAddress,
                    userAgent: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.userAgent,
                });
                (0, logger_utils_1.logPerformance)('user_login', Date.now() - startTime, {
                    userId: adminUser.id,
                    permissionCount: permissions.length,
                });
                return {
                    user: userData,
                    tokens,
                };
            }
            catch (error) {
                logger_utils_1.authLogger.error('Login failed', {
                    email: sanitizedEmail,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: Date.now() - startTime,
                    ipAddress: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.ipAddress,
                });
                throw error;
            }
        });
    }
    /**
     * Refresh access token
     */
    static refreshToken(refreshTokenData, deviceInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            const { refreshToken } = refreshTokenData;
            logger_utils_1.authLogger.debug('Token refresh attempt started', {
                ipAddress: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.ipAddress,
                userAgent: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.userAgent,
                timestamp: new Date().toISOString(),
            });
            try {
                // Verify refresh token
                let decoded;
                try {
                    decoded = (0, jwt_utils_1.verifyRefreshToken)(refreshToken);
                }
                catch (error) {
                    (0, logger_utils_1.logSecurityEvent)('invalid_refresh_token', 'medium', {
                        ipAddress: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.ipAddress,
                        userAgent: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.userAgent,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                    throw new errorHandler_1.AppError('Invalid or expired refresh token', 401);
                }
                // Check if token exists in database and is not revoked
                const storedToken = yield AdminRefreshToken_1.AdminRefreshToken.findOne({
                    where: {
                        token: refreshToken,
                        adminUserId: decoded.userId,
                        isRevoked: false,
                        expiresAt: {
                            [require('sequelize').Op.gt]: new Date(),
                        },
                    },
                });
                if (!storedToken) {
                    (0, logger_utils_1.logSecurityEvent)('refresh_token_not_found_or_revoked', 'high', {
                        userId: decoded.userId,
                        ipAddress: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.ipAddress,
                        userAgent: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.userAgent,
                    });
                    throw new errorHandler_1.AppError('Refresh token not found or revoked', 401);
                }
                // Get user with current permissions
                const adminUser = yield models_1.AdminUser.findByPk(decoded.userId, {
                    include: [
                        {
                            model: models_1.Role,
                            as: 'roles',
                            where: { isActive: true },
                            required: false,
                            include: [
                                {
                                    model: models_1.Policy,
                                    as: 'policies',
                                    where: { isActive: true },
                                    required: false,
                                },
                            ],
                        },
                    ],
                });
                if (!adminUser || !adminUser.isActive) {
                    (0, logger_utils_1.logSecurityEvent)('refresh_token_user_inactive', 'high', {
                        userId: decoded.userId,
                        userActive: adminUser === null || adminUser === void 0 ? void 0 : adminUser.isActive,
                        ipAddress: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.ipAddress,
                    });
                    throw new errorHandler_1.AppError('User not found or inactive', 401);
                }
                // Revoke old refresh token
                yield storedToken.update({ isRevoked: true });
                // Get current permissions
                const permissions = (0, permission_utils_1.extractPermissionsFromRoles)(adminUser.roles || []);
                // Generate new token pair
                const tokenPayload = {
                    userId: adminUser.id,
                    email: adminUser.email,
                    permissions,
                };
                const newTokens = (0, jwt_utils_1.generateTokenPair)(tokenPayload);
                // Store new refresh token
                yield this.storeRefreshToken(adminUser.id, newTokens.refreshToken, newTokens.refreshTokenExpiresAt, deviceInfo);
                (0, logger_utils_1.logAuthEvent)('token_refreshed', adminUser.id, {
                    email: adminUser.email,
                    permissionCount: permissions.length,
                    ipAddress: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.ipAddress,
                    userAgent: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.userAgent,
                });
                (0, logger_utils_1.logPerformance)('token_refresh', Date.now() - startTime, {
                    userId: adminUser.id,
                });
                return newTokens;
            }
            catch (error) {
                logger_utils_1.authLogger.error('Token refresh failed', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: Date.now() - startTime,
                    ipAddress: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.ipAddress,
                });
                throw error;
            }
        });
    }
    /**
     * Logout user (revoke refresh token)
     */
    static logout(refreshTokenData) {
        return __awaiter(this, void 0, void 0, function* () {
            const { refreshToken } = refreshTokenData;
            try {
                // Decode token to get user info for logging
                const decoded = (0, jwt_utils_1.verifyRefreshToken)(refreshToken);
                // Find and revoke the token
                const storedToken = yield AdminRefreshToken_1.AdminRefreshToken.findOne({
                    where: {
                        token: refreshToken,
                        isRevoked: false,
                    },
                });
                if (storedToken) {
                    yield storedToken.update({ isRevoked: true });
                    (0, logger_utils_1.logAuthEvent)('logout_successful', decoded.userId, {
                        tokenId: storedToken.id,
                        deviceInfo: storedToken.deviceInfo,
                    });
                }
                else {
                    logger_utils_1.authLogger.warn('Logout attempted with non-existent token', {
                        userId: decoded.userId,
                    });
                }
            }
            catch (error) {
                logger_utils_1.authLogger.error('Logout failed', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                // Don't throw error for logout - it should be idempotent
            }
        });
    }
    /**
     * Logout from all devices (revoke all refresh tokens for user)
     */
    static logoutAllDevices(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield AdminRefreshToken_1.AdminRefreshToken.update({ isRevoked: true }, {
                    where: {
                        adminUserId: userId,
                        isRevoked: false,
                    },
                });
                const revokedCount = Array.isArray(result) ? result[0] : 0;
                if (revokedCount > 0) {
                    (0, logger_utils_1.logAuthEvent)('logout_all_devices', userId, {
                        revokedTokens: revokedCount,
                    });
                }
                return revokedCount;
            }
            catch (error) {
                logger_utils_1.authLogger.error('Logout all devices failed', {
                    userId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                throw error;
            }
        });
    }
    /**
     * Get user with permissions
     */
    static getUserWithPermissions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const adminUser = yield models_1.AdminUser.findByPk(userId, {
                include: [
                    {
                        model: models_1.Role,
                        as: 'roles',
                        where: { isActive: true },
                        required: false,
                        include: [
                            {
                                model: models_1.Policy,
                                as: 'policies',
                                where: { isActive: true },
                                required: false,
                            },
                        ],
                    },
                ],
            });
            if (!adminUser) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            const roles = adminUser.roles || [];
            const permissions = (0, permission_utils_1.extractPermissionsFromRoles)(roles);
            return {
                id: adminUser.id,
                firstName: adminUser.firstName,
                lastName: adminUser.lastName,
                email: adminUser.email,
                isActive: adminUser.isActive,
                roles: roles.map(role => ({
                    id: role.id,
                    name: role.name,
                    description: role.description,
                    policies: (role.policies || []).map(policy => ({
                        id: policy.id,
                        name: policy.name,
                        permissions: policy.permissions,
                        description: policy.description,
                    })),
                })),
                permissions,
            };
        });
    }
    /**
     * Change user password
     */
    static changePassword(userId, currentPassword, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            logger_utils_1.authLogger.info('Password change attempt started', {
                userId,
                timestamp: new Date().toISOString(),
            });
            try {
                const adminUser = yield models_1.AdminUser.findByPk(userId);
                if (!adminUser) {
                    logger_utils_1.authLogger.warn('Password change attempted for non-existent user', {
                        userId,
                    });
                    throw new errorHandler_1.AppError('User not found', 404);
                }
                // Verify current password
                const isCurrentPasswordValid = yield (0, password_utils_1.comparePassword)(currentPassword, adminUser.passwordHash);
                if (!isCurrentPasswordValid) {
                    (0, logger_utils_1.logSecurityEvent)('password_change_invalid_current', 'medium', {
                        userId,
                        email: adminUser.email,
                    });
                    throw new errorHandler_1.AppError('Current password is incorrect', 400);
                }
                // Hash new password
                const newPasswordHash = yield (0, password_utils_1.hashPassword)(newPassword);
                // Update password
                yield adminUser.update({ passwordHash: newPasswordHash });
                // Revoke all refresh tokens to force re-login
                const revokedCount = yield this.logoutAllDevices(userId);
                (0, logger_utils_1.logAuthEvent)('password_changed', userId, {
                    email: adminUser.email,
                    revokedTokens: revokedCount,
                });
                (0, logger_utils_1.logPerformance)('password_change', Date.now() - startTime, {
                    userId,
                });
            }
            catch (error) {
                logger_utils_1.authLogger.error('Password change failed', {
                    userId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    duration: Date.now() - startTime,
                });
                throw error;
            }
        });
    }
    /**
     * Store refresh token in database
     */
    static storeRefreshToken(adminUserId, token, expiresAt, deviceInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            yield AdminRefreshToken_1.AdminRefreshToken.create({
                adminUserId,
                token,
                expiresAt,
                deviceInfo: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.userAgent,
                ipAddress: deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.ipAddress,
            });
        });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map