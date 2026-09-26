import { Router } from 'express';
import * as locationController from '../controllers/location/location.controller';
import { authenticateUser } from '../services/middleware/authenticateUser';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

/**
 * GET /api/locations/export
 * Export locations to CSV with filters
 * Query params: city, isActive, search
 * Must be before /:id route to avoid route conflict
 */
router.get('/export', locationController.exportLocations);

/**
 * GET /api/locations/cities
 * Get all unique cities
 */
router.get('/cities', locationController.getAllCities);

/**
 * GET /api/locations
 * Get all locations with filters
 * Query params: city, isActive, search, page, limit, sortBy, sortOrder
 */
router.get('/', locationController.getAllLocations);

/**
 * GET /api/locations/:id
 * Get single location by ID
 */
router.get('/:id', locationController.getLocationById);

/**
 * POST /api/locations
 * Create a new location
 */
router.post('/', locationController.createLocation);

/**
 * PUT /api/locations/:id
 * Update location details
 */
router.put('/:id', locationController.updateLocation);

/**
 * PATCH /api/locations/:id/toggle-status
 * Toggle location active status
 */
router.patch('/:id/toggle-status', locationController.toggleLocationStatus);

/**
 * DELETE /api/locations/:id
 * Delete location
 */
router.delete('/:id', locationController.deleteLocation);

export default router;
