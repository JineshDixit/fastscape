import { Router } from 'express';
import * as authController from '../controller/auth/auth.controller';
import { authenticateUser } from '../services/middleware/authenticateUser';
import { authLimiter, refreshTokenLimiter } from '../services/middleware/rateLimiter';
import {
  validateRegistration,
  validateLogin,
  validateRefreshToken,
  validateForgotPassword,
  validateVerifyOtp,
  validateResetPassword,
} from '../services/middleware/validation';

const router = Router();

// Public routes with rate limiting and validation
router.post('/register', authLimiter, validateRegistration, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/refresh-token', refreshTokenLimiter, validateRefreshToken, authController.refreshToken);
router.post('/logout', validateRefreshToken, authController.logout);

router.post('/forgot-password', authLimiter, validateForgotPassword, authController.forgotPassword);
router.post('/verify-otp', authLimiter, validateVerifyOtp, authController.verifyOtp);
router.post('/reset-password', authLimiter, validateResetPassword, authController.resetPassword);

// Protected routes
router.post('/logout-all', authenticateUser, authController.logoutAllDevices);

export default router;
