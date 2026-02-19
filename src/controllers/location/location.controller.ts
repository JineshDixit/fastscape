import { Request, Response } from 'express';
import * as locationService from '../../services/location/location.service';

/**
 * GET /api/locations
 * Get all locations with filters and pagination
 */
export const getAllLocations = async (req: Request, res: Response) => {
  try {
    const filters = {
      city: req.query.city as string,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as string,
    };

    const result = await locationService.getAllLocations(filters);

    res.status(200).json({
      success: true,
      data: result.locations,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch locations',
        code: 'LOCATION_FETCH_ERROR',
      },
    });
  }
};

/**
 * GET /api/locations/cities
 * Get all unique cities
 */
export const getAllCities = async (req: Request, res: Response) => {
  try {
    const cities = await locationService.getAllCities();

    res.status(200).json({
      success: true,
      data: cities,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch cities',
        code: 'CITIES_FETCH_ERROR',
      },
    });
  }
};

/**
 * GET /api/locations/:id
 * Get single location by ID
 */
export const getLocationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const location = await locationService.getLocationById(id);

    res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: {
        message: error.message || 'Location not found',
        code: 'LOCATION_NOT_FOUND',
      },
    });
  }
};

/**
 * POST /api/locations
 * Create a new location
 */
export const createLocation = async (req: Request, res: Response) => {
  try {
    const location = await locationService.createLocation(req.body);

    res.status(201).json({
      success: true,
      data: location,
      message: 'Location created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to create location',
        code: 'CREATE_ERROR',
      },
    });
  }
};

/**
 * PUT /api/locations/:id
 * Update location details
 */
export const updateLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const location = await locationService.updateLocation(id, req.body);

    res.status(200).json({
      success: true,
      data: location,
      message: 'Location updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to update location',
        code: 'UPDATE_ERROR',
      },
    });
  }
};

/**
 * PATCH /api/locations/:id/toggle-status
 * Toggle location active status
 */
export const toggleLocationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const location = await locationService.toggleLocationStatus(id);

    res.status(200).json({
      success: true,
      data: location,
      message: `Location ${location.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to toggle location status',
        code: 'TOGGLE_STATUS_ERROR',
      },
    });
  }
};

/**
 * DELETE /api/locations/:id
 * Delete location
 */
export const deleteLocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await locationService.deleteLocation(id);

    res.status(200).json({
      success: true,
      message: 'Location deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to delete location',
        code: 'DELETE_ERROR',
      },
    });
  }
};

/**
 * GET /api/locations/export
 * Export locations to CSV with filters
 */
export const exportLocations = async (req: Request, res: Response) => {
  try {
    const { CSVExportService } = await import('../../services/csv/csvExport.service');
    
    const filters = {
      city: req.query.city as string,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      search: req.query.search as string,
    };

    const locations = await locationService.exportLocationsToCSV(filters);

    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'code', label: 'Code' },
      { key: 'city', label: 'City' },
      { 
        key: 'isActive', 
        label: 'Active',
        format: CSVExportService.formatBoolean
      },
      { 
        key: 'createdAt', 
        label: 'Created At',
        format: CSVExportService.formatDateTime
      },
      { 
        key: 'updatedAt', 
        label: 'Updated At',
        format: CSVExportService.formatDateTime
      },
    ];

    const csv = CSVExportService.generateCSV(locations, columns);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=locations-${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to export locations',
        code: 'EXPORT_ERROR',
      },
    });
  }
};
