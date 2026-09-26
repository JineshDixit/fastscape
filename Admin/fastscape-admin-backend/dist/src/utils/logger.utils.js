"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logPerformance = exports.logDatabaseOperation = exports.logApiRequest = exports.logSecurityEvent = exports.logAuthEvent = exports.performanceLogger = exports.securityLogger = exports.apiLogger = exports.dbLogger = exports.authLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Define colors for each level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
// Tell winston that you want to link the colors
winston_1.default.addColors(colors);
// Define which level to log based on environment
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};
// Define different log formats
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.colorize({ all: true }), winston_1.default.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
const fileLogFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
// Define transports
const transports = [
    // Console transport
    new winston_1.default.transports.Console({
        format: logFormat,
    }),
    // Error log file
    new winston_1.default.transports.File({
        filename: path_1.default.join('logs', 'error.log'),
        level: 'error',
        format: fileLogFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
    // Combined log file
    new winston_1.default.transports.File({
        filename: path_1.default.join('logs', 'combined.log'),
        format: fileLogFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }),
];
// Create the logger
const Logger = winston_1.default.createLogger({
    level: level(),
    levels,
    transports,
    exitOnError: false,
});
// Create specialized loggers for different components
exports.authLogger = Logger.child({ service: 'auth' });
exports.dbLogger = Logger.child({ service: 'database' });
exports.apiLogger = Logger.child({ service: 'api' });
exports.securityLogger = Logger.child({ service: 'security' });
exports.performanceLogger = Logger.child({ service: 'performance' });
// Helper functions for structured logging
const logAuthEvent = (event, userId, details) => {
    exports.authLogger.info('Auth Event', Object.assign({ event,
        userId, timestamp: new Date().toISOString() }, details));
};
exports.logAuthEvent = logAuthEvent;
const logSecurityEvent = (event, severity, details) => {
    exports.securityLogger.warn('Security Event', Object.assign({ event,
        severity, timestamp: new Date().toISOString() }, details));
};
exports.logSecurityEvent = logSecurityEvent;
const logApiRequest = (method, url, userId, duration, statusCode) => {
    exports.apiLogger.http('API Request', {
        method,
        url,
        userId,
        duration,
        statusCode,
        timestamp: new Date().toISOString(),
    });
};
exports.logApiRequest = logApiRequest;
const logDatabaseOperation = (operation, table, duration, error) => {
    if (error) {
        exports.dbLogger.error('Database Error', {
            operation,
            table,
            duration,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
        });
    }
    else {
        exports.dbLogger.debug('Database Operation', {
            operation,
            table,
            duration,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.logDatabaseOperation = logDatabaseOperation;
const logPerformance = (operation, duration, details) => {
    const level = duration > 1000 ? 'warn' : 'info';
    exports.performanceLogger.log(level, 'Performance Metric', Object.assign({ operation,
        duration, timestamp: new Date().toISOString() }, details));
};
exports.logPerformance = logPerformance;
exports.default = Logger;
//# sourceMappingURL=logger.utils.js.map