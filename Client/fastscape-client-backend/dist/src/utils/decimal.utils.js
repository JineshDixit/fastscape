"use strict";
/**
 * Decimal Utilities
 * Safe decimal operations for financial calculations
 * Avoids floating-point precision issues
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatAmount = exports.calculatePercentage = exports.fromCents = exports.toCents = exports.isLessDecimal = exports.isLessOrEqualDecimal = exports.isGreaterDecimal = exports.isGreaterOrEqualDecimal = exports.isEqualDecimal = exports.compareDecimal = exports.divideDecimal = exports.multiplyDecimal = exports.subtractDecimal = exports.addDecimal = exports.roundDecimal = void 0;
/**
 * Round a number to specified decimal places
 */
const roundDecimal = (value, decimals = 2) => {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
};
exports.roundDecimal = roundDecimal;
/**
 * Add two decimal numbers safely
 */
const addDecimal = (a, b, decimals = 2) => {
    return (0, exports.roundDecimal)(a + b, decimals);
};
exports.addDecimal = addDecimal;
/**
 * Subtract two decimal numbers safely
 */
const subtractDecimal = (a, b, decimals = 2) => {
    return (0, exports.roundDecimal)(a - b, decimals);
};
exports.subtractDecimal = subtractDecimal;
/**
 * Multiply two decimal numbers safely
 */
const multiplyDecimal = (a, b, decimals = 2) => {
    return (0, exports.roundDecimal)(a * b, decimals);
};
exports.multiplyDecimal = multiplyDecimal;
/**
 * Divide two decimal numbers safely
 */
const divideDecimal = (a, b, decimals = 2) => {
    if (b === 0) {
        throw new Error('Division by zero');
    }
    return (0, exports.roundDecimal)(a / b, decimals);
};
exports.divideDecimal = divideDecimal;
/**
 * Compare two decimal numbers with tolerance
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
const compareDecimal = (a, b, delta = 0.01) => {
    const diff = a - b;
    if (Math.abs(diff) < delta) {
        return 0; // Equal within tolerance
    }
    return diff > 0 ? 1 : -1;
};
exports.compareDecimal = compareDecimal;
/**
 * Check if two decimal numbers are equal within tolerance
 */
const isEqualDecimal = (a, b, delta = 0.01) => {
    return (0, exports.compareDecimal)(a, b, delta) === 0;
};
exports.isEqualDecimal = isEqualDecimal;
/**
 * Check if a >= b within tolerance
 */
const isGreaterOrEqualDecimal = (a, b, delta = 0.01) => {
    return (0, exports.compareDecimal)(a, b, delta) >= 0;
};
exports.isGreaterOrEqualDecimal = isGreaterOrEqualDecimal;
/**
 * Check if a > b within tolerance
 */
const isGreaterDecimal = (a, b, delta = 0.01) => {
    return (0, exports.compareDecimal)(a, b, delta) > 0;
};
exports.isGreaterDecimal = isGreaterDecimal;
/**
 * Check if a <= b within tolerance
 */
const isLessOrEqualDecimal = (a, b, delta = 0.01) => {
    return (0, exports.compareDecimal)(a, b, delta) <= 0;
};
exports.isLessOrEqualDecimal = isLessOrEqualDecimal;
/**
 * Check if a < b within tolerance
 */
const isLessDecimal = (a, b, delta = 0.01) => {
    return (0, exports.compareDecimal)(a, b, delta) < 0;
};
exports.isLessDecimal = isLessDecimal;
/**
 * Convert amount to cents (for Stripe and other payment gateways)
 */
const toCents = (amount) => {
    return Math.round(amount * 100);
};
exports.toCents = toCents;
/**
 * Convert cents to amount
 */
const fromCents = (cents) => {
    return (0, exports.roundDecimal)(cents / 100, 2);
};
exports.fromCents = fromCents;
/**
 * Calculate percentage of an amount
 */
const calculatePercentage = (amount, percentage, decimals = 2) => {
    return (0, exports.roundDecimal)((amount * percentage) / 100, decimals);
};
exports.calculatePercentage = calculatePercentage;
/**
 * Format amount for display
 */
const formatAmount = (amount, currency = 'USD', decimals = 2) => {
    return `${currency} ${(0, exports.roundDecimal)(amount, decimals).toFixed(decimals)}`;
};
exports.formatAmount = formatAmount;
//# sourceMappingURL=decimal.utils.js.map