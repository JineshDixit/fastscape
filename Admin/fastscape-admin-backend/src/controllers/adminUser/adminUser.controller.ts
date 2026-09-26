import { Request, Response, NextFunction } from 'express';
import {
  create,
  getById,
  getAll,
  update,
  updatePassword,
  changePassword,
  updateLanguage,
  activate,
  deactivate,
  remove,
} from '../../services/adminUser/adminUser.service';
import {
  sendSuccess,
  sendCreated,
  sendSuccessWithPagination,
  calculatePagination,
  parsePaginationParams,
} from '../../utils/response.utils';
import { createError } from '../../services/middleware/errorHandler';

/**
 * Create a new admin user
 */
export const createAdminUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const result = await create({ firstName, lastName, email, password });

    sendCreated(res, 'Admin user created successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin user by ID
 */
export const getAdminUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await getById(id);

    sendSuccess(res, 'Admin user retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all admin users with pagination
 */
export const getAllAdminUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit } = parsePaginationParams(req.query);
    const { search, isActive } = req.query;

    const activeFilter = isActive !== undefined ? isActive === 'true' : undefined;

    const result = await getAll(page, limit, search as string, activeFilter);

    const pagination = calculatePagination(result.total, page, limit);

    sendSuccessWithPagination(res, 'Admin users retrieved successfully', result.users, pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * Update admin user
 */
export const updateAdminUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const { firstName, lastName, email, isActive } = req.body;

    const result = await update(id, {
      firstName,
      lastName,
      email,
      isActive,
    });

    sendSuccess(res, 'Admin user updated successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Update admin user password
 */
export const updateAdminUserPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      throw createError('New password is required', 400);
    }

    await updatePassword(id, newPassword);

    sendSuccess(res, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Change current admin user's password (with current password verification)
 */
export const changeAdminUserPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUserId = (req as any).user?.userId;

    if (!adminUserId) {
      throw createError('Admin user ID not found', 401);
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw createError('Current password, new password, and confirm password are required', 400);
    }

    if (newPassword !== confirmPassword) {
      throw createError('New password and confirm password do not match', 400);
    }

    if (newPassword.length < 6) {
      throw createError('New password must be at least 6 characters long', 400);
    }

    await changePassword(adminUserId, currentPassword, newPassword);

    sendSuccess(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update admin user language preference
 */
export const updateAdminUserLanguage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const adminUserId = (req as any).user?.userId;

    if (!adminUserId) {
      throw createError('Admin user ID not found', 401);
    }

    const { language } = req.body;

    if (!language) {
      throw createError('Language is required', 400);
    }

    const result = await updateLanguage(adminUserId, language);

    sendSuccess(res, 'Language preference updated successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Activate admin user
 */
export const activateAdminUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await activate(id);

    sendSuccess(res, 'Admin user activated successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate admin user
 */
export const deactivateAdminUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await deactivate(id);

    sendSuccess(res, 'Admin user deactivated successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete admin user
 */
export const deleteAdminUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await remove(id);

    sendSuccess(res, 'Admin user deleted successfully');
  } catch (error) {
    next(error);
  }
};
