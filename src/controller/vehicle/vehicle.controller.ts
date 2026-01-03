import { NextFunction, Response } from 'express';
import * as vehicleService from '../../services/vehicle/vehicle.service';
import { BaseController } from '../../utils/controller.utils';
import { sendSuccess } from '../../utils/response.utils';
import { validateRequiredFields } from '../../utils/validation.utils';
import { AuthenticatedRequest } from 'expressTypes';
import { dbEnums } from '../../common/enum/dbEnums';

class VehicleController extends BaseController {
  getVehiclesController = this.asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    } catch (error) {
      next(error);
    }
  });

  getVehicleByIdController = this.asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = this.getValidatedId(req, 'id');
      const result = await vehicleService.getVehicleById(id);
      sendSuccess(res, 'Vehicle retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  });

  getVehicleStatsController = this.asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const stats = await vehicleService.getVehicleStats();

        sendSuccess(res, 'Vehicle statistics retrieved successfully', stats);
      } catch (error) {
        next(error);
      }
    },
  );

  getVehicleBodyTypeSummaryController = this.asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const result = await vehicleService.getVehicleBodyTypeSummary();
        sendSuccess(res, 'Vehicle body type summary retrieved successfully', result);
      } catch (error) {
        next(error);
      }
    },
  );

  getVehicleFilterMetadataController = this.asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const result = await vehicleService.getVehicleFilterMetadata();
        sendSuccess(res, 'Vehicle filter metadata retrieved successfully', result);
      } catch (error) {
        next(error);
      }
    },
  );
}

const vehicleController = new VehicleController();

export const {
  getVehiclesController,
  getVehicleByIdController,
  getVehicleStatsController,
  getVehicleBodyTypeSummaryController,
  getVehicleFilterMetadataController,
} = vehicleController;
