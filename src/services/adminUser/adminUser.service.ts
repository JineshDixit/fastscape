import { AdminUser, Role, Policy } from '../../models';
import { AdminUserResponse, AdminRegisterRequest } from '../../common/interfaces/authTypes';
import { hashPassword } from '../../utils/password.utils';
import { sanitizeEmail } from '../../utils/security.utils';
import { formatAdminUserResponse, getAdminUserWithRolesAndPermissions } from '../../utils/adminUser.utils';
import { createError } from '../middleware/errorHandler';
import { validateRequiredFields, validateEmail } from '../../utils/validation.utils';
import { Op } from 'sequelize';

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
export const getById = async (adminUserId: number): Promise<AdminUserResponse> => {
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
    include: [
      {
        model: Role,
        through: { attributes: [] },
        include: [
          {
            model: Policy,
            through: { attributes: [] },
            where: { isActive: true },
            required: false,
          }
        ],
        where: { isActive: true },
        required: false,
      }
    ],
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
  isActive?: boolean
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
    include: [
      {
        model: Role,
        through: { attributes: [] },
        include: [
          {
            model: Policy,
            through: { attributes: [] },
            where: { isActive: true },
            required: false,
          }
        ],
        where: { isActive: true },
        required: false,
      }
    ],
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
 * Update admin user
 */
export const update = async (
  adminUserId: number,
  updateData: Partial<Pick<AdminUser, 'firstName' | 'lastName' | 'email' | 'isActive'>>
): Promise<AdminUserResponse> => {
  const user = await AdminUser.findByPk(adminUserId);
  
  if (!user) {
    throw createError('Admin user not found', 404);
  }

  // If email is being updated, validate and check for duplicates
  if (updateData.email) {
    const sanitizedEmail = sanitizeEmail(updateData.email);
    validateEmail(sanitizedEmail);
    
    const existingUser = await AdminUser.findOne({
      where: { 
        email: sanitizedEmail,
        id: { [Op.ne]: adminUserId }
      }
    });
    
    if (existingUser) {
      throw createError('Admin user with this email already exists', 409);
    }
    
    updateData.email = sanitizedEmail;
  }

  // Update user
  await user.update(updateData);

  // Get updated user with roles
  const updatedUser = await getAdminUserWithRolesAndPermissions(adminUserId);
  return formatAdminUserResponse(updatedUser!);
};

/**
 * Update admin user password
 */
export const updatePassword = async (
  adminUserId: number,
  newPassword: string
): Promise<void> => {
  const user = await AdminUser.findByPk(adminUserId);
  
  if (!user) {
    throw createError('Admin user not found', 404);
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password
  await user.update({ passwordHash });
};

/**
 * Activate admin user
 */
export const activate = async (adminUserId: number): Promise<AdminUserResponse> => {
  const user = await AdminUser.findByPk(adminUserId);
  
  if (!user) {
    throw createError('Admin user not found', 404);
  }

  await user.update({ isActive: true });

  const updatedUser = await getAdminUserWithRolesAndPermissions(adminUserId);
  return formatAdminUserResponse(updatedUser!);
};

/**
 * Deactivate admin user
 */
export const deactivate = async (adminUserId: number): Promise<AdminUserResponse> => {
  const user = await AdminUser.findByPk(adminUserId);
  
  if (!user) {
    throw createError('Admin user not found', 404);
  }

  await user.update({ isActive: false });

  const updatedUser = await getAdminUserWithRolesAndPermissions(adminUserId);
  return formatAdminUserResponse(updatedUser!);
};

/**
 * Delete admin user (soft delete by deactivating)
 */
export const remove = async (adminUserId: number): Promise<void> => {
  const user = await AdminUser.findByPk(adminUserId);
  
  if (!user) {
    throw createError('Admin user not found', 404);
  }

  // Soft delete by deactivating
  await user.update({ isActive: false });
};

/**
 * Get admin users by role
 */
export const getByRole = async (roleId: number): Promise<AdminUserResponse[]> => {
  const users = await AdminUser.findAll({
    include: [
      {
        model: Role,
        through: { attributes: [] },
        where: { id: roleId },
        include: [
          {
            model: Policy,
            through: { attributes: [] },
            where: { isActive: true },
            required: false,
          }
        ],
      }
    ],
    where: { isActive: true },
  });

  return users.map(formatAdminUserResponse);
};

/**
 * Check if admin user exists
 */
export const exists = async (adminUserId: number): Promise<boolean> => {
  const user = await AdminUser.findByPk(adminUserId);
  return !!user;
};

/**
 * Check if admin user is active
 */
export const isActive = async (adminUserId: number): Promise<boolean> => {
  const user = await AdminUser.findByPk(adminUserId);
  return user?.isActive || false;
};