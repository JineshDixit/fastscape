import { Router } from 'express';
import * as userController from '../controller/user/User.controller';
import { authenticateUser } from '../services/middleware/authenticateUser';
import { validateUserUpdate } from '../services/middleware/validation';

const router = Router();

// Get current user profile
router.get('/profile', authenticateUser, userController.getCurrentUser);

// Update user profile
router.put('/profile', authenticateUser, validateUserUpdate, userController.updateUserProfile);

// Delete user account
router.delete('/profile', authenticateUser, userController.deleteUserAccount);

// Admin routes (for future use)
router.get('/:userId', authenticateUser, userController.getUserById);

export default router;
