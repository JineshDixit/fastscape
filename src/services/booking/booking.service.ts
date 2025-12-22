import { CreateBookingData, UpdateBookingData } from '../../common/types/bookingTypes';
import { Booking, Vehicle, sequelize } from '../../models';
import { createError } from '../middleware/errorHandler';
import { validateRequiredFields, validateDateRange } from '../../utils/validation.utils';
import { buildDateConflictConditions, BOOKING_ATTRIBUTES, VEHICLE_LIST_ATTRIBUTES } from '../../utils/database.utils';

/**
 * Create a new booking
 */
export const createBooking = async (bookingData: CreateBookingData): Promise<Booking> => {
  const { userId, vehicleId, startDatetime, endDatetime, pickupLocation, dropoffLocation } = bookingData;

  // Validate required fields
  validateRequiredFields(bookingData, ['userId', 'vehicleId', 'startDatetime', 'endDatetime', 'pickupLocation', 'dropoffLocation']);

  // Validate dates
  const { start, end } = validateDateRange(startDatetime, endDatetime);

  // Check if vehicle exists and is available
  const vehicle = await Vehicle.findByPk(vehicleId);
  if (!vehicle) {
    throw createError('Vehicle not found', 404);
  }
  
  if (!vehicle.isAvailable) {
    throw createError('Vehicle is not available', 400);
  }

  // Use transaction to prevent race conditions
  const transaction = await sequelize.transaction();

  try {
    // Check for conflicting bookings within transaction
    const conflictingBooking = await Booking.findOne({
      where: {
        vehicleId,
        bookingStatus: ['PENDING', 'CONFIRMED'],
        ...buildDateConflictConditions(start, end)
      },
      transaction,
      lock: true // Add row-level locking
    });

    if (conflictingBooking) {
      await transaction.rollback();
      throw createError('Vehicle is already booked for the selected dates', 409);
    }

    // Create booking within transaction
    const booking = await Booking.create({
      userId,
      vehicleId,
      startDatetime: start,
      endDatetime: end,
      pickupLocation,
      dropoffLocation,
      bookingStatus: 'PENDING',
      paymentStatus: 'UNPAID',
    }, { transaction });

    await transaction.commit();
    return booking;
  } catch (error) {
    await transaction.rollback();
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

  const bookings = await Booking.findAll({
    where: { userId },
    attributes: BOOKING_ATTRIBUTES,
    include: [
      {
        model: Vehicle,
        attributes: VEHICLE_LIST_ATTRIBUTES
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  return bookings;
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
        attributes: [...VEHICLE_LIST_ATTRIBUTES, 'exteriorColor']
      }
    ]
  });

  if (!booking) {
    throw createError('Booking not found', 404);
  }

  return booking;
};

/**
 * Updates a booking by ID and user ID with the provided data
 */
export const updateBooking = async (bookingId: string, userId: string, updateData: UpdateBookingData): Promise<Booking> => {
  if (!bookingId || !userId) {
    throw createError('Booking ID and User ID are required', 400);
  }

  const booking = await Booking.findOne({
    where: { id: bookingId, userId }
  });

  if (!booking) {
    throw createError('Booking not found', 404);
  }

  // Check if booking can be updated
  if (booking.bookingStatus === 'CANCELLED' || booking.bookingStatus === 'COMPLETED') {
    throw createError('Cannot update cancelled or completed booking', 400);
  }

  // Validate dates if provided
  if (updateData.startDatetime || updateData.endDatetime) {
    const start = updateData.startDatetime ? new Date(updateData.startDatetime) : booking.startDatetime;
    const end = updateData.endDatetime ? new Date(updateData.endDatetime) : booking.endDatetime;
    
    validateDateRange(start, end);
  }

  // Update booking
  await booking.update(updateData);

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
    where: { id: bookingId, userId }
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
};