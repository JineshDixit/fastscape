import { Op } from 'sequelize';
import { Payment, Booking, BookingFinancial, User, sequelize } from '../../models';

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
  return await Payment.findByPk(paymentId, {
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
};

/**
 * Get payment summary for a booking
 */
export const getPaymentSummary = async (bookingId: string) => {
  const booking = await Booking.findByPk(bookingId, {
    include: [{ model: BookingFinancial }, { model: Payment }],
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  const payments = await Payment.findAll({
    where: { bookingId },
    order: [['createdAt', 'ASC']],
  });

  const financial = await BookingFinancial.findOne({
    where: { bookingId },
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
    summary: {
      totalPayments: payments.length,
      totalPaid: payments.reduce((sum, p) => (p.paymentStatus === 'PAID' ? sum + Number(p.amount) : sum), 0),
      pendingPayments: payments.filter((p) => p.paymentStatus === 'UNPAID').length,
    },
  };
};

/**
 * Get overdue payments (UNPAID payments created more than 24 hours ago)
 */
export const getOverduePayments = async (): Promise<Payment[]> => {
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);

  return await Payment.findAll({
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
};

/**
 * Mark a payment as paid (admin override for manual payments)
 */
export const markPaymentPaid = async (paymentId: string, paidAt?: Date, notes?: string): Promise<Payment> => {
  const transaction = await sequelize.transaction();

  try {
    const payment = await Payment.findByPk(paymentId, {
      transaction,
      lock: true,
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.paymentStatus === 'PAID') {
      throw new Error('Payment is already marked as paid');
    }

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
        await booking.update(
          {
            paymentStatus: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
          },
          { transaction },
        );
      }
    }

    await transaction.commit();
    return payment;
  } catch (error) {
    await transaction.rollback();
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
  const transaction = await sequelize.transaction();

  try {
    // Validate booking exists
    const booking = await Booking.findByPk(bookingId, {
      transaction,
      lock: true,
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Get financial record
    const financial = await BookingFinancial.findOne({
      where: { bookingId },
      transaction,
      lock: true,
    });

    if (!financial) {
      throw new Error('Financial record not found for this booking');
    }

    // Validate refund amount
    if (refundAmount <= 0) {
      throw new Error('Refund amount must be greater than 0');
    }

    if (refundAmount > Number(financial.paidAmount)) {
      throw new Error(`Refund amount ($${refundAmount}) cannot exceed paid amount ($${financial.paidAmount})`);
    }

    // Create refund payment record
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

    // Update financial record
    const newPaidAmount = Number(financial.paidAmount) - refundAmount;
    const newRemainingAmount = Number(financial.totalAmount) - newPaidAmount;

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

    await booking.update(
      {
        paymentStatus: newPaymentStatus,
      },
      { transaction },
    );

    await transaction.commit();

    return {
      payment: refundPayment,
      financial,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
