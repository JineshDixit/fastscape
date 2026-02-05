import { Router } from 'express';
import * as paymentController from '../controllers/payment/payment.controller';
import { authenticateUser } from '../services/middleware/authenticateUser';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

/**
 * GET /api/payments/overdue
 * Get all overdue payments
 * Must be before other routes to avoid conflicts
 */
router.get('/overdue', paymentController.getOverduePayments);

/**
 * GET /api/payments/summary/:bookingId
 * Get payment summary for a booking
 */
router.get('/summary/:bookingId', paymentController.getPaymentSummary);

/**
 * GET /api/payments
 * Get all payments with filters
 * Query params: bookingId, userId, paymentType, paymentStatus, paymentMethod, page, limit
 */
router.get('/', paymentController.getAllPayments);

/**
 * GET /api/payments/:id
 * Get single payment details
 */
router.get('/:id', paymentController.getPaymentById);

/**
 * PUT /api/payments/:id/mark-paid
 * Mark a payment as paid (admin override)
 * Body: { paidAt?: Date, notes?: string }
 */
router.put('/:id/mark-paid', paymentController.markPaymentPaid);

/**
 * POST /api/payments/refund/:bookingId
 * Process a refund for a booking
 * Body: { refundAmount: number, reason: string, stripeRefundId?: string }
 */
router.post('/refund/:bookingId', paymentController.processRefund);

export default router;
