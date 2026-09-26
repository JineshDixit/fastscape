"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const logger_utils_1 = require("../../utils/logger.utils");
/**
 * Middleware to log API requests with timing and user context
 */
const requestLogger = (req, res, next) => {
    var _a;
    const startTime = Date.now();
    req.startTime = startTime;
    // Log incoming request
    logger_utils_1.apiLogger.http('Incoming Request', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (_a = req.adminUser) === null || _a === void 0 ? void 0 : _a.id,
        timestamp: new Date().toISOString(),
    });
    // Override res.end to capture response details
    const originalEnd = res.end;
    res.end = function (chunk, encoding, cb) {
        var _a, _b, _c;
        const duration = Date.now() - startTime;
        // Log API request completion
        (0, logger_utils_1.logApiRequest)(req.method, req.originalUrl, (_a = req.adminUser) === null || _a === void 0 ? void 0 : _a.id, duration, res.statusCode);
        // Log slow requests
        if (duration > 1000) {
            logger_utils_1.apiLogger.warn('Slow Request', {
                method: req.method,
                url: req.originalUrl,
                duration,
                statusCode: res.statusCode,
                userId: (_b = req.adminUser) === null || _b === void 0 ? void 0 : _b.id,
                timestamp: new Date().toISOString(),
            });
        }
        // Log failed requests
        if (res.statusCode >= 400) {
            logger_utils_1.apiLogger.warn('Failed Request', {
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                duration,
                userId: (_c = req.adminUser) === null || _c === void 0 ? void 0 : _c.id,
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date().toISOString(),
            });
        }
        return originalEnd.call(this, chunk, encoding, cb);
    };
    next();
};
exports.requestLogger = requestLogger;
//# sourceMappingURL=requestLogger.js.map