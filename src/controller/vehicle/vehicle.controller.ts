import { Response } from 'express';
import * as vehicleService from '../../services/vehicle/vehicle.service';
import * as vehicleMediaService from '../../services/vehicle/vehicleMedia.service';
import { BaseController } from '../../utils/controller.utils';
import { sendSuccess } from '../../utils/response.utils';
import { validateRequiredFields } from '../../utils/validation.utils';
import { AuthenticatedRequest } from 'expressTypes';

class VehicleController extends BaseController {
  /**
   * Get all available vehicles with structured images
   */
  getAvailableVehicles = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { startDate, endDate, bodyType, fuelType, minPrice, maxPrice } = req.query;
    
    const filters = {
      startDate: startDate as string,
      endDate: endDate as string,
      bodyType: bodyType as string,
      fuelType: fuelType as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
    };
    
    const vehicles = await vehicleService.getVehiclesWithImages(filters);
    sendSuccess(res, 'Available vehicles retrieved successfully', vehicles);
  });

  /**
   * Get vehicle by ID with structured images
   */
  getVehicleById = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const vehicleId = this.getValidatedId(req, 'vehicleId');
    const vehicle = await vehicleService.getVehicleById(vehicleId);
    const transformedVehicle = vehicleService.transformVehicleWithImages(vehicle);
    sendSuccess(res, 'Vehicle retrieved successfully', transformedVehicle);
  });

  /**
   * Search vehicles with structured images
   */
  searchVehicles = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { query, ...filters } = req.query;
    
    validateRequiredFields({ query }, ['query']);
    
    const vehicles = await vehicleService.searchVehicles(query as string, filters);
    const transformedVehicles = vehicles.map(vehicleService.transformVehicleWithImages);
    sendSuccess(res, 'Vehicle search completed successfully', transformedVehicles);
  });

  /**
   * Get vehicle images
   */
  getVehicleImages = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const vehicleId = this.getValidatedId(req, 'vehicleId');
    const result = await vehicleService.getVehicleImages(vehicleId);
    res.status(200).json(result);
  });

  /**
   * Get vehicle image statistics
   */
  getVehicleImageStats = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const vehicleId = this.getValidatedId(req, 'vehicleId');
    const result = await vehicleMediaService.getVehicleImageStats(vehicleId);
    sendSuccess(res, 'Vehicle image statistics retrieved successfully', result);
  });
}

const vehicleController = new VehicleController();

export const {
  getAvailableVehicles,
  getVehicleById,
  searchVehicles,
  getVehicleImages,
  getVehicleImageStats
} = vehicleController;