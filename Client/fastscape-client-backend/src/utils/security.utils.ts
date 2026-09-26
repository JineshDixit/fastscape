import crypto from 'crypto';

/**
 * Generate a secure random string
 */
export const generateSecureRandomString = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash a string using SHA-256
 */
export const hashString = (input: string): string => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

/**
 * Sanitize email input
 */
export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if password meets security requirements
 */
export const isStrongPassword = (password: string): boolean => {
  // At least 8 chars, one uppercase, one lowercase, one number, one special char; no spaces.
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])[^\s]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Generate a secure session ID
 */
export const generateSessionId = (): string => {
  return generateSecureRandomString(64);
};

/**
 * Constant time string comparison to prevent timing attacks
 */
export const constantTimeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
};
