import { Request, Response, NextFunction } from 'express';
import * as vehicleService from '../../services/vehicle/vehicle.service';

/**
 * Get all available vehicles
 */
export const getAvailableVehicles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate, bodyType, fuelType, minPrice, maxPrice } = req.query;
    
    const filters = {
      startDate: startDate as string,
      endDate: endDate as string,
      bodyType: bodyType as string,
      fuelType: fuelType as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
    };
    
    const vehicles = await vehicleService.getAvailableVehicles(filters);
    
    res.status(200).json({
      success: true,
      message: 'Available vehicles retrieved successfully',
      data: vehicles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get vehicle by ID
 */
export const getVehicleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await vehicleService.getVehicleById(vehicleId);
    
    res.status(200).json({
      success: true,
      message: 'Vehicle retrieved successfully',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search vehicles
 */
export const searchVehicles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { query, ...filters } = req.query;
    const vehicles = await vehicleService.searchVehicles(query as string, filters);
    
    res.status(200).json({
      success: true,
      message: 'Vehicle search completed successfully',
      data: vehicles,
    });
  } catch (error) {
    next(error);
  }
};