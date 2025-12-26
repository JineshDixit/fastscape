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
import { 
  authenticateUser, 
  requireActiveUser, 
  requireAnyPermission 
} from '../services/middleware';

const router = Router();

// Apply authentication and active user check to all routes
router.use(authenticateUser);
router.use(requireActiveUser);

/**
 * @swagger
 * components:
 *   schemas:
 *     Vehicle:
 *       type: object
 *       required:
 *         - make
 *         - model
 *         - year
 *         - exteriorColor
 *         - interiorColor
 *         - bodyType
 *         - transmission
 *         - drivetrain
 *         - engine
 *         - horsepower
 *         - fuelType
 *         - fuelConsumption
 *         - pricePerDay
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         make:
 *           type: string
 *           example: "Toyota"
 *         model:
 *           type: string
 *           example: "Camry"
 *         trim:
 *           type: string
 *           example: "XLE"
 *         year:
 *           type: integer
 *           example: 2023
 *         exteriorColor:
 *           type: string
 *           example: "White"
 *         interiorColor:
 *           type: string
 *           example: "Black"
 *         bodyType:
 *           type: string
 *           enum: [SUV, Sedan, Coupe, Supercar, Pickup, Hatchback]
 *         transmission:
 *           type: string
 *           enum: [Automatic, Manual]
 *         drivetrain:
 *           type: string
 *           enum: [AWD, RWD, FWD, 4x4]
 *         engine:
 *           type: string
 *           example: "2.5L 4-Cylinder"
 *         horsepower:
 *           type: integer
 *           example: 203
 *         fuelType:
 *           type: string
 *           enum: [Petrol, Diesel, Hybrid, Electric]
 *         fuelConsumption:
 *           type: string
 *           example: "8.5L/100km"
 *         pricePerDay:
 *           type: number
 *           format: decimal
 *           example: 89.99
 *         delayChargePerHour:
 *           type: number
 *           format: decimal
 *           example: 15.00
 *         depositPercentage:
 *           type: number
 *           format: decimal
 *           example: 20.00
 *         currency:
 *           type: string
 *           example: "USD"
 *         isAvailable:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     summary: Get all vehicles with filtering and pagination
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [make, model, year, pricePerDay, createdAt, updatedAt]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sort order
 *       - in: query
 *         name: make
 *         schema:
 *           type: string
 *         description: Filter by make
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Filter by model
 *       - in: query
 *         name: bodyType
 *         schema:
 *           type: string
 *           enum: [SUV, Sedan, Coupe, Supercar, Pickup, Hatchback]
 *         description: Filter by body type
 *       - in: query
 *         name: transmission
 *         schema:
 *           type: string
 *           enum: [Automatic, Manual]
 *         description: Filter by transmission
 *       - in: query
 *         name: fuelType
 *         schema:
 *           type: string
 *           enum: [Petrol, Diesel, Hybrid, Electric]
 *         description: Filter by fuel type
 *       - in: query
 *         name: isAvailable
 *         schema:
 *           type: boolean
 *         description: Filter by availability
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price per day
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price per day
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in make, model, trim, and color
 *     responses:
 *       200:
 *         description: Vehicles retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/',
  requireAnyPermission(['vehicle:read', 'vehicle:list', 'admin:all']),
  vehicleQueryValidation,
  getVehiclesController
);

/**
 * @swagger
 * /api/vehicles/stats:
 *   get:
 *     summary: Get vehicle statistics
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.get(
  '/stats',
  requireAnyPermission(['vehicle:read', 'vehicle:stats', 'admin:all']),
  getVehicleStatsController
);

/**
 * @swagger
 * /api/vehicles/enums:
 *   get:
 *     summary: Get vehicle enums for form dropdowns
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vehicle enums retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  '/enums',
  requireAnyPermission(['vehicle:read', 'vehicle:list', 'admin:all']),
  getVehicleEnumsController
);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     summary: Get vehicle by ID
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/:id',
  requireAnyPermission(['vehicle:read', 'vehicle:view', 'admin:all']),
  vehicleIdValidation,
  getVehicleByIdController
);

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     summary: Create a new vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - make
 *               - model
 *               - year
 *               - exteriorColor
 *               - interiorColor
 *               - bodyType
 *               - transmission
 *               - drivetrain
 *               - engine
 *               - horsepower
 *               - fuelType
 *               - fuelConsumption
 *               - pricePerDay
 *             properties:
 *               make:
 *                 type: string
 *               model:
 *                 type: string
 *               trim:
 *                 type: string
 *               year:
 *                 type: integer
 *               exteriorColor:
 *                 type: string
 *               interiorColor:
 *                 type: string
 *               bodyType:
 *                 type: string
 *                 enum: [SUV, Sedan, Coupe, Supercar, Pickup, Hatchback]
 *               transmission:
 *                 type: string
 *                 enum: [Automatic, Manual]
 *               drivetrain:
 *                 type: string
 *                 enum: [AWD, RWD, FWD, 4x4]
 *               engine:
 *                 type: string
 *               horsepower:
 *                 type: integer
 *               fuelType:
 *                 type: string
 *                 enum: [Petrol, Diesel, Hybrid, Electric]
 *               fuelConsumption:
 *                 type: string
 *               pricePerDay:
 *                 type: number
 *               delayChargePerHour:
 *                 type: number
 *               depositPercentage:
 *                 type: number
 *               currency:
 *                 type: string
 *               isAvailable:
 *                 type: boolean
 *               frontImage:
 *                 type: string
 *                 format: binary
 *               backImage:
 *                 type: string
 *                 format: binary
 *               leftSideImage:
 *                 type: string
 *                 format: binary
 *               rightSideImage:
 *                 type: string
 *                 format: binary
 *               frontLeftImage:
 *                 type: string
 *                 format: binary
 *               frontRightImage:
 *                 type: string
 *                 format: binary
 *               interiorFrontImage:
 *                 type: string
 *                 format: binary
 *               interiorBackImage:
 *                 type: string
 *                 format: binary
 *               dashboardImage:
 *                 type: string
 *                 format: binary
 *               engineImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  requireAnyPermission(['vehicle:create', 'vehicle:write', 'admin:all']),
  vehicleImageUpload,
  handleMulterError,
  createVehicleValidation,
  createVehicleController
);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   put:
 *     summary: Update vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               make:
 *                 type: string
 *               model:
 *                 type: string
 *               trim:
 *                 type: string
 *               year:
 *                 type: integer
 *               exteriorColor:
 *                 type: string
 *               interiorColor:
 *                 type: string
 *               bodyType:
 *                 type: string
 *                 enum: [SUV, Sedan, Coupe, Supercar, Pickup, Hatchback]
 *               transmission:
 *                 type: string
 *                 enum: [Automatic, Manual]
 *               drivetrain:
 *                 type: string
 *                 enum: [AWD, RWD, FWD, 4x4]
 *               engine:
 *                 type: string
 *               horsepower:
 *                 type: integer
 *               fuelType:
 *                 type: string
 *                 enum: [Petrol, Diesel, Hybrid, Electric]
 *               fuelConsumption:
 *                 type: string
 *               pricePerDay:
 *                 type: number
 *               delayChargePerHour:
 *                 type: number
 *               depositPercentage:
 *                 type: number
 *               currency:
 *                 type: string
 *               isAvailable:
 *                 type: boolean
 *               frontImage:
 *                 type: string
 *                 format: binary
 *               backImage:
 *                 type: string
 *                 format: binary
 *               leftSideImage:
 *                 type: string
 *                 format: binary
 *               rightSideImage:
 *                 type: string
 *                 format: binary
 *               frontLeftImage:
 *                 type: string
 *                 format: binary
 *               frontRightImage:
 *                 type: string
 *                 format: binary
 *               interiorFrontImage:
 *                 type: string
 *                 format: binary
 *               interiorBackImage:
 *                 type: string
 *                 format: binary
 *               dashboardImage:
 *                 type: string
 *                 format: binary
 *               engineImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
router.put(
  '/:id',
  requireAnyPermission(['vehicle:update', 'vehicle:write', 'admin:all']),
  vehicleImageUpload,
  handleMulterError,
  updateVehicleValidation,
  updateVehicleController
);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   delete:
 *     summary: Delete vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/:id',
  requireAnyPermission(['vehicle:delete', 'admin:all']),
  vehicleIdValidation,
  deleteVehicleController
);

/**
 * @swagger
 * /api/vehicles/{id}/toggle-availability:
 *   patch:
 *     summary: Toggle vehicle availability
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Vehicle ID
 *     responses:
 *       200:
 *         description: Vehicle availability updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Vehicle not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/:id/toggle-availability',
  requireAnyPermission(['vehicle:update', 'vehicle:write', 'admin:all']),
  vehicleIdValidation,
  toggleAvailabilityController
);

/**
 * @swagger
 * /api/vehicles/bulk/update-availability:
 *   patch:
 *     summary: Bulk update vehicle availability
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleIds
 *               - isAvailable
 *             properties:
 *               vehicleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Vehicles updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/bulk/update-availability',
  requireAnyPermission(['vehicle:update', 'vehicle:write', 'admin:all']),
  bulkUpdateAvailabilityValidation,
  bulkUpdateAvailabilityController
);

export default router;