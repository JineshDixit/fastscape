import { Request, Response, NextFunction } from 'express';
import {
  assignRole,
  removeRole,
  getUserRoles,
  getRoleUsers,
  getUserPermissions,
  hasRole,
  hasAnyRole,
  hasPermission,
  hasAnyPermission,
  bulkAssignRoles,
  removeAllRoles,
} from '../../services/adminUserRole/adminUserRole.service';
import { sendSuccess, sendCreated } from '../../utils/response.utils';
import { createError } from '../../services/middleware/errorHandler';

/**
 * Assign role to admin user
 */
export const assignRoleToUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adminUserId, roleId } = req.body;
    const assignedBy = (req as any).user?.userId; // Get from authenticated user

    if (!adminUserId || !roleId) {
      throw createError('Admin User ID and Role ID are required', 400);
    }

    const result = await assignRole({ adminUserId, roleId }, assignedBy);

    sendCreated(res, 'Role assigned to admin user successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove role from admin user
 */
export const removeRoleFromUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adminUserId, roleId } = req.body;

    if (!adminUserId || !roleId) {
      throw createError('Admin User ID and Role ID are required', 400);
    }

    const result = await removeRole(adminUserId, roleId);

    sendSuccess(res, 'Role removed from admin user successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all roles assigned to an admin user
 */
export const getAdminUserRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adminUserId } = req.params;
    const adminUserIdNum = parseInt(adminUserId);

    if (isNaN(adminUserIdNum)) {
      throw createError('Invalid admin user ID', 400);
    }

    const result = await getUserRoles(adminUserIdNum);

    sendSuccess(res, 'Admin user roles retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all admin users assigned to a role
 */
export const getRoleAdminUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleId } = req.params;
    const roleIdNum = parseInt(roleId);

    if (isNaN(roleIdNum)) {
      throw createError('Invalid role ID', 400);
    }

    const result = await getRoleUsers(roleIdNum);

    sendSuccess(res, 'Role admin users retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin user permissions
 */
export const getAdminUserPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adminUserId } = req.params;
    const adminUserIdNum = parseInt(adminUserId);

    if (isNaN(adminUserIdNum)) {
      throw createError('Invalid admin user ID', 400);
    }

    const result = await getUserPermissions(adminUserIdNum);

    sendSuccess(res, 'Admin user permissions retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Check if admin user has specific role
 */
export const checkUserHasRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adminUserId, roleId } = req.params;
    const adminUserIdNum = parseInt(adminUserId);
    const roleIdNum = parseInt(roleId);

    if (isNaN(adminUserIdNum) || isNaN(roleIdNum)) {
      throw createError('Invalid admin user ID or role ID', 400);
    }

    const result = await hasRole(adminUserIdNum, roleIdNum);

    sendSuccess(res, 'Role check completed', { hasRole: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if admin user has any of the specified roles
 */
export const checkUserHasAnyRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adminUserId } = req.params;
    const { roleIds } = req.body;
    const adminUserIdNum = parseInt(adminUserId);

    if (isNaN(adminUserIdNum)) {
      throw createError('Invalid admin user ID', 400);
    }

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      throw createError('Role IDs array is required', 400);
    }

    const result = await hasAnyRole(adminUserIdNum, roleIds);

    sendSuccess(res, 'Role check completed', { hasAnyRole: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if admin user has specific permission
 */
export const checkUserHasPermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adminUserId, permission } = req.params;
    const adminUserIdNum = parseInt(adminUserId);

    if (isNaN(adminUserIdNum)) {
      throw createError('Invalid admin user ID', 400);
    }

    if (!permission) {
      throw createError('Permission is required', 400);
    }

    const result = await hasPermission(adminUserIdNum, permission);

    sendSuccess(res, 'Permission check completed', { hasPermission: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if admin user has any of the specified permissions
 */
export const checkUserHasAnyPermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adminUserId } = req.params;
    const { permissions } = req.body;
    const adminUserIdNum = parseInt(adminUserId);

    if (isNaN(adminUserIdNum)) {
      throw createError('Invalid admin user ID', 400);
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
      throw createError('Permissions array is required', 400);
    }

    const result = await hasAnyPermission(adminUserIdNum, permissions);

    sendSuccess(res, 'Permission check completed', { hasAnyPermission: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk assign roles to admin user
 */
export const bulkAssignRolesToUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adminUserId } = req.params;
    const { roleIds } = req.body;
    const adminUserIdNum = parseInt(adminUserId);
    const assignedBy = (req as any).user?.userId; // Get from authenticated user

    if (isNaN(adminUserIdNum)) {
      throw createError('Invalid admin user ID', 400);
    }

    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      throw createError('Role IDs array is required', 400);
    }

    const result = await bulkAssignRoles(adminUserIdNum, roleIds, assignedBy);

    sendSuccess(res, 'Roles assigned to admin user successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove all roles from admin user
 */
export const removeAllRolesFromUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { adminUserId } = req.params;
    const adminUserIdNum = parseInt(adminUserId);

    if (isNaN(adminUserIdNum)) {
      throw createError('Invalid admin user ID', 400);
    }

    const result = await removeAllRoles(adminUserIdNum);

    sendSuccess(res, 'All roles removed from admin user successfully', result);
  } catch (error) {
    next(error);
  }
};