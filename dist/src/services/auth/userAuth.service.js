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
exports.logoutAllDevices = exports.logoutUser = exports.refreshToken = exports.loginUser = exports.registerUser = void 0;
const models_1 = require("../../models");
const jwt_utils_1 = require("../../utils/jwt.utils");
const password_utils_1 = require("../../utils/password.utils");
const security_utils_1 = require("../../utils/security.utils");
/**
 * Registers a new user
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise resolving to void
 *
 * Request body must contain the following fields:
 * - `fullName`: User full name
 * - `dateOfBirth`: User date of birth (ISO string)
 * - `nationality`: User nationality
 * - `email`: User email
 * - `phone`: User phone number
 * - `password`: User password
 * - `homeAddress`: User home address (optional)
 *
 * Response will contain the following fields:
 * - `success`: Boolean indicating success of the operation
 * - `message`: String describing the result of the operation
 * - `data`: Object containing user data and tokens
 *
 * User data will contain the following fields:
 * - `id`: User ID
 * - `fullName`: User full name
 * - `email`: User email
 * - `phone`: User phone number
 * - `nationality`: User nationality
 *
 * Tokens will contain the following fields:
 * - `accessToken`: Access token
 * - `refreshToken`: Refresh token
 * - `accessTokenExpiresAt`: Expiration date of the access token
 * - `refreshTokenExpiresAt`: Expiration date of the refresh token
 */
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fullName, dateOfBirth, nationality, email: rawEmail, phone, password, homeAddress } = req.body;
        const email = (0, security_utils_1.sanitizeEmail)(rawEmail);
        // Validate required fields
        if (!fullName || !dateOfBirth || !nationality || !email || !phone || !password) {
            res.status(400).json({
                success: false,
                message: 'All required fields must be provided',
            });
            return;
        }
        // Check if user already exists
        const existingUser = yield models_1.User.findOne({ where: { email } });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'User with this email already exists',
            });
            return;
        }
        // Hash password
        const passwordHash = yield (0, password_utils_1.hashPassword)(password);
        // Create user
        const user = yield models_1.User.create({
            fullName,
            dateOfBirth: new Date(dateOfBirth),
            nationality,
            email,
            phone,
            passwordHash,
            homeAddress,
            isBlocked: false,
        });
        // Generate tokens
        const tokenPair = (0, jwt_utils_1.generateTokenPair)({
            userId: user.id,
            email: user.email,
        });
        // Store refresh token in database
        yield models_1.RefreshToken.create({
            userId: user.id,
            token: tokenPair.refreshToken,
            expiresAt: tokenPair.refreshTokenExpiresAt,
            isRevoked: false,
        });
        const response = {
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                nationality: user.nationality,
            },
            tokens: tokenPair,
        };
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: response,
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
exports.registerUser = registerUser;
/**
 * Login user and generate new access and refresh tokens
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise resolving to void
 *
 * Request body must contain the following fields:
 * - `email`: User email
 * - `password`: User password
 *
 * Response will contain the following fields:
 * - `success`: Boolean indicating success of the operation
 * - `message`: String describing the result of the operation
 * - `data`: Object containing user data and tokens
 *
 * User data will contain the following fields:
 * - `id`: User ID
 * - `fullName`: User full name
 * - `email`: User email
 * - `phone`: User phone number
 * - `nationality`: User nationality
 *
 * Tokens will contain the following fields:
 * - `accessToken`: Access token
 * - `refreshToken`: Refresh token
 * - `accessTokenExpiresAt`: Expiration date of the access token
 * - `refreshTokenExpiresAt`: Expiration date of the refresh token
 */
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email: rawEmail, password } = req.body;
        const email = (0, security_utils_1.sanitizeEmail)(rawEmail);
        // Validate required fields
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
            return;
        }
        // Find user by email
        const user = yield models_1.User.findOne({ where: { email } });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
            return;
        }
        // Check if user is blocked
        if (user.isBlocked) {
            res.status(403).json({
                success: false,
                message: 'Account is blocked. Please contact support.',
            });
            return;
        }
        // Verify password
        const isPasswordValid = yield (0, password_utils_1.comparePassword)(password, user.passwordHash);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
            return;
        }
        // Revoke existing refresh tokens for security
        yield models_1.RefreshToken.update({ isRevoked: true }, { where: { userId: user.id, isRevoked: false } });
        // Generate new tokens
        const tokenPair = (0, jwt_utils_1.generateTokenPair)({
            userId: user.id,
            email: user.email,
        });
        // Store new refresh token
        yield models_1.RefreshToken.create({
            userId: user.id,
            token: tokenPair.refreshToken,
            expiresAt: tokenPair.refreshTokenExpiresAt,
            isRevoked: false,
        });
        const response = {
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                nationality: user.nationality,
            },
            tokens: tokenPair,
        };
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: response,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
exports.loginUser = loginUser;
/**
 * Refresh access and refresh tokens
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise resolving to void
 *
 * Request body must contain the following fields:
 * - `refreshToken`: Refresh token
 *
 * Response will contain the following fields:
 * - `success`: Boolean indicating success of the operation
 * - `message`: String describing the result of the operation
 * - `data`: Object containing new access and refresh tokens
 *
 * Tokens will contain the following fields:
 * - `accessToken`: Access token
 * - `refreshToken`: Refresh token
 * - `accessTokenExpiresAt`: Expiration date of the access token
 * - `refreshTokenExpiresAt`: Expiration date of the refresh token
 */
const refreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken: token } = req.body;
        if (!token) {
            res.status(400).json({
                success: false,
                message: 'Refresh token is required',
            });
            return;
        }
        // Verify refresh token
        let decoded;
        try {
            decoded = (0, jwt_utils_1.verifyRefreshToken)(token);
        }
        catch (error) {
            res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token',
            });
            return;
        }
        // Check if refresh token exists in database and is not revoked
        const storedToken = yield models_1.RefreshToken.findOne({
            where: {
                token,
                userId: decoded.userId,
                isRevoked: false,
            },
        });
        if (!storedToken) {
            res.status(401).json({
                success: false,
                message: 'Refresh token not found or revoked',
            });
            return;
        }
        // Check if token is expired
        if (storedToken.expiresAt < new Date()) {
            // Mark as revoked
            yield storedToken.update({ isRevoked: true });
            res.status(401).json({
                success: false,
                message: 'Refresh token expired',
            });
            return;
        }
        // Get user details
        const user = yield models_1.User.findByPk(decoded.userId);
        if (!user || user.isBlocked) {
            res.status(401).json({
                success: false,
                message: 'User not found or blocked',
            });
            return;
        }
        // Revoke old refresh token
        yield storedToken.update({ isRevoked: true });
        // Generate new token pair
        const newTokenPair = (0, jwt_utils_1.generateTokenPair)({
            userId: user.id,
            email: user.email,
        });
        // Store new refresh token
        yield models_1.RefreshToken.create({
            userId: user.id,
            token: newTokenPair.refreshToken,
            expiresAt: newTokenPair.refreshTokenExpiresAt,
            isRevoked: false,
        });
        const response = newTokenPair;
        res.status(200).json({
            success: true,
            message: 'Tokens refreshed successfully',
            data: response,
        });
    }
    catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
exports.refreshToken = refreshToken;
/**
 * Logout user and revoke the refresh token
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>} - Promise resolving to void
 *
 * Request body must contain the following fields:
 * - `refreshToken`: Refresh token
 *
 * Response will contain the following fields:
 * - `success`: Boolean indicating success of the operation
 * - `message`: String describing the result of the operation
 */
const logoutUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { refreshToken: token } = req.body;
        if (!token) {
            res.status(400).json({
                success: false,
                message: 'Refresh token is required',
            });
            return;
        }
        // Revoke the refresh token
        yield models_1.RefreshToken.update({ isRevoked: true }, { where: { token, isRevoked: false } });
        res.status(200).json({
            success: true,
            message: 'Logout successful',
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
exports.logoutUser = logoutUser;
/**
 * Logout user from all devices
 *
 * Revokes all refresh tokens for the user and logs them out from all devices
 *
 * @param {AuthenticatedRequest} req - Express request object with user authentication
 * @param {Response} res - Express response object
 *
 * @returns {Promise<void>} - Promise resolving to void
 *
 * Response will contain the following fields:
 * - `success`: Boolean indicating success of the operation
 * - `message`: String describing the result of the operation
 */
const logoutAllDevices = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
            return;
        }
        // Revoke all refresh tokens for the user
        yield models_1.RefreshToken.update({ isRevoked: true }, { where: { userId, isRevoked: false } });
        res.status(200).json({
            success: true,
            message: 'Logged out from all devices successfully',
        });
    }
    catch (error) {
        console.error('Logout all devices error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
exports.logoutAllDevices = logoutAllDevices;
//# sourceMappingURL=userAuth.service.js.map