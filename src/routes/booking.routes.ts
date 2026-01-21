import { Router } from 'express';
import * as bookingController from '../controller/booking/booking.controller';
import { authenticateUser } from '../services/middleware/authenticateUser';
import { body, query } from 'express-validator';
import { handleValidationErrors } from '../services/middleware/validation';
import { dbEnums } from '../common/enum/dbEnums';

const router = Router();

// All booking routes require authentication
router.use(authenticateUser);

// Check vehicle availability
router.post(
  '/check-availability',
  [
    body('vehicleId').isUUID().withMessage('Valid vehicle ID is required'),
    body('startDatetime').isISO8601().withMessage('Valid start date is required'),
    body('endDatetime').isISO8601().withMessage('Valid end date is required'),
    handleValidationErrors,
  ],
  bookingController.checkAvailability,
);

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
    body('bookingType')
      .optional()
      .isIn(dbEnums.BOOKING_TYPE)
      .withMessage(`Booking type must be one of: ${dbEnums.BOOKING_TYPE.join(', ')}`),
    body('paymentMethod')
      .optional()
      .isIn(dbEnums.PAYMENT_METHOD)
      .withMessage(`Payment method must be one of: ${dbEnums.PAYMENT_METHOD.join(', ')}`),
    body('chauffeurInstructions')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Chauffeur instructions must not exceed 500 characters'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must not exceed 1000 characters'),
    handleValidationErrors,
  ],
  bookingController.createBooking,
);

// Get user bookings with filtering
router.get(
  '/',
  [
    query('status')
      .optional()
      .isIn(dbEnums.BOOKING_STATUS)
      .withMessage(`Status must be one of: ${dbEnums.BOOKING_STATUS.join(', ')}`),
    query('startDate').optional().isISO8601().withMessage('Valid start date is required'),
    query('endDate').optional().isISO8601().withMessage('Valid end date is required'),
    query('vehicleType')
      .optional()
      .isIn(dbEnums.VEHICLE_BODY_TYPE)
      .withMessage(`Vehicle type must be one of: ${dbEnums.VEHICLE_BODY_TYPE.join(', ')}`),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    handleValidationErrors,
  ],
  bookingController.getUserBookings,
);

// Get upcoming bookings
router.get('/upcoming', bookingController.getUpcomingBookings);

// Get active bookings
router.get('/active', bookingController.getActiveBookings);

// Get booking statistics
router.get('/stats', bookingController.getBookingStats);

// Get booking history
router.get(
  '/history',
  [
    query('year').optional().isInt({ min: 2020, max: 2030 }).withMessage('Year must be between 2020 and 2030'),
    query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
    query('status')
      .optional()
      .isIn(dbEnums.BOOKING_STATUS)
      .withMessage(`Status must be one of: ${dbEnums.BOOKING_STATUS.join(', ')}`),
    query('vehicleType')
      .optional()
      .isIn(dbEnums.VEHICLE_BODY_TYPE)
      .withMessage(`Vehicle type must be one of: ${dbEnums.VEHICLE_BODY_TYPE.join(', ')}`),
    handleValidationErrors,
  ],
  bookingController.getBookingHistory,
);

// Get booking by ID
router.get('/:bookingId', bookingController.getBookingById);

// Confirm booking
router.post(
  '/:bookingId/confirm',
  [
    body('paymentIntentId').optional().isString().withMessage('Payment intent ID must be a string'),
    body('actualPickupDatetime').optional().isISO8601().withMessage('Valid pickup date is required'),
    handleValidationErrors,
  ],
  bookingController.confirmBooking,
);

// Start booking (vehicle pickup)
router.post('/:bookingId/start', bookingController.startBooking);

// Complete booking (vehicle dropoff)
router.post(
  '/:bookingId/complete',
  [
    body('actualDropoffDatetime').optional().isISO8601().withMessage('Valid dropoff date is required'),
    handleValidationErrors,
  ],
  bookingController.completeBooking,
);

// Extend booking
router.post(
  '/:bookingId/extend',
  [
    body('newEndDatetime').isISO8601().withMessage('Valid new end date is required'),
    handleValidationErrors,
  ],
  bookingController.extendBooking,
);

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
    body('chauffeurInstructions')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Chauffeur instructions must not exceed 500 characters'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must not exceed 1000 characters'),
    handleValidationErrors,
  ],
  bookingController.updateBooking,
);

// Cancel booking
router.delete(
  '/:bookingId',
  [
    body('cancellationReason')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Cancellation reason must not exceed 500 characters'),
    handleValidationErrors,
  ],
  bookingController.cancelBooking,
);

export default router;
