import { Router } from 'express';
import * as userController from '../controller/user/User.controller';
import { authenticateUser } from '../services/middleware/authenticateUser';
import { validateUserUpdate } from '../services/middleware/validation';
import { userIdentityDocUpload } from '../config/multer/multerConfig';

const router = Router();

// All user routes require authentication
router.use(authenticateUser);

// Get current user profile
router.get('/profile', userController.getCurrentUser);

// Update user profile
router.put('/profile', userIdentityDocUpload, validateUserUpdate, userController.updateUserProfile);

// Delete user account
router.delete('/profile', userController.deleteUserAccount);

// Get user statistics
router.get('/stats', userController.getUserStats);

// Address Management Routes (Moved to Aggregate)
// router.post('/address', userController.addAddress);

export default router;
