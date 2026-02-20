import { Router } from 'express';
import {
  createVehicleController,
  getVehiclesController,
  getVehicleByIdController,
  updateVehicleController,
  deleteVehicleController,
  getVehicleStatsController,
  toggleAvailabilityController,
  bulkUpdateAvailabilityController,
  getVehicleEnumsController,
} from '../controllers/vehicle/vehicle.controller';
import { vehicleImageUpload, handleMulterError } from '../config/multer/multerConfig';
import {
  createVehicleValidation,
  updateVehicleValidation,
  vehicleIdValidation,
  bulkUpdateAvailabilityValidation,
  vehicleQueryValidation,
} from '../services/middleware/vehicleValidation';
import { authenticateUser, requireActiveUser, requireAnyPermission } from '../services/middleware';

const router = Router();

router.use(authenticateUser);
router.use(requireActiveUser);

router.get(
  '/',
  requireAnyPermission(['vehicle:read', 'vehicle:list', 'admin:all']),
  vehicleQueryValidation,
  getVehiclesController,
);

router.get('/stats', requireAnyPermission(['vehicle:read', 'vehicle:stats', 'admin:all']), getVehicleStatsController);

router.get('/enums', requireAnyPermission(['vehicle:read', 'vehicle:list', 'admin:all']), getVehicleEnumsController);

router.get(
  '/:id',
  requireAnyPermission(['vehicle:read', 'vehicle:view', 'admin:all']),
  vehicleIdValidation,
  getVehicleByIdController,
);

router.post(
  '/',
  requireAnyPermission(['vehicle:create', 'vehicle:write', 'admin:all']),
  vehicleImageUpload,
  handleMulterError,
  createVehicleValidation,
  createVehicleController,
);

router.put(
  '/:id',
  requireAnyPermission(['vehicle:update', 'vehicle:write', 'admin:all']),
  vehicleImageUpload,
  handleMulterError,
  updateVehicleValidation,
  updateVehicleController,
);

router.delete(
  '/:id',
  requireAnyPermission(['vehicle:delete', 'admin:all']),
  vehicleIdValidation,
  deleteVehicleController,
);

router.patch(
  '/:id/toggle-availability',
  requireAnyPermission(['vehicle:update', 'vehicle:write', 'admin:all']),
  vehicleIdValidation,
  toggleAvailabilityController,
);

router.patch(
  '/bulk/update-availability',
  requireAnyPermission(['vehicle:update', 'vehicle:write', 'admin:all']),
  bulkUpdateAvailabilityValidation,
  bulkUpdateAvailabilityController,
);

export default router;
