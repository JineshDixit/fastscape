"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeBookingDates = exports.validateArrayLength = exports.sanitizeString = exports.validateNumericRange = exports.validatePhone = exports.validateEmail = exports.validateDateRange = exports.validateUUID = exports.validateRequiredFields = void 0;
const errorHandler_1 = require("../services/middleware/errorHandler");
/**
 * Validate required fields
 */
const validateRequiredFields = (data, requiredFields) => {
    const missingFields = requiredFields.filter((field) => data[field] === undefined || data[field] === null || data[field] === '');
    if (missingFields.length > 0) {
        throw (0, errorHandler_1.createError)(`Missing required fields: ${missingFields.join(', ')}`, 400);
    }
};
exports.validateRequiredFields = validateRequiredFields;
/**
 * Validate UUID format
 */
const validateUUID = (id, fieldName = 'ID') => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!id || !uuidRegex.test(id)) {
        throw (0, errorHandler_1.createError)(`Invalid ${fieldName} format`, 400);
    }
};
exports.validateUUID = validateUUID;
/**
 * Validate date range
 */
const validateDateRange = (startDate, endDate, allowPastDates = false, allowSameDay = false) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw (0, errorHandler_1.createError)('Invalid date format', 400);
    }
    const isInvalidRange = allowSameDay ? start > end : start >= end;
    if (isInvalidRange) {
        throw (0, errorHandler_1.createError)('End date must be after start date', 400);
    }
    if (!allowPastDates && start < new Date(now.setHours(0, 0, 0, 0))) {
        throw (0, errorHandler_1.createError)('Start date cannot be in the past', 400);
    }
    return { start, end };
};
exports.validateDateRange = validateDateRange;
/**
 * Validate email format
 */
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        throw (0, errorHandler_1.createError)('Invalid email format', 400);
    }
};
exports.validateEmail = validateEmail;
/**
 * Validate phone number format
 */
const validatePhone = (phone) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phone || !phoneRegex.test(phone)) {
        throw (0, errorHandler_1.createError)('Invalid phone number format', 400);
    }
};
exports.validatePhone = validatePhone;
/**
 * Validate numeric range
 */
const validateNumericRange = (value, min, max, fieldName) => {
    if (isNaN(value) || value < min || value > max) {
        throw (0, errorHandler_1.createError)(`${fieldName} must be between ${min} and ${max}`, 400);
    }
};
exports.validateNumericRange = validateNumericRange;
/**
 * Sanitize string input
 */
const sanitizeString = (input) => {
    return (input === null || input === void 0 ? void 0 : input.trim().replace(/[<>]/g, '')) || '';
};
exports.sanitizeString = sanitizeString;
/**
 * Validate array length
 */
const validateArrayLength = (array, minLength, maxLength, fieldName) => {
    if (!Array.isArray(array) || array.length < minLength || array.length > maxLength) {
        throw (0, errorHandler_1.createError)(`${fieldName} must contain between ${minLength} and ${maxLength} items`, 400);
    }
};
exports.validateArrayLength = validateArrayLength;
/**
 * Normalize booking dates to UTC full-day blocks (start of day to start of next day)
 */
const normalizeBookingDates = (startDate, endDate) => {
    // Validate - allow same day as it will be normalized to 1 full day
    const { start: startRaw, end: endRaw } = (0, exports.validateDateRange)(startDate, endDate, false, true);
    // Normalize to UTC full days
    const start = new Date(Date.UTC(startRaw.getUTCFullYear(), startRaw.getUTCMonth(), startRaw.getUTCDate(), 0, 0, 0, 0));
    const end = new Date(Date.UTC(endRaw.getUTCFullYear(), endRaw.getUTCMonth(), endRaw.getUTCDate() + 1, 0, 0, 0, 0));
    return { start, end };
};
exports.normalizeBookingDates = normalizeBookingDates;
//# sourceMappingURL=validation.utils.js.map