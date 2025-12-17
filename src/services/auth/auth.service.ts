import { User, RefreshToken } from '../../common/models';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  RefreshTokenResponse 
} from '../../common/types/authTypes';
import { generateTokenPair, verifyRefreshToken } from '../../utils/jwt.utils';
import { hashPassword, comparePassword } from '../../utils/password.utils';
import { sanitizeEmail } from '../../utils/security.utils';
import { createError } from '../middleware/errorHandler';

/**
 * Registers a new user
 * @param {RegisterRequest} registerData - User registration data
 * @returns {Promise<AuthResponse>} - Promise resolving to a user object (excluding password hash) and tokens
 * @throws {Error} - All required fields must be provided
 * @throws {Error} - User with this email already exists
 */
export const registerUser = async (registerData: RegisterRequest): Promise<AuthResponse> => {
  const { fullName, dateOfBirth, nationality, email: rawEmail, phone, password, homeAddress } = registerData;
  const email = sanitizeEmail(rawEmail);

  // Validate required fields
  if (!fullName || !dateOfBirth || !nationality || !email || !phone || !password) {
    throw createError('All required fields must be provided', 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
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
    homeAddress,
    isBlocked: false,
  });

  // Generate tokens
  const tokenPair = generateTokenPair({
    userId: user.id,
    email: user.email,
  });

  // Store refresh token in database
  await RefreshToken.create({
    userId: user.id,
    token: tokenPair.refreshToken,
    expiresAt: tokenPair.refreshTokenExpiresAt,
    isRevoked: false,
  });

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      nationality: user.nationality,
    },
    tokens: tokenPair,
  };
};

/**
 * Logs in a user and generates a new access and refresh token pair
 * @param {LoginRequest} loginData - Login data containing email and password
 * @returns {Promise<AuthResponse>} - Promise resolving to an object containing user data and tokens
 * @throws {Error} - Email and password are required
 * @throws {Error} - Invalid credentials
 * @throws {Error} - Account is blocked. Please contact support.
 */
export const loginUser = async (loginData: LoginRequest): Promise<AuthResponse> => {
  const { email: rawEmail, password } = loginData;
  const email = sanitizeEmail(rawEmail);

  // Validate required fields
  if (!email || !password) {
    throw createError('Email and password are required', 400);
  }

  // Find user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw createError('Invalid credentials', 401);
  }

  // Check if user is blocked
  if (user.isBlocked) {
    throw createError('Account is blocked. Please contact support.', 403);
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw createError('Invalid credentials', 401);
  }

  // Revoke existing refresh tokens for security
  await RefreshToken.update(
    { isRevoked: true },
    { where: { userId: user.id, isRevoked: false } }
  );

  // Generate new tokens
  const tokenPair = generateTokenPair({
    userId: user.id,
    email: user.email,
  });

  // Store new refresh token
  await RefreshToken.create({
    userId: user.id,
    token: tokenPair.refreshToken,
    expiresAt: tokenPair.refreshTokenExpiresAt,
    isRevoked: false,
  });

  return {
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      nationality: user.nationality,
    },
    tokens: tokenPair,
  };
};

/**
 * Refresh access token
 * @param {string} token - Refresh token
 * @returns {Promise<RefreshTokenResponse>} - Promise resolving to a new access and refresh token pair
 * @throws {Error} - Refresh token is required
 * @throws {Error} - Invalid or expired refresh token
 * @throws {Error} - Refresh token not found or revoked
 * @throws {Error} - User not found or blocked
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
    throw createError('Refresh token not found or revoked', 401);
  }

  // Check if token is expired
  if (storedToken.expiresAt < new Date()) {
    // Mark as revoked
    await storedToken.update({ isRevoked: true });
    throw createError('Refresh token expired', 401);
  }

  // Get user details
  const user = await User.findByPk(decoded.userId);
  if (!user || user.isBlocked) {
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
  await RefreshToken.create({
    userId: user.id,
    token: newTokenPair.refreshToken,
    expiresAt: newTokenPair.refreshTokenExpiresAt,
    isRevoked: false,
  });

  return newTokenPair;
};

/**
 * Logout user (revoke refresh token)
 * Revokes the refresh token and logs the user out from the current device
 * @param {string} token - Refresh token
 * @throws {Error} - Refresh token is required
 * @returns {Promise<void>} - Promise resolving to void
 */
export const logoutUser = async (token: string): Promise<void> => {
  if (!token) {
    throw createError('Refresh token is required', 400);
  }

  // Revoke the refresh token
  await RefreshToken.update(
    { isRevoked: true },
    { where: { token, isRevoked: false } }
  );
};

/**
 * Logs out user from all devices by revoking all their refresh tokens.
 * This method is used to log out a user from all devices when their account
 * is compromised or when they want to log out from all devices at once.
 *
 * @param {string} userId - User ID
 * @throws {Error} - User ID is required
 * @returns {Promise<void>} - Promise resolving to void
 */
export const logoutAllDevices = async (userId: string): Promise<void> => {
  if (!userId) {
    throw createError('User ID is required', 400);
  }

  // Revoke all refresh tokens for the user
  await RefreshToken.update(
    { isRevoked: true },
    { where: { userId, isRevoked: false } }
  );
};