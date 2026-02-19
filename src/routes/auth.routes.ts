import { Router } from 'express';
import {
  registerAdmin,
  loginAdmin,
  refresh,
  logoutAdmin,
  logoutAll,
  getProfile,
  updateProfile,
} from '../controllers/auth/auth.controller';
import {
  authenticateUser,
  authLimiter,
  refreshTokenLimiter,
  requireActiveUser,
} from '../services/middleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new admin user
 * @access  Public (but should be restricted in production)
 */
router.post('/register', authLimiter, registerAdmin);

/**
 * @route   POST /api/auth/login
 * @desc    Login admin user
 * @access  Public
 */
router.post('/login', authLimiter, loginAdmin);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refreshTokenLimiter, refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout admin user
 * @access  Private
 */
router.post('/logout', authenticateUser, requireActiveUser, logoutAdmin);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post('/logout-all', authenticateUser, requireActiveUser, logoutAll);

/**
 * @route   GET /api/auth/profile
 * @desc    Get admin user profile
 * @access  Private
 */
router.get('/profile', authenticateUser, requireActiveUser, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update admin user profile
 * @access  Private
 */
router.put('/profile', authenticateUser, requireActiveUser, updateProfile);

export default router;