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
exports.resetPassword = exports.verifyOtp = exports.forgotPassword = exports.logoutAllDevices = exports.logoutUser = exports.refreshAccessToken = exports.loginUser = exports.registerUser = void 0;
const models_1 = require("../../models");
const jwt_utils_1 = require("../../utils/jwt.utils");
const password_utils_1 = require("../../utils/password.utils");
const security_utils_1 = require("../../utils/security.utils");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_utils_1 = require("../../utils/validation.utils");
const logger_1 = __importDefault(require("../../utils/logger"));
const otp_utils_1 = require("../../utils/otp.utils");
const email_service_1 = require("../email/email.service");
/**
 * Create and store refresh token
 */
const createRefreshToken = (userId, token, expiresAt) => __awaiter(void 0, void 0, void 0, function* () {
    yield models_1.RefreshToken.create({
        userId,
        token,
        expiresAt,
        isRevoked: false,
    });
});
/**
 * Revoke user's refresh tokens
 */
const revokeUserTokens = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield models_1.RefreshToken.update({ isRevoked: true }, { where: { userId, isRevoked: false } });
});
/**
 * Format user response (exclude sensitive data)
 */
const formatUserResponse = (user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    nationality: user.nationality,
});
/**
 * Registers a new user
 */
const registerUser = (registerData) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, dateOfBirth, nationality, email: rawEmail, phone, password } = registerData;
    // Validate required fields
    (0, validation_utils_1.validateRequiredFields)(registerData, [
        'firstName',
        'lastName',
        'dateOfBirth',
        'nationality',
        'email',
        'phone',
        'password',
    ]);
    const email = (0, security_utils_1.sanitizeEmail)(rawEmail);
    (0, validation_utils_1.validateEmail)(email);
    // Check if user already exists
    const existingUser = yield models_1.User.findOne({ where: { email } });
    if (existingUser) {
        logger_1.default.warn('Registration attempt with existing email', { email });
        throw (0, errorHandler_1.createError)('User with this email already exists', 409);
    }
    // Hash password
    const passwordHash = yield (0, password_utils_1.hashPassword)(password);
    // Create user
    const user = yield models_1.User.create({
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        nationality,
        email,
        phone,
        passwordHash,
        isBlocked: false,
        resetPasswordOtp: null,
        resetPasswordOtpExpires: null,
    });
    // Generate tokens
    const tokenPair = (0, jwt_utils_1.generateTokenPair)({
        userId: user.id,
        email: user.email,
    });
    // Store refresh token
    yield createRefreshToken(user.id, tokenPair.refreshToken, tokenPair.refreshTokenExpiresAt);
    logger_1.default.info('User registered successfully', { userId: user.id, email: user.email });
    // Send welcome email (non-blocking)
    (0, email_service_1.sendWelcomeEmail)(user.email, user.firstName, user.lastName, user.email).catch((error) => {
        logger_1.default.error('Failed to send welcome email', { userId: user.id, error });
    });
    return {
        user: formatUserResponse(user),
        tokens: tokenPair,
    };
});
exports.registerUser = registerUser;
/**
 * Logs in a user and generates a new access and refresh token pair
 */
const loginUser = (loginData) => __awaiter(void 0, void 0, void 0, function* () {
    const { email: rawEmail, password } = loginData;
    // Validate required fields
    (0, validation_utils_1.validateRequiredFields)(loginData, ['email', 'password']);
    const email = (0, security_utils_1.sanitizeEmail)(rawEmail);
    (0, validation_utils_1.validateEmail)(email);
    // Find user by email
    const user = yield models_1.User.findOne({ where: { email } });
    if (!user) {
        logger_1.default.warn('Login failed: User not found', { email });
        throw (0, errorHandler_1.createError)('Invalid credentials', 401);
    }
    // Check if user is blocked
    if (user.isBlocked) {
        logger_1.default.warn('Login blocked: User account is blocked', { userId: user.id });
        throw (0, errorHandler_1.createError)('Account is blocked. Please contact support.', 403);
    }
    // Verify password
    const isPasswordValid = yield (0, password_utils_1.comparePassword)(password, user.passwordHash);
    if (!isPasswordValid) {
        logger_1.default.warn('Login failed: Invalid password', { userId: user.id });
        throw (0, errorHandler_1.createError)('Invalid credentials', 401);
    }
    // Revoke existing refresh tokens for security
    yield revokeUserTokens(user.id);
    // Generate new tokens
    const tokenPair = (0, jwt_utils_1.generateTokenPair)({
        userId: user.id,
        email: user.email,
    });
    // Store new refresh token
    yield createRefreshToken(user.id, tokenPair.refreshToken, tokenPair.refreshTokenExpiresAt);
    logger_1.default.info('User logged in successfully', { userId: user.id });
    return {
        user: formatUserResponse(user),
        tokens: tokenPair,
    };
});
exports.loginUser = loginUser;
/**
 * Refresh access token
 */
const refreshAccessToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    if (!token) {
        throw (0, errorHandler_1.createError)('Refresh token is required', 400);
    }
    // Verify refresh token
    let decoded;
    try {
        decoded = (0, jwt_utils_1.verifyRefreshToken)(token);
    }
    catch (error) {
        logger_1.default.warn('Token refresh failed: Invalid token');
        throw (0, errorHandler_1.createError)('Invalid or expired refresh token', 401);
    }
    // Check if refresh token exists in database
    const storedToken = yield models_1.RefreshToken.findOne({
        where: {
            token,
            userId: decoded.userId,
        },
    });
    if (!storedToken) {
        logger_1.default.warn('Token refresh failed: Token not found', { userId: decoded.userId });
        throw (0, errorHandler_1.createError)('Refresh token not found', 401);
    }
    // Check if token is revoked
    if (storedToken.isRevoked) {
        // Implement grace period: if revoked within the last 30 seconds, allow it
        // This handles race conditions when multiple tabs refresh simultaneously
        const GRACE_PERIOD_MS = 30 * 1000; // 30 seconds
        // Check if rotatedAt exists and is within grace period
        if (!storedToken.rotatedAt) {
            // Token was revoked but never rotated (shouldn't happen in normal flow)
            logger_1.default.warn('Token refresh failed: Token revoked without rotation timestamp', {
                userId: decoded.userId,
            });
            throw (0, errorHandler_1.createError)('Refresh token revoked', 401);
        }
        const timeSinceRotation = new Date().getTime() - new Date(storedToken.rotatedAt).getTime();
        const isWithinGracePeriod = timeSinceRotation < GRACE_PERIOD_MS;
        if (!isWithinGracePeriod) {
            logger_1.default.warn('Token refresh failed: Token revoked and grace period expired', {
                userId: decoded.userId,
                rotatedAt: storedToken.rotatedAt,
                timeSinceRotation,
            });
            throw (0, errorHandler_1.createError)('Refresh token revoked', 401);
        }
        logger_1.default.info('Allowing refresh using recently rotated token (grace period)', {
            userId: decoded.userId,
            timeSinceRotation,
        });
    }
    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
        yield storedToken.update({ isRevoked: true });
        logger_1.default.warn('Token refresh failed: Token expired', { userId: decoded.userId });
        throw (0, errorHandler_1.createError)('Refresh token expired', 401);
    }
    // Get user details
    const user = yield models_1.User.findByPk(decoded.userId);
    if (!user || user.isBlocked) {
        logger_1.default.warn('Token refresh failed: User blocked or not found', { userId: decoded.userId });
        throw (0, errorHandler_1.createError)('User not found or blocked', 401);
    }
    // Revoke old refresh token and mark rotation time
    yield storedToken.update({
        isRevoked: true,
        rotatedAt: new Date(),
    });
    // Generate new token pair
    const newTokenPair = (0, jwt_utils_1.generateTokenPair)({
        userId: user.id,
        email: user.email,
    });
    // Store new refresh token
    yield createRefreshToken(user.id, newTokenPair.refreshToken, newTokenPair.refreshTokenExpiresAt);
    logger_1.default.info('Token refreshed successfully', { userId: user.id });
    return newTokenPair;
});
exports.refreshAccessToken = refreshAccessToken;
/**
 * Logout user (revoke refresh token)
 */
const logoutUser = (token) => __awaiter(void 0, void 0, void 0, function* () {
    if (!token) {
        throw (0, errorHandler_1.createError)('Refresh token is required', 400);
    }
    // Revoke the refresh token
    yield models_1.RefreshToken.update({ isRevoked: true }, { where: { token, isRevoked: false } });
    logger_1.default.info('User logged out');
});
exports.logoutUser = logoutUser;
/**
 * Logs out user from all devices by revoking all their refresh tokens
 */
const logoutAllDevices = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw (0, errorHandler_1.createError)('User ID is required', 400);
    }
    yield revokeUserTokens(userId);
    logger_1.default.info('User logged out from all devices', { userId });
});
exports.logoutAllDevices = logoutAllDevices;
/**
 * Initiate Forgot Password flow
 */
const forgotPassword = (email) => __awaiter(void 0, void 0, void 0, function* () {
    if (!email) {
        throw (0, errorHandler_1.createError)('Email is required', 400);
    }
    const user = yield models_1.User.findOne({ where: { email } });
    if (!user) {
        logger_1.default.info(`Forgot password requested for non-existent email: ${email}`);
        return;
    }
    // Generate OTP
    const otp = (0, otp_utils_1.generateOtp)();
    // Hash OTP for storage
    const otpHash = yield (0, password_utils_1.hashPassword)(otp);
    // Set expiry (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    // Update user
    yield user.update({
        resetPasswordOtp: otpHash,
        resetPasswordOtpExpires: expiresAt,
    });
    // LOG OTP TO CONSOLE FOR DEVELOPMENT/TESTING ONLY
    if (process.env.NODE_ENV === 'development') {
        logger_1.default.info('================================================');
        logger_1.default.info(`Password Reset OTP for ${email}: ${otp}`);
        logger_1.default.info('================================================');
    }
    // Send password reset email (non-blocking)
    (0, email_service_1.sendPasswordResetEmail)(user.email, user.firstName, otp, 10).catch((error) => {
        logger_1.default.error('Failed to send password reset email', { userId: user.id, error });
    });
    logger_1.default.info(`Forgot password OTP generated and email sent`, { userId: user.id });
});
exports.forgotPassword = forgotPassword;
/**
 * Verify OTP
 */
const verifyOtp = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    if (!email || !otp) {
        throw (0, errorHandler_1.createError)('Email and OTP are required', 400);
    }
    const user = yield models_1.User.findOne({ where: { email } });
    if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
        return false;
    }
    // Check expiry
    if (new Date() > user.resetPasswordOtpExpires) {
        return false;
    }
    // Verify OTP hash
    return yield (0, password_utils_1.comparePassword)(otp, user.resetPasswordOtp);
});
exports.verifyOtp = verifyOtp;
/**
 * Reset Password
 */
const resetPassword = (email, otp, newPassword) => __awaiter(void 0, void 0, void 0, function* () {
    if (!email || !otp || !newPassword) {
        throw (0, errorHandler_1.createError)('Email, OTP, and new password are required', 400);
    }
    const isValidOtp = yield (0, exports.verifyOtp)(email, otp);
    if (!isValidOtp) {
        throw (0, errorHandler_1.createError)('Invalid or expired OTP', 400);
    }
    const user = yield models_1.User.findOne({ where: { email } });
    if (!user) {
        throw (0, errorHandler_1.createError)('User not found', 404);
    }
    // Hash new password
    const passwordHash = yield (0, password_utils_1.hashPassword)(newPassword);
    // Update password and clear OTP
    yield user.update({
        passwordHash,
        resetPasswordOtp: null,
        resetPasswordOtpExpires: null,
    });
    // Revoke all sessions
    yield revokeUserTokens(user.id);
    logger_1.default.info(`Password reset successfully`, { userId: user.id });
});
exports.resetPassword = resetPassword;
//# sourceMappingURL=auth.service.js.map