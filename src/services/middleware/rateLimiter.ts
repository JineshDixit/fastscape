import rateLimit, { Options } from 'express-rate-limit';

// Factory function to create rate limiters
const createRateLimiter = (options: Partial<Options> & { messageStr: string }) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes default
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
    message: {
      success: false,
      message: options.messageStr,
    },
  });
};

// Rate limiter for authentication endpoints
export const authLimiter = createRateLimiter({
  max: 500,
  messageStr: 'Too many authentication attempts, please try again later.',
});

// Rate limiter for general API endpoints
export const generalLimiter = createRateLimiter({
  max: 500,
  messageStr: 'Too many requests, please try again later.',
});

// Rate limiter for refresh token endpoint
export const refreshTokenLimiter = createRateLimiter({
  max: 100,
  messageStr: 'Too many token refresh attempts, please try again later.',
});

// Rate limiter for public contact endpoint
export const contactLimiter = createRateLimiter({
  max: 100,
  messageStr: 'Too many contact requests, please try again later.',
});
