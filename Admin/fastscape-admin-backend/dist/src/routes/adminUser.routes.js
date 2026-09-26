"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminUser_controller_1 = require("../controllers/adminUser/adminUser.controller");
const middleware_1 = require("../services/middleware");
const router = (0, express_1.Router)();
// Apply authentication and active user check to all routes
router.use(middleware_1.authenticateUser, middleware_1.requireActiveUser);
/**
 * @route   POST /api/admin-users
 * @desc    Create a new admin user
 * @access  Private - Requires 'admin.users.create' permission
 */
router.post('/', middleware_1.generalLimiter, (0, middleware_1.requirePermission)('admin.users.create'), adminUser_controller_1.createAdminUser);
/**
 * @route   GET /api/admin-users
 * @desc    Get all admin users with pagination
 * @access  Private - Requires 'admin.users.read' permission
 */
router.get('/', (0, middleware_1.requirePermission)('admin.users.read'), adminUser_controller_1.getAllAdminUsers);
/**
 * @route   GET /api/admin-users/:id
 * @desc    Get admin user by ID
 * @access  Private - Own profile or 'admin.users.read' permission
 */
router.get('/:id', (0, middleware_1.requireAnyPermission)(['admin.users.read']), adminUser_controller_1.getAdminUserById);
/**
 * @route   PUT /api/admin-users/:id
 * @desc    Update admin user
 * @access  Private - Own profile or 'admin.users.update' permission
 */
router.put('/:id', (0, middleware_1.requireOwnershipOrRole)('super-admin'), adminUser_controller_1.updateAdminUser);
/**
 * @route   PUT /api/admin-users/:id/password
 * @desc    Update admin user password
 * @access  Private - Own profile or 'admin.users.update' permission
 */
router.put('/:id/password', (0, middleware_1.requireOwnershipOrRole)('super-admin'), adminUser_controller_1.updateAdminUserPassword);
/**
 * @route   PUT /api/admin-users/me/language
 * @desc    Update current admin user's language preference
 * @access  Private - Own profile only
 */
router.put('/me/language', adminUser_controller_1.updateAdminUserLanguage);
/**
 * @route   PUT /api/admin-users/me/password
 * @desc    Change current admin user's password (with current password verification)
 * @access  Private - Own profile only
 */
router.put('/me/password', adminUser_controller_1.changeAdminUserPassword);
/**
 * @route   PUT /api/admin-users/:id/activate
 * @desc    Activate admin user
 * @access  Private - Requires 'admin.users.activate' permission
 */
router.put('/:id/activate', (0, middleware_1.requirePermission)('admin.users.activate'), adminUser_controller_1.activateAdminUser);
/**
 * @route   PUT /api/admin-users/:id/deactivate
 * @desc    Deactivate admin user
 * @access  Private - Requires 'admin.users.deactivate' permission
 */
router.put('/:id/deactivate', (0, middleware_1.requirePermission)('admin.users.deactivate'), adminUser_controller_1.deactivateAdminUser);
/**
 * @route   DELETE /api/admin-users/:id
 * @desc    Delete admin user
 * @access  Private - Requires 'admin.users.delete' permission
 */
router.delete('/:id', (0, middleware_1.requirePermission)('admin.users.delete'), adminUser_controller_1.deleteAdminUser);
exports.default = router;
//# sourceMappingURL=adminUser.routes.js.map