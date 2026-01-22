import { DelayChargeCalculation, PaymentCalculation } from 'paymentTypes';
import { Booking, BookingFinancial, Payment, Vehicle } from '../../models';
import { createError } from '../middleware/errorHandler';
import { Op, Transaction } from 'sequelize';
import Logger from '../../utils/logger';

/**
 * Internal logic for payment breakdown calculation
 */
export const calculatePaymentBreakdownInternal = (
  rentalDays: number,
  pricePerDay: number,
  depositPercentage: number,
  delayChargePerHour: number,
  delayHours: number = 0,
  currency: string = '$',
  existingTaxAmount?: number,
): PaymentCalculation => {
  // Base calculations
  const baseAmount = pricePerDay * rentalDays;
  const depositAmount = (baseAmount * depositPercentage) / 100;
  const balanceAmount = baseAmount - depositAmount;

  // Delay charge calculation
  const delayChargeAmount = delayHours > 0 ? delayHours * delayChargePerHour : 0;

  // Tax calculation (example: 10% tax)
  const taxRate = 0.1;
  const subtotal = baseAmount + delayChargeAmount;
  const taxAmount = Number(existingTaxAmount !== undefined ? existingTaxAmount : subtotal * taxRate);

  const totalAmount = subtotal + taxAmount;

  return {
    baseAmount,
    depositAmount,
    balanceAmount,
    delayChargeAmount,
    delayChargeRate: delayChargePerHour,
    taxAmount,
    totalAmount,
    remainingAmount: totalAmount,
    currency,
  };
};

/**
 * Calculate payment breakdown for a booking
 */
export const calculatePaymentBreakdown = async (
  bookingId: string,
  delayHours: number = 0,
  transaction?: Transaction,
): Promise<PaymentCalculation> => {
  const booking = await Booking.findByPk(bookingId, {
    transaction,
    include: [
      {
        model: Vehicle,
        attributes: ['pricePerDay', 'delayChargePerHour', 'depositPercentage', 'currency'],
      },
      {
        model: BookingFinancial,
        attributes: ['baseAmount', 'depositPercentage', 'taxAmount'],
      },
    ],
  });

  if (!booking) {
    throw createError('Booking not found', 404);
  }

  const vehicle = (booking as any).Vehicle;
  const existingFinancial = (booking as any).BookingFinancial;

  // Calculate rental duration in days
  const startDate = new Date(booking.startDatetime);
  const endDate = new Date(booking.endDatetime);
  const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1; // Default to 1 for same-day

  return calculatePaymentBreakdownInternal(
    rentalDays,
    Number(vehicle.pricePerDay),
    Number(existingFinancial?.depositPercentage || vehicle.depositPercentage),
    Number(vehicle.delayChargePerHour),
    delayHours,
    vehicle.currency,
    existingFinancial?.taxAmount ? Number(existingFinancial.taxAmount) : undefined
  );
};

/**
 * Process deposit payment
 */
export const processDepositPayment = async (
  bookingId: string,
  paymentMethod: 'PICKUP' | 'DROPOFF' | 'ONLINE' = 'ONLINE',
  stripePaymentIntentId?: string,
): Promise<{ payment: Payment; financial: BookingFinancial }> => {
  const calculation = await calculatePaymentBreakdown(bookingId);

  // Create or update booking financial record
  let financial = await BookingFinancial.findOne({ where: { bookingId } });

  if (!financial) {
    financial = await BookingFinancial.create({
      bookingId,
      baseAmount: calculation.baseAmount,
      depositAmount: calculation.depositAmount,
      balanceAmount: calculation.balanceAmount,
      delayChargeAmount: calculation.delayChargeAmount,
      delayChargeRate: calculation.delayChargeRate,
      taxAmount: calculation.taxAmount,
      totalAmount: calculation.totalAmount,
      paidAmount: 0,
      remainingAmount: calculation.totalAmount,
      currency: calculation.currency,
      depositPercentage: (calculation.depositAmount / calculation.baseAmount) * 100,
    });
  }

  // Create deposit payment record
  const booking = await Booking.findByPk(bookingId);
  const payment = await Payment.create({
    bookingId,
    userId: booking!.userId,
    amount: calculation.depositAmount,
    currency: calculation.currency,
    paymentType: 'DEPOSIT',
    paymentStatus: paymentMethod === 'ONLINE' ? 'PAID' : 'UNPAID',
    paymentMethod,
    stripePaymentIntentId,
    paidAt: paymentMethod === 'ONLINE' ? new Date() : null,
  });

  // Update financial record if payment is completed
  if (paymentMethod === 'ONLINE') {
    await financial.update({
      paidAmount: calculation.depositAmount,
      remainingAmount: calculation.totalAmount - calculation.depositAmount,
    });

    // Update booking payment status
    await booking!.update({
      paymentStatus: 'PARTIALLY_PAID',
      paymentMethod,
    });

    Logger.info('Deposit processed successfully', { bookingId, amount: calculation.depositAmount });
  } else {
    Logger.info('Deposit payment initiated (manual)', { bookingId, method: paymentMethod });
  }

  return { payment, financial };
};

/**
 * Process balance payment
 */
export const processBalancePayment = async (
  bookingId: string,
  paymentMethod: 'PICKUP' | 'DROPOFF' | 'ONLINE' = 'DROPOFF',
  stripePaymentIntentId?: string,
): Promise<{ payment: Payment; financial: BookingFinancial }> => {
  const financial = await BookingFinancial.findOne({ where: { bookingId } });
  if (!financial) {
    throw createError('Booking financial record not found', 404);
  }

  const balanceAmount = financial.balanceAmount + financial.delayChargeAmount;

  // Create balance payment record
  const booking = await Booking.findByPk(bookingId);
  const payment = await Payment.create({
    bookingId,
    userId: booking!.userId,
    amount: balanceAmount,
    currency: financial.currency,
    paymentType: 'BALANCE',
    paymentStatus: paymentMethod === 'ONLINE' ? 'PAID' : 'UNPAID',
    paymentMethod,
    stripePaymentIntentId,
    paidAt: paymentMethod === 'ONLINE' ? new Date() : null,
  });

  // Update financial record if payment is completed
  if (paymentMethod === 'ONLINE') {
    await financial.update({
      paidAmount: financial.paidAmount + balanceAmount,
      remainingAmount: 0,
    });

    // Update booking payment status
    await booking!.update({
      paymentStatus: 'PAID',
    });
    Logger.info('Balance payment processed successfully', { bookingId, amount: balanceAmount });
  } else {
    Logger.info('Balance payment initiated (manual)', { bookingId, method: paymentMethod });
  }

  return { payment, financial };
};

/**
 * Calculate and apply delay charges
 */
export const calculateDelayCharges = async (
  bookingId: string,
  actualDropoffTime: Date,
): Promise<DelayChargeCalculation> => {
  const booking = await Booking.findByPk(bookingId, {
    include: [{ model: Vehicle, attributes: ['delayChargePerHour'] }],
  });

  if (!booking) {
    throw createError('Booking not found', 404);
  }

  const scheduledDropoff = new Date(booking.endDatetime);
  const actualDropoff = new Date(actualDropoffTime);

  // Calculate delay in hours
  const delayMilliseconds = actualDropoff.getTime() - scheduledDropoff.getTime();
  const delayHours = Math.max(0, Math.ceil(delayMilliseconds / (1000 * 60 * 60)));

  const delayChargeRate = (booking as any).Vehicle.delayChargePerHour;
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
  const delayCalculation = await calculateDelayCharges(bookingId, actualDropoffTime);

  if (delayCalculation.delayHours === 0) {
    const booking = await Booking.findByPk(bookingId);
    const financial = await BookingFinancial.findOne({ where: { bookingId } });
    return { booking: booking!, financial: financial! };
  }

  Logger.warn('Applying delay charges', { bookingId, delayHours: delayCalculation.delayHours });

  // Update booking with delay information
  const booking = await Booking.findByPk(bookingId);
  await booking!.update({
    actualDropoffDatetime: actualDropoffTime,
    delayChargeApplied: true,
    delayHours: delayCalculation.delayHours,
  });

  // Update financial record with delay charges
  const financial = await BookingFinancial.findOne({ where: { bookingId } });
  const newTotalAmount = financial!.totalAmount + delayCalculation.delayChargeAmount;

  await financial!.update({
    delayChargeAmount: delayCalculation.delayChargeAmount,
    delayChargeRate: delayCalculation.delayChargeRate,
    totalAmount: newTotalAmount,
    remainingAmount: newTotalAmount - financial!.paidAmount,
  });

  // Create delay charge payment record
  const delayCharge = await Payment.create({
    bookingId,
    userId: booking!.userId,
    amount: delayCalculation.delayChargeAmount,
    currency: financial!.currency,
    paymentType: 'DELAY_CHARGE',
    paymentStatus: 'UNPAID',
    paymentMethod: 'DROPOFF',
  });

  // Update booking payment status if there's remaining amount
  if (financial!.remainingAmount > 0) {
    await booking!.update({
      paymentStatus: 'PARTIALLY_PAID',
    });
  }

  return { booking: booking!, financial: financial!, delayCharge };
};

/**
 * Get payment summary for a booking
 */
export const getPaymentSummary = async (bookingId: string) => {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: BookingFinancial,
      },
      {
        model: Payment,
        order: [['createdAt', 'ASC']],
      },
      {
        model: Vehicle,
        attributes: ['make', 'model', 'year', 'pricePerDay', 'delayChargePerHour'],
      },
    ],
  });

  if (!booking) {
    throw createError('Booking not found', 404);
  }

  const payments = (booking as any).Payments || [];
  const financial = (booking as any).BookingFinancial;

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
    vehicle: (booking as any).Vehicle,
  };
};

/**
 * Mark payment as completed (for pickup/dropoff payments)
 */
export const markPaymentCompleted = async (paymentId: string, stripePaymentIntentId?: string): Promise<Payment> => {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) {
    throw createError('Payment not found', 404);
  }

  await payment.update({
    paymentStatus: 'PAID',
    paidAt: new Date(),
    stripePaymentIntentId,
  });

  // Update booking financial record
  const financial = await BookingFinancial.findOne({
    where: { bookingId: payment.bookingId },
  });

  if (financial) {
    await financial.update({
      paidAmount: financial.paidAmount + payment.amount,
      remainingAmount: financial.totalAmount - (financial.paidAmount + payment.amount),
    });
  }

  Logger.info('Payment marked as completed', { paymentId, amount: payment.amount });

  return payment;
};

/**
 * Get overdue payments
 */
export const getOverduePayments = async (): Promise<Payment[]> => {
  const overdueDate = new Date();
  overdueDate.setHours(overdueDate.getHours() - 24); // 24 hours overdue

  return Payment.findAll({
    where: {
      paymentStatus: 'UNPAID',
      createdAt: {
        [Op.lt]: overdueDate,
      },
    },
    include: [
      {
        model: Booking,
        attributes: ['id', 'bookingStatus', 'endDatetime'],
      },
    ],
  });
};
