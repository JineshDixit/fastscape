import { Router } from 'express';
import * as vehicleController from '../controller/vehicle/vehicle.controller';
import { handleValidationErrors, vehicleIdValidation, vehicleQueryValidation } from '../services/middleware/validation';

const router = Router();

router.get('/', handleValidationErrors, vehicleQueryValidation, vehicleController.getVehiclesController);

router.get('/stats', handleValidationErrors, vehicleController.getVehicleStatsController);

router.get('/:id', handleValidationErrors, vehicleIdValidation, vehicleController.getVehicleByIdController);

router.get('/body-types/summary', handleValidationErrors, vehicleController.getVehicleBodyTypeSummaryController);

router.get('/filters/metadata', handleValidationErrors, vehicleController.getVehicleFilterMetadataController);

export default router;
