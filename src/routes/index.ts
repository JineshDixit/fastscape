import { Router } from 'express';
import authRoutes from './auth.routes';
import adminUserRoutes from './adminUser.routes';
import roleRoutes from './role.routes';
import vehicleRoutes from './vehicle.routes';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/admin-users', adminUserRoutes);
router.use('/roles', roleRoutes);
router.use('/vehicles', vehicleRoutes);

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
      policies: '/api/policies',
      rolePolicy: '/api/role-policy',
      adminUserRole: '/api/admin-user-role',
    },
    documentation: 'API documentation available at /api/docs',
  });
});

export default router;