import { User, RefreshToken } from '../../models';
import { userModelType } from '../../common/types/userTypes';
import { createError } from '../middleware/errorHandler';
import { hashPassword } from '../../utils/password.utils';
import { sanitizeEmail } from '../../utils/security.utils';

/**
 * Retrieves a user by ID (excluding password hash)
 * @param {string} userId - User ID
 * @returns {Promise<Partial<User>>} - Promise resolving to a user object (excluding password hash)
 * @throws {Error} - User ID is required
 * @throws {Error} - User not found
 */
export const getUserById = async (userId: string): Promise<Partial<User>> => {
  if (!userId) {
    throw createError('User ID is required', 400);
  }

  const user = await User.findByPk(userId, {
    attributes: { exclude: ['passwordHash'] }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  return user.toJSON();
};

/**
 * Retrieves a user by email
 * @param {string} email - User email
 * @returns {Promise<User | null>} - Promise resolving to a user object or null if not found
 * @throws {Error} - Email is required
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  if (!email) {
    throw createError('Email is required', 400);
  }

  const sanitizedEmail = sanitizeEmail(email);
  return await User.findOne({ where: { email: sanitizedEmail } });
};

/**
 * Updates a user by ID with the provided data
 * @param {string} userId - User ID
 * @param {Partial<userModelType>} updateData - Data to update the user with
 * @returns {Promise<Partial<User>>} - Promise resolving to the updated user object
 * @throws {Error} - User ID is required
 * @throws {Error} - User not found
 * @throws {Error} - Email is already taken by another user
 */
export const updateUser = async (userId: string, updateData: Partial<userModelType>): Promise<Partial<User>> => {
  if (!userId) {
    throw createError('User ID is required', 400);
  }

  // Find user first
  const user = await User.findByPk(userId);
  if (!user) {
    throw createError('User not found', 404);
  }

  // Sanitize email if provided
  if (updateData.email) {
    updateData.email = sanitizeEmail(updateData.email);
    
    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      where: { 
        email: updateData.email,
        id: { [require('sequelize').Op.ne]: userId }
      } 
    });
    
    if (existingUser) {
      throw createError('Email is already taken', 409);
    }
  }

  // Hash password if provided
  if (updateData.passwordHash) {
    updateData.passwordHash = await hashPassword(updateData.passwordHash);
  }

  // Remove sensitive fields that shouldn't be updated directly
  const { id, ...safeUpdateData } = updateData;

  // Update user
  await user.update(safeUpdateData);

  // Return updated user without password
  const updatedUser = await User.findByPk(userId, {
    attributes: { exclude: ['passwordHash'] }
  });

  return updatedUser!.toJSON();
};

/**
 * Deletes a user by ID
 * @param {string} userId - User ID
 * @returns {Promise<void>} - Promise resolving to void
 * @throws {Error} - User ID is required
 * @throws {Error} - User not found
 */
export const deleteUser = async (userId: string): Promise<void> => {
  if (!userId) {
    throw createError('User ID is required', 400);
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw createError('User not found', 404);
  }

  // Revoke all refresh tokens before deleting user
  await RefreshToken.update(
    { isRevoked: true },
    { where: { userId, isRevoked: false } }
  );

  // Delete user
  await user.destroy();
};

/**
 * Creates a new user
 * @param {userModelType} userData - User data to create user with
 * @returns {Promise<Partial<User>>} - Promise resolving to a user object (excluding password hash)
 * @throws {Error} - All required fields must be provided
 * @throws {Error} - User with this email already exists
 */
export const createUser = async (userData: userModelType): Promise<Partial<User>> => {
  const { fullName, dateOfBirth, nationality, email: rawEmail, phone, passwordHash, homeAddress } = userData;

  if (!fullName || !dateOfBirth || !nationality || !rawEmail || !phone || !passwordHash) {
    throw createError('All required fields must be provided', 400);
  }

  const email = sanitizeEmail(rawEmail);

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw createError('User with this email already exists', 409);
  }

  // Hash password
  const hashedPassword = await hashPassword(passwordHash);

  // Create user
  const user = await User.create({
    fullName,
    dateOfBirth: new Date(dateOfBirth),
    nationality,
    email,
    phone,
    passwordHash: hashedPassword,
    homeAddress,
    isBlocked: false,
  });

  // Return user without password
  const { passwordHash: _, ...userWithoutPassword } = user.toJSON();
  return userWithoutPassword;
};