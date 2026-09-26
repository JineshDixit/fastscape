import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/expressTypes';
import {
  calculatePaymentBreakdown,
  processDepositPayment,
  processBalancePayment,
  applyDelayCharges,
  getPaymentSummary,
  markPaymentCompleted,
  getOverduePayments,
} from '../../services/payment/enhancedPayment.service';
import {
  createPaymentIntentForBooking,
  processOnlineDepositPayment,
  processOnlineBalancePayment,
  processOnlineFullPayment as processFullPaymentOnline,
  processPaymentRefund,
  getEnhancedPaymentSummary as getPaymentSummaryEnhanced,
  handlePaymentWebhook,
} from '../../services/payment/gatewayIntegratedPayment.service';
import { paymentGatewayService } from '../../services/payment/paymentGatewayService';
import { BaseController } from '../../utils/controller.utils';
import { sendSuccess } from '../../utils/response.utils';
import { validateRequiredFields } from '../../utils/validation.utils';

class PaymentController extends BaseController {
  /**
   * Calculate payment breakdown for a booking
   */
  calculatePayment = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = this.getValidatedId(req, 'bookingId');
    const { delayHours = 0 } = req.query;

    const calculation = await calculatePaymentBreakdown(bookingId, Number(delayHours));

    sendSuccess(res, 'Payment calculation completed', calculation);
  });

  /**
   * Process deposit payment
   */
  processDeposit = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = this.getValidatedId(req, 'bookingId');
    const { paymentMethod = 'ONLINE', stripePaymentIntentId } = req.body;

    const result = await processDepositPayment(bookingId, paymentMethod, stripePaymentIntentId);

    sendSuccess(res, 'Deposit payment processed successfully', {
      payment: result.payment,
      financial: result.financial,
    });
  });

  /**
   * Process balance payment
   */
  processBalance = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = this.getValidatedId(req, 'bookingId');
    const { paymentMethod = 'DROPOFF', stripePaymentIntentId } = req.body;

    const result = await processBalancePayment(bookingId, paymentMethod, stripePaymentIntentId);

    sendSuccess(res, 'Balance payment processed successfully', {
      payment: result.payment,
      financial: result.financial,
    });
  });

  /**
   * Apply delay charges when vehicle is returned late
   */
  applyDelayCharge = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = this.getValidatedId(req, 'bookingId');
    const { actualDropoffTime } = req.body;

    validateRequiredFields({ actualDropoffTime }, ['actualDropoffTime']);

    const result = await applyDelayCharges(bookingId, new Date(actualDropoffTime));

    const message = result.delayCharge
      ? 'Delay charges applied successfully'
      : 'No delay charges applied - vehicle returned on time';

    sendSuccess(res, message, {
      booking: result.booking,
      financial: result.financial,
      delayCharge: result.delayCharge || null,
    });
  });

  /**
   * Get payment summary for a booking
   */
  getBookingPaymentSummary = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = this.getValidatedId(req, 'bookingId');
    const summary = await getPaymentSummary(bookingId);
    sendSuccess(res, 'Payment summary retrieved successfully', summary);
  });

  /**
   * Mark a payment as completed (for pickup/dropoff payments)
   */
  completePayment = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const paymentId = this.getValidatedId(req, 'paymentId');
    const { stripePaymentIntentId } = req.body;

    const payment = await markPaymentCompleted(paymentId, stripePaymentIntentId);
    sendSuccess(res, 'Payment marked as completed', payment);
  });

  /**
   * Get all overdue payments (Admin only)
   */
  getOverduePaymentsList = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const overduePayments = await getOverduePayments();

    sendSuccess(res, 'Overdue payments retrieved successfully', {
      count: overduePayments.length,
      payments: overduePayments,
    });
  });

  /**
   * Update booking status to picked up
   */
  markVehiclePickedUp = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = this.getValidatedId(req, 'bookingId');
    const { actualPickupTime = new Date() } = req.body;

    const { Booking } = await import('../../models');
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return sendSuccess(res, 'Booking not found', null, 404);
    }

    await booking.update({
      bookingStatus: 'PICKED_UP',
      actualPickupDatetime: new Date(actualPickupTime),
    });

    sendSuccess(res, 'Vehicle marked as picked up', booking);
  });

  /**
   * Mark booking status to dropped off
   */
  markVehicleDroppedOff = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = this.getValidatedId(req, 'bookingId');
    const { actualDropoffTime = new Date() } = req.body;

    // Apply delay charges if any
    const result = await applyDelayCharges(bookingId, new Date(actualDropoffTime));

    // Update booking status
    await result.booking.update({
      bookingStatus: 'DROPPED_OFF',
    });

    sendSuccess(res, 'Vehicle marked as dropped off', {
      booking: result.booking,
      financial: result.financial,
      delayCharge: result.delayCharge || null,
      hasDelayCharges: !!result.delayCharge,
    });
  });

  // ===== PAYMENT GATEWAY ENDPOINTS =====

  /**
   * Create payment intent for online payment
   */
  createPaymentIntent = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = this.getValidatedId(req, 'bookingId');
    const { paymentType = 'DEPOSIT', currency = 'USD' } = req.body;

    validateRequiredFields({ paymentType }, ['paymentType']);

    if (!['DEPOSIT', 'BALANCE', 'FULL'].includes(paymentType)) {
      return sendSuccess(res, 'Invalid payment type. Must be DEPOSIT, BALANCE, or FULL', null, 400);
    }

    const paymentIntent = await createPaymentIntentForBooking(bookingId, paymentType, currency);

    if (paymentIntent.success) {
      sendSuccess(res, 'Payment intent created successfully', {
        paymentIntentId: paymentIntent.paymentIntentId,
        clientSecret: paymentIntent.clientSecret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      });
    } else {
      sendSuccess(res, 'Failed to create payment intent', {
        error: paymentIntent.error,
      }, 400);
    }
  });

  /**
   * Process online deposit payment
   */
  processOnlineDeposit = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = this.getValidatedId(req, 'bookingId');
    const { paymentIntentId, paymentMethodId } = req.body;

    validateRequiredFields({ paymentIntentId }, ['paymentIntentId']);

    const result = await processOnlineDepositPayment(bookingId, paymentIntentId, paymentMethodId);

    sendSuccess(res, 'Online deposit payment processed successfully', {
      payment: result.payment,
      financial: result.financial,
      confirmation: result.confirmation,
    });
  });

  /**
   * Process online balance payment
   */
  processOnlineBalance = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = this.getValidatedId(req, 'bookingId');
    const { paymentIntentId, paymentMethodId } = req.body;

    validateRequiredFields({ paymentIntentId }, ['paymentIntentId']);

    const result = await processOnlineBalancePayment(bookingId, paymentIntentId, paymentMethodId);

    sendSuccess(res, 'Online balance payment processed successfully', {
      payment: result.payment,
      financial: result.financial,
      confirmation: result.confirmation,
    });
  });

  /**
   * Process online full payment
   */
  processOnlineFullPayment = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = this.getValidatedId(req, 'bookingId');
    const { paymentIntentId, paymentMethodId } = req.body;

    validateRequiredFields({ paymentIntentId }, ['paymentIntentId']);

    const result = await processFullPaymentOnline(bookingId, paymentIntentId, paymentMethodId);

    sendSuccess(res, 'Online full payment processed successfully', {
      payments: result.payments,
      financial: result.financial,
      confirmation: result.confirmation,
    });
  });

  /**
   * Process payment refund
   */
  processRefund = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const paymentId = this.getValidatedId(req, 'paymentId');
    const { amount, reason } = req.body;

    const result = await processPaymentRefund(paymentId, amount, reason);

    if (result.success) {
      sendSuccess(res, 'Payment refund processed successfully', {
        refundId: result.refundId,
      });
    } else {
      sendSuccess(res, 'Payment refund failed', {
        error: result.error,
      }, 400);
    }
  });

  /**
   * Get enhanced payment summary with gateway information
   */
  getEnhancedPaymentSummary = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = this.getValidatedId(req, 'bookingId');
    const summary = await getPaymentSummaryEnhanced(bookingId);
    sendSuccess(res, 'Enhanced payment summary retrieved successfully', summary);
  });

  /**
   * Handle payment gateway webhook
   */
  handleWebhook = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const signature = (req.headers['stripe-signature'] || req.headers['x-webhook-signature']) as string;
    const payload = req.body;

    if (!signature) {
      return sendSuccess(res, 'Missing webhook signature', null, 400);
    }

    await handlePaymentWebhook(payload, signature);
    sendSuccess(res, 'Webhook processed successfully', { received: true });
  });

  /**
   * Get payment gateway information
   */
  getGatewayInfo = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const gatewayInfo = paymentGatewayService.getGatewayInfo();
    sendSuccess(res, 'Payment gateway information retrieved', gatewayInfo);
  });
}

const paymentController = new PaymentController();

export const {
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
} = paymentController;
