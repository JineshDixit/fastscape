"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSecureToken = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateTokenPair = exports.generateRefreshToken = exports.generateAccessToken = void 0;
require("../config/env/envConfig");
const jwt = __importStar(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate access token
 */
const generateAccessToken = (payload) => {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const expiresIn = process.env.ACCESS_TOKEN_EXPIRY || '15m';
    if (!accessSecret) {
        throw new Error('JWT_ACCESS_SECRET is not defined');
    }
    return jwt.sign(Object.assign(Object.assign({}, payload), { type: 'access' }), accessSecret, { expiresIn });
};
exports.generateAccessToken = generateAccessToken;
/**
 * Generate refresh token
 */
const generateRefreshToken = (payload) => {
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    const expiresIn = process.env.REFRESH_TOKEN_EXPIRY || '7d';
    if (!refreshSecret) {
        throw new Error('JWT_REFRESH_SECRET is not defined');
    }
    return jwt.sign(Object.assign(Object.assign({}, payload), { type: 'refresh' }), refreshSecret, { expiresIn });
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Generate both access and refresh tokens
 */
const generateTokenPair = (payload) => {
    const accessToken = (0, exports.generateAccessToken)(payload);
    const refreshToken = (0, exports.generateRefreshToken)(payload);
    // Get expiry times from environment variables (same as used in token generation)
    const accessExpiryMs = parseTimeStringToMs(process.env.ACCESS_TOKEN_EXPIRY || '15m');
    const refreshExpiryMs = parseTimeStringToMs(process.env.REFRESH_TOKEN_EXPIRY || '7d');
    // Calculate expiration dates using the same values as JWT tokens
    const accessTokenExpiresAt = new Date(Date.now() + accessExpiryMs);
    const refreshTokenExpiresAt = new Date(Date.now() + refreshExpiryMs);
    return {
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
    };
};
exports.generateTokenPair = generateTokenPair;
/**
 * Parse time string (like '15m', '7d', '1h') to milliseconds
 */
const parseTimeStringToMs = (timeString) => {
    const match = timeString.match(/^(\d+)([smhd])$/);
    if (!match) {
        throw new Error(`Invalid time string format: ${timeString}`);
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
        case 's':
            return value * 1000;
        case 'm':
            return value * 60 * 1000;
        case 'h':
            return value * 60 * 60 * 1000;
        case 'd':
            return value * 24 * 60 * 60 * 1000;
        default:
            throw new Error(`Unknown time unit: ${unit}`);
    }
};
/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    if (!accessSecret) {
        throw new Error('JWT_ACCESS_SECRET is not defined');
    }
    try {
        const decoded = jwt.verify(token, accessSecret);
        if (decoded.type !== 'access') {
            throw new Error('Invalid token type');
        }
        return decoded;
    }
    catch (error) {
        throw new Error('Invalid or expired access token');
    }
};
exports.verifyAccessToken = verifyAccessToken;
/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) {
        throw new Error('JWT_REFRESH_SECRET is not defined');
    }
    try {
        const decoded = jwt.verify(token, refreshSecret);
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }
        return decoded;
    }
    catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
/**
 * Generate secure random token for additional security
 */
const generateSecureToken = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
exports.generateSecureToken = generateSecureToken;
//# sourceMappingURL=jwt.utils.js.map