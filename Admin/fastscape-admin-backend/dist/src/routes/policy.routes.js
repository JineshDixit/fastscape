"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const policy_controller_1 = require("../controllers/policy/policy.controller");
const middleware_1 = require("../services/middleware");
const router = (0, express_1.Router)();
// Apply authentication and active user check to all routes
router.use(middleware_1.authenticateUser, middleware_1.requireActiveUser);
/**
 * @route   POST /api/policies
 * @desc    Create a new policy
 * @access  Private - Requires 'admin.policies.create' permission
 */
router.post('/', middleware_1.generalLimiter, (0, middleware_1.requirePermission)('admin.policies.create'), policy_controller_1.createPolicy);
/**
 * @route   GET /api/policies
 * @desc    Get all policies with pagination
 * @access  Private - Requires 'admin.policies.read' permission
 */
router.get('/', (0, middleware_1.requirePermission)('admin.policies.read'), policy_controller_1.getAllPolicies);
/**
 * @route   GET /api/policies/:id
 * @desc    Get policy by ID
 * @access  Private - Requires 'admin.policies.read' permission
 */
router.get('/:id', (0, middleware_1.requirePermission)('admin.policies.read'), policy_controller_1.getPolicyById);
/**
 * @route   GET /api/policies/name/:name
 * @desc    Get policy by name
 * @access  Private - Requires 'admin.policies.read' permission
 */
router.get('/name/:name', (0, middleware_1.requirePermission)('admin.policies.read'), policy_controller_1.getPolicyByName);
/**
 * @route   GET /api/policies/search/permission/:permission
 * @desc    Search policies by permission
 * @access  Private - Requires 'admin.policies.read' permission
 */
router.get('/search/permission/:permission', (0, middleware_1.requirePermission)('admin.policies.read'), policy_controller_1.searchPoliciesByPermission);
/**
 * @route   GET /api/policies/:id/roles
 * @desc    Get roles that have this policy
 * @access  Private - Requires 'admin.policies.read' permission
 */
router.get('/:id/roles', (0, middleware_1.requirePermission)('admin.policies.read'), policy_controller_1.getPolicyRoles);
/**
 * @route   PUT /api/policies/:id
 * @desc    Update policy
 * @access  Private - Requires 'admin.policies.update' permission
 */
router.put('/:id', (0, middleware_1.requirePermission)('admin.policies.update'), policy_controller_1.updatePolicy);
/**
 * @route   PUT /api/policies/:id/permissions
 * @desc    Add permission to policy
 * @access  Private - Requires 'admin.policies.update' permission
 */
router.put('/:id/permissions', (0, middleware_1.requirePermission)('admin.policies.update'), policy_controller_1.addPermissionToPolicy);
/**
 * @route   DELETE /api/policies/:id/permissions
 * @desc    Remove permission from policy
 * @access  Private - Requires 'admin.policies.update' permission
 */
router.delete('/:id/permissions', (0, middleware_1.requirePermission)('admin.policies.update'), policy_controller_1.removePermissionFromPolicy);
/**
 * @route   PUT /api/policies/:id/activate
 * @desc    Activate policy
 * @access  Private - Requires 'admin.policies.activate' permission
 */
router.put('/:id/activate', (0, middleware_1.requireAnyPermission)(['admin.policies.activate', 'admin.policies.update']), policy_controller_1.activatePolicy);
/**
 * @route   PUT /api/policies/:id/deactivate
 * @desc    Deactivate policy
 * @access  Private - Requires 'admin.policies.deactivate' permission
 */
router.put('/:id/deactivate', (0, middleware_1.requireAnyPermission)(['admin.policies.deactivate', 'admin.policies.update']), policy_controller_1.deactivatePolicy);
/**
 * @route   DELETE /api/policies/:id
 * @desc    Delete policy
 * @access  Private - Requires 'admin.policies.delete' permission
 */
router.delete('/:id', (0, middleware_1.requirePermission)('admin.policies.delete'), policy_controller_1.deletePolicy);
exports.default = router;
//# sourceMappingURL=policy.routes.js.map