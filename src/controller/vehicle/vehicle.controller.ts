import { Response } from 'express';
import * as vehicleService from '../../services/vehicle/vehicle.service';
import { BaseController } from '../../utils/controller.utils';
import { sendSuccess } from '../../utils/response.utils';
import { createError } from '../../services/middleware/errorHandler';
import { AuthenticatedRequest } from 'expressTypes';
import { dbEnums } from '../../common/enum/dbEnums';
import Logger from '../../utils/logger';
import { Op } from 'sequelize';

class VehicleController extends BaseController {
  /**
   * Helper to normalize query params that might have [] suffix
   */
  private parseFilterParam(req: AuthenticatedRequest, key: string): any {
    const value = req.query[key] || req.query[`${key}[]`];
    return value;
  }

  /**
   * Get all vehicles with filtering and pagination
   */
  getVehicles = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filters = {
      make: this.parseFilterParam(req, 'make'),
      model: this.parseFilterParam(req, 'model'),
      bodyType: this.parseFilterParam(req, 'bodyType'),
      transmission: this.parseFilterParam(req, 'transmission') as (typeof dbEnums.TRANSMISSION_TYPE)[number],
      fuelType: this.parseFilterParam(req, 'fuelType') as (typeof dbEnums.FUEL_TYPE)[number],
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
    const result = await vehicleService.getVehicleFilterMetadata();
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
      make: this.parseFilterParam(req, 'make'),
      model: this.parseFilterParam(req, 'model'),
      bodyType: this.parseFilterParam(req, 'bodyType'),
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
   * Check vehicle availability for specific dates
   */
  checkAvailability = this.asyncHandler(async (req: AuthenticatedRequest | any, res: Response) => {
    const { id } = req.params;
    const { pickupDate, dropoffDate } = req.query;

    if (!pickupDate || !dropoffDate) {
      throw createError('pickupDate and dropoffDate are required', 400);
    }

    Logger.info('Vehicle availability check request', {
      vehicleId: id,
      pickupDate,
      dropoffDate,
      queryParams: req.query
    });

    const result = await vehicleService.checkAvailability(id, pickupDate as string, dropoffDate as string);

    Logger.info('Vehicle availability check result', {
      vehicleId: id,
      result
    });

    sendSuccess(res, 'Vehicle availability checked successfully', result);
  });

  // Debug endpoint to check bookings for a specific vehicle
  debugVehicleBookings = this.asyncHandler(async (req: AuthenticatedRequest | any, res: Response) => {
    const { id } = req.params;

    const { Booking } = require('../../models');

    const allBookings = await Booking.findAll({
      where: { vehicleId: id },
      attributes: ['id', 'vehicleId', 'startDatetime', 'endDatetime', 'bookingStatus'],
      order: [['startDatetime', 'ASC']]
    });

    const activeBookings = await Booking.findAll({
      where: {
        vehicleId: id,
        bookingStatus: {
          [Op.notIn]: ['CANCELLED', 'COMPLETED'],
        }
      },
      attributes: ['id', 'vehicleId', 'startDatetime', 'endDatetime', 'bookingStatus'],
      order: [['startDatetime', 'ASC']]
    });

    sendSuccess(res, 'Vehicle bookings debug info', {
      vehicleId: id,
      allBookings,
      activeBookings,
      totalBookings: allBookings.length,
      activeBookingsCount: activeBookings.length
    });
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
  checkAvailability,
  debugVehicleBookings,
} = vehicleController;
