import { Router } from 'express';
import authRoutes from './auth.routes';
import adminUserRoutes from './adminUser.routes';
import roleRoutes from './role.routes';
import vehicleRoutes from './vehicle.routes';
import bookingRoutes from './booking.routes';
import paymentRoutes from './payment.routes';
import documentRoutes from './document.routes';
import chauffeurRoutes from './chauffeur.routes';
import userRoutes from './user.routes';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/admin-users', adminUserRoutes);
router.use('/roles', roleRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/documents', documentRoutes);
router.use('/chauffeurs', chauffeurRoutes);
router.use('/users', userRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Fastscape Admin API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      adminUsers: '/api/admin-users',
      roles: '/api/roles',
      vehicles: '/api/vehicles',
      bookings: '/api/bookings',
      payments: '/api/payments',
      documents: '/api/documents',
      chauffeurs: '/api/chauffeurs',
      users: '/api/users',
      policies: '/api/policies',
      rolePolicy: '/api/role-policy',
      adminUserRole: '/api/admin-user-role',
    },
    documentation: 'API documentation available at /api/docs',
  });
});

export default router;
