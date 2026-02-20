import cron from 'node-cron';
import { Op } from 'sequelize';
import { AdminRefreshToken } from '../../models';
import logger from '../../config/logger';

/**
 * Handle individual cleanup tasks to reduce redundancy
 */
const runCleanup = async (label: string, where: any) => {
  const startTime = Date.now();
  try {
    const deletedCount = await AdminRefreshToken.destroy({ where });
    const duration = Date.now() - startTime;
    if (deletedCount > 0) {
      logger.info(`[Cleanup] ${label}: Removed ${deletedCount} tokens in ${duration}ms`);
    } else {
      logger.debug(`[Cleanup] ${label}: No tokens to remove (${duration}ms)`);
    }
  } catch (error) {
    logger.error(`[Cleanup] Error in ${label}:`, error);
  }
};

/**
 * Clean up expired and old revoked refresh tokens (Consolidated)
 */
export const cleanupTokens = async (): Promise<void> => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  await runCleanup('Expired/Revoked (30d)', {
    [Op.or]: [
      { expiresAt: { [Op.lt]: new Date() } },
      { isRevoked: true, updatedAt: { [Op.lt]: thirtyDaysAgo } },
      { createdAt: { [Op.lt]: ninetyDaysAgo } },
    ],
  });
};

/**
 * Get token statistics
 */
export const getTokenStatistics = async () => {
  try {
    const now = new Date();
    const stats = await Promise.all([
      AdminRefreshToken.count(),
      AdminRefreshToken.count({ where: { isRevoked: false, expiresAt: { [Op.gt]: now } } }),
      AdminRefreshToken.count({ where: { isRevoked: false, expiresAt: { [Op.lt]: now } } }),
      AdminRefreshToken.count({ where: { isRevoked: true } }),
    ]);

    return { total: stats[0], active: stats[1], expired: stats[2], revoked: stats[3] };
  } catch (error) {
    logger.error('Error getting token statistics:', error);
    return { total: 0, active: 0, expired: 0, revoked: 0 };
  }
};

/**
 * Start the token cleanup job
 */
export const startTokenCleanupJob = (): void => {
  // Run consolidated cleanup every 4 hours
  cron.schedule('0 */4 * * *', async () => {
    logger.info('Starting scheduled token cleanup job...');
    const startTime = Date.now();
    await cleanupTokens();
    const duration = Date.now() - startTime;
    logger.info(`Token cleanup job completed in ${duration}ms`);
  });

  // Log token statistics daily at 1 AM
  cron.schedule('0 1 * * *', async () => {
    const stats = await getTokenStatistics();
    logger.info('Token Statistics:', stats);
  });

  logger.info('Token cleanup jobs scheduled (every 4 hours + daily stats at 1 AM)');
};

/**
 * Stop all cleanup jobs
 */
export const stopTokenCleanupJob = (): void => {
  cron.getTasks().forEach((task) => task.stop());
  logger.info('Token cleanup jobs stopped');
};
