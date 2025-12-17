import { Router } from 'express';
import * as vehicleController from '../controller/vehicle/vehicle.controller';
import { query } from 'express-validator';
import { handleValidationErrors } from '../services/middleware/validation';

const router = Router();

// Get available vehicles with filters
router.get('/',
  [
    query('startDate').optional().isISO8601().withMessage('Valid start date is required'),
    query('endDate').optional().isISO8601().withMessage('Valid end date is required'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Minimum price must be a positive number'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Maximum price must be a positive number'),
    handleValidationErrors,
  ],
  vehicleController.getAvailableVehicles
);

// Search vehicles
router.get('/search',
  [
    query('query').isLength({ min: 2 }).withMessage('Search query must be at least 2 characters long'),
    handleValidationErrors,
  ],
  vehicleController.searchVehicles
);

// Get vehicle by ID
router.get('/:vehicleId', vehicleController.getVehicleById);

export default router;