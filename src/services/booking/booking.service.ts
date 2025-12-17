import { CreateBookingData, UpdateBookingData } from '../../common/types/bookingTypes';
import { Booking, Vehicle } from '../../models';
import { createError } from '../middleware/errorHandler';

/**
 * Create a new booking
 * @param {CreateBookingData} bookingData - All required fields must be provided
 * @returns {Promise<Booking>} - Newly created booking
 * @throws {Error} - If required fields are missing, dates are invalid, vehicle is not available, or if there is a conflicting booking
 */
export const createBooking = async (bookingData: CreateBookingData): Promise<Booking> => {
  const { userId, vehicleId, startDatetime, endDatetime, pickupLocation, dropoffLocation } = bookingData;

  // Validate required fields
  if (!userId || !vehicleId || !startDatetime || !endDatetime || !pickupLocation || !dropoffLocation) {
    throw createError('All required fields must be provided', 400);
  }

  // Validate dates
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  
  if (start >= end) {
    throw createError('End date must be after start date', 400);
  }
  
  if (start < new Date()) {
    throw createError('Start date cannot be in the past', 400);
  }

  // Check if vehicle exists and is available
  const vehicle = await Vehicle.findByPk(vehicleId);
  if (!vehicle) {
    throw createError('Vehicle not found', 404);
  }
  
  if (!vehicle.isAvailable) {
    throw createError('Vehicle is not available', 400);
  }

  // Use transaction to prevent race conditions
  const { sequelize } = require('../../common/models');
  const transaction = await sequelize.transaction();

  try {
    // Check for conflicting bookings within transaction
    const conflictingBooking = await Booking.findOne({
      where: {
        vehicleId,
        bookingStatus: ['PENDING', 'CONFIRMED'],
        [require('sequelize').Op.or]: [
          {
            startDatetime: {
              [require('sequelize').Op.between]: [start, end]
            }
          },
          {
            endDatetime: {
              [require('sequelize').Op.between]: [start, end]
            }
          },
          {
            [require('sequelize').Op.and]: [
              { startDatetime: { [require('sequelize').Op.lte]: start } },
              { endDatetime: { [require('sequelize').Op.gte]: end } }
            ]
          }
        ]
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
 * @param {string} userId - User ID
 * @returns {Promise<Booking[]>} - Promise resolving to an array of booking objects
 * @throws {Error} - User ID is required
 */
export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  if (!userId) {
    throw createError('User ID is required', 400);
  }

  const bookings = await Booking.findAll({
    where: { userId },
    include: [
      {
        model: Vehicle,
        attributes: ['id', 'make', 'model', 'year', 'pricePerDay']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  return bookings;
};

/**
 * Retrieves a booking by ID and user ID
 * @param {string} bookingId - Booking ID
 * @param {string} userId - User ID
 * @returns {Promise<Booking>} - Promise resolving to a booking object
 * @throws {Error} - Booking ID and User ID are required
 * @throws {Error} - Booking not found
 */
export const getBookingById = async (bookingId: string, userId: string): Promise<Booking> => {
  if (!bookingId || !userId) {
    throw createError('Booking ID and User ID are required', 400);
  }

  const booking = await Booking.findOne({
    where: { id: bookingId, userId },
    include: [
      {
        model: Vehicle,
        attributes: ['id', 'make', 'model', 'year', 'pricePerDay', 'exteriorColor']
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
 * @param {string} bookingId - Booking ID
 * @param {string} userId - User ID
 * @param {UpdateBookingData} updateData - Data to update the booking with
 * @returns {Promise<Booking>} - Promise resolving to the updated booking object
 * @throws {Error} - Booking ID and User ID are required
 * @throws {Error} - Booking not found
 * @throws {Error} - Cannot update cancelled or completed booking
 * @throws {Error} - End date must be after start date
 * @throws {Error} - Start date cannot be in the past
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
    
    if (start >= end) {
      throw createError('End date must be after start date', 400);
    }
    
    if (start < new Date()) {
      throw createError('Start date cannot be in the past', 400);
    }
  }

  // Update booking
  await booking.update(updateData);

  return booking;
};

/**
 * Cancels a booking by ID and user ID
 * @param {string} bookingId - Booking ID
 * @param {string} userId - User ID
 * @returns {Promise<void>} - Promise resolving to void
 * @throws {Error} - Booking ID and User ID are required
 * @throws {Error} - Booking not found
 * @throws {Error} - Booking is already cancelled
 * @throws {Error} - Cannot cancel completed booking
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