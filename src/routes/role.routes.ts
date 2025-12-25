import { Router } from 'express';
import {
  createRole,
  getRoleById,
  getAllRoles,
  updateRole,
  deleteRole,
  activateRole,
  deactivateRole,
  getRoleByName,
} from '../controllers/role/role.controller';
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
 * @route   POST /api/roles
 * @desc    Create a new role
 * @access  Private - Requires 'admin.roles.create' permission
 */
router.post(
  '/',
  generalLimiter,
  requirePermission('admin.roles.create'),
  createRole
);

/**
 * @route   GET /api/roles
 * @desc    Get all roles with pagination
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.get(
  '/',
  requirePermission('admin.roles.read'),
  getAllRoles
);

/**
 * @route   GET /api/roles/:id
 * @desc    Get role by ID
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.get(
  '/:id',
  requirePermission('admin.roles.read'),
  getRoleById
);

/**
 * @route   GET /api/roles/name/:name
 * @desc    Get role by name
 * @access  Private - Requires 'admin.roles.read' permission
 */
router.get(
  '/name/:name',
  requirePermission('admin.roles.read'),
  getRoleByName
);

/**
 * @route   PUT /api/roles/:id
 * @desc    Update role
 * @access  Private - Requires 'admin.roles.update' permission
 */
router.put(
  '/:id',
  requirePermission('admin.roles.update'),
  updateRole
);

/**
 * @route   PUT /api/roles/:id/activate
 * @desc    Activate role
 * @access  Private - Requires 'admin.roles.activate' permission
 */
router.put(
  '/:id/activate',
  requireAnyPermission(['admin.roles.activate', 'admin.roles.update']),
  activateRole
);

/**
 * @route   PUT /api/roles/:id/deactivate
 * @desc    Deactivate role
 * @access  Private - Requires 'admin.roles.deactivate' permission
 */
router.put(
  '/:id/deactivate',
  requireAnyPermission(['admin.roles.deactivate', 'admin.roles.update']),
  deactivateRole
);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Delete role
 * @access  Private - Requires 'admin.roles.delete' permission
 */
router.delete(
  '/:id',
  requirePermission('admin.roles.delete'),
  deleteRole
);

export default router;