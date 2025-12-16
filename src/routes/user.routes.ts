import { Router } from 'express';
import { authenticateUser } from '../services/middleware/authenticateUser';
import { fetchCurrentUser } from '../services/user/user.service';

const router = Router();

// Get current user profile
router.get('/profile', authenticateUser, fetchCurrentUser);

export default router;