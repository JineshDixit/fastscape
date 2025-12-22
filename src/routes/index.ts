import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import vehicleRoutes from './vehicle.routes';
import bookingRoutes from './booking.routes';
import paymentRoutes from './payment.routes';
import chauffeurRoutes from './chauffeur.routes';
import { generalLimiter } from '../services/middleware/rateLimiter';

const router = Router();

// Apply general rate limiting to all routes
router.use(generalLimiter);

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/chauffeurs', chauffeurRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;