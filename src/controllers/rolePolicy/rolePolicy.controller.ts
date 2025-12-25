import { Request, Response, NextFunction } from 'express';
import {
  assignPolicy,
  removePolicy,
  getRolePolicies,
  getPolicyRoles,
  hasPolicy,
  hasAnyPolicy,
  getRolePermissions,
  hasPermission,
  hasAnyPermission,
  bulkAssignPolicies,
  removeAllPolicies,
} from '../../services/rolePolicy/rolePolicy.service';
import { sendSuccess, sendCreated } from '../../utils/response.utils';
import { createError } from '../../services/middleware/errorHandler';

/**
 * Assign policy to role
 */
export const assignPolicyToRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleId, policyId } = req.body;

    if (!roleId || !policyId) {
      throw createError('Role ID and Policy ID are required', 400);
    }

    const result = await assignPolicy({ roleId, policyId });

    sendCreated(res, 'Policy assigned to role successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove policy from role
 */
export const removePolicyFromRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleId, policyId } = req.body;

    if (!roleId || !policyId) {
      throw createError('Role ID and Policy ID are required', 400);
    }

    const result = await removePolicy(roleId, policyId);

    sendSuccess(res, 'Policy removed from role successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all policies assigned to a role
 */
export const getRolePoliciesById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleId } = req.params;
    const roleIdNum = parseInt(roleId);

    if (isNaN(roleIdNum)) {
      throw createError('Invalid role ID', 400);
    }

    const result = await getRolePolicies(roleIdNum);

    sendSuccess(res, 'Role policies retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all roles that have a specific policy
 */
export const getPolicyRolesById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { policyId } = req.params;
    const policyIdNum = parseInt(policyId);

    if (isNaN(policyIdNum)) {
      throw createError('Invalid policy ID', 400);
    }

    const result = await getPolicyRoles(policyIdNum);

    sendSuccess(res, 'Policy roles retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Check if role has specific policy
 */
export const checkRoleHasPolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleId, policyId } = req.params;
    const roleIdNum = parseInt(roleId);
    const policyIdNum = parseInt(policyId);

    if (isNaN(roleIdNum) || isNaN(policyIdNum)) {
      throw createError('Invalid role ID or policy ID', 400);
    }

    const result = await hasPolicy(roleIdNum, policyIdNum);

    sendSuccess(res, 'Policy check completed', { hasPolicy: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if role has any of the specified policies
 */
export const checkRoleHasAnyPolicy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleId } = req.params;
    const { policyIds } = req.body;
    const roleIdNum = parseInt(roleId);

    if (isNaN(roleIdNum)) {
      throw createError('Invalid role ID', 400);
    }

    if (!Array.isArray(policyIds) || policyIds.length === 0) {
      throw createError('Policy IDs array is required', 400);
    }

    const result = await hasAnyPolicy(roleIdNum, policyIds);

    sendSuccess(res, 'Policy check completed', { hasAnyPolicy: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all permissions for a role
 */
export const getRolePermissionsById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleId } = req.params;
    const roleIdNum = parseInt(roleId);

    if (isNaN(roleIdNum)) {
      throw createError('Invalid role ID', 400);
    }

    const result = await getRolePermissions(roleIdNum);

    sendSuccess(res, 'Role permissions retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Check if role has specific permission
 */
export const checkRoleHasPermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleId, permission } = req.params;
    const roleIdNum = parseInt(roleId);

    if (isNaN(roleIdNum)) {
      throw createError('Invalid role ID', 400);
    }

    if (!permission) {
      throw createError('Permission is required', 400);
    }

    const result = await hasPermission(roleIdNum, permission);

    sendSuccess(res, 'Permission check completed', { hasPermission: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if role has any of the specified permissions
 */
export const checkRoleHasAnyPermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleId } = req.params;
    const { permissions } = req.body;
    const roleIdNum = parseInt(roleId);

    if (isNaN(roleIdNum)) {
      throw createError('Invalid role ID', 400);
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
      throw createError('Permissions array is required', 400);
    }

    const result = await hasAnyPermission(roleIdNum, permissions);

    sendSuccess(res, 'Permission check completed', { hasAnyPermission: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk assign policies to role
 */
export const bulkAssignPoliciesToRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleId } = req.params;
    const { policyIds } = req.body;
    const roleIdNum = parseInt(roleId);

    if (isNaN(roleIdNum)) {
      throw createError('Invalid role ID', 400);
    }

    if (!Array.isArray(policyIds) || policyIds.length === 0) {
      throw createError('Policy IDs array is required', 400);
    }

    const result = await bulkAssignPolicies(roleIdNum, policyIds);

    sendSuccess(res, 'Policies assigned to role successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove all policies from role
 */
export const removeAllPoliciesFromRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { roleId } = req.params;
    const roleIdNum = parseInt(roleId);

    if (isNaN(roleIdNum)) {
      throw createError('Invalid role ID', 400);
    }

    const result = await removeAllPolicies(roleIdNum);

    sendSuccess(res, 'All policies removed from role successfully', result);
  } catch (error) {
    next(error);
  }
};