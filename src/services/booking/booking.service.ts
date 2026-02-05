import { CreateBookingData, UpdateBookingData } from '../../common/types/bookingTypes';
import { Booking, Vehicle, sequelize } from '../../models';
import { Op } from 'sequelize';
import { createError } from '../middleware/errorHandler';
import { validateRequiredFields, normalizeBookingDates } from '../../utils/validation.utils';
import { buildDateConflictConditions, BOOKING_ATTRIBUTES, VEHICLE_LIST_ATTRIBUTES } from '../../utils/database.utils';
import { dbEnums } from '../../common/enum/dbEnums';
import Logger from '../../utils/logger';

// Booking status state machine using enum values
const BOOKING_STATUS_TRANSITIONS: Record<string, string[]> = {
  [dbEnums.BOOKING_STATUS[0]]: [dbEnums.BOOKING_STATUS[1], dbEnums.BOOKING_STATUS[4]], // PENDING -> [CONFIRMED, CANCELLED]
  [dbEnums.BOOKING_STATUS[1]]: [dbEnums.BOOKING_STATUS[2], dbEnums.BOOKING_STATUS[4]], // CONFIRMED -> [PICKED_UP, CANCELLED]
  [dbEnums.BOOKING_STATUS[2]]: [dbEnums.BOOKING_STATUS[3], dbEnums.BOOKING_STATUS[4]], // PICKED_UP -> [DROPPED_OFF, CANCELLED]
  [dbEnums.BOOKING_STATUS[3]]: [dbEnums.BOOKING_STATUS[5]], // DROPPED_OFF -> [COMPLETED]
  [dbEnums.BOOKING_STATUS[5]]: [], // COMPLETED -> [] (terminal state)
  [dbEnums.BOOKING_STATUS[4]]: [], // CANCELLED -> [] (terminal state)
};

/**
 * Validate booking status transition
 */
const validateStatusTransition = (currentStatus: string, newStatus: string): boolean => {
  const allowedTransitions = BOOKING_STATUS_TRANSITIONS[currentStatus];
  return allowedTransitions?.includes(newStatus) || false;
};

/**
 * Create a new booking
 */
export const createBooking = async (bookingData: CreateBookingData): Promise<Booking> => {
  const { userId, vehicleId, startDatetime, endDatetime, pickupLocation, dropoffLocation } = bookingData;

  // Validate required fields
  validateRequiredFields(bookingData, [
    'userId',
    'vehicleId',
    'startDatetime',
    'endDatetime',
    'pickupLocation',
    'dropoffLocation',
  ]);

  // Validate and normalize dates
  const { start, end } = normalizeBookingDates(startDatetime, endDatetime);

  // Use transaction to prevent race conditions
  const transaction = await sequelize.transaction();

  try {
    const now = new Date();
    
    // First, clean up expired bookings for this vehicle to prevent false conflicts
    await Booking.update(
      { bookingStatus: dbEnums.BOOKING_STATUS[4] }, // 'CANCELLED'
      {
        where: {
          vehicleId,
          bookingStatus: dbEnums.BOOKING_STATUS[0], // 'PENDING'
          expiresAt: { [Op.lt]: now },
        },
        transaction,
      }
    );

    // Check if vehicle exists and is available with a lock
    const vehicle = await Vehicle.findByPk(vehicleId, {
      transaction,
      lock: true,
    });

    if (!vehicle) {
      throw createError('Vehicle not found', 404);
    }

    if (!vehicle.isAvailable) {
      Logger.warn('Booking attempted on unavailable vehicle', { vehicleId, userId });
      throw createError('Vehicle is not available', 400);
    }

    // Check for conflicting bookings within transaction (after cleanup)
    const conflictingBooking = await Booking.findOne({
      where: {
        vehicleId,
        [Op.and]: [
          buildDateConflictConditions(start, end),
          {
            [Op.or]: [
              { bookingStatus: dbEnums.BOOKING_STATUS[1] }, // 'CONFIRMED'
              { bookingStatus: dbEnums.BOOKING_STATUS[2] }, // 'PICKED_UP'
              { bookingStatus: dbEnums.BOOKING_STATUS[3] }, // 'DROPPED_OFF'
              {
                bookingStatus: dbEnums.BOOKING_STATUS[0], // 'PENDING'
                [Op.or]: [{ expiresAt: { [Op.eq]: null } }, { expiresAt: { [Op.gt]: now } }],
              },
            ],
          },
        ],
      },
      transaction,
      lock: true, // Add row-level locking
    });

    if (conflictingBooking) {
      Logger.warn('Booking conflict detected', { vehicleId, start, end, conflictingBookingId: conflictingBooking.id });
      throw createError('Vehicle is already booked for the selected dates', 409);
    }

    // Set expiration to 10 minutes from now
    const expiresAt = new Date(now.getTime() + 10 * 60000);

    // Create booking within transaction
    const booking = await Booking.create(
      {
        userId,
        vehicleId,
        startDatetime: start,
        endDatetime: end,
        pickupLocation,
        dropoffLocation,
        bookingType: bookingData.bookingType || dbEnums.BOOKING_TYPE[0], // 'SELF_DRIVE'
        paymentMethod: bookingData.paymentMethod || dbEnums.PAYMENT_METHOD[2], // 'ONLINE'
        bookingStatus: dbEnums.BOOKING_STATUS[0], // 'PENDING'
        paymentStatus: dbEnums.PAYMENT_STATUS[0], // 'UNPAID'
        notes: bookingData.notes,
        expiresAt,
      },
      { transaction },
    );

    await transaction.commit();
    Logger.info('Booking created successfully', { bookingId: booking.id, userId, vehicleId });
    return booking;
  } catch (error) {
    await transaction.rollback();
    Logger.error('Booking transaction failed', { error });
    throw error;
  }
};

/**
 * Retrieves all bookings for a given user ID
 */
export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  if (!userId) {
    throw createError('User ID is required', 400);
  }

  return await Booking.findAll({
      where: { userId },
      attributes: BOOKING_ATTRIBUTES,
      include: [
        {
          model: Vehicle,
          attributes: VEHICLE_LIST_ATTRIBUTES,
        },
      ],
      order: [['createdAt', 'DESC']],
    });
};

/**
 * Retrieves a booking by ID and user ID
 */
export const getBookingById = async (bookingId: string, userId: string): Promise<Booking> => {
  if (!bookingId || !userId) {
    throw createError('Booking ID and User ID are required', 400);
  }

  const booking = await Booking.findOne({
    where: { id: bookingId, userId },
    attributes: BOOKING_ATTRIBUTES,
    include: [
      {
        model: Vehicle,
        attributes: [...VEHICLE_LIST_ATTRIBUTES, 'exteriorColor'],
      },
    ],
  });

  if (!booking) {
    throw createError('Booking not found', 404);
  }

  return booking;
};

/**
 * Updates a booking by ID and user ID with the provided data
 */
export const updateBooking = async (
  bookingId: string,
  userId: string,
  updateData: UpdateBookingData,
): Promise<Booking> => {
  if (!bookingId || !userId) {
    throw createError('Booking ID and User ID are required', 400);
  }

  const booking = await Booking.findOne({
    where: { id: bookingId, userId },
  });

  if (!booking) {
    throw createError('Booking not found', 404);
  }

  // Check if booking can be updated
  if (booking.bookingStatus === dbEnums.BOOKING_STATUS[4] || booking.bookingStatus === dbEnums.BOOKING_STATUS[5]) { // 'CANCELLED' or 'COMPLETED'
    throw createError('Cannot update cancelled or completed booking', 400);
  }

  // Validate status transition if bookingStatus is being updated
  if (updateData.bookingStatus && updateData.bookingStatus !== booking.bookingStatus) {
    if (!validateStatusTransition(booking.bookingStatus, updateData.bookingStatus)) {
      throw createError(
        `Invalid status transition from ${booking.bookingStatus} to ${updateData.bookingStatus}`,
        400
      );
    }
  }

  // Validate and normalize dates if provided
  if (updateData.startDatetime || updateData.endDatetime) {
    const { start, end } = normalizeBookingDates(
      updateData.startDatetime || booking.startDatetime,
      updateData.endDatetime || booking.endDatetime,
    );

    updateData.startDatetime = start as any;
    updateData.endDatetime = end as any;
  }

  // Update booking
  await booking.update(updateData);

  Logger.info('Booking updated', { bookingId, updates: Object.keys(updateData) });
  return booking;
};

/**
 * Cancels a booking by ID and user ID
 */
export const cancelBooking = async (bookingId: string, userId: string): Promise<void> => {
  if (!bookingId || !userId) {
    throw createError('Booking ID and User ID are required', 400);
  }

  const booking = await Booking.findOne({
    where: { id: bookingId, userId },
  });

  if (!booking) {
    throw createError('Booking not found', 404);
  }

  // Check if booking can be cancelled
  if (booking.bookingStatus === dbEnums.BOOKING_STATUS[4]) { // 'CANCELLED'
    throw createError('Booking is already cancelled', 400);
  }

  if (booking.bookingStatus === dbEnums.BOOKING_STATUS[5]) { // 'COMPLETED'
    throw createError('Cannot cancel completed booking', 400);
  }

  // Update booking status
  await booking.update({ bookingStatus: dbEnums.BOOKING_STATUS[4] }); // 'CANCELLED'
  Logger.info('Booking cancelled', { bookingId, userId });
};
