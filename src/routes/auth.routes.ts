import { Router } from 'express';
import { 
  registerUser, 
  loginUser, 
  refreshToken, 
  logoutUser, 
  logoutAllDevices 
} from '../services/auth/userAuth.service';
import { authenticateUser } from '../services/middleware/authenticateUser';
import { authLimiter, refreshTokenLimiter } from '../services/middleware/rateLimiter';
import { 
  validateRegistration, 
  validateLogin, 
  validateRefreshToken 
} from '../services/middleware/validation';

const router = Router();

// Public routes with rate limiting and validation
router.post('/register', authLimiter, validateRegistration, registerUser);
router.post('/login', authLimiter, validateLogin, loginUser);
router.post('/refresh-token', refreshTokenLimiter, validateRefreshToken, refreshToken);
router.post('/logout', validateRefreshToken, logoutUser);

// Protected routes
router.post('/logout-all', authenticateUser, logoutAllDevices);

export default router;