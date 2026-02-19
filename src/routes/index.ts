import { Router } from 'express';
import authRoutes from './auth.routes';
import adminUserRoutes from './adminUser.routes';
import roleRoutes from './role.routes';
import policyRoutes from './policy.routes';
import rolePolicyRoutes from './rolePolicy.routes';
import adminUserRoleRoutes from './adminUserRole.routes';
import vehicleRoutes from './vehicle.routes';
import bookingRoutes from './booking.routes';
import paymentRoutes from './payment.routes';
import documentRoutes from './document.routes';
import chauffeurRoutes from './chauffeur.routes';
import userRoutes from './user.routes';
import locationRoutes from './location.routes';
import financeRoutes from './finance.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/admin-users', adminUserRoutes);
router.use('/roles', roleRoutes);
router.use('/policies', policyRoutes);
router.use('/role-policies', rolePolicyRoutes);
router.use('/admin-user-roles', adminUserRoleRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/documents', documentRoutes);
router.use('/chauffeurs', chauffeurRoutes);
router.use('/users', userRoutes);
router.use('/locations', locationRoutes);
router.use('/finance', financeRoutes);
router.use('/dashboard', dashboardRoutes);

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
      locations: '/api/locations',
      finance: '/api/finance',
      dashboard: '/api/dashboard',
      policies: '/api/policies',
      rolePolicies: '/api/role-policies',
      adminUserRoles: '/api/admin-user-roles',
    },
    documentation: 'API documentation available at /api/docs',
  });
});

export default router;
