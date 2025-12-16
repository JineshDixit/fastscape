import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import { generalLimiter } from '../services/middleware/rateLimiter';

const router = Router();

// Apply general rate limiting to all routes
router.use(generalLimiter);

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;