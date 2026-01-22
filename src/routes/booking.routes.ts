import { Router } from 'express';
import * as bookingController from '../controller/booking/booking.controller';
import { authenticateUser } from '../services/middleware/authenticateUser';
import { body, query, param } from 'express-validator';
import { handleValidationErrors } from '../services/middleware/validation';
import { dbEnums } from '../common/enum/dbEnums';

const router = Router();

// All booking routes require authentication
router.use(authenticateUser);

// Enhanced Booking Flow Routes (Requirements: 6.1, 6.2, 6.3, 6.4)

// Get booking flow steps based on user profile completeness
router.get(
  '/flow/steps',
  [
    query('bookingType')
      .optional()
      .isIn(dbEnums.BOOKING_TYPE)
      .withMessage(`Booking type must be one of: ${dbEnums.BOOKING_TYPE.join(', ')}`),
    handleValidationErrors,
  ],
  bookingController.getBookingFlowSteps,
);

// Check booking eligibility based on profile completeness
router.get(
  '/flow/eligibility',
  [
    query('bookingType')
      .optional()
      .isIn(dbEnums.BOOKING_TYPE)
      .withMessage(`Booking type must be one of: ${dbEnums.BOOKING_TYPE.join(', ')}`),
    handleValidationErrors,
  ],
  bookingController.checkBookingEligibility,
);

// Get user addresses for booking selection
router.get('/addresses', bookingController.getAddressesForBooking);

// Save booking progress
router.post(
  '/progress',
  [
    body('step').isInt({ min: 1, max: 10 }).withMessage('Step must be a number between 1 and 10'),
    body('data').isObject().withMessage('Data must be an object'),
    body('bookingType')
      .optional()
      .isIn(dbEnums.BOOKING_TYPE)
      .withMessage(`Booking type must be one of: ${dbEnums.BOOKING_TYPE.join(', ')}`),
    handleValidationErrors,
  ],
  bookingController.saveBookingProgress,
);

// Resume booking progress
router.get(
  '/progress',
  [
    query('bookingType')
      .optional()
      .isIn(dbEnums.BOOKING_TYPE)
      .withMessage(`Booking type must be one of: ${dbEnums.BOOKING_TYPE.join(', ')}`),
    handleValidationErrors,
  ],
  bookingController.resumeBookingProgress,
);

// Clear booking progress
router.delete(
  '/progress',
  [
    query('bookingType')
      .optional()
      .isIn(dbEnums.BOOKING_TYPE)
      .withMessage(`Booking type must be one of: ${dbEnums.BOOKING_TYPE.join(', ')}`),
    handleValidationErrors,
  ],
  bookingController.clearBookingProgress,
);

// Create enhanced booking with address integration
router.post(
  '/enhanced',
  [
    body('vehicleId').isUUID().withMessage('Valid vehicle ID is required'),
    body('startDatetime').isISO8601().withMessage('Valid start date is required'),
    body('endDatetime').isISO8601().withMessage('Valid end date is required'),

    // Address selection validation
    body('pickupAddressId')
      .optional()
      .isUUID()
      .withMessage('Pickup address ID must be a valid UUID'),
    body('dropoffAddressId')
      .optional()
      .isUUID()
      .withMessage('Dropoff address ID must be a valid UUID'),

    // New address validation
    body('useNewPickupAddress')
      .optional()
      .isBoolean()
      .withMessage('Use new pickup address must be a boolean'),
    body('useNewDropoffAddress')
      .optional()
      .isBoolean()
      .withMessage('Use new dropoff address must be a boolean'),

    // New pickup address fields (conditional validation)
    body('newPickupAddress.addressLine1')
      .if(body('useNewPickupAddress').equals('true'))
      .notEmpty()
      .withMessage('Pickup address line 1 is required when using new pickup address'),
    body('newPickupAddress.city')
      .if(body('useNewPickupAddress').equals('true'))
      .notEmpty()
      .withMessage('Pickup city is required when using new pickup address'),
    body('newPickupAddress.state')
      .if(body('useNewPickupAddress').equals('true'))
      .notEmpty()
      .withMessage('Pickup state is required when using new pickup address'),
    body('newPickupAddress.country')
      .if(body('useNewPickupAddress').equals('true'))
      .notEmpty()
      .withMessage('Pickup country is required when using new pickup address'),

    // New dropoff address fields (conditional validation)
    body('newDropoffAddress.addressLine1')
      .if(body('useNewDropoffAddress').equals('true'))
      .notEmpty()
      .withMessage('Dropoff address line 1 is required when using new dropoff address'),
    body('newDropoffAddress.city')
      .if(body('useNewDropoffAddress').equals('true'))
      .notEmpty()
      .withMessage('Dropoff city is required when using new dropoff address'),
    body('newDropoffAddress.state')
      .if(body('useNewDropoffAddress').equals('true'))
      .notEmpty()
      .withMessage('Dropoff state is required when using new dropoff address'),
    body('newDropoffAddress.country')
      .if(body('useNewDropoffAddress').equals('true'))
      .notEmpty()
      .withMessage('Dropoff country is required when using new dropoff address'),

    body('saveNewAddresses')
      .optional()
      .isBoolean()
      .withMessage('Save new addresses must be a boolean'),

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
  bookingController.createEnhancedBooking,
);

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

// Get booking quote (availability + price)
router.post(
  '/quote',
  [
    body('vehicleId').isUUID().withMessage('Valid vehicle ID is required'),
    body('startDatetime').isISO8601().withMessage('Valid start date is required'),
    body('endDatetime').isISO8601().withMessage('Valid end date is required'),
    handleValidationErrors,
  ],
  bookingController.getBookingQuote,
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
