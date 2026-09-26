import { Router } from 'express';
import {
  createPolicy,
  getPolicyById,
  getAllPolicies,
  updatePolicy,
  deletePolicy,
  addPermissionToPolicy,
  removePermissionFromPolicy,
  getPolicyRoles,
  activatePolicy,
  deactivatePolicy,
  getPolicyByName,
  searchPoliciesByPermission,
  getPolicyPermissionPresets,
} from '../controllers/policy/policy.controller';
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
 * @route   POST /api/policies
 * @desc    Create a new policy
 * @access  Private - Requires 'admin.policies.create' permission
 */
router.post('/', generalLimiter, requirePermission('admin.policies.create'), createPolicy);

/**
 * @route   GET /api/policies
 * @desc    Get all policies with pagination
 * @access  Private - Requires 'admin.policies.read' permission
 */
router.get('/', requirePermission('admin.policies.read'), getAllPolicies);

/**
 * @route   GET /api/policies/permission-presets
 * @desc    Get permission presets for policy creation
 * @access  Private - Requires 'admin.policies.read' permission
 */
router.get('/permission-presets', requirePermission('admin.policies.read'), getPolicyPermissionPresets);

/**
 * @route   GET /api/policies/:id
 * @desc    Get policy by ID
 * @access  Private - Requires 'admin.policies.read' permission
 */
router.get('/:id', requirePermission('admin.policies.read'), getPolicyById);

/**
 * @route   GET /api/policies/name/:name
 * @desc    Get policy by name
 * @access  Private - Requires 'admin.policies.read' permission
 */
router.get('/name/:name', requirePermission('admin.policies.read'), getPolicyByName);

/**
 * @route   GET /api/policies/search/permission/:permission
 * @desc    Search policies by permission
 * @access  Private - Requires 'admin.policies.read' permission
 */
router.get('/search/permission/:permission', requirePermission('admin.policies.read'), searchPoliciesByPermission);

/**
 * @route   GET /api/policies/:id/roles
 * @desc    Get roles that have this policy
 * @access  Private - Requires 'admin.policies.read' permission
 */
router.get('/:id/roles', requirePermission('admin.policies.read'), getPolicyRoles);

/**
 * @route   PUT /api/policies/:id
 * @desc    Update policy
 * @access  Private - Requires 'admin.policies.update' permission
 */
router.put('/:id', requirePermission('admin.policies.update'), updatePolicy);

/**
 * @route   PUT /api/policies/:id/permissions
 * @desc    Add permission to policy
 * @access  Private - Requires 'admin.policies.update' permission
 */
router.put('/:id/permissions', requirePermission('admin.policies.update'), addPermissionToPolicy);

/**
 * @route   DELETE /api/policies/:id/permissions
 * @desc    Remove permission from policy
 * @access  Private - Requires 'admin.policies.update' permission
 */
router.delete('/:id/permissions', requirePermission('admin.policies.update'), removePermissionFromPolicy);

/**
 * @route   PUT /api/policies/:id/activate
 * @desc    Activate policy
 * @access  Private - Requires 'admin.policies.activate' permission
 */
router.put('/:id/activate', requireAnyPermission(['admin.policies.activate', 'admin.policies.update']), activatePolicy);

/**
 * @route   PUT /api/policies/:id/deactivate
 * @desc    Deactivate policy
 * @access  Private - Requires 'admin.policies.deactivate' permission
 */
router.put(
  '/:id/deactivate',
  requireAnyPermission(['admin.policies.deactivate', 'admin.policies.update']),
  deactivatePolicy,
);

/**
 * @route   DELETE /api/policies/:id
 * @desc    Delete policy
 * @access  Private - Requires 'admin.policies.delete' permission
 */
router.delete('/:id', requirePermission('admin.policies.delete'), deletePolicy);

export default router;
