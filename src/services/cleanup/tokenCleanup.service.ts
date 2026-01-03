import cron from 'node-cron';
import { Op } from 'sequelize';
import { RefreshToken } from '../../models';
import Logger from '../../utils/logger';

/**
 * Clean up expired and revoked refresh tokens
 */
export const cleanupTokens = async (): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const deletedCount = await RefreshToken.destroy({
      where: {
        [Op.or]: [
          // Expired tokens
          {
            expiresAt: {
              [Op.lt]: new Date(),
            },
          },
          // Revoked tokens older than 30 days
          {
            isRevoked: true,
            updatedAt: {
              [Op.lt]: thirtyDaysAgo,
            },
          },
          // Very old tokens (inactive users)
          {
            createdAt: {
              [Op.lt]: ninetyDaysAgo,
            },
          },
        ],
      },
    });

    if (deletedCount > 0) {
      Logger.info(`Cleaned up ${deletedCount} tokens (expired, revoked, or old)`);
    }
  } catch (error) {
    Logger.error('Error cleaning up tokens:', error);
  }
};

/**
 * Get token statistics
 */
export const getTokenStatistics = async (): Promise<{
  total: number;
  active: number;
  expired: number;
  revoked: number;
}> => {
  try {
    const now = new Date();

    const [total, active, expired, revoked] = await Promise.all([
      RefreshToken.count(),
      RefreshToken.count({
        where: {
          isRevoked: false,
          expiresAt: { [Op.gt]: now },
        },
      }),
      RefreshToken.count({
        where: {
          isRevoked: false,
          expiresAt: { [Op.lt]: now },
        },
      }),
      RefreshToken.count({
        where: { isRevoked: true },
      }),
    ]);

    return { total, active, expired, revoked };
  } catch (error) {
    Logger.error('Error getting token statistics:', error);
    return { total: 0, active: 0, expired: 0, revoked: 0 };
  }
};

/**
 * Start the token cleanup job
 */
export const startTokenCleanupJob = (): void => {
  // Run cleanup every 4 hours (balance between database load and cleanliness)
  cron.schedule('0 */4 * * *', async () => {
    const start = Date.now();
    Logger.info('Starting token cleanup job...');
    await cleanupTokens();
    const duration = Date.now() - start;
    Logger.info(`Token cleanup job finished in ${duration}ms`);
  });

  // Log token statistics daily at 1 AM
  cron.schedule('0 1 * * *', async () => {
    const stats = await getTokenStatistics();
    Logger.info('Token Statistics:', stats);
  });

  Logger.info('Token cleanup jobs scheduled');
};

/**
 * Stop all cleanup jobs (for testing or shutdown)
 */
export const stopTokenCleanupJob = (): void => {
  cron.getTasks().forEach((task) => task.stop());
  Logger.info('Token cleanup jobs stopped');
};
