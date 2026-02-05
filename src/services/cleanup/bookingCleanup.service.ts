import { Booking, sequelize } from '../../models';
import { Op } from 'sequelize';
import { dbEnums } from '../../common/enum/dbEnums';
import Logger from '../../utils/logger';

/**
 * Clean up expired pending bookings
 */
export const cleanupExpiredBookings = async (): Promise<number> => {
  const transaction = await sequelize.transaction();

  try {
    const now = new Date();
    
    // Find expired pending bookings
    const expiredBookings = await Booking.findAll({
      where: {
        bookingStatus: dbEnums.BOOKING_STATUS[0], // 'PENDING'
        expiresAt: {
          [Op.lt]: now,
        },
      },
      transaction,
      lock: true,
    });

    if (expiredBookings.length === 0) {
      await transaction.commit();
      return 0;
    }

    const expiredBookingIds = expiredBookings.map(booking => booking.id);
    
    // Update expired bookings to CANCELLED
    const [affectedCount] = await Booking.update(
      { 
        bookingStatus: dbEnums.BOOKING_STATUS[4], // 'CANCELLED'
        notes: 'Automatically cancelled due to payment timeout'
      },
      {
        where: {
          id: { [Op.in]: expiredBookingIds },
        },
        transaction,
      }
    );

    await transaction.commit();
    
    Logger.info('Expired bookings cleaned up', { 
      count: affectedCount,
      bookingIds: expiredBookingIds 
    });
    
    return affectedCount;
  } catch (error) {
    await transaction.rollback();
    Logger.error('Failed to cleanup expired bookings', { error });
    throw error;
  }
};

/**
 * Schedule cleanup job to run every 5 minutes
 */
export const scheduleBookingCleanup = () => {
  const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  const runCleanup = async () => {
    try {
      const cleanedCount = await cleanupExpiredBookings();
      if (cleanedCount > 0) {
        Logger.info('Booking cleanup completed', { cleanedCount });
      }
    } catch (error) {
      Logger.error('Booking cleanup failed', { error });
    }
  };

  // Run immediately on startup
  runCleanup();

  // Schedule recurring cleanup
  setInterval(runCleanup, CLEANUP_INTERVAL);
  
  Logger.info('Booking cleanup scheduler started', { intervalMinutes: 5 });
};

/**
 * Get statistics about expired bookings
 */
export const getExpiredBookingStats = async () => {
  const now = new Date();
  
  const expiredCount = await Booking.count({
    where: {
      bookingStatus: dbEnums.BOOKING_STATUS[0], // 'PENDING'
      expiresAt: {
        [Op.lt]: now,
      },
    },
  });

  const soonToExpireCount = await Booking.count({
    where: {
      bookingStatus: dbEnums.BOOKING_STATUS[0], // 'PENDING'
      expiresAt: {
        [Op.between]: [now, new Date(now.getTime() + 5 * 60000)], // Next 5 minutes
      },
    },
  });

  return {
    expiredCount,
    soonToExpireCount,
  };
};