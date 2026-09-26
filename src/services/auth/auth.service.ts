import { UniqueConstraintError } from 'sequelize';
import { User, RefreshToken } from '../../models';
import { LoginRequest, RegisterRequest, AuthResponse, RefreshTokenResponse } from '../../common/types/authTypes';
import { TokenPair } from '../../common/types/jwtTypes';
import { generateTokenPair, verifyRefreshToken } from '../../utils/jwt.utils';
import { hashPassword, comparePassword } from '../../utils/password.utils';
import { sanitizeEmail } from '../../utils/security.utils';
import { createError } from '../middleware/errorHandler';
import { validateRequiredFields, validateEmail } from '../../utils/validation.utils';
import Logger from '../../utils/logger';
import { generateOtp } from '../../utils/otp.utils';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../email/email.service';

/**
 * Create and store refresh token
 */
const createRefreshToken = async (userId: string, token: string, expiresAt: Date): Promise<void> => {
  await RefreshToken.create({
    userId,
    token,
    expiresAt,
    isRevoked: false,
  });
};

/**
 * Generate a token pair and store it, retrying on the rare chance of a
 * refresh-token collision (e.g. concurrent refreshes in the same second).
 */
const issueAndStoreTokenPair = async (userId: string, email: string): Promise<TokenPair> => {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const tokenPair = generateTokenPair({ userId, email });

    try {
      await createRefreshToken(userId, tokenPair.refreshToken, tokenPair.refreshTokenExpiresAt);
      return tokenPair;
    } catch (error: any) {
      const isUniqueViolation =
        error instanceof UniqueConstraintError || error?.name === 'SequelizeUniqueConstraintError' || error?.parent?.code === '23505';

      if (isUniqueViolation && attempt < maxAttempts) {
        Logger.warn('Refresh token collision detected, retrying issuance', { userId, attempt, maxAttempts });
        continue;
      }

      throw error;
    }
  }

  throw createError('Failed to issue refresh token', 500);
};

/**
 * Revoke user's refresh tokens
 */
const revokeUserTokens = async (userId: string): Promise<void> => {
  await RefreshToken.update({ isRevoked: true }, { where: { userId, isRevoked: false } });
};

/**
 * Format user response (exclude sensitive data)
 */
const formatUserResponse = (user: User) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  nationality: user.nationality,
});

/**
 * Registers a new user
 */
export const registerUser = async (registerData: RegisterRequest): Promise<AuthResponse> => {
  const { firstName, lastName, dateOfBirth, nationality, email: rawEmail, phone, password } = registerData;

  // Validate required fields
  validateRequiredFields(registerData, [
    'firstName',
    'lastName',
    'dateOfBirth',
    'nationality',
    'email',
    'phone',
    'password',
  ]);

  const email = sanitizeEmail(rawEmail);
  validateEmail(email);

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    Logger.warn('Registration attempt with existing email', { email });
    throw createError('User with this email already exists', 409);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    dateOfBirth: new Date(dateOfBirth),
    nationality,
    email,
    phone,
    passwordHash,
    isBlocked: false,
    resetPasswordOtp: null,
    resetPasswordOtpExpires: null,
  });

  // Generate and store refresh token with collision retry
  const tokenPair = await issueAndStoreTokenPair(user.id, user.email);

  Logger.info('User registered successfully', { userId: user.id, email: user.email });

  // Send welcome email (non-blocking)
  sendWelcomeEmail(user.email, user.firstName, user.lastName, user.email).catch((error) => {
    Logger.error('Failed to send welcome email', { userId: user.id, error });
  });

  return {
    user: formatUserResponse(user),
    tokens: tokenPair,
  };
};

/**
 * Logs in a user and generates a new access and refresh token pair
 */
export const loginUser = async (loginData: LoginRequest): Promise<AuthResponse> => {
  const { email: rawEmail, password } = loginData;

  // Validate required fields
  validateRequiredFields(loginData, ['email', 'password']);

  const email = sanitizeEmail(rawEmail);
  validateEmail(email);

  // Find user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    Logger.warn('Login failed: User not found', { email });
    throw createError('Invalid credentials', 401);
  }

  // Check if user is blocked
  if (user.isBlocked) {
    Logger.warn('Login blocked: User account is blocked', { userId: user.id });
    throw createError('Account is blocked. Please contact support.', 403);
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    Logger.warn('Login failed: Invalid password', { userId: user.id });
    throw createError('Invalid credentials', 401);
  }

  // Revoke existing refresh tokens for security
  await revokeUserTokens(user.id);

  // Generate and store refresh token with collision retry
  const tokenPair = await issueAndStoreTokenPair(user.id, user.email);

  Logger.info('User logged in successfully', { userId: user.id });

  return {
    user: formatUserResponse(user),
    tokens: tokenPair,
  };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (token: string): Promise<RefreshTokenResponse> => {
  if (!token) {
    throw createError('Refresh token is required', 400);
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (error) {
    Logger.warn('Token refresh failed: Invalid token');
    throw createError('Invalid or expired refresh token', 401);
  }

  // Check if refresh token exists in database
  const storedToken = await RefreshToken.findOne({
    where: {
      token,
      userId: decoded.userId,
    },
  });

  if (!storedToken) {
    Logger.warn('Token refresh failed: Token not found', { userId: decoded.userId });
    throw createError('Refresh token not found', 401);
  }

  // Check if token is revoked
  if (storedToken.isRevoked) {
    // Implement grace period: if revoked within the last 30 seconds, allow it
    // This handles race conditions when multiple tabs refresh simultaneously
    const GRACE_PERIOD_MS = 30 * 1000; // 30 seconds

    // Check if rotatedAt exists and is within grace period
    if (!storedToken.rotatedAt) {
      // Token was revoked but never rotated (shouldn't happen in normal flow)
      Logger.warn('Token refresh failed: Token revoked without rotation timestamp', {
        userId: decoded.userId,
      });
      throw createError('Refresh token revoked', 401);
    }

    const timeSinceRotation = new Date().getTime() - new Date(storedToken.rotatedAt).getTime();
    const isWithinGracePeriod = timeSinceRotation < GRACE_PERIOD_MS;

    if (!isWithinGracePeriod) {
      Logger.warn('Token refresh failed: Token revoked and grace period expired', {
        userId: decoded.userId,
        rotatedAt: storedToken.rotatedAt,
        timeSinceRotation,
      });
      throw createError('Refresh token revoked', 401);
    }

    Logger.info('Allowing refresh using recently rotated token (grace period)', {
      userId: decoded.userId,
      timeSinceRotation,
    });
  }

  // Check if token is expired
  if (storedToken.expiresAt < new Date()) {
    await storedToken.update({ isRevoked: true });
    Logger.warn('Token refresh failed: Token expired', { userId: decoded.userId });
    throw createError('Refresh token expired', 401);
  }

  // Get user details
  const user = await User.findByPk(decoded.userId);
  if (!user || user.isBlocked) {
    Logger.warn('Token refresh failed: User blocked or not found', { userId: decoded.userId });
    throw createError('User not found or blocked', 401);
  }

  // Revoke old refresh token and mark rotation time
  await storedToken.update({
    isRevoked: true,
    rotatedAt: new Date(),
  });

  // Generate and store refresh token with collision retry
  const newTokenPair = await issueAndStoreTokenPair(user.id, user.email);

  Logger.info('Token refreshed successfully', { userId: user.id });

  return newTokenPair;
};

/**
 * Logout user (revoke refresh token)
 */
export const logoutUser = async (token: string): Promise<void> => {
  if (!token) {
    throw createError('Refresh token is required', 400);
  }

  // Revoke the refresh token
  await RefreshToken.update({ isRevoked: true }, { where: { token, isRevoked: false } });

  Logger.info('User logged out');
};

/**
 * Logs out user from all devices by revoking all their refresh tokens
 */
export const logoutAllDevices = async (userId: string): Promise<void> => {
  if (!userId) {
    throw createError('User ID is required', 400);
  }

  await revokeUserTokens(userId);
  Logger.info('User logged out from all devices', { userId });
};

/**
 * Initiate Forgot Password flow
 */
export const forgotPassword = async (email: string): Promise<void> => {
  if (!email) {
    throw createError('Email is required', 400);
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    Logger.info(`Forgot password requested for non-existent email: ${email}`);
    return;
  }

  // Generate OTP
  const otp = generateOtp();

  // Hash OTP for storage
  const otpHash = await hashPassword(otp);

  // Set expiry (10 minutes)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Update user
  await user.update({
    resetPasswordOtp: otpHash,
    resetPasswordOtpExpires: expiresAt,
  });

  // LOG OTP TO CONSOLE FOR DEVELOPMENT/TESTING ONLY
  if (process.env.NODE_ENV === 'development') {
    Logger.info('================================================');
    Logger.info(`Password Reset OTP for ${email}: ${otp}`);
    Logger.info('================================================');
  }

  // Send password reset email (non-blocking)
  sendPasswordResetEmail(user.email, user.firstName, otp, 10).catch((error) => {
    Logger.error('Failed to send password reset email', { userId: user.id, error });
  });

  Logger.info(`Forgot password OTP generated and email sent`, { userId: user.id });
};

/**
 * Verify OTP
 */
export const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
  if (!email || !otp) {
    throw createError('Email and OTP are required', 400);
  }

  const user = await User.findOne({ where: { email } });
  if (!user || !user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
    return false;
  }

  // Check expiry
  if (new Date() > user.resetPasswordOtpExpires) {
    return false;
  }

  // Verify OTP hash
  return await comparePassword(otp, user.resetPasswordOtp);
};

/**
 * Reset Password
 */
export const resetPassword = async (email: string, otp: string, newPassword: string): Promise<void> => {
  if (!email || !otp || !newPassword) {
    throw createError('Email, OTP, and new password are required', 400);
  }

  const isValidOtp = await verifyOtp(email, otp);
  if (!isValidOtp) {
    throw createError('Invalid or expired OTP', 400);
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw createError('User not found', 404);
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password and clear OTP
  await user.update({
    passwordHash,
    resetPasswordOtp: null,
    resetPasswordOtpExpires: null,
  });

  // Revoke all sessions
  await revokeUserTokens(user.id);

  Logger.info(`Password reset successfully`, { userId: user.id });
};
