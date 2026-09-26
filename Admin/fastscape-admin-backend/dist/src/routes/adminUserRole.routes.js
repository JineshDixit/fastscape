"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminUserRole_controller_1 = require("../controllers/adminUserRole/adminUserRole.controller");
const middleware_1 = require("../services/middleware");
const router = (0, express_1.Router)();
// Apply authentication and active user check to all routes
router.use(middleware_1.authenticateUser, middleware_1.requireActiveUser);
/**
 * @route   POST /api/admin-user-roles/assign
 * @desc    Assign role to admin user
 * @access  Private - Requires 'admin.users.update' permission
 */
router.post('/assign', middleware_1.generalLimiter, (0, middleware_1.requirePermission)('admin.users.update'), adminUserRole_controller_1.assignRoleToUser);
/**
 * @route   POST /api/admin-user-roles/remove
 * @desc    Remove role from admin user
 * @access  Private - Requires 'admin.users.update' permission
 */
router.post('/remove', (0, middleware_1.requirePermission)('admin.users.update'), adminUserRole_controller_1.removeRoleFromUser);
/**
 * @route   GET /api/admin-user-roles/user/:adminUserId/roles
 * @desc    Get all roles assigned to an admin user
 * @access  Private - Requires 'admin.users.read' permission
 */
router.get('/user/:adminUserId/roles', (0, middleware_1.requirePermission)('admin.users.read'), adminUserRole_controller_1.getAdminUserRoles);
/**
 * @route   GET /api/admin-user-roles/role/:roleId/users
 * @desc    Get all admin users assigned to a role
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.get('/role/:roleId/users', (0, middleware_1.requirePermission)('admin.roles.read'), adminUserRole_controller_1.getRoleAdminUsers);
/**
 * @route   GET /api/admin-user-roles/user/:adminUserId/permissions
 * @desc    Get admin user permissions
 * @access  Private - Requires 'admin.users.read' permission
 */
router.get('/user/:adminUserId/permissions', (0, middleware_1.requirePermission)('admin.users.read'), adminUserRole_controller_1.getAdminUserPermissions);
/**
 * @route   GET /api/admin-user-roles/check/user/:adminUserId/role/:roleId
 * @desc    Check if admin user has specific role
 * @access  Private - Requires 'admin.users.read' permission
 */
router.get('/check/user/:adminUserId/role/:roleId', (0, middleware_1.requirePermission)('admin.users.read'), adminUserRole_controller_1.checkUserHasRole);
/**
 * @route   POST /api/admin-user-roles/check/user/:adminUserId/roles
 * @desc    Check if admin user has any of the specified roles
 * @access  Private - Requires 'admin.users.read' permission
 */
router.post('/check/user/:adminUserId/roles', (0, middleware_1.requirePermission)('admin.users.read'), adminUserRole_controller_1.checkUserHasAnyRole);
/**
 * @route   GET /api/admin-user-roles/check/user/:adminUserId/permission/:permission
 * @desc    Check if admin user has specific permission
 * @access  Private - Requires 'admin.users.read' permission
 */
router.get('/check/user/:adminUserId/permission/:permission', (0, middleware_1.requirePermission)('admin.users.read'), adminUserRole_controller_1.checkUserHasPermission);
/**
 * @route   POST /api/admin-user-roles/check/user/:adminUserId/permissions
 * @desc    Check if admin user has any of the specified permissions
 * @access  Private - Requires 'admin.users.read' permission
 */
router.post('/check/user/:adminUserId/permissions', (0, middleware_1.requirePermission)('admin.users.read'), adminUserRole_controller_1.checkUserHasAnyPermission);
/**
 * @route   PUT /api/admin-user-roles/user/:adminUserId/roles/bulk
 * @desc    Bulk assign roles to admin user
 * @access  Private - Requires 'admin.users.update' permission
 */
router.put('/user/:adminUserId/roles/bulk', (0, middleware_1.requirePermission)('admin.users.update'), adminUserRole_controller_1.bulkAssignRolesToUser);
/**
 * @route   DELETE /api/admin-user-roles/user/:adminUserId/roles
 * @desc    Remove all roles from admin user
 * @access  Private - Requires 'admin.users.update' permission
 */
router.delete('/user/:adminUserId/roles', (0, middleware_1.requirePermission)('admin.users.update'), adminUserRole_controller_1.removeAllRolesFromUser);
exports.default = router;
//# sourceMappingURL=adminUserRole.routes.js.map