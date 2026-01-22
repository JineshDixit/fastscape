import { NextFunction, Request, Router } from 'express';
import * as vehicleController from '../controller/vehicle/vehicle.controller';
import {
  handleValidationErrors,
  vehicleIdValidation,
  vehicleQueryValidation,
  availableVehiclesValidation,
} from '../services/middleware/validation';

const router = Router();

// Get all vehicles with filtering and pagination
router.get('/', vehicleQueryValidation, handleValidationErrors, vehicleController.getVehicles);

// Get vehicle statistics
router.get('/stats', vehicleController.getVehicleStats);

// Get body type summary
router.get('/body-types/summary', vehicleController.getVehicleBodyTypeSummary);

// Get filter metadata
router.get('/filters/metadata', vehicleController.getVehicleFilterMetadata);

// Search available vehicles (requires date validation)
router.get('/available', availableVehiclesValidation, handleValidationErrors, vehicleController.getAvailableVehicles);

// Get vehicle availability for specific dates
router.get('/:id/availability', vehicleIdValidation, handleValidationErrors, vehicleController.checkAvailability);

// Debug endpoint to check vehicle bookings
router.get('/:id/debug-bookings', vehicleIdValidation, handleValidationErrors, vehicleController.debugVehicleBookings);

// Get vehicle by ID
router.get('/:id', vehicleIdValidation, handleValidationErrors, vehicleController.getVehicleById);

export default router;
