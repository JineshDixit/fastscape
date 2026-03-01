import { Request, Response, NextFunction } from 'express';
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getVehicleStats,
  toggleVehicleAvailability,
  bulkUpdateVehicleAvailability,
} from '../../services/vehicle/vehicle.service';
import { validationResult } from 'express-validator';
import { sendSuccess, sendCreated } from '../../utils/response.utils';
import { createError } from '../../services/middleware/errorHandler';
import { dbEnums } from '../../common/enum/dbEnums';

/**
 * Create a new vehicle
 */
export const createVehicleController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400);
    }

    const vehicleData = {
      make: req.body.make,
      model: req.body.model,
      trim: req.body.trim,
      year: parseInt(req.body.year),
      exteriorColor: req.body.exteriorColor,
      interiorColor: req.body.interiorColor,
      bodyType: req.body.bodyType,
      transmission: req.body.transmission,
      drivetrain: req.body.drivetrain,
      engine: req.body.engine,
      horsepower: parseInt(req.body.horsepower),
      fuelType: req.body.fuelType,
      fuelConsumption: req.body.fuelConsumption,
      pricePerDay: parseFloat(req.body.pricePerDay),
      delayChargePerHour: req.body.delayChargePerHour ? parseFloat(req.body.delayChargePerHour) : undefined,
      depositPercentage: req.body.depositPercentage ? parseFloat(req.body.depositPercentage) : undefined,
      currency: req.body.currency || 'USD',
      isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable === 'true' : true,
      passengerCapacity: req.body.passengerCapacity ? parseInt(req.body.passengerCapacity) : 5,
      locationId: req.body.locationId || undefined,
    };

    // Handle image files
    const imageFiles = req.files as any;

    const vehicle = await createVehicle(vehicleData, imageFiles);

    sendCreated(res, 'Vehicle created successfully', vehicle);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all vehicles with filtering and pagination
 */
export const getVehiclesController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filters = {
      make: req.query.make as string,
      model: req.query.model as string,
      bodyType: req.query.bodyType as (typeof dbEnums.VEHICLE_BODY_TYPE)[number],
      transmission: req.query.transmission as (typeof dbEnums.TRANSMISSION_TYPE)[number],
      fuelType: req.query.fuelType as (typeof dbEnums.FUEL_TYPE)[number],
      isAvailable: req.query.isAvailable ? req.query.isAvailable === 'true' : undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      city: req.query.city as string,
      locationId: req.query.locationId as string,
      passengerCapacity: req.query.passengerCapacity ? parseInt(req.query.passengerCapacity as string) : undefined,
      search: req.query.search as string,
    };

    const pagination = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
    };

    const result = await getVehicles(filters, pagination);

    sendSuccess(res, 'Vehicles retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get vehicle by ID
 */
export const getVehicleByIdController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const vehicle = await getVehicleById(id);

    sendSuccess(res, 'Vehicle retrieved successfully', vehicle);
  } catch (error) {
    next(error);
  }
};

/**
 * Update vehicle
 */
export const updateVehicleController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400);
    }

    const { id } = req.params;
    const updateData: any = {};

    // Only include fields that are provided
    if (req.body.make !== undefined) updateData.make = req.body.make;
    if (req.body.model !== undefined) updateData.model = req.body.model;
    if (req.body.trim !== undefined) updateData.trim = req.body.trim;
    if (req.body.year !== undefined) updateData.year = parseInt(req.body.year);
    if (req.body.exteriorColor !== undefined) updateData.exteriorColor = req.body.exteriorColor;
    if (req.body.interiorColor !== undefined) updateData.interiorColor = req.body.interiorColor;
    if (req.body.bodyType !== undefined) updateData.bodyType = req.body.bodyType;
    if (req.body.transmission !== undefined) updateData.transmission = req.body.transmission;
    if (req.body.drivetrain !== undefined) updateData.drivetrain = req.body.drivetrain;
    if (req.body.engine !== undefined) updateData.engine = req.body.engine;
    if (req.body.horsepower !== undefined) updateData.horsepower = parseInt(req.body.horsepower);
    if (req.body.fuelType !== undefined) updateData.fuelType = req.body.fuelType;
    if (req.body.fuelConsumption !== undefined) updateData.fuelConsumption = req.body.fuelConsumption;
    if (req.body.pricePerDay !== undefined) updateData.pricePerDay = parseFloat(req.body.pricePerDay);
    if (req.body.delayChargePerHour !== undefined)
      updateData.delayChargePerHour = parseFloat(req.body.delayChargePerHour);
    if (req.body.depositPercentage !== undefined) updateData.depositPercentage = parseFloat(req.body.depositPercentage);
    if (req.body.currency !== undefined) updateData.currency = req.body.currency;
    if (req.body.isAvailable !== undefined) updateData.isAvailable = req.body.isAvailable === 'true';
    if (req.body.passengerCapacity !== undefined) updateData.passengerCapacity = parseInt(req.body.passengerCapacity);
    if (req.body.locationId !== undefined) updateData.locationId = req.body.locationId || null;

    // Handle image files
    const imageFiles = req.files as any;

    const vehicle = await updateVehicle(id, updateData, imageFiles);

    sendSuccess(res, 'Vehicle updated successfully', vehicle);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete vehicle
 */
export const deleteVehicleController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await deleteVehicle(id);

    sendSuccess(res, 'Vehicle deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get vehicle statistics
 */
export const getVehicleStatsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await getVehicleStats();

    sendSuccess(res, 'Vehicle statistics retrieved successfully', stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle vehicle availability
 */
export const toggleAvailabilityController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const vehicle = await toggleVehicleAvailability(id);

    sendSuccess(res, 'Vehicle availability updated successfully', vehicle);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update vehicle availability
 */
export const bulkUpdateAvailabilityController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed', 400);
    }

    const { vehicleIds, isAvailable } = req.body;
    const affectedCount = await bulkUpdateVehicleAvailability(vehicleIds, isAvailable);

    sendSuccess(res, `${affectedCount} vehicles updated successfully`, { affectedCount });
  } catch (error) {
    next(error);
  }
};

/**
 * Get vehicle enums for form dropdowns
 */
export const getVehicleEnumsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const enums = {
      bodyTypes: dbEnums.VEHICLE_BODY_TYPE,
      transmissionTypes: dbEnums.TRANSMISSION_TYPE,
      drivetrainTypes: dbEnums.DRIVETRAIN_TYPE,
      fuelTypes: dbEnums.FUEL_TYPE,
    };

    sendSuccess(res, 'Vehicle enums retrieved successfully', enums);
  } catch (error) {
    next(error);
  }
};
