import { AdminUser, Role, Policy } from '../../models';
import { AdminUserResponse, AdminRegisterRequest } from '../../common/interfaces/authTypes';
import { hashPassword, comparePassword } from '../../utils/password.utils';
import { sanitizeEmail } from '../../utils/security.utils';
import { formatAdminUserResponse, getAdminUserWithRolesAndPermissions } from '../../utils/adminUser.utils';
import { createError } from '../middleware/errorHandler';
import { validateRequiredFields, validateEmail } from '../../utils/validation.utils';
import { Op } from 'sequelize';
import { ADMIN_USER_ROLES_POLICIES_INCLUDE } from '../../common/constants/constants';

// Supported languages constant
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'ar'];

/**
 * Validate language
 */
const validateLanguage = (language: string): void => {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw createError(`Unsupported language. Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`, 400);
  }
};

/**
 * Get admin user by ID or throw error
 */
const getAdminUserOrThrow = async (adminUserId: string): Promise<AdminUser> => {
  const user = await AdminUser.findByPk(adminUserId);

  if (!user) {
    throw createError('Admin user not found', 404);
  }

  return user;
};

/**
 * Create new admin user
 */
export const create = async (userData: AdminRegisterRequest): Promise<AdminUserResponse> => {
  const { firstName, lastName, email: rawEmail, password } = userData;

  // Validate required fields
  validateRequiredFields(userData, ['firstName', 'lastName', 'email', 'password']);

  const email = sanitizeEmail(rawEmail);
  validateEmail(email);

  // Check if admin user already exists
  const existingUser = await AdminUser.findOne({ where: { email } });
  if (existingUser) {
    throw createError('Admin user with this email already exists', 409);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create admin user
  const user = await AdminUser.create({
    firstName,
    lastName,
    email,
    passwordHash,
    isActive: true,
  });

  return formatAdminUserResponse(user);
};

/**
 * Get admin user by ID
 */
export const getById = async (adminUserId: string): Promise<AdminUserResponse> => {
  const user = await getAdminUserWithRolesAndPermissions(adminUserId);

  if (!user) {
    throw createError('Admin user not found', 404);
  }

  return formatAdminUserResponse(user);
};

/**
 * Get admin user by email
 */
export const getByEmail = async (email: string): Promise<AdminUserResponse> => {
  const sanitizedEmail = sanitizeEmail(email);
  validateEmail(sanitizedEmail);

  const user = await AdminUser.findOne({
    where: { email: sanitizedEmail },
    include: ADMIN_USER_ROLES_POLICIES_INCLUDE,
  });

  if (!user) {
    throw createError('Admin user not found', 404);
  }

  return formatAdminUserResponse(user);
};

/**
 * Get all admin users with pagination
 */
export const getAll = async (
  page: number = 1,
  limit: number = 20,
  search?: string,
  isActive?: boolean,
): Promise<{ users: AdminUserResponse[]; total: number; totalPages: number }> => {
  const offset = (page - 1) * limit;

  const whereClause: any = {};

  if (search) {
    whereClause[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (isActive !== undefined) {
    whereClause.isActive = isActive;
  }

  const { rows: users, count: total } = await AdminUser.findAndCountAll({
    where: whereClause,
    include: ADMIN_USER_ROLES_POLICIES_INCLUDE,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return {
    users: users.map(formatAdminUserResponse),
    total,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Update admin user language preference
 */
export const updateLanguage = async (adminUserId: string, language: string): Promise<AdminUserResponse> => {
  const user = await getAdminUserOrThrow(adminUserId);

  // Validate language
  validateLanguage(language);

  // Update language
  await user.update({ preferredLanguage: language });

  // Get updated user with roles
  const updatedUser = await getAdminUserWithRolesAndPermissions(adminUserId);
  return formatAdminUserResponse(updatedUser!);
};

/**
 * Update admin user
 */
export const update = async (
  adminUserId: string,
  updateData: Partial<Pick<AdminUser, 'firstName' | 'lastName' | 'email' | 'isActive' | 'preferredLanguage'>>,
): Promise<AdminUserResponse> => {
  const user = await getAdminUserOrThrow(adminUserId);

  // If email is being updated, validate and check for duplicates
  if (updateData.email) {
    const sanitizedEmail = sanitizeEmail(updateData.email);
    validateEmail(sanitizedEmail);

    const existingUser = await AdminUser.findOne({
      where: {
        email: sanitizedEmail,
        id: { [Op.ne]: adminUserId },
      },
    });

    if (existingUser) {
      throw createError('Admin user with this email already exists', 409);
    }

    updateData.email = sanitizedEmail;
  }

  // If language is being updated, validate it
  if (updateData.preferredLanguage) {
    validateLanguage(updateData.preferredLanguage);
  }

  // Update user
  await user.update(updateData);

  // Get updated user with roles
  const updatedUser = await getAdminUserWithRolesAndPermissions(adminUserId);
  return formatAdminUserResponse(updatedUser!);
};

/**
 * Helper: Update user password (internal use)
 */
const updateUserPassword = async (user: AdminUser, newPassword: string): Promise<void> => {
  const passwordHash = await hashPassword(newPassword);
  await user.update({ passwordHash });
};

/**
 * Update admin user password (admin action - no current password verification)
 * Used by super-admin to reset any user's password
 */
export const updatePassword = async (adminUserId: string, newPassword: string): Promise<void> => {
  const user = await getAdminUserOrThrow(adminUserId);
  await updateUserPassword(user, newPassword);
};

/**
 * Change admin user password (user action - requires current password verification)
 * Used by user to change their own password
 */
export const changePassword = async (
  adminUserId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  const user = await getAdminUserOrThrow(adminUserId);

  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isPasswordValid) {
    throw createError('Current password is incorrect', 401);
  }

  await updateUserPassword(user, newPassword);
};

/**
 * Activate admin user
 */
export const activate = async (adminUserId: string): Promise<AdminUserResponse> => {
  const user = await getAdminUserOrThrow(adminUserId);
  await user.update({ isActive: true });

  const updatedUser = await getAdminUserWithRolesAndPermissions(adminUserId);
  return formatAdminUserResponse(updatedUser!);
};

/**
 * Deactivate admin user
 */
export const deactivate = async (adminUserId: string): Promise<AdminUserResponse> => {
  const user = await getAdminUserOrThrow(adminUserId);
  await user.update({ isActive: false });

  const updatedUser = await getAdminUserWithRolesAndPermissions(adminUserId);
  return formatAdminUserResponse(updatedUser!);
};

/**
 * Delete admin user (soft delete by deactivating)
 */
export const remove = async (adminUserId: string): Promise<void> => {
  const user = await getAdminUserOrThrow(adminUserId);

  // Soft delete by deactivating
  await user.update({ isActive: false });
};

/**
 * Get admin users by role
 */
export const getByRole = async (roleId: string): Promise<AdminUserResponse[]> => {
  const users = await AdminUser.findAll({
    include: ADMIN_USER_ROLES_POLICIES_INCLUDE,
    where: { isActive: true },
  });

  return users.map(formatAdminUserResponse);
};

/**
 * Check if admin user exists
 */
export const exists = async (adminUserId: string): Promise<boolean> => {
  const user = await AdminUser.findByPk(adminUserId);
  return !!user;
};

/**
 * Check if admin user is active
 */
export const isActive = async (adminUserId: string): Promise<boolean> => {
  const user = await AdminUser.findByPk(adminUserId);
  return user?.isActive || false;
};
