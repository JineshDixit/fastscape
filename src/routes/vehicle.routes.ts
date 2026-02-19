import { Router } from 'express';
import * as vehicleController from '../controller/vehicle/vehicle.controller';
import { handleValidationErrors, vehicleIdValidation, vehicleQueryValidation } from '../services/middleware/validation';
import { authenticateUser } from '../services/middleware/authenticateUser';

const router = Router();

router.get('/', vehicleQueryValidation, handleValidationErrors, vehicleController.getVehicles);

router.get('/stats', vehicleController.getVehicleStats);

router.get('/body-types/summary', vehicleController.getVehicleBodyTypeSummary);

router.get('/filters/metadata', vehicleController.getVehicleFilterMetadata);

router.get('/available', vehicleController.getAvailableVehicles);

router.get('/most-popular', vehicleController.getMostPopularCar);

router.get(
  '/:id/availability',
  authenticateUser,
  vehicleIdValidation,
  handleValidationErrors,
  vehicleController.checkVehicleAvailability,
);

router.get('/:id', vehicleIdValidation, handleValidationErrors, vehicleController.getVehicleById);

export default router;
