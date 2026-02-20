import { Request, Response } from 'express';
import * as chauffeurService from '../../services/chauffeur/chauffeur.service';

/**
 * GET /api/chauffeurs
 * Get all chauffeurs with filters and pagination
 */
export const getAllChauffeurs = async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      isVerified: req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined,
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      city: req.query.city as string,
      experienceLevel: req.query.experienceLevel as string,
      nationality: req.query.nationality as string,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as string,
    };

    const result = await chauffeurService.getAllChauffeurs(filters);

    res.status(200).json({
      success: true,
      data: result.chauffeurs,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch chauffeurs',
        code: 'CHAUFFEUR_FETCH_ERROR',
      },
    });
  }
};

/**
 * GET /api/chauffeurs/:id
 * Get single chauffeur with booking history and performance metrics
 */
export const getChauffeurById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await chauffeurService.getChauffeurById(id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: {
        message: error.message || 'Chauffeur not found',
        code: 'CHAUFFEUR_NOT_FOUND',
      },
    });
  }
};

/**
 * PUT /api/chauffeurs/:id/verify
 * Mark chauffeur as verified
 */
export const verifyChauffeur = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const chauffeur = await chauffeurService.verifyChauffeur(id);

    res.status(200).json({
      success: true,
      data: chauffeur,
      message: 'Chauffeur verified successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to verify chauffeur',
        code: 'VERIFICATION_ERROR',
      },
    });
  }
};

/**
 * PUT /api/chauffeurs/:id/status
 * Update chauffeur status
 */
export const updateChauffeurStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'status is required',
          code: 'MISSING_STATUS',
        },
      });
    }

    const chauffeur = await chauffeurService.updateChauffeurStatus(id, status);

    res.status(200).json({
      success: true,
      data: chauffeur,
      message: `Chauffeur status updated to ${status}`,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to update chauffeur status',
        code: 'STATUS_UPDATE_ERROR',
      },
    });
  }
};

/**
 * POST /api/chauffeurs
 * Create a new chauffeur
 */
export const createChauffeur = async (req: Request, res: Response) => {
  try {
    const chauffeur = await chauffeurService.createChauffeur(req.body);

    res.status(201).json({
      success: true,
      data: chauffeur,
      message: 'Chauffeur created successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to create chauffeur',
        code: 'CREATE_ERROR',
      },
    });
  }
};

/**
 * PUT /api/chauffeurs/:id
 * Update chauffeur details
 */
export const updateChauffeur = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const chauffeur = await chauffeurService.updateChauffeur(id, req.body);

    res.status(200).json({
      success: true,
      data: chauffeur,
      message: 'Chauffeur updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to update chauffeur',
        code: 'UPDATE_ERROR',
      },
    });
  }
};

/**
 * DELETE /api/chauffeurs/:id
 * Delete (Soft Delete) a chauffeur
 */
export const deleteChauffeur = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await chauffeurService.deleteChauffeur(id);

    res.status(200).json({
      success: true,
      message: 'Chauffeur deleted successfully',
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to delete chauffeur',
        code: 'DELETE_ERROR',
      },
    });
  }
};

/**
 * GET /api/chauffeurs/export
 * Export chauffeurs to CSV with filters
 */
export const exportChauffeurs = async (req: Request, res: Response) => {
  try {
    const { CSVExportService } = await import('../../services/csv/csvExport.service');

    const filters = {
      status: req.query.status as string,
      isVerified: req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined,
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      city: req.query.city as string,
      experienceLevel: req.query.experienceLevel as string,
      nationality: req.query.nationality as string,
      search: req.query.search as string,
    };

    const chauffeurs = await chauffeurService.exportChauffeursToCSV(filters);

    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'fullName', label: 'Full Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'status', label: 'Status' },
      {
        key: 'isVerified',
        label: 'Verified',
        format: CSVExportService.formatBoolean,
      },
      { key: 'rating', label: 'Rating' },
      { key: 'totalTrips', label: 'Total Trips' },
      { key: 'nationality', label: 'Nationality' },
      { key: 'licenseNumber', label: 'License Number' },
      {
        key: 'licenseExpiryDate',
        label: 'License Expiry',
        format: CSVExportService.formatDate,
      },
      { key: 'experienceLevel', label: 'Experience Level' },
      { key: 'yearsOfExperience', label: 'Years of Experience' },
      {
        key: 'hourlyRate',
        label: 'Hourly Rate',
        format: (val: number) => CSVExportService.formatCurrency(val),
      },
      { key: 'city', label: 'City' },
      { key: 'country', label: 'Country' },
      {
        key: 'createdAt',
        label: 'Created At',
        format: CSVExportService.formatDateTime,
      },
    ];

    const csv = CSVExportService.generateCSV(chauffeurs, columns);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=chauffeurs-${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to export chauffeurs',
        code: 'EXPORT_ERROR',
      },
    });
  }
};
