"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_controller_1 = require("../controllers/role/role.controller");
const middleware_1 = require("../services/middleware");
const router = (0, express_1.Router)();
// Apply authentication and active user check to all routes
router.use(middleware_1.authenticateUser, middleware_1.requireActiveUser);
/**
 * @route   POST /api/roles
 * @desc    Create a new role
 * @access  Private - Requires 'admin.roles.create' permission
 */
router.post('/', middleware_1.generalLimiter, (0, middleware_1.requirePermission)('admin.roles.create'), role_controller_1.createRole);
/**
 * @route   GET /api/roles
 * @desc    Get all roles with pagination
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.get('/', (0, middleware_1.requirePermission)('admin.roles.read'), role_controller_1.getAllRoles);
/**
 * @route   GET /api/roles/:id
 * @desc    Get role by ID
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.get('/:id', (0, middleware_1.requirePermission)('admin.roles.read'), role_controller_1.getRoleById);
/**
 * @route   GET /api/roles/name/:name
 * @desc    Get role by name
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.get('/name/:name', (0, middleware_1.requirePermission)('admin.roles.read'), role_controller_1.getRoleByName);
/**
 * @route   PUT /api/roles/:id
 * @desc    Update role
 * @access  Private - Requires 'admin.roles.update' permission
 */
router.put('/:id', (0, middleware_1.requirePermission)('admin.roles.update'), role_controller_1.updateRole);
/**
 * @route   PUT /api/roles/:id/activate
 * @desc    Activate role
 * @access  Private - Requires 'admin.roles.activate' permission
 */
router.put('/:id/activate', (0, middleware_1.requireAnyPermission)(['admin.roles.activate', 'admin.roles.update']), role_controller_1.activateRole);
/**
 * @route   PUT /api/roles/:id/deactivate
 * @desc    Deactivate role
 * @access  Private - Requires 'admin.roles.deactivate' permission
 */
router.put('/:id/deactivate', (0, middleware_1.requireAnyPermission)(['admin.roles.deactivate', 'admin.roles.update']), role_controller_1.deactivateRole);
/**
 * @route   DELETE /api/roles/:id
 * @desc    Delete role
 * @access  Private - Requires 'admin.roles.delete' permission
 */
router.delete('/:id', (0, middleware_1.requirePermission)('admin.roles.delete'), role_controller_1.deleteRole);
exports.default = router;
//# sourceMappingURL=role.routes.js.map