import { Request, Response, NextFunction } from 'express';
import {
  create,
  getById,
  getAll,
  update,
  remove,
  activate,
  deactivate,
  getByName,
} from '../../services/role/role.service';
import {
  sendSuccess,
  sendCreated,
  sendSuccessWithPagination,
  calculatePagination,
  parsePaginationParams,
} from '../../utils/response.utils';
import { createError } from '../../services/middleware/errorHandler';

/**
 * Create a new role
 */
export const createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, policyIds } = req.body;

    const result = await create({ name, description, policyIds });

    sendCreated(res, 'Role created successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get role by ID
 */
export const getRoleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await getById(id);

    sendSuccess(res, 'Role retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all roles with pagination
 */
export const getAllRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit } = parsePaginationParams(req.query);
    const { search, isActive, includePolicies } = req.query;

    const activeFilter = isActive !== undefined ? isActive === 'true' : undefined;
    const includePoliciesFlag = includePolicies === 'true';

    const result = await getAll(page, limit, search as string, activeFilter, includePoliciesFlag);

    const pagination = calculatePagination(result.total, page, limit);

    sendSuccessWithPagination(res, 'Roles retrieved successfully', result.roles, pagination);
  } catch (error) {
    next(error);
  }
};

/**
 * Update role
 */
export const updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const { name, description, isActive } = req.body;

    const result = await update(id, {
      name,
      description,
      isActive,
    });

    sendSuccess(res, 'Role updated successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete role
 */
export const deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await remove(id);

    sendSuccess(res, 'Role deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Activate role
 */
export const activateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await activate(id);

    sendSuccess(res, 'Role activated successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate role
 */
export const deactivateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await deactivate(id);

    sendSuccess(res, 'Role deactivated successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get role by name
 */
export const getRoleByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name } = req.params;

    if (!name) {
      throw createError('Role name is required', 400);
    }

    const result = await getByName(name);

    if (!result) {
      throw createError('Role not found', 404);
    }

    sendSuccess(res, 'Role retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};
