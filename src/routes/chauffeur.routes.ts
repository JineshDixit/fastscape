import { Router } from 'express';
import * as chauffeurController from '../controllers/chauffeur/chauffeur.controller';
import { authenticateUser } from '../services/middleware/authenticateUser';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

/**
 * GET /api/chauffeurs/export
 * Export chauffeurs to CSV with filters
 * Query params: status, isVerified, minRating, city, experienceLevel, nationality, search
 * Must be before /:id route to avoid route conflict
 */
router.get('/export', chauffeurController.exportChauffeurs);

/**
 * GET /api/chauffeurs
 * Get all chauffeurs with filters
 * Query params: status, isVerified, minRating, city, page, limit
 */
router.get('/', chauffeurController.getAllChauffeurs);

/**
 * GET /api/chauffeurs/:id
 * Get single chauffeur with booking history and performance metrics
 */
router.get('/:id', chauffeurController.getChauffeurById);

/**
 * PUT /api/chauffeurs/:id/verify
 * Mark chauffeur as verified
 */
router.put('/:id/verify', chauffeurController.verifyChauffeur);

/**
 * PUT /api/chauffeurs/:id/status
 * Update chauffeur status
 * Body: { status: string } (AVAILABLE, BUSY, OFF_DUTY, ON_BREAK)
 */
router.put('/:id/status', chauffeurController.updateChauffeurStatus);

/**
 * POST /api/chauffeurs
 * Create a new chauffeur
 */
router.post('/', chauffeurController.createChauffeur);

/**
 * PUT /api/chauffeurs/:id
 * Update chauffeur details
 */
router.put('/:id', chauffeurController.updateChauffeur);

/**
 * DELETE /api/chauffeurs/:id
 * Delete (Soft Delete) a chauffeur
 */
router.delete('/:id', chauffeurController.deleteChauffeur);

export default router;
