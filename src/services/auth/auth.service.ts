import { User, RefreshToken } from '../../models';
import { LoginRequest, RegisterRequest, AuthResponse, RefreshTokenResponse } from '../../common/types/authTypes';
import { generateTokenPair, verifyRefreshToken } from '../../utils/jwt.utils';
import { hashPassword, comparePassword } from '../../utils/password.utils';
import { sanitizeEmail } from '../../utils/security.utils';
import { createError } from '../middleware/errorHandler';
import { validateRequiredFields, validateEmail } from '../../utils/validation.utils';
import Logger from '../../utils/logger';
import { generateOtp } from '../../utils/otp.utils';

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
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  nationality: user.nationality,
});

/**
 * Registers a new user
 */
export const registerUser = async (registerData: RegisterRequest): Promise<AuthResponse> => {
  const { fullName, dateOfBirth, nationality, email: rawEmail, phone, password } = registerData;

  // Validate required fields
  validateRequiredFields(registerData, ['fullName', 'dateOfBirth', 'nationality', 'email', 'phone', 'password']);

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
    fullName,
    dateOfBirth: new Date(dateOfBirth),
    nationality,
    email,
    phone,
    passwordHash,
    isBlocked: false,
    resetPasswordOtp: null,
    resetPasswordOtpExpires: null,
  });

  // Generate tokens
  const tokenPair = generateTokenPair({
    userId: user.id,
    email: user.email,
  });

  // Store refresh token
  await createRefreshToken(user.id, tokenPair.refreshToken, tokenPair.refreshTokenExpiresAt);

  Logger.info('User registered successfully', { userId: user.id, email: user.email });

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

  // Generate new tokens
  const tokenPair = generateTokenPair({
    userId: user.id,
    email: user.email,
  });

  // Store new refresh token
  await createRefreshToken(user.id, tokenPair.refreshToken, tokenPair.refreshTokenExpiresAt);

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

  // Check if refresh token exists in database and is not revoked
  const storedToken = await RefreshToken.findOne({
    where: {
      token,
      userId: decoded.userId,
      isRevoked: false,
    },
  });

  if (!storedToken) {
    Logger.warn('Token refresh failed: Token not found or revoked', { userId: decoded.userId });
    throw createError('Refresh token not found or revoked', 401);
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

  // Revoke old refresh token
  await storedToken.update({ isRevoked: true });

  // Generate new token pair
  const newTokenPair = generateTokenPair({
    userId: user.id,
    email: user.email,
  });

  // Store new refresh token
  await createRefreshToken(user.id, newTokenPair.refreshToken, newTokenPair.refreshTokenExpiresAt);

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

  // LOG OTP TO CONSOLE FOR MANUAL TESTING
  Logger.info('================================================');
  Logger.info(`OTP for ${email}: ${otp}`);
  Logger.info('================================================');

  Logger.info(`Forgot password OTP generated`, { userId: user.id });
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
  const isValid = await comparePassword(otp, user.resetPasswordOtp);
  return isValid;
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
