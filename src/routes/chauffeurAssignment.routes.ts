import { Router } from 'express';
import { param } from 'express-validator';
import { checkAssignmentStatus } from '../controller/booking/chauffeurAssignment.controller';
import { authenticateUser } from '../services/middleware/authenticateUser';
import { handleValidationErrors } from '../services/middleware/validation';

const router = Router();

// Apply authentication to all chauffeur assignment routes
router.use(authenticateUser);

/**
 * @route GET /api/chauffeur-assignment/:bookingId/status
 * @desc Check chauffeur assignment status for a booking
 * @access Private
 */
router.get(
  '/:bookingId/status',
  [param('bookingId').isUUID().withMessage('Valid booking ID is required')],
  handleValidationErrors,
  checkAssignmentStatus,
);

export default router;
