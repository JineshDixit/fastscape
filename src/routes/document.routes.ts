import { Router } from 'express';
import * as documentController from '../controllers/document/document.controller';
import { authenticateUser } from '../services/middleware/authenticateUser';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

/**
 * GET /api/documents/pending
 * Get all users with PENDING document verification
 */
router.get('/pending', documentController.getPendingDocuments);

/**
 * GET /api/documents/user/:userId
 * Get user's identity documents
 */
router.get('/user/:userId', documentController.getUserDocuments);

/**
 * PUT /api/documents/:id/verify
 * Verify (approve) user documents
 * Body: { notes?: string }
 */
router.put('/:id/verify', documentController.verifyDocuments);

/**
 * PUT /api/documents/:id/reject
 * Reject user documents
 * Body: { rejectionReason: string }
 */
router.put('/:id/reject', documentController.rejectDocuments);

export default router;
