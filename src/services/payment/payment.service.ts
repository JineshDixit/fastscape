import { Op } from 'sequelize';
import { Payment, Booking, BookingFinancial, User, sequelize } from '../../models';
import logger from '../../config/logger';

interface PaymentFilters {
  bookingId?: string;
  userId?: string;
  paymentType?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}

interface PaymentListResult {
  payments: Payment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get all payments with filtering and pagination
 */
export const getAllPayments = async (filters: PaymentFilters): Promise<PaymentListResult> => {
  const startTime = Date.now();
  logger.debug('Fetching payments with filters', { filters });

  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 100);
  const offset = (page - 1) * limit;

  const where: any = {};

  if (filters.bookingId) {
    where.bookingId = filters.bookingId;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.paymentType) {
    where.paymentType = filters.paymentType;
  }

  if (filters.paymentStatus) {
    where.paymentStatus = filters.paymentStatus;
  }

  if (filters.paymentMethod) {
    where.paymentMethod = filters.paymentMethod;
  }

  const { rows: payments, count: total } = await Payment.findAndCountAll({
    where,
    include: [
      {
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: Booking,
        attributes: ['id', 'bookingStatus', 'paymentStatus', 'startDatetime', 'endDatetime'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  const duration = Date.now() - startTime;
  logger.info('Payments fetched successfully', {
    count: payments.length,
    total,
    page,
    duration: `${duration}ms`,
  });

  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single payment by ID
 */
export const getPaymentById = async (paymentId: string): Promise<Payment | null> => {
  logger.debug('Fetching payment by ID', { paymentId });

  const payment = await Payment.findByPk(paymentId, {
    include: [
      {
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
      },
      {
        model: Booking,
        attributes: ['id', 'bookingStatus', 'paymentStatus', 'startDatetime', 'endDatetime', 'vehicleId'],
      },
    ],
  });

  if (payment) {
    logger.debug('Payment found', { paymentId, amount: payment.amount, status: payment.paymentStatus });
  } else {
    logger.warn('Payment not found', { paymentId });
  }

  return payment;
};

/**
 * Get payment summary for a booking
 */
export const getPaymentSummary = async (bookingId: string) => {
  logger.debug('Fetching payment summary', { bookingId });

  const booking = await Booking.findByPk(bookingId, {
    include: [{ model: BookingFinancial }, { model: Payment }],
  });

  if (!booking) {
    logger.error('Booking not found for payment summary', { bookingId });
    throw new Error('Booking not found');
  }

  const payments = await Payment.findAll({
    where: { bookingId },
    order: [['createdAt', 'ASC']],
  });

  const financial = await BookingFinancial.findOne({
    where: { bookingId },
  });

  const summary = {
    totalPayments: payments.length,
    totalPaid: payments.reduce((sum, p) => (p.paymentStatus === 'PAID' ? sum + Number(p.amount) : sum), 0),
    pendingPayments: payments.filter((p) => p.paymentStatus === 'UNPAID').length,
  };

  logger.info('Payment summary retrieved', {
    bookingId,
    totalPayments: summary.totalPayments,
    totalPaid: summary.totalPaid,
    pendingPayments: summary.pendingPayments,
  });

  return {
    booking: {
      id: booking.id,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
    },
    financial: financial || null,
    payments,
    summary,
  };
};

/**
 * Get overdue payments (UNPAID payments created more than 24 hours ago)
 */
export const getOverduePayments = async (): Promise<Payment[]> => {
  const startTime = Date.now();
  logger.debug('Fetching overdue payments');

  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);

  const payments = await Payment.findAll({
    where: {
      paymentStatus: 'UNPAID',
      createdAt: {
        [Op.lt]: yesterday,
      },
    },
    include: [
      {
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
      },
      {
        model: Booking,
        attributes: ['id', 'bookingStatus', 'paymentStatus', 'startDatetime', 'endDatetime'],
      },
    ],
    order: [['createdAt', 'ASC']],
  });

  const duration = Date.now() - startTime;
  logger.info('Overdue payments retrieved', {
    count: payments.length,
    duration: `${duration}ms`,
  });

  return payments;
};

/**
 * Mark a payment as paid (admin override for manual payments)
 */
export const markPaymentPaid = async (paymentId: string, paidAt?: Date, notes?: string): Promise<Payment> => {
  const startTime = Date.now();
  logger.info('Starting mark payment as paid operation', { paymentId, paidAt, notes });

  const transaction = await sequelize.transaction();

  try {
    const payment = await Payment.findByPk(paymentId, {
      transaction,
      lock: true,
    });

    if (!payment) {
      logger.error('Payment not found for marking as paid', { paymentId });
      throw new Error('Payment not found');
    }

    if (payment.paymentStatus === 'PAID') {
      logger.warn('Attempted to mark already paid payment', {
        paymentId,
        currentStatus: payment.paymentStatus,
      });
      throw new Error('Payment is already marked as paid');
    }

    logger.debug('Updating payment status to PAID', {
      paymentId,
      previousStatus: payment.paymentStatus,
      amount: payment.amount,
    });

    // Update payment record
    await payment.update(
      {
        paymentStatus: 'PAID',
        paidAt: paidAt || new Date(),
        metadata: {
          ...((payment.metadata as any) || {}),
          adminNotes: notes,
          markedPaidAt: new Date().toISOString(),
        },
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
      const newPaidAmount = Number(financial.paidAmount) + Number(payment.amount);
      const newRemainingAmount = Math.max(0, Number(financial.totalAmount) - newPaidAmount);

      logger.debug('Updating booking financial record', {
        bookingId: payment.bookingId,
        previousPaidAmount: financial.paidAmount,
        newPaidAmount,
        newRemainingAmount,
      });

      await financial.update(
        {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
        },
        { transaction },
      );

      // Update booking payment status
      const booking = await Booking.findByPk(payment.bookingId, { transaction });
      if (booking) {
        const isFullyPaid = newPaidAmount >= Number(financial.totalAmount) - 0.01;
        const newPaymentStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';

        logger.debug('Updating booking payment status', {
          bookingId: payment.bookingId,
          previousStatus: booking.paymentStatus,
          newStatus: newPaymentStatus,
          isFullyPaid,
        });

        await booking.update(
          {
            paymentStatus: newPaymentStatus,
          },
          { transaction },
        );
      }
    }

    await transaction.commit();

    const duration = Date.now() - startTime;
    logger.info('Payment marked as paid successfully', {
      paymentId,
      bookingId: payment.bookingId,
      amount: payment.amount,
      duration: `${duration}ms`,
    });

    return payment;
  } catch (error) {
    await transaction.rollback();
    logger.error('Failed to mark payment as paid, transaction rolled back', {
      paymentId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

/**
 * Process refund for a booking
 * Creates a REFUND payment record and updates financial records
 */
export const processRefund = async (
  bookingId: string,
  refundAmount: number,
  reason: string,
  stripeRefundId?: string,
): Promise<{ payment: Payment; financial: BookingFinancial | null }> => {
  const startTime = Date.now();
  logger.info('Starting refund processing', {
    bookingId,
    refundAmount,
    reason,
    stripeRefundId,
  });

  const transaction = await sequelize.transaction();

  try {
    // Validate booking exists
    const booking = await Booking.findByPk(bookingId, {
      transaction,
      lock: true,
    });

    if (!booking) {
      logger.error('Booking not found for refund', { bookingId });
      throw new Error('Booking not found');
    }

    logger.debug('Booking found for refund', {
      bookingId,
      userId: booking.userId,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
    });

    // Get financial record
    const financial = await BookingFinancial.findOne({
      where: { bookingId },
      transaction,
      lock: true,
    });

    if (!financial) {
      logger.error('Financial record not found for refund', { bookingId });
      throw new Error('Financial record not found for this booking');
    }

    logger.debug('Financial record retrieved', {
      bookingId,
      totalAmount: financial.totalAmount,
      paidAmount: financial.paidAmount,
      remainingAmount: financial.remainingAmount,
    });

    // Validate refund amount
    if (refundAmount <= 0) {
      logger.warn('Invalid refund amount (must be > 0)', { bookingId, refundAmount });
      throw new Error('Refund amount must be greater than 0');
    }

    if (refundAmount > Number(financial.paidAmount)) {
      logger.warn('Refund amount exceeds paid amount', {
        bookingId,
        refundAmount,
        paidAmount: financial.paidAmount,
      });
      throw new Error(`Refund amount (${refundAmount}) cannot exceed paid amount (${financial.paidAmount})`);
    }

    // Create refund payment record
    logger.debug('Creating refund payment record', {
      bookingId,
      userId: booking.userId,
      refundAmount,
    });

    const refundPayment = await Payment.create(
      {
        bookingId,
        userId: booking.userId,
        amount: refundAmount,
        currency: financial.currency,
        paymentType: 'REFUND',
        paymentStatus: 'REFUNDED',
        paymentMethod: booking.paymentMethod,
        stripeRefundId: stripeRefundId || null,
        paidAt: new Date(),
        metadata: {
          refundReason: reason,
          processedBy: 'admin',
          processedAt: new Date().toISOString(),
        },
      },
      { transaction },
    );

    logger.info('Refund payment record created', {
      refundPaymentId: refundPayment.id,
      bookingId,
      amount: refundAmount,
    });

    // Update financial record
    const newPaidAmount = Number(financial.paidAmount) - refundAmount;
    const newRemainingAmount = Number(financial.totalAmount) - newPaidAmount;

    logger.debug('Updating financial record after refund', {
      bookingId,
      previousPaidAmount: financial.paidAmount,
      newPaidAmount,
      newRemainingAmount,
    });

    await financial.update(
      {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
      },
      { transaction },
    );

    // Update booking payment status
    let newPaymentStatus: string;
    if (newPaidAmount === 0) {
      newPaymentStatus = 'REFUNDED';
    } else if (newPaidAmount < Number(financial.totalAmount)) {
      newPaymentStatus = 'PARTIALLY_PAID';
    } else {
      newPaymentStatus = 'PAID';
    }

    logger.debug('Updating booking payment status after refund', {
      bookingId,
      previousStatus: booking.paymentStatus,
      newStatus: newPaymentStatus,
      newPaidAmount,
    });

    await booking.update(
      {
        paymentStatus: newPaymentStatus,
      },
      { transaction },
    );

    await transaction.commit();

    const duration = Date.now() - startTime;
    logger.info('Refund processed successfully', {
      bookingId,
      refundPaymentId: refundPayment.id,
      refundAmount,
      newPaymentStatus,
      duration: `${duration}ms`,
    });

    return {
      payment: refundPayment,
      financial,
    };
  } catch (error) {
    await transaction.rollback();
    logger.error('Refund processing failed, transaction rolled back', {
      bookingId,
      refundAmount,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};
