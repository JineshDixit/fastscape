import rateLimit from 'express-rate-limit';

/**
 * Factory function to create a rate limiter
 */
const createLimiter = (max: number, message: string, windowMs: number = 15 * 60 * 1000) => rateLimit({
  windowMs,
  max,
  message: {
    success: false,
    message,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for authentication endpoints
export const authLimiter = createLimiter(10, 'Too many authentication attempts, please try again later.');

// Rate limiter for general API endpoints
export const generalLimiter = createLimiter(100, 'Too many requests, please try again later.');

// Rate limiter for refresh token endpoint
export const refreshTokenLimiter = createLimiter(10, 'Too many token refresh attempts, please try again later.');