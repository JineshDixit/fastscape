"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rolePolicy_controller_1 = require("../controllers/rolePolicy/rolePolicy.controller");
const middleware_1 = require("../services/middleware");
const router = (0, express_1.Router)();
// Apply authentication and active user check to all routes
router.use(middleware_1.authenticateUser, middleware_1.requireActiveUser);
/**
 * @route   POST /api/role-policies/assign
 * @desc    Assign policy to role
 * @access  Private - Requires 'admin.roles.update' permission
 */
router.post('/assign', middleware_1.generalLimiter, (0, middleware_1.requirePermission)('admin.roles.update'), rolePolicy_controller_1.assignPolicyToRole);
/**
 * @route   POST /api/role-policies/remove
 * @desc    Remove policy from role
 * @access  Private - Requires 'admin.roles.update' permission
 */
router.post('/remove', (0, middleware_1.requirePermission)('admin.roles.update'), rolePolicy_controller_1.removePolicyFromRole);
/**
 * @route   GET /api/role-policies/role/:roleId/policies
 * @desc    Get all policies assigned to a role
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.get('/role/:roleId/policies', (0, middleware_1.requirePermission)('admin.roles.read'), rolePolicy_controller_1.getRolePoliciesById);
/**
 * @route   GET /api/role-policies/policy/:policyId/roles
 * @desc    Get all roles that have a specific policy
 * @access  Private - Requires 'admin.policies.read' permission
 */
router.get('/policy/:policyId/roles', (0, middleware_1.requirePermission)('admin.policies.read'), rolePolicy_controller_1.getPolicyRolesById);
/**
 * @route   GET /api/role-policies/role/:roleId/permissions
 * @desc    Get all permissions for a role
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.get('/role/:roleId/permissions', (0, middleware_1.requirePermission)('admin.roles.read'), rolePolicy_controller_1.getRolePermissionsById);
/**
 * @route   GET /api/role-policies/check/role/:roleId/policy/:policyId
 * @desc    Check if role has specific policy
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.get('/check/role/:roleId/policy/:policyId', (0, middleware_1.requirePermission)('admin.roles.read'), rolePolicy_controller_1.checkRoleHasPolicy);
/**
 * @route   POST /api/role-policies/check/role/:roleId/policies
 * @desc    Check if role has any of the specified policies
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.post('/check/role/:roleId/policies', (0, middleware_1.requirePermission)('admin.roles.read'), rolePolicy_controller_1.checkRoleHasAnyPolicy);
/**
 * @route   GET /api/role-policies/check/role/:roleId/permission/:permission
 * @desc    Check if role has specific permission
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.get('/check/role/:roleId/permission/:permission', (0, middleware_1.requirePermission)('admin.roles.read'), rolePolicy_controller_1.checkRoleHasPermission);
/**
 * @route   POST /api/role-policies/check/role/:roleId/permissions
 * @desc    Check if role has any of the specified permissions
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.post('/check/role/:roleId/permissions', (0, middleware_1.requirePermission)('admin.roles.read'), rolePolicy_controller_1.checkRoleHasAnyPermission);
/**
 * @route   PUT /api/role-policies/role/:roleId/policies/bulk
 * @desc    Bulk assign policies to role
 * @access  Private - Requires 'admin.roles.update' permission
 */
router.put('/role/:roleId/policies/bulk', (0, middleware_1.requirePermission)('admin.roles.update'), rolePolicy_controller_1.bulkAssignPoliciesToRole);
/**
 * @route   DELETE /api/role-policies/role/:roleId/policies
 * @desc    Remove all policies from role
 * @access  Private - Requires 'admin.roles.update' permission
 */
router.delete('/role/:roleId/policies', (0, middleware_1.requirePermission)('admin.roles.update'), rolePolicy_controller_1.removeAllPoliciesFromRole);
exports.default = router;
//# sourceMappingURL=rolePolicy.routes.js.map