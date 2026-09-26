"use strict";
/**
 * Logging Configuration
 *
 * This file contains configuration for different types of logs and their purposes:
 *
 * 1. AUTH LOGS - Authentication and authorization events
 *    - Login attempts (successful/failed)
 *    - Token refresh events
 *    - Permission checks
 *    - User creation/modification
 *
 * 2. SECURITY LOGS - Security-related events
 *    - Rate limiting violations
 *    - Invalid authentication attempts
 *    - Permission violations
 *    - Suspicious activities
 *
 * 3. API LOGS - HTTP request/response logging
 *    - Request details (method, URL, user, timing)
 *    - Response status codes
 *    - Slow requests (>1000ms)
 *    - Failed requests (4xx, 5xx)
 *
 * 4. DATABASE LOGS - Database operations
 *    - Query execution times
 *    - Database errors
 *    - Connection issues
 *
 * 5. PERFORMANCE LOGS - Performance metrics
 *    - Operation durations
 *    - Resource usage
 *    - Bottleneck identification
 *
 * LOG LEVELS:
 * - error: System errors, exceptions
 * - warn: Warning conditions, security events
 * - info: General information, successful operations
 * - http: HTTP request/response details
 * - debug: Detailed debugging information (dev only)
 *
 * LOG ROTATION:
 * - Files are rotated when they reach 5MB
 * - Keep 5 historical files
 * - Automatic cleanup of old logs
 *
 * SECURITY CONSIDERATIONS:
 * - Sensitive data (passwords, tokens) are never logged
 * - PII is masked or excluded
 * - Production logs exclude debug information
 * - Log files are secured with appropriate permissions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOG_CONFIG = void 0;
exports.LOG_CONFIG = {
    // Log levels by environment
    levels: {
        development: 'debug',
        production: 'warn',
        test: 'error',
    },
    // File rotation settings
    rotation: {
        maxSize: 5242880, // 5MB
        maxFiles: 5,
    },
    // Log directories
    directories: {
        logs: 'logs',
        error: 'logs/error.log',
        combined: 'logs/combined.log',
        auth: 'logs/auth.log',
        security: 'logs/security.log',
        performance: 'logs/performance.log',
    },
    // Fields to exclude from logs (security)
    excludeFields: [
        'password',
        'passwordHash',
        'token',
        'refreshToken',
        'accessToken',
        'authorization',
        'cookie',
        'x-auth-token',
    ],
    // Performance thresholds
    performance: {
        slowRequestThreshold: 1000, // ms
        slowDatabaseQueryThreshold: 500, // ms
        slowOperationThreshold: 2000, // ms
    },
    // Security event severity levels
    securitySeverity: {
        low: ['rate_limit_warning', 'invalid_input'],
        medium: ['authentication_failed', 'permission_denied', 'duplicate_admin_creation_attempt'],
        high: ['multiple_failed_logins', 'token_manipulation', 'privilege_escalation_attempt'],
        critical: ['system_compromise', 'data_breach_attempt', 'admin_account_takeover'],
    },
};
//# sourceMappingURL=logConfig.js.map