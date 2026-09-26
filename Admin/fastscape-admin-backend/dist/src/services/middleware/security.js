"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySecurityMiddlewares = exports.preventParameterPollution = exports.sanitizeInput = exports.securityHeaders = void 0;
/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:");
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.removeHeader('X-Powered-By');
    next();
};
exports.securityHeaders = securityHeaders;
/**
 * Sanitize request body to prevent XSS
 */
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        // Recursively sanitize all string values in the request body
        req.body = sanitizeObject(req.body);
    }
    next();
};
exports.sanitizeInput = sanitizeInput;
/**
 * Recursively sanitize an object
 */
const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                sanitized[key] = sanitizeObject(obj[key]);
            }
        }
        return sanitized;
    }
    return obj;
};
/**
 * Sanitize a string to prevent XSS
 */
const sanitizeString = (str) => {
    return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};
/**
 * Prevent parameter pollution
 */
const preventParameterPollution = (req, res, next) => {
    // Convert array parameters to single values (take the last one)
    if (req.query) {
        for (const key in req.query) {
            if (Array.isArray(req.query[key])) {
                req.query[key] = req.query[key].pop();
            }
        }
    }
    next();
};
exports.preventParameterPollution = preventParameterPollution;
/**
 * Grouped security middlewares for convenience
 */
exports.applySecurityMiddlewares = [exports.securityHeaders, exports.preventParameterPollution, exports.sanitizeInput];
//# sourceMappingURL=security.js.map