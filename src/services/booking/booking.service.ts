import {
  CreateBookingData,
  UpdateBookingData,
  BookingConfirmationData,
  BookingAvailabilityCheck,
} from '../../common/types/bookingTypes';
import { Booking, Vehicle, User, Chauffeur, BookingFinancial, Address, sequelize } from '../../models';
import { createError } from '../middleware/errorHandler';
import { validateRequiredFields, validateDateRange } from '../../utils/validation.utils';
import { buildDateConflictConditions, BOOKING_ATTRIBUTES, VEHICLE_LIST_ATTRIBUTES } from '../../utils/database.utils';
import { calculatePaymentBreakdown, calculatePaymentBreakdownInternal } from '../payment/enhancedPayment.service';
import { autoAssignChauffeur } from '../chauffeur/chauffeur.service';
import {
  checkDocumentCompleteness,
  validateDocumentForBooking,
  shouldSkipDocumentStep,
  checkBookingEligibility
} from '../user/user.service';
import Logger from '../../utils/logger';
import { Op } from 'sequelize';

// Enhanced booking interfaces for address integration
export interface EnhancedBookingData extends CreateBookingData {
  pickupAddressId?: string;
  dropoffAddressId?: string;
  useNewPickupAddress?: boolean;
  useNewDropoffAddress?: boolean;
  newPickupAddress?: CreateAddressData;
  newDropoffAddress?: CreateAddressData;
  saveNewAddresses?: boolean;
}

export interface CreateAddressData {
  type: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface BookingFlowStep {
  step: number;
  name: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  skippable: boolean;
  estimatedTime: number; // minutes
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  missingRequirements: string[];
}

export interface BookingAddressOption {
  id: string;
  type: string;
  displayName: string;
  fullAddress: string;
  isDefault: boolean;
}

/**
 * Check vehicle availability for specific date range
 */
export const checkVehicleAvailability = async (
  vehicleId: string,
  startDatetime: Date,
  endDatetime: Date,
  excludeBookingId?: string,
): Promise<BookingAvailabilityCheck> => {
  // Validate dates
  const { start, end } = validateDateRange(startDatetime, endDatetime);

  // Check if vehicle exists
  const vehicle = await Vehicle.findByPk(vehicleId);
  if (!vehicle) {
    throw createError('Vehicle not found', 404);
  }

  // Build conflict conditions
  const whereConditions: any = {
    vehicleId,
    bookingStatus: ['PENDING', 'CONFIRMED', 'PICKED_UP'],
    ...buildDateConflictConditions(start, end),
  };

  // Exclude specific booking if provided (for updates)
  if (excludeBookingId) {
    whereConditions.id = { [Op.ne]: excludeBookingId };
  }

  // Check for conflicting bookings
  const conflictingBookings = await Booking.findAll({
    where: whereConditions,
    attributes: ['id', 'startDatetime', 'endDatetime', 'bookingStatus'],
  });

  const isAvailable = vehicle.isAvailable && conflictingBookings.length === 0;

  return {
    isAvailable,
    vehicle: {
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      isAvailable: vehicle.isAvailable,
    },
    conflictingBookings: conflictingBookings.map((booking) => ({
      id: booking.id,
      startDatetime: booking.startDatetime,
      endDatetime: booking.endDatetime,
      status: booking.bookingStatus,
    })),
    requestedPeriod: {
      start,
      end,
      durationHours: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)),
      durationDays: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1,
    },
  };
};

/**
 * Get a temporal and financial quote for a potential booking
 */
export const getBookingQuote = async (bookingData: CreateBookingData) => {
  const { vehicleId, startDatetime, endDatetime } = bookingData;

  // Validate dates
  const { start, end } = validateDateRange(startDatetime, endDatetime);

  // Check vehicle availability
  const availability = await checkVehicleAvailability(vehicleId, start, end);

  if (!availability.isAvailable) {
    return { availability, calculation: null };
  }

  // Get vehicle details for calculation
  const vehicle = await Vehicle.findByPk(vehicleId);
  if (!vehicle) {
    throw createError('Vehicle not found', 404);
  }

  const rentalDays = availability.requestedPeriod.durationDays;

  // Calculate breakdown without persistence
  const calculation = calculatePaymentBreakdownInternal(
    rentalDays,
    Number(vehicle.pricePerDay),
    Number(vehicle.depositPercentage),
    Number(vehicle.delayChargePerHour),
    0, // No delay for initial quote
    vehicle.currency
  );

  return {
    availability,
    calculation
  };
};
/**
 * Create a new booking with comprehensive validation and setup
 */
export const createBooking = async (bookingData: CreateBookingData): Promise<Booking> => {
  const {
    userId,
    vehicleId,
    startDatetime,
    endDatetime,
    pickupLocation,
    dropoffLocation,
    bookingType = 'SELF_DRIVE',
    paymentMethod = 'ONLINE',
    paymentIntentId,
    chauffeurInstructions,
    notes,
  } = bookingData;

  // Validate required fields
  validateRequiredFields(bookingData, [
    'userId',
    'vehicleId',
    'startDatetime',
    'endDatetime',
    'pickupLocation',
    'dropoffLocation',
  ]);

  // Validate dates
  const { start, end } = validateDateRange(startDatetime, endDatetime);

  // Check if user exists and is not blocked
  const user = await User.findByPk(userId);
  if (!user) {
    throw createError('User not found', 404);
  }

  if (user.isBlocked) {
    Logger.warn('Booking attempted by blocked user', { userId });
    throw createError('Account is blocked. Please contact support.', 403);
  }

  // Check vehicle availability
  const availabilityCheck = await checkVehicleAvailability(vehicleId, start, end);

  if (!availabilityCheck.isAvailable) {
    Logger.warn('Booking attempted on unavailable vehicle', {
      vehicleId,
      userId,
      conflicts: availabilityCheck.conflictingBookings.length,
    });

    if (availabilityCheck.conflictingBookings.length > 0) {
      throw createError('Vehicle is already booked for the selected dates', 409);
    } else {
      throw createError('Vehicle is not available', 400);
    }
  }

  // Calculate rental duration
  const rentalDays = availabilityCheck.requestedPeriod.durationDays;
  const rentalHours = availabilityCheck.requestedPeriod.durationHours;

  // Use transaction to prevent race conditions
  const transaction = await sequelize.transaction();

  try {
    // Double-check availability within transaction with row locking
    const finalAvailabilityCheck = await Booking.findOne({
      where: {
        vehicleId,
        bookingStatus: ['PENDING', 'CONFIRMED', 'PICKED_UP'],
        ...buildDateConflictConditions(start, end),
      },
      transaction,
      lock: true,
    });

    if (finalAvailabilityCheck) {
      await transaction.rollback();
      Logger.warn('Race condition detected during booking creation', { vehicleId, userId });
      throw createError('Vehicle was just booked by another user. Please try again.', 409);
    }

    // Create booking within transaction
    const booking = await Booking.create(
      {
        userId,
        vehicleId,
        startDatetime: start,
        endDatetime: end,
        pickupLocation,
        dropoffLocation,
        bookingType,
        paymentMethod,
        bookingStatus: paymentMethod === 'ONLINE' && paymentIntentId ? 'CONFIRMED' : 'PENDING',
        paymentStatus: paymentMethod === 'ONLINE' && paymentIntentId ? 'PARTIALLY_PAID' : 'UNPAID',
        chauffeurInstructions: chauffeurInstructions || null,
        notes: notes || null,
        delayChargeApplied: false,
        delayHours: 0,
      },
      { transaction },
    );

    // Calculate payment breakdown and create financial record
    const paymentCalculation = await calculatePaymentBreakdown(booking.id, 0, transaction);

    await BookingFinancial.create(
      {
        bookingId: booking.id,
        baseAmount: paymentCalculation.baseAmount,
        depositAmount: paymentCalculation.depositAmount,
        balanceAmount: paymentCalculation.balanceAmount,
        delayChargeAmount: paymentCalculation.delayChargeAmount,
        delayChargeRate: paymentCalculation.delayChargeRate,
        taxAmount: paymentCalculation.taxAmount,
        totalAmount: paymentCalculation.totalAmount,
        paidAmount: paymentIntentId ? paymentCalculation.depositAmount : 0,
        remainingAmount: paymentIntentId ? paymentCalculation.totalAmount - paymentCalculation.depositAmount : paymentCalculation.totalAmount,
        currency: paymentCalculation.currency,
        depositPercentage: (paymentCalculation.depositAmount / paymentCalculation.baseAmount) * 100,
      },
      { transaction },
    );

    // If payment was made, create a Payment record
    if (paymentIntentId) {
      const { Payment } = require('../../models');
      await Payment.create({
        bookingId: booking.id,
        userId,
        amount: paymentCalculation.depositAmount,
        currency: paymentCalculation.currency,
        paymentType: 'DEPOSIT',
        paymentStatus: 'PAID',
        paymentMethod,
        stripePaymentIntentId: paymentIntentId,
        paidAt: new Date(),
      }, { transaction });
    }

    // Auto-assign chauffeur if booking type is CHAUFFEUR
    if (bookingType === 'CHAUFFEUR') {
      try {
        const chauffeurAssignment = await autoAssignChauffeur(booking.id);
        if (chauffeurAssignment) {
          await booking.update({ chauffeurId: chauffeurAssignment.chauffeur.id }, { transaction });
          Logger.info('Chauffeur auto-assigned to booking', {
            bookingId: booking.id,
            chauffeurId: chauffeurAssignment.chauffeur.id,
          });
        } else {
          Logger.warn('No chauffeur available for auto-assignment', {
            bookingId: booking.id,
          });
        }
      } catch (chauffeurError) {
        Logger.error('Error during chauffeur auto-assignment', {
          bookingId: booking.id,
          error: chauffeurError,
        });
        // Don't fail the booking if chauffeur assignment fails
      }
    }

    await transaction.commit();

    Logger.info('Booking created successfully', {
      bookingId: booking.id,
      userId,
      vehicleId,
      bookingType,
      rentalDays,
      rentalHours,
      totalAmount: paymentCalculation.totalAmount,
    });

    return booking;
  } catch (error) {
    await transaction.rollback();
    Logger.error('Booking transaction failed', { error, userId, vehicleId });
    throw error;
  }
};

/**
 * Confirm a booking (usually after deposit payment)
 */
export const confirmBooking = async (
  bookingId: string,
  confirmationData: BookingConfirmationData,
): Promise<Booking> => {
  const { userId, paymentIntentId, actualPickupDatetime } = confirmationData;

  const booking = await Booking.findOne({
    where: { id: bookingId, userId },
    include: [
      {
        model: Vehicle,
        attributes: VEHICLE_LIST_ATTRIBUTES,
      },
      {
        model: BookingFinancial,
      },
    ],
  });

  if (!booking) {
    throw createError('Booking not found', 404);
  }

  if (booking.bookingStatus !== 'PENDING') {
    throw createError('Only pending bookings can be confirmed', 400);
  }

  // Update booking status
  const updateData: any = {
    bookingStatus: 'CONFIRMED',
  };

  if (actualPickupDatetime) {
    updateData.actualPickupDatetime = new Date(actualPickupDatetime);
  }

  await booking.update(updateData);

  Logger.info('Booking confirmed successfully', {
    bookingId,
    userId,
    paymentIntentId: paymentIntentId || 'N/A',
  });

  return booking;
};

/**
 * Start booking (vehicle pickup)
 */
export const startBooking = async (bookingId: string, userId: string): Promise<Booking> => {
  const booking = await Booking.findOne({
    where: { id: bookingId, userId },
  });

  if (!booking) {
    throw createError('Booking not found', 404);
  }

  if (booking.bookingStatus !== 'CONFIRMED') {
    throw createError('Only confirmed bookings can be started', 400);
  }

  // Check if pickup time is appropriate (not too early)
  const now = new Date();
  const pickupTime = new Date(booking.startDatetime);
  const timeDiff = pickupTime.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  if (hoursDiff > 24) {
    throw createError('Vehicle pickup is not available more than 24 hours before scheduled time', 400);
  }

  await booking.update({
    bookingStatus: 'PICKED_UP',
    actualPickupDatetime: now,
  });

  Logger.info('Booking started (vehicle picked up)', { bookingId, userId });
  return booking;
};

/**
 * Complete booking (vehicle dropoff)
 */
export const completeBooking = async (
  bookingId: string,
  userId: string,
  actualDropoffDatetime?: Date,
): Promise<Booking> => {
  const booking = await Booking.findOne({
    where: { id: bookingId, userId },
    include: [
      {
        model: Vehicle,
        attributes: ['delayChargePerHour'],
      },
    ],
  });

  if (!booking) {
    throw createError('Booking not found', 404);
  }

  if (booking.bookingStatus !== 'PICKED_UP') {
    throw createError('Only picked up bookings can be completed', 400);
  }

  const dropoffTime = actualDropoffDatetime || new Date();
  const scheduledDropoff = new Date(booking.endDatetime);

  // Calculate delay charges if applicable
  let delayHours = 0;
  let delayChargeApplied = false;

  if (dropoffTime > scheduledDropoff) {
    delayHours = Math.ceil((dropoffTime.getTime() - scheduledDropoff.getTime()) / (1000 * 60 * 60));
    delayChargeApplied = delayHours > 0;
  }

  await booking.update({
    bookingStatus: 'COMPLETED',
    actualDropoffDatetime: dropoffTime,
    delayHours,
    delayChargeApplied,
  });

  // If there are delay charges, update payment status
  if (delayChargeApplied) {
    await booking.update({ paymentStatus: 'PARTIALLY_PAID' });
    Logger.info('Delay charges applied to booking', {
      bookingId,
      delayHours,
      userId,
    });
  }

  Logger.info('Booking completed successfully', {
    bookingId,
    userId,
    delayHours,
    onTime: !delayChargeApplied,
  });

  return booking;
};
/**
 * Retrieves all bookings for a given user ID with enhanced filtering
 */
export const getUserBookings = async (
  userId: string,
  filters: {
    status?: string;
    startDate?: string;
    endDate?: string;
    vehicleType?: string;
    page?: number;
    limit?: number;
  } = {},
): Promise<{
  bookings: Booking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  if (!userId) {
    throw createError('User ID is required', 400);
  }

  const { status, startDate, endDate, vehicleType, page = 1, limit = 10 } = filters;
  const offset = (page - 1) * limit;

  // Build where conditions
  const whereConditions: any = { userId };

  if (status) {
    whereConditions.bookingStatus = status;
  }

  if (startDate || endDate) {
    whereConditions.startDatetime = {};
    if (startDate) {
      whereConditions.startDatetime[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      whereConditions.startDatetime[Op.lte] = new Date(endDate);
    }
  }

  // Build vehicle include conditions
  const vehicleInclude: any = {
    model: Vehicle,
    attributes: [...VEHICLE_LIST_ATTRIBUTES, 'bodyType', 'city'],
  };

  if (vehicleType) {
    vehicleInclude.where = { bodyType: vehicleType };
  }

  const { count, rows } = await Booking.findAndCountAll({
    where: whereConditions,
    attributes: BOOKING_ATTRIBUTES,
    include: [
      vehicleInclude,
      {
        model: Chauffeur,
        attributes: ['id', 'fullName', 'phone', 'rating'],
        required: false,
      },
      {
        model: BookingFinancial,
        attributes: ['baseAmount', 'depositAmount', 'totalAmount', 'currency'],
        required: false,
      },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    bookings: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  };
};

/**
 * Retrieves a booking by ID and user ID with complete details
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
        attributes: [...VEHICLE_LIST_ATTRIBUTES, 'exteriorColor', 'interiorColor', 'city', 'address'],
        include: [
          {
            model: require('../../models').VehicleMedia,
            as: 'media',
            attributes: ['id', 'mediaType', 'mediaUrl', 'isPrimary'],
          },
        ],
      },
      {
        model: Chauffeur,
        attributes: ['id', 'fullName', 'phone', 'rating', 'experienceLevel', 'languages'],
        required: false,
      },
      {
        model: BookingFinancial,
        attributes: [
          'baseAmount',
          'depositAmount',
          'balanceAmount',
          'taxAmount',
          'totalAmount',
          'currency',
          'depositPercentage',
        ],
        required: false,
      },
      {
        model: User,
        attributes: ['id', 'fullName', 'email', 'phone'],
      },
    ],
  });

  if (!booking) {
    throw createError('Booking not found', 404);
  }

  return booking;
};

/**
 * Updates a booking by ID and user ID with comprehensive validation
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
    include: [
      {
        model: Vehicle,
        attributes: ['id', 'isAvailable'],
      },
    ],
  });

  if (!booking) {
    throw createError('Booking not found', 404);
  }

  // Check if booking can be updated
  if (booking.bookingStatus === 'CANCELLED' || booking.bookingStatus === 'COMPLETED') {
    throw createError('Cannot update cancelled or completed booking', 400);
  }

  // If booking is confirmed or picked up, only allow limited updates
  if (booking.bookingStatus === 'CONFIRMED' || booking.bookingStatus === 'PICKED_UP') {
    const allowedFields = ['notes', 'chauffeurInstructions', 'actualPickupDatetime', 'actualDropoffDatetime'];
    const updateFields = Object.keys(updateData);
    const hasRestrictedFields = updateFields.some((field) => !allowedFields.includes(field));

    if (hasRestrictedFields) {
      throw createError(
        'Only notes, chauffeur instructions, and actual pickup/dropoff times can be updated for confirmed bookings',
        400,
      );
    }
  }

  // Validate dates if provided
  if (updateData.startDatetime || updateData.endDatetime) {
    const start = updateData.startDatetime ? new Date(updateData.startDatetime) : booking.startDatetime;
    const end = updateData.endDatetime ? new Date(updateData.endDatetime) : booking.endDatetime;

    validateDateRange(start, end);

    // Check availability for new dates
    const availabilityCheck = await checkVehicleAvailability(
      booking.vehicleId,
      start,
      end,
      bookingId, // Exclude current booking from conflict check
    );

    if (!availabilityCheck.isAvailable) {
      throw createError('Vehicle is not available for the new dates', 409);
    }

    // Recalculate payment if dates changed
    if (updateData.startDatetime || updateData.endDatetime) {
      try {
        const newPaymentCalculation = await calculatePaymentBreakdown(bookingId);

        // Update financial record
        await BookingFinancial.update(
          {
            baseAmount: newPaymentCalculation.baseAmount,
            depositAmount: newPaymentCalculation.depositAmount,
            balanceAmount: newPaymentCalculation.balanceAmount,
            taxAmount: newPaymentCalculation.taxAmount,
            totalAmount: newPaymentCalculation.totalAmount,
          },
          {
            where: { bookingId },
          },
        );

        Logger.info('Payment recalculated due to date change', {
          bookingId,
          newTotal: newPaymentCalculation.totalAmount,
        });
      } catch (paymentError) {
        Logger.error('Error recalculating payment for booking update', {
          bookingId,
          error: paymentError,
        });
      }
    }
  }

  // Update booking
  await booking.update(updateData);

  Logger.info('Booking updated', {
    bookingId,
    userId,
    updates: Object.keys(updateData),
  });

  return booking;
};

/**
 * Cancels a booking by ID and user ID with refund processing
 */
export const cancelBooking = async (
  bookingId: string,
  userId: string,
  cancellationReason?: string,
): Promise<{ booking: Booking; refundAmount: number; refundPolicy: string }> => {
  if (!bookingId || !userId) {
    throw createError('Booking ID and User ID are required', 400);
  }

  const booking = await Booking.findOne({
    where: { id: bookingId, userId },
    include: [
      {
        model: BookingFinancial,
        attributes: ['depositAmount', 'totalAmount', 'currency'],
      },
    ],
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

  if (booking.bookingStatus === 'PICKED_UP') {
    throw createError('Cannot cancel booking after vehicle pickup. Please contact support.', 400);
  }

  // Calculate refund based on cancellation policy
  const now = new Date();
  const bookingStart = new Date(booking.startDatetime);
  const hoursUntilBooking = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60);

  let refundPercentage = 0;
  let refundPolicy = '';

  if (hoursUntilBooking >= 48) {
    refundPercentage = 100;
    refundPolicy = 'Full refund (48+ hours notice)';
  } else if (hoursUntilBooking >= 24) {
    refundPercentage = 75;
    refundPolicy = '75% refund (24-48 hours notice)';
  } else if (hoursUntilBooking >= 12) {
    refundPercentage = 50;
    refundPolicy = '50% refund (12-24 hours notice)';
  } else if (hoursUntilBooking >= 2) {
    refundPercentage = 25;
    refundPolicy = '25% refund (2-12 hours notice)';
  } else {
    refundPercentage = 0;
    refundPolicy = 'No refund (less than 2 hours notice)';
  }

  const financial = (booking as any).BookingFinancial;
  const refundAmount = financial ? (financial.depositAmount * refundPercentage) / 100 : 0;

  // Update booking status
  await booking.update({
    bookingStatus: 'CANCELLED',
    notes: cancellationReason ? `Cancelled: ${cancellationReason}` : 'Cancelled by user',
  });

  // Update payment status if refund is due
  if (refundAmount > 0) {
    await booking.update({ paymentStatus: 'REFUNDED' });
  }

  Logger.info('Booking cancelled', {
    bookingId,
    userId,
    refundAmount,
    refundPercentage,
    hoursUntilBooking: Math.round(hoursUntilBooking * 100) / 100,
    reason: cancellationReason || 'No reason provided',
  });

  return {
    booking,
    refundAmount,
    refundPolicy,
  };
};

/**
 * Get booking statistics for a user
 */
export const getUserBookingStats = async (
  userId: string,
): Promise<{
  total: number;
  pending: number;
  confirmed: number;
  active: number;
  completed: number;
  cancelled: number;
  totalSpent: number;
  averageRating: number;
}> => {
  const bookings = await Booking.findAll({
    where: { userId },
    include: [
      {
        model: BookingFinancial,
        attributes: ['totalAmount'],
        required: false,
      },
    ],
  });

  const stats = {
    total: bookings.length,
    pending: 0,
    confirmed: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    totalSpent: 0,
    averageRating: 0,
  };

  bookings.forEach((booking) => {
    switch (booking.bookingStatus) {
      case 'PENDING':
        stats.pending++;
        break;
      case 'CONFIRMED':
        stats.confirmed++;
        break;
      case 'PICKED_UP':
        stats.active++;
        break;
      case 'COMPLETED':
        stats.completed++;
        break;
      case 'CANCELLED':
        stats.cancelled++;
        break;
    }

    const financial = (booking as any).BookingFinancial;
    if (financial && booking.bookingStatus === 'COMPLETED') {
      stats.totalSpent += parseFloat(financial.totalAmount);
    }
  });

  return stats;
};

/**
 * Get upcoming bookings for a user
 */
export const getUpcomingBookings = async (userId: string): Promise<Booking[]> => {
  const now = new Date();

  return await Booking.findAll({
    where: {
      userId,
      bookingStatus: ['CONFIRMED', 'PICKED_UP'],
      startDatetime: { [Op.gte]: now },
    },
    include: [
      {
        model: Vehicle,
        attributes: VEHICLE_LIST_ATTRIBUTES,
      },
      {
        model: Chauffeur,
        attributes: ['id', 'fullName', 'phone'],
        required: false,
      },
    ],
    order: [['startDatetime', 'ASC']],
    limit: 5,
  });
};

/**
 * Get active bookings for a user
 */
export const getActiveBookings = async (userId: string): Promise<Booking[]> => {
  return await Booking.findAll({
    where: {
      userId,
      bookingStatus: 'PICKED_UP',
    },
    include: [
      {
        model: Vehicle,
        attributes: VEHICLE_LIST_ATTRIBUTES,
      },
      {
        model: Chauffeur,
        attributes: ['id', 'fullName', 'phone'],
        required: false,
      },
    ],
    order: [['actualPickupDatetime', 'DESC']],
  });
};

/**
 * Extend booking duration
 */
export const extendBooking = async (
  bookingId: string,
  userId: string,
  newEndDatetime: Date,
): Promise<{ booking: Booking; additionalCost: number }> => {
  const booking = await Booking.findOne({
    where: { id: bookingId, userId },
    include: [
      {
        model: Vehicle,
        attributes: ['id', 'pricePerDay'],
      },
    ],
  });

  if (!booking) {
    throw createError('Booking not found', 404);
  }

  if (booking.bookingStatus !== 'PICKED_UP') {
    throw createError('Only active bookings can be extended', 400);
  }

  const currentEndDate = new Date(booking.endDatetime);
  const requestedEndDate = new Date(newEndDatetime);

  if (requestedEndDate <= currentEndDate) {
    throw createError('New end date must be after current end date', 400);
  }

  // Check availability for extended period
  const availabilityCheck = await checkVehicleAvailability(
    booking.vehicleId,
    currentEndDate,
    requestedEndDate,
    bookingId,
  );

  if (!availabilityCheck.isAvailable) {
    throw createError('Vehicle is not available for the extended period', 409);
  }

  // Calculate additional cost
  const vehicle = (booking as any).Vehicle;
  const additionalDays = Math.ceil((requestedEndDate.getTime() - currentEndDate.getTime()) / (1000 * 60 * 60 * 24));
  const additionalCost = additionalDays * vehicle.pricePerDay;

  // Update booking
  await booking.update({
    endDatetime: requestedEndDate,
    paymentStatus: 'PARTIALLY_PAID', // Will need to pay for extension
  });

  Logger.info('Booking extended', {
    bookingId,
    userId,
    originalEndDate: currentEndDate,
    newEndDate: requestedEndDate,
    additionalDays,
    additionalCost,
  });

  return {
    booking,
    additionalCost,
  };
};

/**
 * Get booking history with filters
 */
export const getBookingHistory = async (
  userId: string,
  filters: {
    year?: number;
    month?: number;
    status?: string;
    vehicleType?: string;
  } = {},
): Promise<Booking[]> => {
  const whereConditions: any = { userId };

  if (filters.status) {
    whereConditions.bookingStatus = filters.status;
  }

  if (filters.year || filters.month) {
    const startDate = new Date(filters.year || new Date().getFullYear(), (filters.month || 1) - 1, 1);
    const endDate = new Date(filters.year || new Date().getFullYear(), filters.month || 12, 0);

    whereConditions.startDatetime = {
      [Op.between]: [startDate, endDate],
    };
  }

  const vehicleInclude: any = {
    model: Vehicle,
    attributes: [...VEHICLE_LIST_ATTRIBUTES, 'bodyType'],
  };

  if (filters.vehicleType) {
    vehicleInclude.where = { bodyType: filters.vehicleType };
  }

  return await Booking.findAll({
    where: whereConditions,
    include: [
      vehicleInclude,
      {
        model: BookingFinancial,
        attributes: ['totalAmount', 'currency'],
        required: false,
      },
    ],
    order: [['startDatetime', 'DESC']],
  });
};

/**
 * Enhanced Booking Service Methods for Address Integration
 * Requirements: 2.1, 2.2, 2.4, 6.1, 6.2, 6.3
 */

/**
 * Create booking with address integration support
 * Supports both saved addresses and new address creation
 * Requirements: 2.1, 2.2, 2.4
 */
export const createBookingWithAddresses = async (bookingData: EnhancedBookingData): Promise<Booking> => {
  const {
    userId,
    vehicleId,
    startDatetime,
    endDatetime,
    pickupAddressId,
    dropoffAddressId,
    useNewPickupAddress,
    useNewDropoffAddress,
    newPickupAddress,
    newDropoffAddress,
    saveNewAddresses,
    bookingType = 'SELF_DRIVE',
    paymentMethod = 'ONLINE',
    paymentIntentId,
    chauffeurInstructions,
    notes,
  } = bookingData;

  Logger.info('Creating booking with address integration', {
    userId,
    vehicleId,
    pickupAddressId,
    dropoffAddressId,
    useNewPickupAddress,
    useNewDropoffAddress,
  });

  // Validate required fields
  validateRequiredFields(bookingData, [
    'userId',
    'vehicleId',
    'startDatetime',
    'endDatetime',
  ]);

  // Validate dates
  const { start, end } = validateDateRange(startDatetime, endDatetime);

  // Check if user exists and is not blocked
  const user = await User.findByPk(userId);
  if (!user) {
    throw createError('User not found', 404);
  }

  if (user.isBlocked) {
    Logger.warn('Booking attempted by blocked user', { userId });
    throw createError('Account is blocked. Please contact support.', 403);
  }

  // Validate addresses and get location strings
  const { pickupLocation, dropoffLocation } = await validateBookingAddresses(
    pickupAddressId,
    dropoffAddressId,
    userId,
    useNewPickupAddress ? newPickupAddress : undefined,
    useNewDropoffAddress ? newDropoffAddress : undefined
  );

  // Check vehicle availability
  const availabilityCheck = await checkVehicleAvailability(vehicleId, start, end);

  if (!availabilityCheck.isAvailable) {
    Logger.warn('Booking attempted on unavailable vehicle', {
      vehicleId,
      userId,
      conflicts: availabilityCheck.conflictingBookings.length,
    });

    if (availabilityCheck.conflictingBookings.length > 0) {
      throw createError('Vehicle is already booked for the selected dates', 409);
    } else {
      throw createError('Vehicle is not available', 400);
    }
  }

  // Use transaction for atomic operations
  const transaction = await sequelize.transaction();

  try {
    // Double-check availability within transaction with row locking
    const finalAvailabilityCheck = await Booking.findOne({
      where: {
        vehicleId,
        bookingStatus: ['PENDING', 'CONFIRMED', 'PICKED_UP'],
        ...buildDateConflictConditions(start, end),
      },
      transaction,
      lock: true,
    });

    if (finalAvailabilityCheck) {
      await transaction.rollback();
      Logger.warn('Race condition detected during booking creation', { vehicleId, userId });
      throw createError('Vehicle was just booked by another user. Please try again.', 409);
    }

    // Save new addresses if requested
    if (saveNewAddresses) {
      if (useNewPickupAddress && newPickupAddress && !pickupAddressId) {
        const savedPickupAddress = await Address.create(
          { ...newPickupAddress, userId },
          { transaction }
        );
        Logger.info('New pickup address saved', { userId, addressId: savedPickupAddress.id });
      }

      if (useNewDropoffAddress && newDropoffAddress && !dropoffAddressId) {
        const savedDropoffAddress = await Address.create(
          { ...newDropoffAddress, userId },
          { transaction }
        );
        Logger.info('New dropoff address saved', { userId, addressId: savedDropoffAddress.id });
      }
    }

    // Create booking within transaction
    const booking = await Booking.create(
      {
        userId,
        vehicleId,
        startDatetime: start,
        endDatetime: end,
        pickupLocation,
        dropoffLocation,
        bookingType,
        paymentMethod,
        bookingStatus: paymentMethod === 'ONLINE' && paymentIntentId ? 'CONFIRMED' : 'PENDING',
        paymentStatus: paymentMethod === 'ONLINE' && paymentIntentId ? 'PARTIALLY_PAID' : 'UNPAID',
        chauffeurInstructions: chauffeurInstructions || null,
        notes: notes || null,
        delayChargeApplied: false,
        delayHours: 0,
      },
      { transaction },
    );

    // Calculate payment breakdown and create financial record
    const paymentCalculation = await calculatePaymentBreakdown(booking.id, 0, transaction);

    await BookingFinancial.create(
      {
        bookingId: booking.id,
        baseAmount: paymentCalculation.baseAmount,
        depositAmount: paymentCalculation.depositAmount,
        balanceAmount: paymentCalculation.balanceAmount,
        delayChargeAmount: paymentCalculation.delayChargeAmount,
        delayChargeRate: paymentCalculation.delayChargeRate,
        taxAmount: paymentCalculation.taxAmount,
        totalAmount: paymentCalculation.totalAmount,
        paidAmount: paymentIntentId ? paymentCalculation.depositAmount : 0,
        remainingAmount: paymentIntentId ? paymentCalculation.totalAmount - paymentCalculation.depositAmount : paymentCalculation.totalAmount,
        currency: paymentCalculation.currency,
        depositPercentage: (paymentCalculation.depositAmount / paymentCalculation.baseAmount) * 100,
      },
      { transaction },
    );

    // If payment was made, create a Payment record
    if (paymentIntentId) {
      const { Payment } = require('../../models');
      await Payment.create({
        bookingId: booking.id,
        userId,
        amount: paymentCalculation.depositAmount,
        currency: paymentCalculation.currency,
        paymentType: 'DEPOSIT',
        paymentStatus: 'PAID',
        paymentMethod,
        stripePaymentIntentId: paymentIntentId,
        paidAt: new Date(),
      }, { transaction });
    }

    // Auto-assign chauffeur if booking type is CHAUFFEUR
    if (bookingType === 'CHAUFFEUR') {
      try {
        const chauffeurAssignment = await autoAssignChauffeur(booking.id);
        if (chauffeurAssignment) {
          await booking.update({ chauffeurId: chauffeurAssignment.chauffeur.id }, { transaction });
          Logger.info('Chauffeur auto-assigned to booking', {
            bookingId: booking.id,
            chauffeurId: chauffeurAssignment.chauffeur.id,
          });
        } else {
          Logger.warn('No chauffeur available for auto-assignment', {
            bookingId: booking.id,
          });
        }
      } catch (chauffeurError) {
        Logger.error('Error during chauffeur auto-assignment', {
          bookingId: booking.id,
          error: chauffeurError,
        });
        // Don't fail the booking if chauffeur assignment fails
      }
    }

    await transaction.commit();

    Logger.info('Enhanced booking created successfully', {
      bookingId: booking.id,
      userId,
      vehicleId,
      bookingType,
      hasAddressIntegration: !!(pickupAddressId || dropoffAddressId),
      totalAmount: paymentCalculation.totalAmount,
    });

    return booking;
  } catch (error) {
    await transaction.rollback();
    Logger.error('Enhanced booking transaction failed', { error, userId, vehicleId });
    throw error;
  }
};

/**
 * Validate booking addresses and return location strings
 * Requirements: 2.2, 2.4
 */
export const validateBookingAddresses = async (
  pickupAddressId?: string,
  dropoffAddressId?: string,
  userId?: string,
  newPickupAddress?: CreateAddressData,
  newDropoffAddress?: CreateAddressData
): Promise<{ pickupLocation: string; dropoffLocation: string }> => {
  Logger.info('Validating booking addresses', {
    pickupAddressId,
    dropoffAddressId,
    userId,
    hasNewPickupAddress: !!newPickupAddress,
    hasNewDropoffAddress: !!newDropoffAddress,
  });

  let pickupLocation = '';
  let dropoffLocation = '';

  // Validate pickup address
  if (pickupAddressId && userId) {
    const pickupAddress = await Address.findOne({
      where: { id: pickupAddressId, userId }
    });

    if (!pickupAddress) {
      throw createError('Pickup address not found or does not belong to user', 404);
    }

    pickupLocation = formatAddressString(pickupAddress);
  } else if (newPickupAddress) {
    // Validate new pickup address format
    validateRequiredFields(newPickupAddress, ['addressLine1', 'city', 'state', 'country']);
    pickupLocation = formatAddressString(newPickupAddress);
  } else {
    throw createError('Either pickup address ID or new pickup address must be provided', 400);
  }

  // Validate dropoff address
  if (dropoffAddressId && userId) {
    const dropoffAddress = await Address.findOne({
      where: { id: dropoffAddressId, userId }
    });

    if (!dropoffAddress) {
      throw createError('Dropoff address not found or does not belong to user', 404);
    }

    dropoffLocation = formatAddressString(dropoffAddress);
  } else if (newDropoffAddress) {
    // Validate new dropoff address format
    validateRequiredFields(newDropoffAddress, ['addressLine1', 'city', 'state', 'country']);
    dropoffLocation = formatAddressString(newDropoffAddress);
  } else {
    throw createError('Either dropoff address ID or new dropoff address must be provided', 400);
  }

  Logger.info('Address validation completed successfully', {
    pickupLocation: pickupLocation.substring(0, 50) + '...',
    dropoffLocation: dropoffLocation.substring(0, 50) + '...',
  });

  return { pickupLocation, dropoffLocation };
};

/**
 * Get customized booking flow steps based on user profile completeness
 * Requirements: 6.1, 6.2, 6.3
 */
export const getBookingFlowSteps = async (
  userId: string,
  bookingType: string = 'SELF_DRIVE'
): Promise<BookingFlowStep[]> => {
  Logger.info('Getting booking flow steps', { userId, bookingType });

  try {
    // Check user's profile completeness
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Address,
          as: 'addresses',
          required: false,
        }
      ],
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Check document completeness
    const documentStatus = await checkDocumentCompleteness(userId);
    const shouldSkipDocuments = await shouldSkipDocumentStep(userId, bookingType as any);

    // Check address completeness
    const addresses = (user as any).addresses || [];
    const hasAddresses = addresses.length > 0;

    // Base flow steps
    const baseSteps: BookingFlowStep[] = [
      {
        step: 1,
        name: 'vehicle_selection',
        title: 'Select Vehicle',
        description: 'Choose your preferred vehicle from available options',
        required: true,
        completed: false,
        skippable: false,
        estimatedTime: 5,
      },
      {
        step: 2,
        name: 'address_selection',
        title: 'Pickup & Dropoff',
        description: hasAddresses
          ? 'Select pickup and dropoff locations from your saved addresses'
          : 'Enter pickup and dropoff locations',
        required: true,
        completed: false,
        skippable: false,
        estimatedTime: hasAddresses ? 2 : 5,
      },
      {
        step: 3,
        name: 'document_verification',
        title: 'Document Verification',
        description: shouldSkipDocuments
          ? 'Documents verified - this step will be skipped'
          : 'Upload and verify required documents',
        required: !shouldSkipDocuments,
        completed: shouldSkipDocuments,
        skippable: shouldSkipDocuments,
        estimatedTime: shouldSkipDocuments ? 0 : 10,
      },
      {
        step: 4,
        name: 'payment',
        title: 'Payment',
        description: 'Choose payment option and complete booking',
        required: true,
        completed: false,
        skippable: false,
        estimatedTime: 3,
      },
      {
        step: 5,
        name: 'confirmation',
        title: 'Confirmation',
        description: 'Review booking details and receive confirmation',
        required: true,
        completed: false,
        skippable: false,
        estimatedTime: 1,
      },
    ];

    // Filter out skippable steps for simplified flow
    const activeSteps = baseSteps.filter(step => !step.skippable);

    // Renumber steps after filtering
    activeSteps.forEach((step, index) => {
      step.step = index + 1;
    });

    Logger.info('Booking flow steps generated', {
      userId,
      totalSteps: activeSteps.length,
      skippedSteps: baseSteps.length - activeSteps.length,
      hasAddresses,
      documentsComplete: shouldSkipDocuments,
    });

    return activeSteps;

  } catch (error) {
    Logger.error('Error generating booking flow steps', { userId, bookingType, error });
    throw createError('Failed to generate booking flow steps', 500);
  }
};

/**
 * Check booking eligibility based on document status and profile completeness
 * Requirements: 6.1, 6.2
 */
export const checkBookingEligibilityEnhanced = async (
  userId: string,
  bookingType: string = 'SELF_DRIVE'
): Promise<EligibilityResult> => {
  Logger.info('Checking enhanced booking eligibility', { userId, bookingType });

  try {
    // Use the existing document validation from user service
    const eligibilityResult = await checkBookingEligibility(userId, bookingType as any);

    Logger.info('Enhanced booking eligibility check completed', {
      userId,
      eligible: eligibilityResult.eligible,
      missingRequirements: eligibilityResult.missingRequirements.length,
    });

    return eligibilityResult;

  } catch (error) {
    Logger.error('Error checking enhanced booking eligibility', { userId, bookingType, error });
    throw createError('Failed to check booking eligibility', 500);
  }
};

/**
 * Get user addresses formatted for booking selection
 * Requirements: 2.1
 */
export const getAddressesForBooking = async (userId: string): Promise<BookingAddressOption[]> => {
  Logger.info('Getting addresses for booking selection', { userId });

  try {
    const addresses = await Address.findAll({
      where: { userId },
      order: [['isDefault', 'DESC'], ['type', 'ASC'], ['createdAt', 'ASC']],
    });

    const addressOptions: BookingAddressOption[] = addresses.map(address => ({
      id: address.id,
      type: address.type,
      displayName: `${address.type}${address.isDefault ? ' (Default)' : ''}`,
      fullAddress: formatAddressString(address),
      isDefault: address.isDefault,
    }));

    Logger.info('Address options retrieved for booking', {
      userId,
      addressCount: addressOptions.length,
      hasDefault: addressOptions.some(addr => addr.isDefault),
    });

    return addressOptions;

  } catch (error) {
    Logger.error('Error getting addresses for booking', { userId, error });
    throw createError('Failed to get addresses for booking', 500);
  }
};

/**
 * Helper function to format address as a string
 */
const formatAddressString = (address: Address | CreateAddressData): string => {
  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.zipCode,
    address.country,
  ].filter(Boolean);

  return parts.join(', ');
};
