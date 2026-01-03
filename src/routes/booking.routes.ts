import { Router } from 'express';
import * as bookingController from '../controller/booking/booking.controller';
import { authenticateUser } from '../services/middleware/authenticateUser';
import { body } from 'express-validator';
import { handleValidationErrors } from '../services/middleware/validation';

const router = Router();

// All booking routes require authentication
router.use(authenticateUser);

// Create booking
router.post(
  '/',
  [
    body('vehicleId').isUUID().withMessage('Valid vehicle ID is required'),
    body('startDatetime').isISO8601().withMessage('Valid start date is required'),
    body('endDatetime').isISO8601().withMessage('Valid end date is required'),
    body('pickupLocation')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Pickup location must be between 5 and 200 characters'),
    body('dropoffLocation')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Dropoff location must be between 5 and 200 characters'),
    handleValidationErrors,
  ],
  bookingController.createBooking,
);

// Get user bookings
router.get('/', bookingController.getUserBookings);

// Get booking by ID
router.get('/:bookingId', bookingController.getBookingById);

// Update booking
router.put(
  '/:bookingId',
  [
    body('startDatetime').optional().isISO8601().withMessage('Valid start date is required'),
    body('endDatetime').optional().isISO8601().withMessage('Valid end date is required'),
    body('pickupLocation')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Pickup location must be between 5 and 200 characters'),
    body('dropoffLocation')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Dropoff location must be between 5 and 200 characters'),
    handleValidationErrors,
  ],
  bookingController.updateBooking,
);

// Cancel booking
router.delete('/:bookingId', bookingController.cancelBooking);

export default router;
