import { Router } from 'express';
import * as userController from '../controller/user/User.controller';
import { authenticateUser } from '../services/middleware/authenticateUser';
import { body } from 'express-validator';
import { handleValidationErrors } from '../services/middleware/validation';

const router = Router();

// Get current user profile
router.get('/profile', authenticateUser, userController.getCurrentUser);

// Update user profile
router.put('/profile', 
  authenticateUser,
  [
    body('fullName').optional().trim().isLength({ min: 2, max: 150 }),
    body('phone').optional().isMobilePhone('any'),
    body('nationality').optional().trim().isLength({ min: 2, max: 100 }),
    body('homeAddress').optional().trim().isLength({ max: 500 }),
    handleValidationErrors,
  ],
  userController.updateUserProfile
);

// Delete user account
router.delete('/profile', authenticateUser, userController.deleteUserAccount);

// Admin routes (for future use)
router.get('/:userId', authenticateUser, userController.getUserById);

export default router;