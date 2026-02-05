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
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
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
