import { CreateBookingData, UpdateBookingData } from '../../common/types/bookingTypes';
import { Booking, Vehicle, sequelize } from '../../models';
import { Op } from 'sequelize';
import { createError } from '../middleware/errorHandler';
import { validateRequiredFields, validateDateRange, normalizeBookingDates } from '../../utils/validation.utils';
import { buildDateConflictConditions, BOOKING_ATTRIBUTES, VEHICLE_LIST_ATTRIBUTES } from '../../utils/database.utils';
import Logger from '../../utils/logger';

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

    // Check for conflicting bookings within transaction
    const now = new Date();
    const conflictingBooking = await Booking.findOne({
      where: {
        vehicleId,
        [Op.and]: [
          buildDateConflictConditions(start, end),
          {
            [Op.or]: [
              { bookingStatus: 'CONFIRMED' },
              {
                bookingStatus: 'PENDING',
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
      Logger.warn('Booking conflict detected', { vehicleId, start, end });
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
        bookingStatus: 'PENDING',
        paymentStatus: 'UNPAID',
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
  if (booking.bookingStatus === 'CANCELLED' || booking.bookingStatus === 'COMPLETED') {
    throw createError('Cannot update cancelled or completed booking', 400);
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
  if (booking.bookingStatus === 'CANCELLED') {
    throw createError('Booking is already cancelled', 400);
  }

  if (booking.bookingStatus === 'COMPLETED') {
    throw createError('Cannot cancel completed booking', 400);
  }

  // Update booking status
  await booking.update({ bookingStatus: 'CANCELLED' });
  Logger.info('Booking cancelled', { bookingId, userId });
};
