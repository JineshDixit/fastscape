import '../config/env/envConfig'
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JwtPayload, TokenPair } from '../common/interfaces/jwtInterfaces';

/**
 * Generate access token
 */
export const generateAccessToken = (payload: Omit<JwtPayload, 'type'>): string => {
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRY || '15m';

  if (!accessSecret) {
    throw new Error('JWT_ACCESS_SECRET is not defined');
  }

  return jwt.sign(
    { ...payload, type: 'access' as const },
    accessSecret,
    { expiresIn } as jwt.SignOptions
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: Omit<JwtPayload, 'type'>): string => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRY || '7d';

  if (!refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  return jwt.sign(
    { ...payload, type: 'refresh' as const },
    refreshSecret,
    { expiresIn } as jwt.SignOptions
  );
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (payload: Omit<JwtPayload, 'type'>): TokenPair => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Calculate expiration dates based on environment variables
  const accessExpiryMs = parseTimeStringToMs(process.env.ACCESS_TOKEN_EXPIRY || '15m');
  const refreshExpiryMs = parseTimeStringToMs(process.env.REFRESH_TOKEN_EXPIRY || '7d');
  
  const accessTokenExpiresAt = new Date(Date.now() + accessExpiryMs);
  const refreshTokenExpiresAt = new Date(Date.now() + refreshExpiryMs);

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  };
};

/**
 * Parse time string (like '15m', '7d', '1h') to milliseconds
 */
const parseTimeStringToMs = (timeString: string): number => {
  const match = timeString.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid time string format: ${timeString}`);
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: throw new Error(`Unknown time unit: ${unit}`);
  }
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  const accessSecret = process.env.JWT_ACCESS_SECRET;

  if (!accessSecret) {
    throw new Error('JWT_ACCESS_SECRET is not defined');
  }

  try {
    const decoded = jwt.verify(token, accessSecret) as JwtPayload;
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }

  try {
    const decoded = jwt.verify(token, refreshSecret) as JwtPayload;
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Generate secure random token for additional security
 */
export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};