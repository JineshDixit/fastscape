import { Router } from 'express';
import * as bookingController from '../controllers/booking/booking.controller';
import { authenticateUser } from '../services/middleware/authenticateUser';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

/**
 * GET /api/bookings/expired
 * Get all expired PENDING bookings
 * Must be before /:id route to avoid route conflict
 */
router.get('/expired', bookingController.getExpiredBookings);

/**
 * GET /api/bookings
 * Get all bookings with filters and pagination
 * Query params: status, paymentStatus, bookingType, userId, vehicleId, chauffeurId, startDate, endDate, page, limit
 */
router.get('/', bookingController.getAllBookings);

/**
 * GET /api/bookings/:id
 * Get single booking details
 */
router.get('/:id', bookingController.getBookingById);

/**
 * PUT /api/bookings/:id/status
 * Update booking status (admin override)
 * Body: { bookingStatus: string }
 */
router.put('/:id/status', bookingController.updateBookingStatus);

/**
 * PUT /api/bookings/:id/cancel
 * Cancel a booking
 * Body: { reason?: string }
 */
router.put('/:id/cancel', bookingController.cancelBooking);

/**
 * DELETE /api/bookings/:id/cleanup
 * Cleanup an expired booking (soft delete)
 */
router.delete('/:id/cleanup', bookingController.cleanupExpiredBooking);

export default router;
