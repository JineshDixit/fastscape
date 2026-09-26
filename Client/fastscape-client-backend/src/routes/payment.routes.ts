import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  calculatePayment,
  processDeposit,
  processBalance,
  applyDelayCharge,
  getBookingPaymentSummary,
  completePayment,
  getOverduePaymentsList,
  markVehiclePickedUp,
  markVehicleDroppedOff,
  // Gateway-related endpoints
  createPaymentIntent,
  processOnlineDeposit,
  processOnlineBalance,
  processOnlineFullPayment,
  processRefund,
  getEnhancedPaymentSummary,
  handleWebhook,
  getGatewayInfo,
} from '../controller/payment/payment.controller';
import { authenticateUser } from '../services/middleware/authenticateUser';
import { handleValidationErrors } from '../services/middleware/validation';

const router = Router();

// Apply authentication to all payment routes
router.use(authenticateUser);

/**
 * @route GET /api/payments/calculate/:bookingId
 * @desc Calculate payment breakdown for a booking
 * @access Private
 */
router.get(
  '/calculate/:bookingId',
  [param('bookingId').isUUID().withMessage('Valid booking ID is required')],
  handleValidationErrors,
  calculatePayment,
);

/**
 * @route POST /api/payments/deposit/:bookingId
 * @desc Process deposit payment for a booking
 * @access Private
 */
router.post(
  '/deposit/:bookingId',
  [
    param('bookingId').isUUID().withMessage('Valid booking ID is required'),
    body('paymentMethod')
      .optional()
      .isIn(['PICKUP', 'DROPOFF', 'ONLINE'])
      .withMessage('Payment method must be PICKUP, DROPOFF, or ONLINE'),
    body('stripePaymentIntentId').optional().isString().withMessage('Stripe payment intent ID must be a string'),
  ],
  handleValidationErrors,
  processDeposit,
);

/**
 * @route POST /api/payments/balance/:bookingId
 * @desc Process balance payment for a booking
 * @access Private
 */
router.post(
  '/balance/:bookingId',
  [
    param('bookingId').isUUID().withMessage('Valid booking ID is required'),
    body('paymentMethod')
      .optional()
      .isIn(['PICKUP', 'DROPOFF', 'ONLINE'])
      .withMessage('Payment method must be PICKUP, DROPOFF, or ONLINE'),
    body('stripePaymentIntentId').optional().isString().withMessage('Stripe payment intent ID must be a string'),
  ],
  handleValidationErrors,
  processBalance,
);

/**
 * @route POST /api/payments/delay-charge/:bookingId
 * @desc Apply delay charges for late vehicle return
 * @access Private
 */
router.post(
  '/delay-charge/:bookingId',
  [
    param('bookingId').isUUID().withMessage('Valid booking ID is required'),
    body('actualDropoffTime').isISO8601().withMessage('Valid actual dropoff time is required'),
  ],
  handleValidationErrors,
  applyDelayCharge,
);

/**
 * @route GET /api/payments/summary/:bookingId
 * @desc Get payment summary for a booking
 * @access Private
 */
router.get(
  '/summary/:bookingId',
  [param('bookingId').isUUID().withMessage('Valid booking ID is required')],
  handleValidationErrors,
  getBookingPaymentSummary,
);

/**
 * @route PUT /api/payments/complete/:paymentId
 * @desc Mark a payment as completed (for pickup/dropoff payments)
 * @access Private
 */
router.put(
  '/complete/:paymentId',
  [
    param('paymentId').isUUID().withMessage('Valid payment ID is required'),
    body('stripePaymentIntentId').optional().isString().withMessage('Stripe payment intent ID must be a string'),
  ],
  handleValidationErrors,
  completePayment,
);

/**
 * @route PUT /api/payments/pickup/:bookingId
 * @desc Mark vehicle as picked up
 * @access Private
 */
router.put(
  '/pickup/:bookingId',
  [
    param('bookingId').isUUID().withMessage('Valid booking ID is required'),
    body('actualPickupTime').optional().isISO8601().withMessage('Valid pickup time is required'),
  ],
  handleValidationErrors,
  markVehiclePickedUp,
);

/**
 * @route PUT /api/payments/dropoff/:bookingId
 * @desc Mark vehicle as dropped off and apply delay charges if applicable
 * @access Private
 */
router.put(
  '/dropoff/:bookingId',
  [
    param('bookingId').isUUID().withMessage('Valid booking ID is required'),
    body('actualDropoffTime').optional().isISO8601().withMessage('Valid dropoff time is required'),
  ],
  handleValidationErrors,
  markVehicleDroppedOff,
);

/**
 * @route GET /api/payments/overdue
 * @desc Get all overdue payments (Admin only)
 * @access Private (Admin)
 */
router.get('/overdue', getOverduePaymentsList);

// ===== PAYMENT GATEWAY ROUTES =====

/**
 * @route POST /api/payments/intent/:bookingId
 * @desc Create payment intent for online payment
 * @access Private
 */
router.post(
  '/intent/:bookingId',
  [
    param('bookingId').isUUID().withMessage('Valid booking ID is required'),
    body('paymentType')
      .isIn(['DEPOSIT', 'BALANCE', 'FULL'])
      .withMessage('Payment type must be DEPOSIT, BALANCE, or FULL'),
    body('currency').optional().isString().withMessage('Currency must be a string'),
  ],
  handleValidationErrors,
  createPaymentIntent,
);

/**
 * @route POST /api/payments/online/deposit/:bookingId
 * @desc Process online deposit payment
 * @access Private
 */
router.post(
  '/online/deposit/:bookingId',
  [
    param('bookingId').isUUID().withMessage('Valid booking ID is required'),
    body('paymentIntentId').isString().withMessage('Payment intent ID is required'),
    body('paymentMethodId').optional().isString().withMessage('Payment method ID must be a string'),
  ],
  handleValidationErrors,
  processOnlineDeposit,
);

/**
 * @route POST /api/payments/online/balance/:bookingId
 * @desc Process online balance payment
 * @access Private
 */
router.post(
  '/online/balance/:bookingId',
  [
    param('bookingId').isUUID().withMessage('Valid booking ID is required'),
    body('paymentIntentId').isString().withMessage('Payment intent ID is required'),
    body('paymentMethodId').optional().isString().withMessage('Payment method ID must be a string'),
  ],
  handleValidationErrors,
  processOnlineBalance,
);

/**
 * @route POST /api/payments/online/full/:bookingId
 * @desc Process online full payment
 * @access Private
 */
router.post(
  '/online/full/:bookingId',
  [
    param('bookingId').isUUID().withMessage('Valid booking ID is required'),
    body('paymentIntentId').isString().withMessage('Payment intent ID is required'),
    body('paymentMethodId').optional().isString().withMessage('Payment method ID must be a string'),
  ],
  handleValidationErrors,
  processOnlineFullPayment,
);

/**
 * @route POST /api/payments/refund/:paymentId
 * @desc Process payment refund
 * @access Private
 */
router.post(
  '/refund/:paymentId',
  [
    param('paymentId').isUUID().withMessage('Valid payment ID is required'),
    body('amount').optional().isNumeric().withMessage('Amount must be a number'),
    body('reason').optional().isString().withMessage('Reason must be a string'),
  ],
  handleValidationErrors,
  processRefund,
);

/**
 * @route GET /api/payments/enhanced-summary/:bookingId
 * @desc Get enhanced payment summary with gateway information
 * @access Private
 */
router.get(
  '/enhanced-summary/:bookingId',
  [param('bookingId').isUUID().withMessage('Valid booking ID is required')],
  handleValidationErrors,
  getEnhancedPaymentSummary,
);

/**
 * @route GET /api/payments/gateway/info
 * @desc Get payment gateway information
 * @access Private
 */
router.get('/gateway/info', getGatewayInfo);

/**
 * @route POST /api/payments/webhook
 * @desc Handle payment gateway webhook
 * @access Public (webhook endpoint)
 */
router.post('/webhook', handleWebhook);

export default router;
