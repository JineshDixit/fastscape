import { Router } from 'express';
import {
  createAdminUser,
  getAdminUserById,
  getAllAdminUsers,
  updateAdminUser,
  updateAdminUserPassword,
  changeAdminUserPassword,
  updateAdminUserLanguage,
  activateAdminUser,
  deactivateAdminUser,
  deleteAdminUser,
} from '../controllers/adminUser/adminUser.controller';
import {
  authenticateUser,
  requireActiveUser,
  requirePermission,
  requireAnyPermission,
  requireOwnershipOrRole,
  generalLimiter,
} from '../services/middleware';

const router = Router();

// Apply authentication and active user check to all routes
router.use(authenticateUser, requireActiveUser);

/**
 * @route   POST /api/admin-users
 * @desc    Create a new admin user
 * @access  Private - Requires 'admin.users.create' permission
 */
router.post(
  '/',
  generalLimiter,
  requirePermission('admin.users.create'),
  createAdminUser
);

/**
 * @route   GET /api/admin-users
 * @desc    Get all admin users with pagination
 * @access  Private - Requires 'admin.users.read' permission
 */
router.get(
  '/',
  requirePermission('admin.users.read'),
  getAllAdminUsers
);

/**
 * @route   GET /api/admin-users/:id
 * @desc    Get admin user by ID
 * @access  Private - Own profile or 'admin.users.read' permission
 */
router.get(
  '/:id',
  requireAnyPermission(['admin.users.read']),
  getAdminUserById
);

/**
 * @route   PUT /api/admin-users/:id
 * @desc    Update admin user
 * @access  Private - Own profile or 'admin.users.update' permission
 */
router.put(
  '/:id',
  requireOwnershipOrRole('super-admin'),
  updateAdminUser
);

/**
 * @route   PUT /api/admin-users/:id/password
 * @desc    Update admin user password
 * @access  Private - Own profile or 'admin.users.update' permission
 */
router.put(
  '/:id/password',
  requireOwnershipOrRole('super-admin'),
  updateAdminUserPassword
);

/**
 * @route   PUT /api/admin-users/me/language
 * @desc    Update current admin user's language preference
 * @access  Private - Own profile only
 */
router.put(
  '/me/language',
  updateAdminUserLanguage
);

/**
 * @route   PUT /api/admin-users/me/password
 * @desc    Change current admin user's password (with current password verification)
 * @access  Private - Own profile only
 */
router.put(
  '/me/password',
  changeAdminUserPassword
);

/**
 * @route   PUT /api/admin-users/:id/activate
 * @desc    Activate admin user
 * @access  Private - Requires 'admin.users.activate' permission
 */
router.put(
  '/:id/activate',
  requirePermission('admin.users.activate'),
  activateAdminUser
);

/**
 * @route   PUT /api/admin-users/:id/deactivate
 * @desc    Deactivate admin user
 * @access  Private - Requires 'admin.users.deactivate' permission
 */
router.put(
  '/:id/deactivate',
  requirePermission('admin.users.deactivate'),
  deactivateAdminUser
);

/**
 * @route   DELETE /api/admin-users/:id
 * @desc    Delete admin user
 * @access  Private - Requires 'admin.users.delete' permission
 */
router.delete(
  '/:id',
  requirePermission('admin.users.delete'),
  deleteAdminUser
);

export default router;