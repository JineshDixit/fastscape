import { Router } from 'express';
import * as userController from '../controller/user/User.controller';
import { authenticateUser } from '../services/middleware/authenticateUser';
import { validateUserUpdate } from '../services/middleware/validation';
import { userIdentityDocUpload } from '../config/multer/multerConfig';

const router = Router();

// Get current user profile
router.get('/profile', authenticateUser, userController.getCurrentUser);

// Update user profile
router.put('/profile', authenticateUser, userIdentityDocUpload, validateUserUpdate, userController.updateUserProfile);

export default router;
