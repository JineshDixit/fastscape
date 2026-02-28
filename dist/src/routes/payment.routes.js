"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const payment_controller_1 = require("../controller/payment/payment.controller");
const paymentWebhook_controller_1 = require("../controller/payment/paymentWebhook.controller");
const authenticateUser_1 = require("../services/middleware/authenticateUser");
const validation_1 = require("../services/middleware/validation");
const router = (0, express_1.Router)();
/**
 * @route POST /api/payments/webhook
 * @desc Stripe webhook handler (Public)
 * @access Public
 */
router.post('/webhook', paymentWebhook_controller_1.handleWebhook);
// Apply authentication to all following payment routes
router.use(authenticateUser_1.authenticateUser);
/**
 * @route GET /api/payments/calculate/:bookingId
 * @desc Calculate payment breakdown for a booking
 * @access Private
 */
router.get('/calculate/:bookingId', [(0, express_validator_1.param)('bookingId').isUUID().withMessage('Valid booking ID is required')], validation_1.handleValidationErrors, payment_controller_1.calculatePayment);
/**
 * @route POST /api/payments/intent/:bookingId
 * @desc Initiate a Stripe PaymentIntent
 * @access Private
 */
router.post('/intent/:bookingId', [
    (0, express_validator_1.param)('bookingId').isUUID().withMessage('Valid booking ID is required'),
    (0, express_validator_1.body)('paymentType')
        .isIn(['DEPOSIT', 'BALANCE', 'FULL'])
        .withMessage('Payment type must be DEPOSIT, BALANCE or FULL'),
], validation_1.handleValidationErrors, payment_controller_1.initiateIntent);
/**
 * @route POST /api/payments/deposit/:bookingId
 * @desc Process deposit payment for a booking
 * @access Private
 */
router.post('/deposit/:bookingId', [
    (0, express_validator_1.param)('bookingId').isUUID().withMessage('Valid booking ID is required'),
    (0, express_validator_1.body)('paymentMethod')
        .optional()
        .isIn(['PICKUP', 'DROPOFF', 'ONLINE'])
        .withMessage('Payment method must be PICKUP, DROPOFF, or ONLINE'),
    (0, express_validator_1.body)('stripePaymentIntentId').optional().isString().withMessage('Stripe payment intent ID must be a string'),
    (0, express_validator_1.body)('paymentType').optional().isIn(['DEPOSIT', 'FULL']).withMessage('Payment type must be DEPOSIT or FULL'),
], validation_1.handleValidationErrors, payment_controller_1.processDeposit);
/**
 * @route POST /api/payments/balance/:bookingId
 * @desc Process balance payment for a booking
 * @access Private
 */
router.post('/balance/:bookingId', [
    (0, express_validator_1.param)('bookingId').isUUID().withMessage('Valid booking ID is required'),
    (0, express_validator_1.body)('paymentMethod')
        .optional()
        .isIn(['PICKUP', 'DROPOFF', 'ONLINE'])
        .withMessage('Payment method must be PICKUP, DROPOFF, or ONLINE'),
    (0, express_validator_1.body)('stripePaymentIntentId').optional().isString().withMessage('Stripe payment intent ID must be a string'),
], validation_1.handleValidationErrors, payment_controller_1.processBalance);
/**
 * @route POST /api/payments/delay-charge/:bookingId
 * @desc Apply delay charges for late vehicle return
 * @access Private
 */
router.post('/delay-charge/:bookingId', [
    (0, express_validator_1.param)('bookingId').isUUID().withMessage('Valid booking ID is required'),
    (0, express_validator_1.body)('actualDropoffTime').isISO8601().withMessage('Valid actual dropoff time is required'),
], validation_1.handleValidationErrors, payment_controller_1.applyDelayCharge);
/**
 * @route GET /api/payments/summary/:bookingId
 * @desc Get payment summary for a booking
 * @access Private
 */
router.get('/summary/:bookingId', [(0, express_validator_1.param)('bookingId').isUUID().withMessage('Valid booking ID is required')], validation_1.handleValidationErrors, payment_controller_1.getBookingPaymentSummary);
/**
 * @route PUT /api/payments/complete/:paymentId
 * @desc Mark a payment as completed (for pickup/dropoff payments)
 * @access Private
 */
router.put('/complete/:paymentId', [
    (0, express_validator_1.param)('paymentId').isUUID().withMessage('Valid payment ID is required'),
    (0, express_validator_1.body)('stripePaymentIntentId').optional().isString().withMessage('Stripe payment intent ID must be a string'),
], validation_1.handleValidationErrors, payment_controller_1.completePayment);
/**
 * @route PUT /api/payments/pickup/:bookingId
 * @desc Mark vehicle as picked up
 * @access Private
 */
router.put('/pickup/:bookingId', [
    (0, express_validator_1.param)('bookingId').isUUID().withMessage('Valid booking ID is required'),
    (0, express_validator_1.body)('actualPickupTime').optional().isISO8601().withMessage('Valid pickup time is required'),
], validation_1.handleValidationErrors, payment_controller_1.markVehiclePickedUp);
/**
 * @route PUT /api/payments/dropoff/:bookingId
 * @desc Mark vehicle as dropped off and apply delay charges if applicable
 * @access Private
 */
router.put('/dropoff/:bookingId', [
    (0, express_validator_1.param)('bookingId').isUUID().withMessage('Valid booking ID is required'),
    (0, express_validator_1.body)('actualDropoffTime').optional().isISO8601().withMessage('Valid dropoff time is required'),
], validation_1.handleValidationErrors, payment_controller_1.markVehicleDroppedOff);
/**
 * @route GET /api/payments/overdue
 * @desc Get all overdue payments (Admin only)
 * @access Private (Admin)
 */
router.get('/overdue', payment_controller_1.getOverduePaymentsList);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map