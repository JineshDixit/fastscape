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
exports.checkAnyPermission = exports.checkPermission = exports.getCurrentProfile = exports.logoutFromAllDevices = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
const jwt_utils_1 = require("../../utils/jwt.utils");
const password_utils_1 = require("../../utils/password.utils");
const security_utils_1 = require("../../utils/security.utils");
const adminUser_utils_1 = require("../../utils/adminUser.utils");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_utils_1 = require("../../utils/validation.utils");
const logger_1 = __importDefault(require("../../config/logger"));
/**
 * Create and store refresh token
 */
const storeRefreshToken = (adminUserId, token, expiresAt, deviceInfo, ipAddress) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.debug('Storing refresh token', { adminUserId, deviceInfo, ipAddress, expiresAt });
    yield models_1.AdminRefreshToken.create({
        adminUserId,
        token,
        expiresAt,
        isRevoked: false,
        deviceInfo,
        ipAddress,
    });
    logger_1.default.debug('Refresh token stored successfully', { adminUserId });
});
/**
 * Revoke all refresh tokens for admin user
 */
const revokeAllRefreshTokens = (adminUserId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.debug('Revoking all refresh tokens', { adminUserId });
    const result = yield models_1.AdminRefreshToken.update({ isRevoked: true }, { where: { adminUserId, isRevoked: false } });
    logger_1.default.info('All refresh tokens revoked', { adminUserId, count: result[0] });
});
/**
 * Register new admin user
 */
const register = (registerData, deviceInfo, ipAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, email: rawEmail, password } = registerData;
    logger_1.default.info('Admin user registration initiated', { email: rawEmail, firstName, lastName, ipAddress });
    // Validate required fields
    (0, validation_utils_1.validateRequiredFields)(registerData, ['firstName', 'lastName', 'email', 'password']);
    const email = (0, security_utils_1.sanitizeEmail)(rawEmail);
    (0, validation_utils_1.validateEmail)(email);
    // Check if admin user already exists
    const existingUser = yield models_1.AdminUser.findOne({ where: { email } });
    if (existingUser) {
        logger_1.default.warn('Registration failed: admin user already exists', { email });
        throw (0, errorHandler_1.createError)('Admin user with this email already exists', 409);
    }
    // Hash password
    logger_1.default.debug('Hashing password for new admin user');
    const passwordHash = yield (0, password_utils_1.hashPassword)(password);
    // Create admin user
    const user = yield models_1.AdminUser.create({
        firstName,
        lastName,
        email,
        passwordHash,
        isActive: true,
    });
    logger_1.default.info('Admin user created successfully', { userId: user.id, email: user.email });
    // Generate tokens
    const tokenPair = (0, jwt_utils_1.generateTokenPair)({
        userId: user.id,
        email: user.email,
    });
    // Store refresh token
    yield storeRefreshToken(user.id, tokenPair.refreshToken, tokenPair.refreshTokenExpiresAt, deviceInfo, ipAddress);
    // Get user with permissions for response
    const userWithPermissions = yield (0, adminUser_utils_1.getAdminUserWithRolesAndPermissions)(user.id);
    logger_1.default.info('Admin user registration completed', { userId: user.id, email: user.email });
    return {
        user: (0, adminUser_utils_1.formatAdminUserResponse)(userWithPermissions || user),
        tokens: tokenPair,
    };
});
exports.register = register;
/**
 * Login admin user
 */
const login = (loginData, deviceInfo, ipAddress) => __awaiter(void 0, void 0, void 0, function* () {
    const { email: rawEmail, password } = loginData;
    logger_1.default.info('Admin user login attempt', { email: rawEmail, ipAddress, deviceInfo });
    // Validate required fields
    (0, validation_utils_1.validateRequiredFields)(loginData, ['email', 'password']);
    const email = (0, security_utils_1.sanitizeEmail)(rawEmail);
    (0, validation_utils_1.validateEmail)(email);
    // Find admin user by email
    const user = yield models_1.AdminUser.findOne({ where: { email } });
    if (!user) {
        logger_1.default.warn('Login failed: admin user not found', { email });
        throw (0, errorHandler_1.createError)('Invalid credentials', 401);
    }
    // Check if admin user is active
    if (!user.isActive) {
        logger_1.default.warn('Login failed: admin user account deactivated', { userId: user.id, email });
        throw (0, errorHandler_1.createError)('Account is deactivated. Please contact administrator.', 403);
    }
    // Verify password
    logger_1.default.debug('Verifying password', { userId: user.id });
    const isPasswordValid = yield (0, password_utils_1.comparePassword)(password, user.passwordHash);
    if (!isPasswordValid) {
        logger_1.default.warn('Login failed: invalid password', { userId: user.id, email });
        throw (0, errorHandler_1.createError)('Invalid credentials', 401);
    }
    // Revoke existing refresh tokens for security
    yield revokeAllRefreshTokens(user.id);
    // Generate new tokens
    const tokenPair = (0, jwt_utils_1.generateTokenPair)({
        userId: user.id,
        email: user.email,
    });
    // Store new refresh token
    yield storeRefreshToken(user.id, tokenPair.refreshToken, tokenPair.refreshTokenExpiresAt, deviceInfo, ipAddress);
    // Get user with permissions for response
    const userWithPermissions = yield (0, adminUser_utils_1.getAdminUserWithRolesAndPermissions)(user.id);
    logger_1.default.info('Admin user login successful', { userId: user.id, email: user.email });
    return {
        user: (0, adminUser_utils_1.formatAdminUserResponse)(userWithPermissions || user),
        tokens: tokenPair,
    };
});
exports.login = login;
/**
 * Refresh access token
 */
const refreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.debug('Refresh token request received');
    if (!token) {
        logger_1.default.warn('Refresh token request missing token');
        throw (0, errorHandler_1.createError)('Refresh token is required', 400);
    }
    // Verify refresh token
    let decoded;
    try {
        decoded = (0, jwt_utils_1.verifyRefreshToken)(token);
        logger_1.default.debug('Refresh token verified', { userId: decoded.userId });
    }
    catch (error) {
        logger_1.default.warn('Refresh token verification failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw (0, errorHandler_1.createError)('Invalid or expired refresh token', 401);
    }
    // Check if refresh token exists in database and is not revoked
    // OR was revoked very recently (grace period for concurrent requests)
    const storedToken = yield models_1.AdminRefreshToken.findOne({
        where: {
            token,
            adminUserId: decoded.userId,
            [sequelize_1.Op.or]: [
                { isRevoked: false },
                {
                    isRevoked: true,
                    updatedAt: { [sequelize_1.Op.gte]: new Date(Date.now() - 30 * 1000) },
                },
            ],
        },
    });
    if (!storedToken) {
        logger_1.default.warn('Refresh token not found or already revoked', { userId: decoded.userId });
        throw (0, errorHandler_1.createError)('Refresh token not found or revoked', 401);
    }
    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
        logger_1.default.warn('Refresh token expired', { userId: decoded.userId, expiresAt: storedToken.expiresAt });
        yield storedToken.update({ isRevoked: true });
        throw (0, errorHandler_1.createError)('Refresh token expired', 401);
    }
    // Get admin user details
    const user = yield models_1.AdminUser.findByPk(decoded.userId);
    if (!user || !user.isActive) {
        logger_1.default.warn('Admin user not found or deactivated during token refresh', { userId: decoded.userId });
        throw (0, errorHandler_1.createError)('Admin user not found or deactivated', 401);
    }
    // Revoke old refresh token (only if not already revoked)
    if (!storedToken.isRevoked) {
        logger_1.default.debug('Revoking old refresh token', { userId: user.id });
        yield storedToken.update({ isRevoked: true });
    }
    else {
        logger_1.default.info('Using recently rotated refresh token (grace period)', {
            userId: user.id,
            tokenSnippet: token.substring(0, 10),
        });
    }
    // Generate new token pair
    const newTokenPair = (0, jwt_utils_1.generateTokenPair)({
        userId: user.id,
        email: user.email,
    });
    // Store new refresh token
    yield storeRefreshToken(user.id, newTokenPair.refreshToken, newTokenPair.refreshTokenExpiresAt, storedToken.deviceInfo, storedToken.ipAddress);
    logger_1.default.info('Refresh token renewed successfully', { userId: user.id });
    return newTokenPair;
});
exports.refreshToken = refreshToken;
/**
 * Logout admin user
 */
const logout = (token) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('Admin user logout initiated');
    if (!token) {
        logger_1.default.warn('Logout request missing token');
        throw (0, errorHandler_1.createError)('Refresh token is required', 400);
    }
    // Revoke the refresh token
    const result = yield models_1.AdminRefreshToken.update({ isRevoked: true }, { where: { token, isRevoked: false } });
    logger_1.default.info('Admin user logout completed', { tokensRevoked: result[0] });
});
exports.logout = logout;
/**
 * Logout from all devices
 */
const logoutFromAllDevices = (adminUserId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info('Logout from all devices initiated', { adminUserId });
    if (!adminUserId) {
        logger_1.default.warn('Logout from all devices missing adminUserId');
        throw (0, errorHandler_1.createError)('Admin User ID is required', 400);
    }
    yield revokeAllRefreshTokens(adminUserId);
    logger_1.default.info('Logout from all devices completed', { adminUserId });
});
exports.logoutFromAllDevices = logoutFromAllDevices;
/**
 * Get current admin user profile
 */
const getCurrentProfile = (adminUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield (0, adminUser_utils_1.getAdminUserWithRolesAndPermissions)(adminUserId);
    if (!user) {
        throw (0, errorHandler_1.createError)('Admin user not found', 404);
    }
    if (!user.isActive) {
        throw (0, errorHandler_1.createError)('Admin user account is deactivated', 403);
    }
    return (0, adminUser_utils_1.formatAdminUserResponse)(user);
});
exports.getCurrentProfile = getCurrentProfile;
/**
 * Check if admin user has specific permission
 */
const checkPermission = (adminUserId, permission) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield (0, adminUser_utils_1.getAdminUserWithRolesAndPermissions)(adminUserId);
    if (!user || !user.isActive) {
        return false;
    }
    const userResponse = (0, adminUser_utils_1.formatAdminUserResponse)(user);
    return ((_a = userResponse.permissions) === null || _a === void 0 ? void 0 : _a.includes(permission)) || false;
});
exports.checkPermission = checkPermission;
/**
 * Check if admin user has any of the specified permissions
 */
const checkAnyPermission = (adminUserId, permissions) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield (0, adminUser_utils_1.getAdminUserWithRolesAndPermissions)(adminUserId);
    if (!user || !user.isActive) {
        return false;
    }
    const userResponse = (0, adminUser_utils_1.formatAdminUserResponse)(user);
    return permissions.some((permission) => { var _a; return (_a = userResponse.permissions) === null || _a === void 0 ? void 0 : _a.includes(permission); }) || false;
});
exports.checkAnyPermission = checkAnyPermission;
//# sourceMappingURL=auth.service.js.map