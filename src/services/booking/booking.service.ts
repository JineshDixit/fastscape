import { Op } from 'sequelize';
import { Booking, BookingFinancial, Payment, User, Vehicle, Chauffeur, sequelize } from '../../models';
import { dbEnums } from '../../common/enum/dbEnums';
import logger from '../../config/logger';

interface BookingFilters {
  status?: string;
  paymentStatus?: string;
  bookingType?: string;
  userId?: string;
  vehicleId?: string;
  chauffeurId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

interface BookingListResult {
  bookings: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get all bookings with filtering and pagination
 */
export const getAllBookings = async (filters: BookingFilters): Promise<BookingListResult> => {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 100);
  const offset = (page - 1) * limit;

  const where: any = {};

  if (filters.status) {
    where.bookingStatus = filters.status;
  }

  if (filters.paymentStatus) {
    where.paymentStatus = filters.paymentStatus;
  }

  if (filters.bookingType) {
    where.bookingType = filters.bookingType;
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.vehicleId) {
    where.vehicleId = filters.vehicleId;
  }

  if (filters.chauffeurId) {
    where.chauffeurId = filters.chauffeurId;
  }

  if (filters.startDate) {
    where.startDatetime = {
      [Op.gte]: new Date(filters.startDate),
    };
  }

  if (filters.endDate) {
    where.endDatetime = {
      [Op.lte]: new Date(filters.endDate),
    };
  }

  // Server-side search logic
  if (filters.search) {
    const searchCondition = {
      [Op.or]: [
        { id: { [Op.iLike]: `%${filters.search}%` } },
        { '$User.firstName$': { [Op.iLike]: `%${filters.search}%` } },
        { '$User.lastName$': { [Op.iLike]: `%${filters.search}%` } },
        { '$Vehicle.make$': { [Op.iLike]: `%${filters.search}%` } },
        { '$Vehicle.model$': { [Op.iLike]: `%${filters.search}%` } },
      ],
    };
    Object.assign(where, searchCondition);
  }

  // Sorting logic
  let order: any = [['createdAt', 'DESC']];
  if (filters.sortBy) {
    const sortOrder = filters.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    // Handle nested sorting mapping if necessary, otherwise assume direct field
    const field = filters.sortBy;
    if (field === 'user') {
      order = [[{ model: User, as: 'User' }, 'firstName', sortOrder]];
    } else if (field === 'vehicle') {
      order = [[{ model: Vehicle, as: 'Vehicle' }, 'make', sortOrder]];
    } else {
      order = [[field, sortOrder]];
    }
  }

  const { rows: bookings, count: total } = await Booking.findAndCountAll({
    where,
    include: [
      {
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
      },
      {
        model: Vehicle,
        attributes: ['id', 'make', 'model', 'year', 'bodyType'],
      },
      {
        model: Chauffeur,
        attributes: ['id', 'fullName', 'phone', 'rating', 'status'],
        required: false,
      },
      {
        model: BookingFinancial,
        required: false,
      },
      {
        model: Payment,
        required: false,
      },
    ],
    order,
    limit,
    offset,
    distinct: true, // Crucial for correct count with includes
  });

  return {
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single booking by ID with full details
 */
export const getBookingById = async (bookingId: string): Promise<Booking | null> => {
  return await Booking.findByPk(bookingId, {
    include: [
      {
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'verificationStatus'],
      },
      {
        model: Vehicle,
        attributes: [
          'id',
          'make',
          'model',
          'year',
          'bodyType',
          'pricePerDay',
          'depositPercentage',
          'delayChargePerHour',
        ],
      },
      {
        model: Chauffeur,
        attributes: ['id', 'fullName', 'phone', 'email', 'rating', 'hourlyRate', 'status'],
        required: false,
      },
      {
        model: BookingFinancial,
        required: false,
      },
      {
        model: Payment,
        required: false,
        order: [['createdAt', 'DESC']],
      },
    ],
  });
};

/**
 * Update booking status with validation
 */
export const updateBookingStatus = async (bookingId: string, newStatus: string): Promise<Booking> => {
  const startTime = Date.now();
  logger.info('Updating booking status', { bookingId, newStatus });

  const transaction = await sequelize.transaction();

  try {
    const booking = await Booking.findByPk(bookingId, {
      transaction,
      lock: true,
    });

    if (!booking) {
      logger.error('Booking not found for status update', { bookingId });
      throw new Error('Booking not found');
    }

    logger.debug('Current booking state', {
      bookingId,
      currentStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      chauffeurId: booking.chauffeurId,
    });

    // Validate status transitions
    if (newStatus === 'CONFIRMED') {
      // Cannot confirm without payment
      const hasPayment = await Payment.findOne({
        where: {
          bookingId,
          paymentStatus: 'PAID',
        },
        transaction,
      });

      if (!hasPayment) {
        logger.warn('Cannot confirm booking without payment', { bookingId });
        throw new Error('Cannot confirm booking without payment');
      }

      logger.debug('Payment verified for booking confirmation', { bookingId });
    }

    if (newStatus === 'CANCELLED' && booking.chauffeurId) {
      logger.debug('Releasing chauffeur due to cancellation', {
        bookingId,
        chauffeurId: booking.chauffeurId,
      });

      await Chauffeur.update(
        { status: 'AVAILABLE' },
        {
          where: { id: booking.chauffeurId },
          transaction,
        },
      );

      logger.info('Chauffeur released', { chauffeurId: booking.chauffeurId });
    }

    if (newStatus === 'COMPLETED') {
      // Cannot complete without being dropped off
      if (booking.bookingStatus !== 'DROPPED_OFF') {
        logger.warn('Cannot complete booking without DROPPED_OFF status', {
          bookingId,
          currentStatus: booking.bookingStatus,
        });
        throw new Error('Booking must be in DROPPED_OFF status before completion');
      }

      // Increment chauffeur trip count if applicable
      if (booking.chauffeurId) {
        logger.debug('Incrementing chauffeur trip count', {
          bookingId,
          chauffeurId: booking.chauffeurId,
        });

        await Chauffeur.increment('totalTrips', {
          where: { id: booking.chauffeurId },
          transaction,
        });
        await Chauffeur.update(
          { status: 'AVAILABLE' },
          {
            where: { id: booking.chauffeurId },
            transaction,
          },
        );

        logger.info('Chauffeur trip count incremented and status updated', {
          chauffeurId: booking.chauffeurId,
        });
      }
    }

    await booking.update({ bookingStatus: newStatus }, { transaction });
    await transaction.commit();

    const duration = Date.now() - startTime;
    logger.info('Booking status updated successfully', {
      bookingId,
      previousStatus: booking.bookingStatus,
      newStatus,
      duration: `${duration}ms`,
    });

    return booking;
  } catch (error) {
    await transaction.rollback();
    logger.error('Failed to update booking status, transaction rolled back', {
      bookingId,
      newStatus,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

/**
 * Cancel booking with optional reason
 */
export const cancelBooking = async (bookingId: string, reason?: string): Promise<Booking> => {
  const startTime = Date.now();
  logger.info('Cancelling booking', { bookingId, reason });

  const transaction = await sequelize.transaction();

  try {
    const booking = await Booking.findByPk(bookingId, {
      transaction,
      lock: true,
    });

    if (!booking) {
      logger.error('Booking not found for cancellation', { bookingId });
      throw new Error('Booking not found');
    }

    if (booking.bookingStatus === 'COMPLETED' || booking.bookingStatus === 'CANCELLED') {
      logger.warn('Cannot cancel booking with current status', {
        bookingId,
        currentStatus: booking.bookingStatus,
      });
      throw new Error(`Cannot cancel booking with status ${booking.bookingStatus}`);
    }

    // Release chauffeur if assigned
    if (booking.chauffeurId) {
      logger.debug('Releasing chauffeur due to booking cancellation', {
        bookingId,
        chauffeurId: booking.chauffeurId,
      });

      await Chauffeur.update(
        { status: 'AVAILABLE' },
        {
          where: { id: booking.chauffeurId },
          transaction,
        },
      );

      logger.info('Chauffeur released', { chauffeurId: booking.chauffeurId });
    }

    await booking.update(
      {
        bookingStatus: 'CANCELLED',
        notes: reason ? `${booking.notes || ''}\nCancellation reason: ${reason}`.trim() : booking.notes,
      },
      { transaction },
    );

    await transaction.commit();

    const duration = Date.now() - startTime;
    logger.info('Booking cancelled successfully', {
      bookingId,
      reason,
      duration: `${duration}ms`,
    });

    return booking;
  } catch (error) {
    await transaction.rollback();
    logger.error('Failed to cancel booking, transaction rolled back', {
      bookingId,
      reason,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

/**
 * Get expired PENDING bookings
 */
export const getExpiredBookings = async (): Promise<Booking[]> => {
  return await Booking.findAll({
    where: {
      bookingStatus: 'PENDING',
      expiresAt: {
        [Op.lt]: new Date(),
      },
    },
    include: [
      {
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: Vehicle,
        attributes: ['id', 'make', 'model'],
      },
    ],
    order: [['expiresAt', 'ASC']],
  });
};

/**
 * Cleanup (soft delete) an expired booking
 */
export const cleanupExpiredBooking = async (bookingId: string): Promise<void> => {
  const startTime = Date.now();
  logger.info('Cleaning up expired booking', { bookingId });

  const transaction = await sequelize.transaction();

  try {
    const booking = await Booking.findByPk(bookingId, {
      transaction,
      lock: true,
    });

    if (!booking) {
      logger.error('Booking not found for cleanup', { bookingId });
      throw new Error('Booking not found');
    }

    if (booking.bookingStatus !== 'PENDING') {
      logger.warn('Can only cleanup PENDING bookings', {
        bookingId,
        currentStatus: booking.bookingStatus,
      });
      throw new Error('Can only cleanup PENDING bookings');
    }

    if (booking.expiresAt && new Date() <= new Date(booking.expiresAt)) {
      logger.warn('Booking has not expired yet', {
        bookingId,
        expiresAt: booking.expiresAt,
        now: new Date(),
      });
      throw new Error('Booking has not expired yet');
    }

    // Release chauffeur if assigned
    if (booking.chauffeurId) {
      logger.debug('Releasing chauffeur during expired booking cleanup', {
        bookingId,
        chauffeurId: booking.chauffeurId,
      });

      await Chauffeur.update(
        { status: 'AVAILABLE' },
        {
          where: { id: booking.chauffeurId },
          transaction,
        },
      );
    }

    // Mark as cancelled instead of hard delete (safer approach)
    await booking.update(
      {
        bookingStatus: 'CANCELLED',
        notes: `${booking.notes || ''}\nAuto-cancelled: Expired on ${booking.expiresAt}`.trim(),
      },
      { transaction },
    );

    await transaction.commit();

    const duration = Date.now() - startTime;
    logger.info('Expired booking cleaned up successfully', {
      bookingId,
      expiresAt: booking.expiresAt,
      duration: `${duration}ms`,
    });
  } catch (error) {
    await transaction.rollback();
    logger.error('Failed to cleanup expired booking, transaction rolled back', {
      bookingId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};
