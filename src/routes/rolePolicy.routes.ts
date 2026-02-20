import { Router } from 'express';
import {
  assignPolicyToRole,
  removePolicyFromRole,
  getRolePoliciesById,
  getPolicyRolesById,
  checkRoleHasPolicy,
  checkRoleHasAnyPolicy,
  getRolePermissionsById,
  checkRoleHasPermission,
  checkRoleHasAnyPermission,
  bulkAssignPoliciesToRole,
  removeAllPoliciesFromRole,
} from '../controllers/rolePolicy/rolePolicy.controller';
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
 * @route   POST /api/role-policies/assign
 * @desc    Assign policy to role
 * @access  Private - Requires 'admin.roles.update' permission
 */
router.post('/assign', generalLimiter, requirePermission('admin.roles.update'), assignPolicyToRole);

/**
 * @route   POST /api/role-policies/remove
 * @desc    Remove policy from role
 * @access  Private - Requires 'admin.roles.update' permission
 */
router.post('/remove', requirePermission('admin.roles.update'), removePolicyFromRole);

/**
 * @route   GET /api/role-policies/role/:roleId/policies
 * @desc    Get all policies assigned to a role
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.get('/role/:roleId/policies', requirePermission('admin.roles.read'), getRolePoliciesById);

/**
 * @route   GET /api/role-policies/policy/:policyId/roles
 * @desc    Get all roles that have a specific policy
 * @access  Private - Requires 'admin.policies.read' permission
 */
router.get('/policy/:policyId/roles', requirePermission('admin.policies.read'), getPolicyRolesById);

/**
 * @route   GET /api/role-policies/role/:roleId/permissions
 * @desc    Get all permissions for a role
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.get('/role/:roleId/permissions', requirePermission('admin.roles.read'), getRolePermissionsById);

/**
 * @route   GET /api/role-policies/check/role/:roleId/policy/:policyId
 * @desc    Check if role has specific policy
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.get('/check/role/:roleId/policy/:policyId', requirePermission('admin.roles.read'), checkRoleHasPolicy);

/**
 * @route   POST /api/role-policies/check/role/:roleId/policies
 * @desc    Check if role has any of the specified policies
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.post('/check/role/:roleId/policies', requirePermission('admin.roles.read'), checkRoleHasAnyPolicy);

/**
 * @route   GET /api/role-policies/check/role/:roleId/permission/:permission
 * @desc    Check if role has specific permission
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.get('/check/role/:roleId/permission/:permission', requirePermission('admin.roles.read'), checkRoleHasPermission);

/**
 * @route   POST /api/role-policies/check/role/:roleId/permissions
 * @desc    Check if role has any of the specified permissions
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.post('/check/role/:roleId/permissions', requirePermission('admin.roles.read'), checkRoleHasAnyPermission);

/**
 * @route   PUT /api/role-policies/role/:roleId/policies/bulk
 * @desc    Bulk assign policies to role
 * @access  Private - Requires 'admin.roles.update' permission
 */
router.put('/role/:roleId/policies/bulk', requirePermission('admin.roles.update'), bulkAssignPoliciesToRole);

/**
 * @route   DELETE /api/role-policies/role/:roleId/policies
 * @desc    Remove all policies from role
 * @access  Private - Requires 'admin.roles.update' permission
 */
router.delete('/role/:roleId/policies', requirePermission('admin.roles.update'), removeAllPoliciesFromRole);

export default router;
