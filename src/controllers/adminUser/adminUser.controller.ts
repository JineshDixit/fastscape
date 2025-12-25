import { Request, Response, NextFunction } from 'express';
import {
  create,
  getById,
  getAll,
  update,
  updatePassword,
  activate,
  deactivate,
  remove,
} from '../../services/adminUser/adminUser.service';
import { sendSuccess, sendCreated, sendSuccessWithPagination, calculatePagination, parsePaginationParams } from '../../utils/response.utils';
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
    const adminUserId = parseInt(id);

    if (isNaN(adminUserId)) {
      throw createError('Invalid admin user ID', 400);
    }

    const result = await getById(adminUserId);

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

    sendSuccessWithPagination(
      res,
      'Admin users retrieved successfully',
      result.users,
      pagination
    );
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
    const adminUserId = parseInt(id);

    if (isNaN(adminUserId)) {
      throw createError('Invalid admin user ID', 400);
    }

    const { firstName, lastName, email, isActive } = req.body;

    const result = await update(adminUserId, {
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
    const adminUserId = parseInt(id);

    if (isNaN(adminUserId)) {
      throw createError('Invalid admin user ID', 400);
    }

    const { newPassword } = req.body;

    if (!newPassword) {
      throw createError('New password is required', 400);
    }

    await updatePassword(adminUserId, newPassword);

    sendSuccess(res, 'Password updated successfully');
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
    const adminUserId = parseInt(id);

    if (isNaN(adminUserId)) {
      throw createError('Invalid admin user ID', 400);
    }

    const result = await activate(adminUserId);

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
    const adminUserId = parseInt(id);

    if (isNaN(adminUserId)) {
      throw createError('Invalid admin user ID', 400);
    }

    const result = await deactivate(adminUserId);

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
    const adminUserId = parseInt(id);

    if (isNaN(adminUserId)) {
      throw createError('Invalid admin user ID', 400);
    }

    await remove(adminUserId);

    sendSuccess(res, 'Admin user deleted successfully');
  } catch (error) {
    next(error);
  }
};