"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preventParameterPollution = exports.sanitizeInput = void 0;
/**
 * Sanitize request body to prevent XSS
 */
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        // Recursively sanitize all string values in the request body
        // Limit recursion depth to 5 to prevent stack overflow
        req.body = sanitizeObject(req.body, 0, 5);
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
/**
 * Recursively sanitize an object
 */
const sanitizeObject = (obj, depth, maxDepth) => {
    if (depth > maxDepth) {
        return obj;
    }
    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeObject(item, depth + 1, maxDepth));
    }
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                sanitized[key] = sanitizeObject(obj[key], depth + 1, maxDepth);
            }
        }
        return sanitized;
    }
    return obj;
};
/**
 * Sanitize a string to prevent XSS
 * Uses a single replace with a map for better performance
 */
const sanitizeString = (str) => {
    const map = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };
    return str.replace(/[<>"'/]/g, (match) => map[match]);
};
/**
 * Prevent parameter pollution
 */
const preventParameterPollution = (req, res, next) => {
    // Convert array parameters to single values (take the last one)
    // EXCEPT for specific filters that support multiple values
    const allowArrays = ['make', 'model', 'bodyType'];
    if (req.query) {
        for (const key in req.query) {
            if (Array.isArray(req.query[key]) && !allowArrays.includes(key)) {
                req.query[key] = req.query[key].pop();
            }
        }
    }
    next();
};
exports.preventParameterPollution = preventParameterPollution;
//# sourceMappingURL=security.js.map