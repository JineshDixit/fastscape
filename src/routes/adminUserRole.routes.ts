import { Router } from 'express';
import {
  assignRoleToUser,
  removeRoleFromUser,
  getAdminUserRoles,
  getRoleAdminUsers,
  getAdminUserPermissions,
  checkUserHasRole,
  checkUserHasAnyRole,
  checkUserHasPermission,
  checkUserHasAnyPermission,
  bulkAssignRolesToUser,
  removeAllRolesFromUser,
} from '../controllers/adminUserRole/adminUserRole.controller';
import {
  authenticateUser,
  requireActiveUser,
  requirePermission,
  requireAnyPermission,
  generalLimiter,
} from '../services/middleware';

const router = Router();

// Apply authentication and active user check to all routes
router.use(authenticateUser, requireActiveUser);

/**
 * @route   POST /api/admin-user-roles/assign
 * @desc    Assign role to admin user
 * @access  Private - Requires 'admin.users.update' permission
 */
router.post(
  '/assign',
  generalLimiter,
  requirePermission('admin.users.update'),
  assignRoleToUser
);

/**
 * @route   POST /api/admin-user-roles/remove
 * @desc    Remove role from admin user
 * @access  Private - Requires 'admin.users.update' permission
 */
router.post(
  '/remove',
  requirePermission('admin.users.update'),
  removeRoleFromUser
);

/**
 * @route   GET /api/admin-user-roles/user/:adminUserId/roles
 * @desc    Get all roles assigned to an admin user
 * @access  Private - Requires 'admin.users.read' permission
 */
router.get(
  '/user/:adminUserId/roles',
  requirePermission('admin.users.read'),
  getAdminUserRoles
);

/**
 * @route   GET /api/admin-user-roles/role/:roleId/users
 * @desc    Get all admin users assigned to a role
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.get(
  '/role/:roleId/users',
  requirePermission('admin.roles.read'),
  getRoleAdminUsers
);

/**
 * @route   GET /api/admin-user-roles/user/:adminUserId/permissions
 * @desc    Get admin user permissions
 * @access  Private - Requires 'admin.users.read' permission
 */
router.get(
  '/user/:adminUserId/permissions',
  requirePermission('admin.users.read'),
  getAdminUserPermissions
);

/**
 * @route   GET /api/admin-user-roles/check/user/:adminUserId/role/:roleId
 * @desc    Check if admin user has specific role
 * @access  Private - Requires 'admin.users.read' permission
 */
router.get(
  '/check/user/:adminUserId/role/:roleId',
  requirePermission('admin.users.read'),
  checkUserHasRole
);

/**
 * @route   POST /api/admin-user-roles/check/user/:adminUserId/roles
 * @desc    Check if admin user has any of the specified roles
 * @access  Private - Requires 'admin.users.read' permission
 */
router.post(
  '/check/user/:adminUserId/roles',
  requirePermission('admin.users.read'),
  checkUserHasAnyRole
);

/**
 * @route   GET /api/admin-user-roles/check/user/:adminUserId/permission/:permission
 * @desc    Check if admin user has specific permission
 * @access  Private - Requires 'admin.users.read' permission
 */
router.get(
  '/check/user/:adminUserId/permission/:permission',
  requirePermission('admin.users.read'),
  checkUserHasPermission
);

/**
 * @route   POST /api/admin-user-roles/check/user/:adminUserId/permissions
 * @desc    Check if admin user has any of the specified permissions
 * @access  Private - Requires 'admin.users.read' permission
 */
router.post(
  '/check/user/:adminUserId/permissions',
  requirePermission('admin.users.read'),
  checkUserHasAnyPermission
);

/**
 * @route   PUT /api/admin-user-roles/user/:adminUserId/roles/bulk
 * @desc    Bulk assign roles to admin user
 * @access  Private - Requires 'admin.users.update' permission
 */
router.put(
  '/user/:adminUserId/roles/bulk',
  requirePermission('admin.users.update'),
  bulkAssignRolesToUser
);

/**
 * @route   DELETE /api/admin-user-roles/user/:adminUserId/roles
 * @desc    Remove all roles from admin user
 * @access  Private - Requires 'admin.users.update' permission
 */
router.delete(
  '/user/:adminUserId/roles',
  requirePermission('admin.users.update'),
  removeAllRolesFromUser
);

export default router;