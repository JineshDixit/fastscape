import { Response } from 'express';
import * as vehicleService from '../../services/vehicle/vehicle.service';
import { BaseController } from '../../utils/controller.utils';
import { sendSuccess } from '../../utils/response.utils';
import { AuthenticatedRequest } from 'expressTypes';
import { dbEnums } from '../../common/enum/dbEnums';
import { createError } from '../../services/middleware/errorHandler';

class VehicleController extends BaseController {
  /**
   * Get all vehicles with filtering and pagination
   */
  getVehicles = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = {
      make: req.query.make as any,
      model: req.query.model as any,
      bodyType: req.query.bodyType as any,
      transmission: req.query.transmission as (typeof dbEnums.TRANSMISSION_TYPE)[number],
      fuelType: req.query.fuelType as (typeof dbEnums.FUEL_TYPE)[number],
      isAvailable: req.query.isAvailable ? req.query.isAvailable === 'true' : undefined,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      search: req.query.search as string,
    };

    const pagination = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
    };

    const result = await vehicleService.getVehicles(filters, pagination);
    sendSuccess(res, 'Vehicles retrieved successfully', result);
  });

  /**
   * Get vehicle by ID with media
   */
  getVehicleById = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = this.getValidatedId(req, 'id');
    const result = await vehicleService.getVehicleById(id);
    sendSuccess(res, 'Vehicle retrieved successfully', result);
  });

  /**
   * Get vehicle statistics
   */
  getVehicleStats = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await vehicleService.getVehicleStats();
    sendSuccess(res, 'Vehicle statistics retrieved successfully', stats);
  });

  /**
   * Get vehicle body type summary
   */
  getVehicleBodyTypeSummary = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await vehicleService.getVehicleBodyTypeSummary();
    sendSuccess(res, 'Vehicle body type summary retrieved successfully', result);
  });

  /**
   * Get vehicle filter metadata
   */
  getVehicleFilterMetadata = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const searchQuery = {
      pickupLocation: req.query.pickupLocation as string,
      pickupDate: req.query.pickupDate as string,
      dropoffDate: req.query.dropoffDate as string,
      bookingType: req.query.bookingType as 'SELF_DRIVE' | 'CHAUFFEUR',
    };
    const result = await vehicleService.getVehicleFilterMetadata(searchQuery);
    sendSuccess(res, 'Vehicle filter metadata retrieved successfully', result);
  });

  /**
   * Search for available vehicles based on date range and location
   */
  getAvailableVehicles = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const searchQuery = {
      pickupLocation: req.query.pickupLocation as string,
      pickupDate: req.query.pickupDate as string,
      dropoffDate: req.query.dropoffDate as string,
      bookingType: req.query.bookingType as 'SELF_DRIVE' | 'CHAUFFEUR',
      make: req.query.make as any,
      model: req.query.model as any,
      bodyType: req.query.bodyType as any,
      transmission: req.query.transmission as (typeof dbEnums.TRANSMISSION_TYPE)[number],
      fuelType: req.query.fuelType as (typeof dbEnums.FUEL_TYPE)[number],
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      search: req.query.search as string,
    };

    const pagination = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
    };

    const result = await vehicleService.getAvailableVehicles(searchQuery, pagination);
    sendSuccess(res, 'Available vehicles retrieved successfully', result);
  });

  /**
   * Get most popular car (most booked vehicle)
   */
  getMostPopularCar = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await vehicleService.getMostPopularCar();
    sendSuccess(res, 'Most popular car retrieved successfully', result);
  });

  /**
   * Check if a specific vehicle is available for a date range
   */
  checkVehicleAvailability = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = this.getValidatedId(req, 'id');
    const pickupDate = req.query.pickupDate as string;
    const dropoffDate = req.query.dropoffDate as string;
    const excludeUserId = req.user?.id; // Exclude current user's bookings

    if (!pickupDate || !dropoffDate) {
      throw createError('pickupDate and dropoffDate are required', 400);
    }

    const result = await vehicleService.checkVehicleAvailability(id, pickupDate, dropoffDate, excludeUserId);
    sendSuccess(res, 'Vehicle availability checked successfully', result);
  });
}

const vehicleController = new VehicleController();

export const {
  getVehicles,
  getVehicleById,
  getVehicleStats,
  getVehicleBodyTypeSummary,
  getVehicleFilterMetadata,
  getAvailableVehicles,
  getMostPopularCar,
  checkVehicleAvailability,
} = vehicleController;
