import { Op } from 'sequelize';
import { AdminUser, AdminRefreshToken } from '../../models';
import {
  AdminLoginRequest,
  AdminRegisterRequest,
  AdminAuthResponse,
  RefreshTokenResponse,
  AdminUserResponse,
} from '../../common/interfaces/authTypes';
import { generateTokenPair, verifyRefreshToken } from '../../utils/jwt.utils';
import { hashPassword, comparePassword } from '../../utils/password.utils';
import { sanitizeEmail } from '../../utils/security.utils';
import { formatAdminUserResponse, getAdminUserWithRolesAndPermissions } from '../../utils/adminUser.utils';
import { createError } from '../middleware/errorHandler';
import { validateRequiredFields, validateEmail } from '../../utils/validation.utils';
import logger from '../../config/logger';

/**
 * Create and store refresh token
 */
const storeRefreshToken = async (
  adminUserId: string,
  token: string,
  expiresAt: Date,
  deviceInfo?: string,
  ipAddress?: string,
): Promise<void> => {
  logger.debug('Storing refresh token', { adminUserId, deviceInfo, ipAddress, expiresAt });

  await AdminRefreshToken.create({
    adminUserId,
    token,
    expiresAt,
    isRevoked: false,
    deviceInfo,
    ipAddress,
  });

  logger.debug('Refresh token stored successfully', { adminUserId });
};

/**
 * Revoke all refresh tokens for admin user
 */
const revokeAllRefreshTokens = async (adminUserId: string): Promise<void> => {
  logger.debug('Revoking all refresh tokens', { adminUserId });

  const result = await AdminRefreshToken.update({ isRevoked: true }, { where: { adminUserId, isRevoked: false } });

  logger.info('All refresh tokens revoked', { adminUserId, count: result[0] });
};

/**
 * Register new admin user
 */
export const register = async (
  registerData: AdminRegisterRequest,
  deviceInfo?: string,
  ipAddress?: string,
): Promise<AdminAuthResponse> => {
  const { firstName, lastName, email: rawEmail, password } = registerData;

  logger.info('Admin user registration initiated', { email: rawEmail, firstName, lastName, ipAddress });

  // Validate required fields
  validateRequiredFields(registerData, ['firstName', 'lastName', 'email', 'password']);

  const email = sanitizeEmail(rawEmail);
  validateEmail(email);

  // Check if admin user already exists
  const existingUser = await AdminUser.findOne({ where: { email } });
  if (existingUser) {
    logger.warn('Registration failed: admin user already exists', { email });
    throw createError('Admin user with this email already exists', 409);
  }

  // Hash password
  logger.debug('Hashing password for new admin user');
  const passwordHash = await hashPassword(password);

  // Create admin user
  const user = await AdminUser.create({
    firstName,
    lastName,
    email,
    passwordHash,
    isActive: true,
  });

  logger.info('Admin user created successfully', { userId: user.id, email: user.email });

  // Generate tokens
  const tokenPair = generateTokenPair({
    userId: user.id,
    email: user.email,
  });

  // Store refresh token
  await storeRefreshToken(user.id, tokenPair.refreshToken, tokenPair.refreshTokenExpiresAt, deviceInfo, ipAddress);

  // Get user with permissions for response
  const userWithPermissions = await getAdminUserWithRolesAndPermissions(user.id);

  logger.info('Admin user registration completed', { userId: user.id, email: user.email });

  return {
    user: formatAdminUserResponse(userWithPermissions || user),
    tokens: tokenPair,
  };
};

/**
 * Login admin user
 */
export const login = async (
  loginData: AdminLoginRequest,
  deviceInfo?: string,
  ipAddress?: string,
): Promise<AdminAuthResponse> => {
  const { email: rawEmail, password } = loginData;

  logger.info('Admin user login attempt', { email: rawEmail, ipAddress, deviceInfo });

  // Validate required fields
  validateRequiredFields(loginData, ['email', 'password']);

  const email = sanitizeEmail(rawEmail);
  validateEmail(email);

  // Find admin user by email
  const user = await AdminUser.findOne({ where: { email } });
  if (!user) {
    logger.warn('Login failed: admin user not found', { email });
    throw createError('Invalid credentials', 401);
  }

  // Check if admin user is active
  if (!user.isActive) {
    logger.warn('Login failed: admin user account deactivated', { userId: user.id, email });
    throw createError('Account is deactivated. Please contact administrator.', 403);
  }

  // Verify password
  logger.debug('Verifying password', { userId: user.id });
  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    logger.warn('Login failed: invalid password', { userId: user.id, email });
    throw createError('Invalid credentials', 401);
  }

  // Revoke existing refresh tokens for security
  await revokeAllRefreshTokens(user.id);

  // Generate new tokens
  const tokenPair = generateTokenPair({
    userId: user.id,
    email: user.email,
  });

  // Store new refresh token
  await storeRefreshToken(user.id, tokenPair.refreshToken, tokenPair.refreshTokenExpiresAt, deviceInfo, ipAddress);

  // Get user with permissions for response
  const userWithPermissions = await getAdminUserWithRolesAndPermissions(user.id);

  logger.info('Admin user login successful', { userId: user.id, email: user.email });

  return {
    user: formatAdminUserResponse(userWithPermissions || user),
    tokens: tokenPair,
  };
};

/**
 * Refresh access token
 */
export const refreshToken = async (token: string): Promise<RefreshTokenResponse> => {
  logger.debug('Refresh token request received');

  if (!token) {
    logger.warn('Refresh token request missing token');
    throw createError('Refresh token is required', 400);
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
    logger.debug('Refresh token verified', { userId: decoded.userId });
  } catch (error) {
    logger.warn('Refresh token verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw createError('Invalid or expired refresh token', 401);
  }

  // Check if refresh token exists in database and is not revoked
  // OR was revoked very recently (grace period for concurrent requests)
  const storedToken = await AdminRefreshToken.findOne({
    where: {
      token,
      adminUserId: decoded.userId,
      [Op.or]: [
        { isRevoked: false },
        {
          isRevoked: true,
          updatedAt: { [Op.gte]: new Date(Date.now() - 30 * 1000) },
        },
      ],
    },
  });

  if (!storedToken) {
    logger.warn('Refresh token not found or already revoked', { userId: decoded.userId });
    throw createError('Refresh token not found or revoked', 401);
  }

  // Check if token is expired
  if (storedToken.expiresAt < new Date()) {
    logger.warn('Refresh token expired', { userId: decoded.userId, expiresAt: storedToken.expiresAt });
    await storedToken.update({ isRevoked: true });
    throw createError('Refresh token expired', 401);
  }

  // Get admin user details
  const user = await AdminUser.findByPk(decoded.userId);
  if (!user || !user.isActive) {
    logger.warn('Admin user not found or deactivated during token refresh', { userId: decoded.userId });
    throw createError('Admin user not found or deactivated', 401);
  }

  // Revoke old refresh token (only if not already revoked)
  if (!storedToken.isRevoked) {
    logger.debug('Revoking old refresh token', { userId: user.id });
    await storedToken.update({ isRevoked: true });
  } else {
    logger.info('Using recently rotated refresh token (grace period)', {
      userId: user.id,
      tokenSnippet: token.substring(0, 10),
    });
  }

  // Generate new token pair
  const newTokenPair = generateTokenPair({
    userId: user.id,
    email: user.email,
  });

  // Store new refresh token
  await storeRefreshToken(
    user.id,
    newTokenPair.refreshToken,
    newTokenPair.refreshTokenExpiresAt,
    storedToken.deviceInfo,
    storedToken.ipAddress,
  );

  logger.info('Refresh token renewed successfully', { userId: user.id });

  return newTokenPair;
};

/**
 * Logout admin user
 */
export const logout = async (token: string): Promise<void> => {
  logger.info('Admin user logout initiated');

  if (!token) {
    logger.warn('Logout request missing token');
    throw createError('Refresh token is required', 400);
  }

  // Revoke the refresh token
  const result = await AdminRefreshToken.update({ isRevoked: true }, { where: { token, isRevoked: false } });

  logger.info('Admin user logout completed', { tokensRevoked: result[0] });
};

/**
 * Logout from all devices
 */
export const logoutFromAllDevices = async (adminUserId: string): Promise<void> => {
  logger.info('Logout from all devices initiated', { adminUserId });

  if (!adminUserId) {
    logger.warn('Logout from all devices missing adminUserId');
    throw createError('Admin User ID is required', 400);
  }

  await revokeAllRefreshTokens(adminUserId);

  logger.info('Logout from all devices completed', { adminUserId });
};

/**
 * Get current admin user profile
 */
export const getCurrentProfile = async (adminUserId: string): Promise<AdminUserResponse> => {
  const user = await getAdminUserWithRolesAndPermissions(adminUserId);

  if (!user) {
    throw createError('Admin user not found', 404);
  }

  if (!user.isActive) {
    throw createError('Admin user account is deactivated', 403);
  }

  return formatAdminUserResponse(user);
};

/**
 * Check if admin user has specific permission
 */
export const checkPermission = async (adminUserId: string, permission: string): Promise<boolean> => {
  const user = await getAdminUserWithRolesAndPermissions(adminUserId);

  if (!user || !user.isActive) {
    return false;
  }

  const userResponse = formatAdminUserResponse(user);
  return userResponse.permissions?.includes(permission) || false;
};

/**
 * Check if admin user has any of the specified permissions
 */
export const checkAnyPermission = async (adminUserId: string, permissions: string[]): Promise<boolean> => {
  const user = await getAdminUserWithRolesAndPermissions(adminUserId);

  if (!user || !user.isActive) {
    return false;
  }

  const userResponse = formatAdminUserResponse(user);
  return permissions.some((permission) => userResponse.permissions?.includes(permission)) || false;
};
