import { User, RefreshToken } from '../../models';
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
import { validateRequiredFields, validateEmail } from '../../utils/validation.utils';

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
  await RefreshToken.update(
    { isRevoked: true },
    { where: { userId, isRevoked: false } }
  );
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
  const { fullName, dateOfBirth, nationality, email: rawEmail, phone, password, homeAddress } = registerData;

  // Validate required fields
  validateRequiredFields(registerData, ['fullName', 'dateOfBirth', 'nationality', 'email', 'phone', 'password']);

  const email = sanitizeEmail(rawEmail);
  validateEmail(email);

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

  // Store refresh token
  await createRefreshToken(user.id, tokenPair.refreshToken, tokenPair.refreshTokenExpiresAt);

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
  await revokeUserTokens(user.id);

  // Generate new tokens
  const tokenPair = generateTokenPair({
    userId: user.id,
    email: user.email,
  });

  // Store new refresh token
  await createRefreshToken(user.id, tokenPair.refreshToken, tokenPair.refreshTokenExpiresAt);

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
  await createRefreshToken(user.id, newTokenPair.refreshToken, newTokenPair.refreshTokenExpiresAt);

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
  await RefreshToken.update(
    { isRevoked: true },
    { where: { token, isRevoked: false } }
  );
};

/**
 * Logs out user from all devices by revoking all their refresh tokens
 */
export const logoutAllDevices = async (userId: string): Promise<void> => {
  if (!userId) {
    throw createError('User ID is required', 400);
  }

  await revokeUserTokens(userId);
};