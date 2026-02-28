import { Booking, Chauffeur, Vehicle, sequelize } from '../../models';
import { autoAssignChauffeur } from '../chauffeur/chauffeur.service';
import { dbEnums } from '../../common/enum/dbEnums';
import Logger from '../../utils/logger';
import { Op } from 'sequelize';
import { sendChauffeurAssignment } from '../../utils/email.utils';
import { paymentConfig } from '../../config/payment/paymentConfig';

/**
 * Automatic chauffeur assignment service
 * Handles assigning chauffeurs to CHAUFFEUR type bookings when payment is completed
 */

/**
 * Check if a booking is eligible for chauffeur assignment
 */
const isEligibleForChauffeurAssignment = (booking: any): boolean => {
  const isTypeChauffeur = booking.bookingType === dbEnums.BOOKING_TYPE[1];
  const isPaidOrPartial =
    booking.paymentStatus === dbEnums.PAYMENT_STATUS[2] || booking.paymentStatus === dbEnums.PAYMENT_STATUS[1];
  const noChauffeur = !booking.chauffeurId;
  const isActive = ['CONFIRMED', 'PICKED_UP'].includes(booking.bookingStatus);

  if (!isTypeChauffeur || !isPaidOrPartial || !noChauffeur || !isActive) {
    Logger.info('Booking not eligible for chauffeur assignment - detailed check:', {
      bookingId: booking.id,
      isTypeChauffeur,
      paymentStatus: booking.paymentStatus,
      isPaidOrPartial,
      hasChauffeurId: !!booking.chauffeurId,
      bookingStatus: booking.bookingStatus,
      isActive,
    });
  }

  return isTypeChauffeur && isPaidOrPartial && noChauffeur && isActive;
};

/**
 * Assign chauffeur to a single booking
 */
export const assignChauffeurToBooking = async (
  bookingId: string,
): Promise<{
  success: boolean;
  chauffeur?: Chauffeur;
  error?: string;
}> => {
  const transaction = await sequelize.transaction();

  Logger.info('Assigning chauffeur to booking', {
    bookingId,
  });

  try {
    // Get booking with vehicle and financial info
    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: Vehicle,
          as: 'vehicle',
          attributes: ['id', 'make', 'model', 'bodyType'],
          required: true, // Force INNER JOIN to avoid "FOR UPDATE cannot be applied to the nullable side of an outer join" error
        },
      ],
      transaction,
      lock: true,
    });

    Logger.info('Booking found', {
      bookingId,
      booking,
    });

    if (!booking) {
      await transaction.rollback();
      return { success: false, error: 'Booking not found' };
    }

    // Check eligibility
    if (!isEligibleForChauffeurAssignment(booking)) {
      await transaction.rollback();
      return {
        success: false,
        error:
          `Booking not eligible for chauffeur assignment. ` +
          `Type: ${booking.bookingType}, ` +
          `Payment: ${booking.paymentStatus}, ` +
          `Status: ${booking.bookingStatus}, ` +
          `HasChauffeur: ${!!booking.chauffeurId}`,
      };
    }

    Logger.info('Attempting auto-assignment for eligible booking', {
      bookingId,
      vehicleType: (booking as any).vehicle?.bodyType,
      startDatetime: booking.startDatetime,
      endDatetime: booking.endDatetime,
    });

    // Attempt to assign chauffeur using config values
    const chauffeurAssignment = await autoAssignChauffeur(
      bookingId,
      {
        vehicleType: (booking as any).vehicle?.bodyType,
        minRating: paymentConfig.minChauffeurRating,
        maxHourlyRate: paymentConfig.maxChauffeurHourlyRate,
        isVerified: paymentConfig.requireVerifiedChauffeurs,
      },
      transaction,
    );

    if (chauffeurAssignment) {
      await transaction.commit();

      Logger.info('Chauffeur auto-assigned successfully', {
        bookingId,
        chauffeurId: chauffeurAssignment.chauffeur.id,
        chauffeurName: chauffeurAssignment.chauffeur.fullName,
        chauffeurRating: chauffeurAssignment.chauffeur.rating,
      });

      // Send chauffeur assignment email (non-blocking)
      sendChauffeurAssignment(bookingId).catch((error) => {
        Logger.error('Failed to send chauffeur assignment email', { bookingId, error });
      });

      return {
        success: true,
        chauffeur: chauffeurAssignment.chauffeur,
      };
    } else {
      await transaction.rollback();

      Logger.warn('No available chauffeurs found for booking', {
        bookingId,
        vehicleType: (booking as any).vehicle?.bodyType,
      });

      return {
        success: false,
        error: 'No available chauffeurs found matching the criteria',
      };
    }
  } catch (error: any) {
    if (transaction) await transaction.rollback();

    Logger.error('Failed to assign chauffeur to booking - Exception caught', {
      bookingId,
      error: error?.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    });

    return {
      success: false,
      error: error?.message || 'Unknown error occurred',
    };
  }
};

/**
 * Process chauffeur assignment for multiple bookings (batch processing)
 */
export const processChauffeurAssignments = async (
  bookingIds?: string[],
): Promise<{
  processed: number;
  successful: number;
  failed: number;
  results: Array<{ bookingId: string; success: boolean; chauffeur?: Chauffeur; error?: string }>;
}> => {
  try {
    // Find bookings eligible for chauffeur assignment
    const whereClause: any = {
      bookingType: dbEnums.BOOKING_TYPE[1], // 'CHAUFFEUR'
      paymentStatus: { [Op.in]: [dbEnums.PAYMENT_STATUS[1], dbEnums.PAYMENT_STATUS[2]] }, // 'PARTIALLY_PAID' or 'PAID'
      chauffeurId: null,
      bookingStatus: {
        [Op.in]: ['CONFIRMED', 'PICKED_UP'],
      },
    };

    if (bookingIds && bookingIds.length > 0) {
      whereClause.id = { [Op.in]: bookingIds };
    }

    const eligibleBookings = await Booking.findAll({
      where: whereClause,
      attributes: ['id'],
      order: [['createdAt', 'ASC']],
      limit: 50, // Process in batches to avoid overwhelming
    });

    Logger.info(`Found ${eligibleBookings.length} bookings eligible for chauffeur assignment`);

    const results = [];
    let successful = 0;
    let failed = 0;

    for (const booking of eligibleBookings) {
      const result = await assignChauffeurToBooking(booking.id);
      results.push({
        bookingId: booking.id,
        success: result.success,
        chauffeur: result.chauffeur,
        error: result.error,
      });

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Add small delay between assignments to avoid race conditions
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    Logger.info('Chauffeur assignment batch completed', {
      processed: eligibleBookings.length,
      successful,
      failed,
    });

    return {
      processed: eligibleBookings.length,
      successful,
      failed,
      results,
    };
  } catch (error) {
    Logger.error('Failed to process chauffeur assignments batch', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      processed: 0,
      successful: 0,
      failed: 0,
      results: [],
    };
  }
};

/**
 * Trigger chauffeur assignment when booking payment is completed
 * This function should be called whenever a booking's payment status changes to PAID
 */
export const triggerChauffeurAssignmentOnPayment = async (
  bookingId: string,
  paymentType: 'DEPOSIT' | 'BALANCE' | 'FULL',
): Promise<void> => {
  try {
    Logger.info('Triggering chauffeur assignment on payment completion', {
      bookingId,
      paymentType,
    });

    const result = await assignChauffeurToBooking(bookingId);

    if (result.success) {
      Logger.info('Chauffeur assignment triggered successfully on payment', {
        bookingId,
        paymentType,
        chauffeurId: result.chauffeur?.id,
        chauffeurName: result.chauffeur?.fullName,
      });
    } else {
      Logger.warn('Chauffeur assignment failed on payment trigger', {
        bookingId,
        paymentType,
        error: result.error,
      });
    }
  } catch (error: any) {
    Logger.error('Error triggering chauffeur assignment on payment - Exception caught', {
      bookingId,
      paymentType,
      error: error?.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    });
  }
};

/**
 * Release chauffeur when booking is cancelled or completed
 */
export const releaseChauffeurOnBookingEnd = async (bookingId: string): Promise<void> => {
  try {
    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: Chauffeur, as: 'chauffeur' }],
    });

    if (!booking || !booking.chauffeurId) {
      return; // No chauffeur to release
    }

    const { chauffeur } = booking as any;
    if (chauffeur) {
      // Update chauffeur status back to AVAILABLE
      await chauffeur.update({
        status: 'AVAILABLE',
        lastActiveAt: new Date(),
      });

      // Increment total trips if booking was completed
      if (booking.bookingStatus === dbEnums.BOOKING_STATUS[5]) {
        // 'COMPLETED'
        await chauffeur.update({
          totalTrips: chauffeur.totalTrips + 1,
        });
      }

      Logger.info('Chauffeur released from booking', {
        bookingId,
        chauffeurId: chauffeur.id,
        chauffeurName: chauffeur.fullName,
        bookingStatus: booking.bookingStatus,
        newTotalTrips: chauffeur.totalTrips + 1,
      });
    }
  } catch (error) {
    Logger.error('Failed to release chauffeur from booking', {
      bookingId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
