import { Router } from 'express';
import * as userController from '../controllers/user/user.controller';
import { authenticateUser } from '../services/middleware/authenticateUser';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

/**
 * GET /api/users
 * Get all users with filters and pagination
 * Query params: verificationStatus, isBlocked, country, city, page, limit, search, sortBy, sortOrder
 */
router.get('/', userController.getAllUsers);

/**
 * GET /api/users/:id
 * Get single user details
 */
router.get('/:id', userController.getUserById);

/**
 * PUT /api/users/:id/verification-status
 * Update user verification status
 * Body: { verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' }
 */
router.put('/:id/verification-status', userController.updateVerificationStatus);

/**
 * PUT /api/users/:id/block
 * Block or unblock a user
 * Body: { isBlocked: boolean, reason?: string }
 */
router.put('/:id/block', userController.toggleBlockUser);

export default router;
