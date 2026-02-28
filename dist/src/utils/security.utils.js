"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.constantTimeCompare = exports.generateSessionId = exports.isStrongPassword = exports.isValidEmail = exports.sanitizeEmail = exports.hashString = exports.generateSecureRandomString = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate a secure random string
 */
const generateSecureRandomString = (length = 32) => {
    return crypto_1.default.randomBytes(length).toString('hex');
};
exports.generateSecureRandomString = generateSecureRandomString;
/**
 * Hash a string using SHA-256
 */
const hashString = (input) => {
    return crypto_1.default.createHash('sha256').update(input).digest('hex');
};
exports.hashString = hashString;
/**
 * Sanitize email input
 */
const sanitizeEmail = (email) => {
    return email.toLowerCase().trim();
};
exports.sanitizeEmail = sanitizeEmail;
/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
/**
 * Check if password meets security requirements
 */
const isStrongPassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};
exports.isStrongPassword = isStrongPassword;
/**
 * Generate a secure session ID
 */
const generateSessionId = () => {
    return (0, exports.generateSecureRandomString)(64);
};
exports.generateSessionId = generateSessionId;
/**
 * Constant time string comparison to prevent timing attacks
 */
const constantTimeCompare = (a, b) => {
    if (a.length !== b.length) {
        return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
};
exports.constantTimeCompare = constantTimeCompare;
//# sourceMappingURL=security.utils.js.map