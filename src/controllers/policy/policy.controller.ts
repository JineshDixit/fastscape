import { Request, Response, NextFunction } from 'express';
import {
  create,
  getById,
  getAll,
  update,
  remove,
  addPermission,
  removePermission,
  getRoles,
  activate,
  deactivate,
  getByName,
  searchByPermission,
} from '../../services/policy/policy.service';
import {
  sendSuccess,
  sendCreated,
  sendSuccessWithPagination,
  calculatePagination,
  parsePaginationParams,
} from '../../utils/response.utils';
import { createError } from '../../services/middleware/errorHandler';

/**
 * Create a new policy
 */
export const createPolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, permissions, description } = req.body;

    const result = await create({ name, permissions, description });

    sendCreated(res, 'Policy created successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get policy by ID
 */
export const getPolicyById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await getById(id);

    sendSuccess(res, 'Policy retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all policies with pagination
 */
export const getAllPolicies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit } = parsePaginationParams(req.query);
    const { search, isActive } = req.query;

    const activeFilter = isActive !== undefined ? isActive === 'true' : undefined;

    const result = await getAll(page, limit, search as string, activeFilter);

    const pagination = calculatePagination(result.total, page, limit);

    sendSuccessWithPagination(res, 'Policies retrieved successfully', result.policies, pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * Update policy
 */
export const updatePolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const { name, permissions, description, isActive } = req.body;

    const result = await update(id, {
      name,
      permissions,
      description,
      isActive,
    });

    sendSuccess(res, 'Policy updated successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete policy
 */
export const deletePolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await remove(id);

    sendSuccess(res, 'Policy deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Add permission to policy
 */
export const addPermissionToPolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const { permission } = req.body;

    if (!permission) {
      throw createError('Permission is required', 400);
    }

    const result = await addPermission(id, permission);

    sendSuccess(res, 'Permission added successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove permission from policy
 */
export const removePermissionFromPolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const { permission } = req.body;

    if (!permission) {
      throw createError('Permission is required', 400);
    }

    const result = await removePermission(id, permission);

    sendSuccess(res, 'Permission removed successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get roles that have this policy
 */
export const getPolicyRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await getRoles(id);

    sendSuccess(res, 'Policy roles retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Activate policy
 */
export const activatePolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await activate(id);

    sendSuccess(res, 'Policy activated successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate policy
 */
export const deactivatePolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await deactivate(id);

    sendSuccess(res, 'Policy deactivated successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get policy by name
 */
export const getPolicyByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name } = req.params;

    if (!name) {
      throw createError('Policy name is required', 400);
    }

    const result = await getByName(name);

    if (!result) {
      throw createError('Policy not found', 404);
    }

    sendSuccess(res, 'Policy retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Search policies by permission
 */
export const searchPoliciesByPermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { permission } = req.params;

    if (!permission) {
      throw createError('Permission is required', 400);
    }

    const result = await searchByPermission(permission);

    sendSuccess(res, 'Policies retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};
