import { DelayChargeCalculation } from '../../common/types/paymentTypes';
import { Booking, BookingFinancial, Payment, Vehicle, sequelize } from '../../models';
import { createError } from '../middleware/errorHandler';
import { buildDateConflictConditions } from '../../utils/database.utils';
import { stripe } from './stripe.service';
import { triggerChauffeurAssignmentOnPayment } from '../booking/chauffeurAssignment.service';
import { Op } from 'sequelize';
import { dbEnums } from '../../common/enum/dbEnums';
import Logger from '../../utils/logger';
import { sendBookingConfirmation, sendPaymentConfirmation } from '../../utils/email.utils';
import { paymentConfig } from '../../config/payment/paymentConfig';
import {
  roundDecimal,
  addDecimal,
  subtractDecimal,
  multiplyDecimal,
  isGreaterOrEqualDecimal,
  calculatePercentage,
  toCents,
} from '../../utils/decimal.utils';

export interface ExternalStripeData {
  amountReceived: number; // in final currency unit (e.g. 100.50)
  currency: string;
  paymentIntentId: string;
  chargeId?: string;
  gatewayFee?: number;
  metadata?: Record<string, any>;
}

/**
 * Calculate payment breakdown for a booking
 */
export const calculatePaymentBreakdown = async (bookingId: string, delayHours: number = 0): Promise<any> => {
  Logger.info('Starting payment breakdown calculation', { bookingId, delayHours });

  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: Vehicle,
        as: 'vehicle',
        attributes: ['pricePerDay', 'delayChargePerHour', 'depositPercentage', 'currency'],
      },
      {
        model: BookingFinancial,
        as: 'financial',
        attributes: ['baseAmount', 'depositPercentage', 'taxAmount'],
      },
    ],
  });

  if (!booking) {
    Logger.error('Booking not found for payment calculation', { bookingId });
    throw createError('Booking not found', 404);
  }

  const { vehicle } = booking as any;
  const existingFinancial = (booking as any).financial;

  Logger.info('Booking and vehicle data retrieved', {
    bookingId,
    hasVehicle: !!vehicle,
    hasFinancial: !!existingFinancial,
  });

  if (!vehicle) {
    Logger.error('Vehicle not found for booking', { bookingId });
    throw createError('Vehicle information not found for this booking', 404);
  }

  // Calculate rental duration in days
  const startDate = new Date(booking.startDatetime);
  const endDate = new Date(booking.endDatetime);
  const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Base calculations - ensure all values are numbers
  const baseAmount = Number(existingFinancial?.baseAmount || vehicle.pricePerDay * rentalDays);
  const depositPercentage = Number(existingFinancial?.depositPercentage || vehicle.depositPercentage);
  const depositAmount = (baseAmount * depositPercentage) / 100;
  const balanceAmount = baseAmount - depositAmount;

  // Delay charge calculation
  const delayChargeRate = Number(vehicle.delayChargePerHour || 0);
  const delayChargeAmount = delayHours > 0 ? multiplyDecimal(delayHours, delayChargeRate) : 0;

  // Tax calculation using config
  const taxRate = paymentConfig.taxRate;
  // Platform charge calculation
  const platformChargeRate = Number(existingFinancial?.platformChargeRate || paymentConfig.platformChargeRate);
  const platformChargeAmount = Number(existingFinancial?.platformChargeAmount) || calculatePercentage(baseAmount, platformChargeRate);

  const subtotal = addDecimal(addDecimal(baseAmount, delayChargeAmount), platformChargeAmount);
  const taxAmount = Number(existingFinancial?.taxAmount) || multiplyDecimal(subtotal, taxRate);

  const totalAmount = addDecimal(subtotal, taxAmount);

  // Return in frontend-compatible format (strings)
  const result = {
    baseAmount: Number(baseAmount).toFixed(2),
    depositAmount: Number(depositAmount).toFixed(2),
    balanceAmount: Number(balanceAmount).toFixed(2),
    taxAmount: Number(taxAmount).toFixed(2),
    delayCharges: delayChargeAmount > 0 ? Number(delayChargeAmount).toFixed(2) : undefined,
    totalAmount: Number(totalAmount).toFixed(2),
    currency: vehicle.currency || 'USD',
    daysCount: rentalDays,
    delayHours: delayHours > 0 ? delayHours : undefined,
    depositPercentage: Number(depositPercentage),
    platformChargeAmount: Number(platformChargeAmount).toFixed(2),
    platformChargeRate: Number(platformChargeRate),
  };

  Logger.info('Payment breakdown calculated successfully', { bookingId, result });

  return result;
};

/**
 * Process deposit payment
 */
export const processDepositPayment = async (
  bookingId: string,
  paymentMethod: 'PICKUP' | 'DROPOFF' | 'ONLINE' = 'ONLINE',
  stripePaymentIntentId?: string,
  stripeData?: ExternalStripeData,
  paymentTypeOverride?: 'DEPOSIT' | 'FULL',
): Promise<{ payment: Payment; financial: BookingFinancial }> => {
  const transaction = await sequelize.transaction();

  try {
    const calculation = await calculatePaymentBreakdown(bookingId);

    // Create or update booking financial record
    let financial = await BookingFinancial.findOne({
      where: { bookingId },
      transaction,
      lock: true,
    });

    if (!financial) {
      financial = await BookingFinancial.create(
        {
          bookingId,
          baseAmount: calculation.baseAmount,
          depositAmount: calculation.depositAmount,
          balanceAmount: calculation.balanceAmount,
          delayChargeAmount: 0,
          delayChargeRate: 0,
          taxAmount: calculation.taxAmount,
          platformChargeAmount: calculation.platformChargeAmount,
          platformChargeRate: calculation.platformChargeRate,
          totalAmount: calculation.totalAmount,
          paidAmount: 0,
          remainingAmount: calculation.totalAmount,
          currency: calculation.currency,
          depositPercentage: (calculation.depositAmount / calculation.baseAmount) * 100,
        },
        { transaction },
      );
    }

    // Create deposit payment record
    const booking = await Booking.findByPk(bookingId, { transaction, lock: true });
    if (!booking) throw createError('Booking not found', 404);

    // Store old booking state for audit
    const oldBookingState = {
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
    };

    // Check if booking has expired
    if (
      booking.bookingStatus === dbEnums.BOOKING_STATUS[0] &&
      booking.expiresAt &&
      new Date() > new Date(booking.expiresAt)
    ) {
      // 'PENDING'
      Logger.warn('Processing payment for expired booking - re-checking availability', { bookingId });

      // Re-check availability
      const conflictingBooking = await Booking.findOne({
        where: {
          vehicleId: booking.vehicleId,
          id: { [Op.ne]: bookingId }, // Exclude current booking
          [Op.and]: [
            buildDateConflictConditions(booking.startDatetime, booking.endDatetime),
            {
              [Op.or]: [
                { bookingStatus: dbEnums.BOOKING_STATUS[1] }, // 'CONFIRMED'
                {
                  bookingStatus: dbEnums.BOOKING_STATUS[0], // 'PENDING'
                  [Op.or]: [{ expiresAt: { [Op.eq]: null } }, { expiresAt: { [Op.gt]: new Date() } }],
                },
              ],
            },
          ],
        },
        transaction,
        lock: true,
      });

      if (conflictingBooking) {
        throw createError('Booking expired and vehicle is no longer available', 409);
      }
    }

    // Idempotency check: prevent duplicate payment records for the same intent
    const effectiveIntentId = stripeData?.paymentIntentId || stripePaymentIntentId;
    if (effectiveIntentId) {
      const existingPayment = await Payment.findOne({
        where: {
          stripePaymentIntentId: effectiveIntentId,
          paymentType: { [Op.in]: [dbEnums.PAYMENT_TYPE[0], dbEnums.PAYMENT_TYPE[4]] }, // 'DEPOSIT' and 'FULL'
        },
        transaction,
      });
      if (existingPayment) {
        Logger.info('Duplicate payment attempt detected - returning existing payment', {
          intentId: effectiveIntentId,
          existingPaymentId: existingPayment.id,
        });
        await transaction.rollback();
        return { payment: existingPayment, financial };
      }
    }

    // If we have an ID but no data yet (client-side confirmation), fetch it from Stripe
    let effectiveStripeData = stripeData;
    if (stripePaymentIntentId && !effectiveStripeData) {
      try {
        const intent = await stripe.retrievePaymentIntent(stripePaymentIntentId);
        if (intent && (intent.status === 'succeeded' || intent.status === 'processing')) {
          effectiveStripeData = {
            amountReceived: intent.amount_received / 100,
            currency: intent.currency,
            paymentIntentId: intent.id,
            chargeId: intent.latest_charge,
            metadata: intent.metadata,
          };
          Logger.info('Retrieved Stripe intent for processing', {
            intentId: intent.id,
            paymentType: intent.metadata?.paymentType,
          });
        }
      } catch (err) {
        Logger.warn('Failed to retrieve Stripe intent', { stripePaymentIntentId, err });
      }
    }

    // Determine portion of platform charge
    const isFullPayment = paymentTypeOverride === 'FULL' || effectiveStripeData?.metadata?.paymentType === 'FULL';

    // Calculate portion of platform charge for this payment
    const paymentPlatformCharge = isFullPayment
      ? calculation.platformChargeAmount
      : (calculation.depositAmount / calculation.totalAmount) * calculation.platformChargeAmount;

    // Use Stripe data if provided, otherwise fallback to calculations
    const finalAmount = effectiveStripeData
      ? effectiveStripeData.amountReceived
      : isFullPayment
        ? calculation.totalAmount
        : calculation.depositAmount;

    const finalCurrency = effectiveStripeData ? effectiveStripeData.currency.toUpperCase() : calculation.currency;
    const gatewayFee =
      effectiveStripeData?.gatewayFee !== undefined
        ? effectiveStripeData.gatewayFee
        : paymentMethod === 'ONLINE'
          ? addDecimal(
              calculatePercentage(finalAmount, paymentConfig.gatewayFeePercent),
              paymentConfig.gatewayFeeFixed,
            )
          : 0;

    // Determine payment type from metadata or override
    const paymentTypeValue = effectiveStripeData?.metadata?.paymentType || paymentTypeOverride || 'DEPOSIT';
    const paymentTypeEnum = paymentTypeValue === 'FULL' ? dbEnums.PAYMENT_TYPE[4] : dbEnums.PAYMENT_TYPE[0]; // 'FULL' or 'DEPOSIT'

    const payment = await Payment.create(
      {
        bookingId,
        userId: booking.userId,
        amount: finalAmount,
        currency: finalCurrency,
        paymentType: paymentTypeEnum,
        paymentStatus: paymentMethod === 'ONLINE' ? dbEnums.PAYMENT_STATUS[2] : dbEnums.PAYMENT_STATUS[0], // 'PAID' or 'UNPAID'
        paymentMethod,
        stripePaymentIntentId: effectiveIntentId,
        stripeChargeId: stripeData?.chargeId,
        gatewayFeeAmount: gatewayFee,
        platformChargeAmount: paymentPlatformCharge,
        paidAt: paymentMethod === 'ONLINE' ? new Date() : null,
        metadata: stripeData?.metadata,
      },
      { transaction },
    );

    // Update financial record if payment is completed
    if (paymentMethod === 'ONLINE') {
      const newPaidAmount = addDecimal(Number(financial.paidAmount), finalAmount);
      const newRemainingAmount = Math.max(0, subtractDecimal(calculation.totalAmount, newPaidAmount));

      await financial.update(
        {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
        },
        { transaction },
      );

      // Update booking status and payment status
      // Dynamically determine payment status: if paid >= total, it's PAID, else PARTIALLY_PAID
      const isFullyPaid = isGreaterOrEqualDecimal(
        newPaidAmount,
        calculation.totalAmount,
        paymentConfig.comparisonDelta,
      );
      const bookingUpdates: any = {
        paymentStatus: isFullyPaid ? dbEnums.PAYMENT_STATUS[2] : dbEnums.PAYMENT_STATUS[1], // 'PAID' or 'PARTIALLY_PAID'
        paymentMethod,
      };

      // Confirm booking if it was PENDING
      if (booking.bookingStatus === dbEnums.BOOKING_STATUS[0]) {
        // 'PENDING'
        bookingUpdates.bookingStatus = dbEnums.BOOKING_STATUS[1]; // 'CONFIRMED'
        bookingUpdates.expiresAt = null;
      }

      await booking.update(bookingUpdates, { transaction });

      Logger.info('Deposit processed successfully and booking confirmed', { bookingId, amount: finalAmount });

      // Send booking confirmation email if booking was just confirmed (non-blocking)
      if (oldBookingState.bookingStatus === dbEnums.BOOKING_STATUS[0] && bookingUpdates.bookingStatus === dbEnums.BOOKING_STATUS[1]) {
        sendBookingConfirmation(bookingId).catch((error) => {
          Logger.error('Failed to send booking confirmation email', { bookingId, error });
        });
      }

      // Send payment confirmation email (non-blocking)
      sendPaymentConfirmation(
        bookingId,
        paymentTypeEnum === dbEnums.PAYMENT_TYPE[4] ? 'Full Payment' : 'Deposit',
        finalAmount.toString(),
        finalCurrency,
        paymentMethod
      ).catch((error) => {
        Logger.error('Failed to send payment confirmation email', { bookingId, error });
      });
    } else {
      Logger.info('Deposit payment initiated (manual)', { bookingId, method: paymentMethod });
    }

    await transaction.commit();

    // Trigger chauffeur assignment for CHAUFFEUR bookings AFTER commit to avoid race conditions
    if (paymentMethod === 'ONLINE' && booking.bookingType === dbEnums.BOOKING_TYPE[1]) {
      // 'CHAUFFEUR'
      // Re-fetch or check state to see if assignment is needed
      const isInitialConfirmation =
        oldBookingState.bookingStatus === dbEnums.BOOKING_STATUS[0] &&
        booking.bookingStatus === dbEnums.BOOKING_STATUS[1];

      // Use safe decimal comparison
      const isFullyPaid = isGreaterOrEqualDecimal(
        Number(financial.paidAmount),
        calculation.totalAmount,
        paymentConfig.comparisonDelta,
      );

      if (isFullyPaid || isInitialConfirmation) {
        // Don't wait for assignment to complete - trigger asynchronously
        triggerChauffeurAssignmentOnPayment(
          bookingId,
          paymentTypeEnum === dbEnums.PAYMENT_TYPE[4] ? 'FULL' : 'DEPOSIT',
        ).catch((error) => {
          Logger.error('Async chauffeur assignment failed after transaction commit', { bookingId, error });
        });
      }
    }

    return { payment, financial };
  } catch (error) {
    await transaction.rollback();
    Logger.error('Deposit payment processing failed', { error });
    throw error;
  }
};

/**
 * Process balance payment
 */
export const processBalancePayment = async (
  bookingId: string,
  paymentMethod: 'PICKUP' | 'DROPOFF' | 'ONLINE' = 'DROPOFF',
  stripePaymentIntentId?: string,
  stripeData?: ExternalStripeData,
): Promise<{ payment: Payment; financial: BookingFinancial }> => {
  const transaction = await sequelize.transaction();

  try {
    const financial = await BookingFinancial.findOne({
      where: { bookingId },
      transaction,
      lock: true,
    });

    if (!financial) {
      throw createError('Booking financial record not found', 404);
    }

    const booking = await Booking.findByPk(bookingId, { transaction, lock: true });
    if (!booking) throw createError('Booking not found', 404);

    // Idempotency check
    const effectiveIntentId = stripeData?.paymentIntentId || stripePaymentIntentId;
    if (effectiveIntentId) {
      const existingPayment = await Payment.findOne({
        where: {
          stripePaymentIntentId: effectiveIntentId,
          paymentType: dbEnums.PAYMENT_TYPE[1], // 'BALANCE'
        },
        transaction,
      });
      if (existingPayment) {
        Logger.info('Duplicate balance payment attempt detected - returning existing payment', {
          intentId: effectiveIntentId,
          existingPaymentId: existingPayment.id,
        });
        await transaction.rollback();
        return { payment: existingPayment, financial };
      }
    }

    const balanceAmount = Number(financial.balanceAmount) + Number(financial.delayChargeAmount);

    // Use the remaining platform charge
    const paymentPlatformCharge =
      financial.platformChargeAmount -
      (financial.paidAmount > 0 ? (financial.paidAmount / financial.totalAmount) * financial.platformChargeAmount : 0);

    // Use Stripe data if provided
    const finalAmount = stripeData ? stripeData.amountReceived : balanceAmount;
    const finalCurrency = stripeData ? stripeData.currency.toUpperCase() : financial.currency;
    const gatewayFee =
      stripeData?.gatewayFee !== undefined
        ? stripeData.gatewayFee
        : paymentMethod === 'ONLINE'
          ? addDecimal(
              calculatePercentage(finalAmount, paymentConfig.gatewayFeePercent),
              paymentConfig.gatewayFeeFixed,
            )
          : 0;

    // Create balance payment record
    const payment = await Payment.create(
      {
        bookingId,
        userId: booking.userId,
        amount: finalAmount,
        currency: finalCurrency,
        paymentType: dbEnums.PAYMENT_TYPE[1], // 'BALANCE'
        paymentStatus: paymentMethod === 'ONLINE' ? dbEnums.PAYMENT_STATUS[2] : dbEnums.PAYMENT_STATUS[0], // 'PAID' or 'UNPAID'
        paymentMethod,
        stripePaymentIntentId: effectiveIntentId,
        stripeChargeId: stripeData?.chargeId,
        gatewayFeeAmount: gatewayFee,
        platformChargeAmount: paymentPlatformCharge,
        paidAt: paymentMethod === 'ONLINE' ? new Date() : null,
        metadata: stripeData?.metadata,
      },
      { transaction },
    );

    // Update financial record if payment is completed
    if (paymentMethod === 'ONLINE') {
      const newPaidAmount = addDecimal(Number(financial.paidAmount), balanceAmount);
      await financial.update(
        {
          paidAmount: roundDecimal(newPaidAmount),
          remainingAmount: 0,
        },
        { transaction },
      );

      // Update booking payment status
      await booking.update(
        {
          paymentStatus: dbEnums.PAYMENT_STATUS[2], // 'PAID'
        },
        { transaction },
      );

      Logger.info('Balance payment processed successfully', { bookingId, amount: balanceAmount });

      // Send payment confirmation email (non-blocking)
      sendPaymentConfirmation(
        bookingId,
        'Balance Payment',
        balanceAmount.toString(),
        finalCurrency,
        paymentMethod
      ).catch((error) => {
        Logger.error('Failed to send payment confirmation email', { bookingId, error });
      });
    } else {
      Logger.info('Balance payment initiated (manual)', { bookingId, method: paymentMethod });
    }

    await transaction.commit();

    // Trigger chauffeur assignment for CHAUFFEUR bookings AFTER commit to avoid race conditions
    if (paymentMethod === 'ONLINE' && booking.bookingType === dbEnums.BOOKING_TYPE[1]) {
      // 'CHAUFFEUR'
      // Don't wait for assignment to complete - trigger asynchronously
      triggerChauffeurAssignmentOnPayment(bookingId, 'BALANCE').catch((error) => {
        Logger.error('Async chauffeur assignment failed after transaction commit (balance)', { bookingId, error });
      });
    }

    return { payment, financial };
  } catch (error) {
    await transaction.rollback();
    Logger.error('Balance payment processing failed', { error });
    throw error;
  }
};

/**
 * Calculate and apply delay charges
 */
export const calculateDelayCharges = async (
  bookingId: string,
  actualDropoffTime: Date,
): Promise<DelayChargeCalculation> => {
  const booking = await Booking.findByPk(bookingId, {
    include: [{ model: Vehicle, as: 'vehicle', attributes: ['delayChargePerHour'] }],
  });

  if (!booking) {
    throw createError('Booking not found', 404);
  }

  const scheduledDropoff = new Date(booking.endDatetime);
  const actualDropoff = new Date(actualDropoffTime);

  // Calculate delay in hours
  const delayMilliseconds = actualDropoff.getTime() - scheduledDropoff.getTime();
  const delayHours = Math.max(0, Math.ceil(delayMilliseconds / (1000 * 60 * 60)));

  const delayChargeRate = (booking as any).vehicle.delayChargePerHour;
  const delayChargeAmount = delayHours * delayChargeRate;

  return {
    delayHours,
    delayChargeRate,
    delayChargeAmount,
    totalDelayCharge: delayChargeAmount,
  };
};

/**
 * Apply delay charges to booking
 */
export const applyDelayCharges = async (
  bookingId: string,
  actualDropoffTime: Date,
): Promise<{ booking: Booking; financial: BookingFinancial; delayCharge?: Payment }> => {
  const transaction = await sequelize.transaction();

  try {
    const delayCalculation = await calculateDelayCharges(bookingId, actualDropoffTime);

    const booking = await Booking.findByPk(bookingId, { transaction, lock: true });
    if (!booking) throw createError('Booking not found', 404);

    const financial = await BookingFinancial.findOne({
      where: { bookingId },
      transaction,
      lock: true,
    });
    if (!financial) throw createError('Booking financial record not found', 404);

    if (delayCalculation.delayHours === 0) {
      await transaction.commit();
      return { booking, financial };
    }

    Logger.warn('Applying delay charges', { bookingId, delayHours: delayCalculation.delayHours });

    // Update booking with delay information
    await booking.update(
      {
        actualDropoffDatetime: actualDropoffTime,
        delayChargeApplied: true,
        delayHours: delayCalculation.delayHours,
      },
      { transaction },
    );

    // Update financial record with delay charges
    const newTotalAmount = Number(financial.totalAmount) + delayCalculation.delayChargeAmount;

    await financial.update(
      {
        delayChargeAmount: delayCalculation.delayChargeAmount,
        delayChargeRate: delayCalculation.delayChargeRate,
        totalAmount: newTotalAmount,
        remainingAmount: newTotalAmount - Number(financial.paidAmount),
      },
      { transaction },
    );

    // Create delay charge payment record
    const delayCharge = await Payment.create(
      {
        bookingId,
        userId: booking.userId,
        amount: delayCalculation.delayChargeAmount,
        currency: financial.currency,
        paymentType: dbEnums.PAYMENT_TYPE[2], // 'DELAY_CHARGE'
        paymentStatus: dbEnums.PAYMENT_STATUS[0], // 'UNPAID'
        paymentMethod: dbEnums.PAYMENT_METHOD[1], // 'DROPOFF'
      },
      { transaction },
    );

    // Update booking payment status if there's remaining amount
    if (financial.remainingAmount > 0) {
      await booking.update(
        {
          paymentStatus: dbEnums.PAYMENT_STATUS[1], // 'PARTIALLY_PAID'
        },
        { transaction },
      );
    }

    await transaction.commit();
    return { booking, financial, delayCharge };
  } catch (error) {
    await transaction.rollback();
    Logger.error('Applying delay charges failed', { error });
    throw error;
  }
};

/**
 * Get payment summary for a booking
 */
export const getPaymentSummary = async (bookingId: string) => {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: BookingFinancial,
        as: 'financial',
      },
      {
        model: Payment,
        as: 'payments',
        order: [['createdAt', 'ASC']],
      },
      {
        model: Vehicle,
        as: 'vehicle',
        attributes: ['make', 'model', 'year', 'pricePerDay', 'delayChargePerHour'],
      },
    ],
  });

  if (!booking) {
    throw createError('Booking not found', 404);
  }

  const payments = (booking as any).payments || [];
  const { financial } = booking as any;

  // Calculate total paid amount from successful payments
  const totalPaid = payments
    .filter((payment: any) => payment.paymentStatus === 'PAID')
    .reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || 0), 0)
    .toString();

  // Calculate remaining balance
  const totalAmount = financial ? parseFloat(financial.totalAmount || 0) : 0;
  const remainingBalance = (totalAmount - parseFloat(totalPaid || 0)).toString();

  return {
    booking: {
      id: booking.id,
      startDatetime: booking.startDatetime,
      endDatetime: booking.endDatetime,
      actualPickupDatetime: booking.actualPickupDatetime,
      actualDropoffDatetime: booking.actualDropoffDatetime,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      delayChargeApplied: booking.delayChargeApplied,
      delayHours: booking.delayHours,
    },
    financial: financial
      ? {
          baseAmount: financial.baseAmount,
          depositAmount: financial.depositAmount,
          balanceAmount: financial.balanceAmount,
          delayChargeAmount: financial.delayChargeAmount,
          taxAmount: financial.taxAmount,
          totalAmount: financial.totalAmount,
          paidAmount: financial.paidAmount,
          remainingAmount: financial.remainingAmount,
          currency: financial.currency,
        }
      : null,
    payments: payments.map((payment: any) => ({
      id: payment.id,
      amount: payment.amount,
      paymentType: payment.paymentType,
      paymentStatus: payment.paymentStatus,
      paymentMethod: payment.paymentMethod,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    })),
    totalPaid,
    remainingBalance,
    vehicle: (booking as any).vehicle,
  };
};

/**
 * Mark payment as completed (for pickup/dropoff payments)
 */
export const markPaymentCompleted = async (paymentId: string, stripePaymentIntentId?: string): Promise<Payment> => {
  const transaction = await sequelize.transaction();

  try {
    const payment = await Payment.findByPk(paymentId, { transaction, lock: true });
    if (!payment) {
      throw createError('Payment not found', 404);
    }

    if (payment.paymentStatus === 'PAID') {
      await transaction.rollback();
      return payment;
    }

    await payment.update(
      {
        paymentStatus: 'PAID',
        paidAt: new Date(),
        stripePaymentIntentId,
      },
      { transaction },
    );

    // Update booking financial record
    const financial = await BookingFinancial.findOne({
      where: { bookingId: payment.bookingId },
      transaction,
      lock: true,
    });

    if (financial) {
      const newPaidAmount = addDecimal(Number(financial.paidAmount), Number(payment.amount));
      const newRemainingAmount = Math.max(0, subtractDecimal(Number(financial.totalAmount), newPaidAmount));

      await financial.update(
        {
          paidAmount: roundDecimal(newPaidAmount),
          remainingAmount: roundDecimal(newRemainingAmount),
        },
        { transaction },
      );

      // Update booking payment status
      const booking = await Booking.findByPk(payment.bookingId, { transaction, lock: true });
      if (booking) {
        const isFullyPaid = isGreaterOrEqualDecimal(
          newPaidAmount,
          Number(financial.totalAmount),
          paymentConfig.comparisonDelta,
        );
        await booking.update(
          {
            paymentStatus: isFullyPaid ? dbEnums.PAYMENT_STATUS[2] : dbEnums.PAYMENT_STATUS[1], // 'PAID' or 'PARTIALLY_PAID'
          },
          { transaction },
        );
      }
    }

    await transaction.commit();

    // Trigger chauffeur assignment for CHAUFFEUR bookings AFTER commit to avoid race conditions
    // This is useful for manual payment confirmations (pickup/dropoff payments)
    const booking = await Booking.findByPk(payment.bookingId);
    if (booking && booking.bookingType === dbEnums.BOOKING_TYPE[1]) {
      // 'CHAUFFEUR'
      triggerChauffeurAssignmentOnPayment(payment.bookingId, 'BALANCE').catch((error) => {
        Logger.error('Async chauffeur assignment failed after manual payment confirmation commit', {
          bookingId: payment.bookingId,
          error,
        });
      });
    }

    Logger.info('Payment marked as completed and booking status updated', {
      paymentId,
      amount: payment.amount,
      bookingId: payment.bookingId,
    });

    return payment;
  } catch (error) {
    await transaction.rollback();
    Logger.error('Failed to mark payment as completed', { error, paymentId });
    throw error;
  }
};

/**
 * Get overdue payments
 */
export const getOverduePayments = async (): Promise<Payment[]> => {
  const overdueDate = new Date();
  overdueDate.setHours(overdueDate.getHours() - 24); // 24 hours overdue

  return Payment.findAll({
    where: {
      paymentStatus: dbEnums.PAYMENT_STATUS[0], // 'UNPAID'
      createdAt: {
        [Op.lt]: overdueDate,
      },
    },
    include: [
      {
        model: Booking,
        as: 'booking',
        attributes: ['id', 'bookingStatus', 'endDatetime'],
      },
    ],
  });
};

/**
 * Initiate a Stripe PaymentIntent for a booking
 */
export const initiatePaymentIntent = async (
  bookingId: string,
  paymentType: 'DEPOSIT' | 'BALANCE' | 'FULL',
): Promise<any> => {
  const calculation = await calculatePaymentBreakdown(bookingId);

  // Convert string amounts back to numbers for calculation
  const depositAmount = parseFloat(calculation.depositAmount);
  const totalAmount = parseFloat(calculation.totalAmount);
  const balanceAmount = parseFloat(calculation.balanceAmount);
  const delayChargeAmount = calculation.delayCharges ? parseFloat(calculation.delayCharges) : 0;

  const amount =
    paymentType === 'DEPOSIT'
      ? depositAmount
      : paymentType === 'FULL'
        ? totalAmount
        : addDecimal(balanceAmount, delayChargeAmount);

  return await stripe.createPaymentIntent({
    amount: toCents(amount), // Convert to cents using utility
    currency: calculation.currency.toLowerCase(),
    metadata: {
      bookingId,
      paymentType,
    },
  });
};
