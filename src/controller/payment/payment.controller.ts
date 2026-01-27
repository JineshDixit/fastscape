import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/expressTypes';
import { createError } from '../../services/middleware/errorHandler';
import {
  calculatePaymentBreakdown,
  processDepositPayment,
  processBalancePayment,
  applyDelayCharges,
  getPaymentSummary,
  markPaymentCompleted,
  getOverduePayments,
  initiatePaymentIntent,
} from '../../services/payment/payment.service';
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
   * Initiate a Stripe PaymentIntent
   */
  initiateIntent = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = this.getValidatedId(req, 'bookingId');
    const { paymentType } = req.body;

    validateRequiredFields({ paymentType }, ['paymentType']);

    if (!['DEPOSIT', 'BALANCE', 'FULL'].includes(paymentType)) {
      throw createError('Invalid payment type. Must be DEPOSIT, BALANCE or FULL', 400);
    }

    const intent = await initiatePaymentIntent(bookingId, paymentType as 'DEPOSIT' | 'BALANCE' | 'FULL');

    sendSuccess(res, 'Payment intent created successfully', intent);
  });

  /**
   * Process deposit payment
   */
  processDeposit = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = this.getValidatedId(req, 'bookingId');
    const { paymentMethod = 'ONLINE', stripePaymentIntentId, paymentType } = req.body;
    const result = await processDepositPayment(bookingId, paymentMethod, stripePaymentIntentId, undefined, paymentType);

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
   * Update booking status to dropped off
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
}

const paymentController = new PaymentController();

export const {
  calculatePayment,
  initiateIntent,
  processDeposit,
  processBalance,
  applyDelayCharge,
  getBookingPaymentSummary,
  completePayment,
  getOverduePaymentsList,
  markVehiclePickedUp,
  markVehicleDroppedOff,
} = paymentController;
