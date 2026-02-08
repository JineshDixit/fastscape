import { CreateBookingData, UpdateBookingData } from '../../common/types/bookingTypes';
import { Booking, Vehicle, Chauffeur, sequelize } from '../../models';
import { Op } from 'sequelize';
import { createError } from '../middleware/errorHandler';
import { validateRequiredFields, normalizeBookingDates } from '../../utils/validation.utils';
import { buildDateConflictConditions, BOOKING_ATTRIBUTES, VEHICLE_LIST_ATTRIBUTES } from '../../utils/database.utils';
import { dbEnums } from '../../common/enum/dbEnums';
import Logger from '../../utils/logger';

// Chauffeur attributes for booking responses
const CHAUFFEUR_ATTRIBUTES = [
  'id',
  'fullName',
  'phone',
  'rating',
  'totalTrips',
  'experienceLevel',
  'languages',
];

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
        {
          model: Chauffeur,
          attributes: CHAUFFEUR_ATTRIBUTES,
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });
};

/**
 * Get upcoming bookings (next 30 days)
 */
export const getUpcomingBookings = async (userId: string): Promise<Booking[]> => {
  if (!userId) {
    throw createError('User ID is required', 400);
  }

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return await Booking.findAll({
    where: {
      userId,
      startDatetime: {
        [Op.gt]: now,
        [Op.lte]: thirtyDaysFromNow,
      },
      bookingStatus: {
        [Op.in]: [
          dbEnums.BOOKING_STATUS[0], // PENDING
          dbEnums.BOOKING_STATUS[1], // CONFIRMED
        ],
      },
    },
    attributes: BOOKING_ATTRIBUTES,
    include: [
      {
        model: Vehicle,
        attributes: VEHICLE_LIST_ATTRIBUTES,
      },
      {
        model: Chauffeur,
        attributes: CHAUFFEUR_ATTRIBUTES,
        required: false,
      },
    ],
    order: [['startDatetime', 'ASC']],
  });
};

/**
 * Get active bookings (currently ongoing)
 */
export const getActiveBookings = async (userId: string): Promise<Booking[]> => {
  if (!userId) {
    throw createError('User ID is required', 400);
  }

  const now = new Date();

  return await Booking.findAll({
    where: {
      userId,
      [Op.or]: [
        {
          // Currently picked up
          bookingStatus: dbEnums.BOOKING_STATUS[2], // PICKED_UP
        },
        {
          // Confirmed and within booking period
          bookingStatus: dbEnums.BOOKING_STATUS[1], // CONFIRMED
          startDatetime: { [Op.lte]: now },
          endDatetime: { [Op.gte]: now },
        },
      ],
    },
    attributes: BOOKING_ATTRIBUTES,
    include: [
      {
        model: Vehicle,
        attributes: VEHICLE_LIST_ATTRIBUTES,
      },
      {
        model: Chauffeur,
        attributes: CHAUFFEUR_ATTRIBUTES,
        required: false,
      },
    ],
    order: [['startDatetime', 'ASC']],
  });
};

/**
 * Get booking statistics for a user
 */
export const getBookingStats = async (userId: string): Promise<any> => {
  if (!userId) {
    throw createError('User ID is required', 400);
  }

  const bookings = await Booking.findAll({
    where: { userId },
    attributes: ['bookingStatus'],
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.bookingStatus === dbEnums.BOOKING_STATUS[0]).length,
    confirmed: bookings.filter((b) => b.bookingStatus === dbEnums.BOOKING_STATUS[1]).length,
    active: bookings.filter(
      (b) => b.bookingStatus === dbEnums.BOOKING_STATUS[2] || b.bookingStatus === dbEnums.BOOKING_STATUS[1]
    ).length,
    completed: bookings.filter((b) => b.bookingStatus === dbEnums.BOOKING_STATUS[5]).length,
    cancelled: bookings.filter((b) => b.bookingStatus === dbEnums.BOOKING_STATUS[4]).length,
    totalSpent: 0, // TODO: Calculate from payments
    averageRating: 0, // TODO: Calculate from reviews
  };

  return stats;
};

/**
 * Get booking history with optional filters
 */
export const getBookingHistory = async (
  userId: string,
  params?: {
    year?: number;
    month?: number;
    status?: string;
    vehicleType?: string;
  }
): Promise<Booking[]> => {
  if (!userId) {
    throw createError('User ID is required', 400);
  }

  const whereConditions: any = {
    userId,
    bookingStatus: {
      [Op.in]: [
        dbEnums.BOOKING_STATUS[3], // DROPPED_OFF
        dbEnums.BOOKING_STATUS[4], // CANCELLED
        dbEnums.BOOKING_STATUS[5], // COMPLETED
      ],
    },
  };

  // Filter by specific status if provided
  if (params?.status) {
    whereConditions.bookingStatus = params.status;
  }

  // Filter by year
  if (params?.year) {
    const startOfYear = new Date(params.year, 0, 1);
    const endOfYear = new Date(params.year, 11, 31, 23, 59, 59);
    whereConditions.startDatetime = {
      [Op.between]: [startOfYear, endOfYear],
    };
  }

  // Filter by month (requires year)
  if (params?.month && params?.year) {
    const startOfMonth = new Date(params.year, params.month - 1, 1);
    const endOfMonth = new Date(params.year, params.month, 0, 23, 59, 59);
    whereConditions.startDatetime = {
      [Op.between]: [startOfMonth, endOfMonth],
    };
  }

  const includeOptions: any = [
    {
      model: Vehicle,
      attributes: VEHICLE_LIST_ATTRIBUTES,
    },
  ];

  // Filter by vehicle type if provided
  if (params?.vehicleType) {
    includeOptions[0].where = { bodyType: params.vehicleType };
  }

  return await Booking.findAll({
    where: whereConditions,
    attributes: BOOKING_ATTRIBUTES,
    include: includeOptions.concat([
      {
        model: Chauffeur,
        attributes: CHAUFFEUR_ATTRIBUTES,
        required: false,
      },
    ]),
    order: [['startDatetime', 'DESC']],
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
      {
        model: Chauffeur,
        attributes: CHAUFFEUR_ATTRIBUTES,
        required: false,
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
