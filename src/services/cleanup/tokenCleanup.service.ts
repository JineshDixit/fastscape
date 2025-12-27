import cron from 'node-cron';
import { Op } from 'sequelize';
import { AdminRefreshToken } from '../../models';

/**
 * Handle individual cleanup tasks to reduce redundancy
 */
const runCleanup = async (label: string, where: any) => {
  try {
    const deletedCount = await AdminRefreshToken.destroy({ where });
    if (deletedCount > 0) {
      console.log(`[Cleanup] ${label}: Removed ${deletedCount} tokens`);
    }
  } catch (error) {
    console.error(`[Cleanup] Error in ${label}:`, error);
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
      { createdAt: { [Op.lt]: ninetyDaysAgo } }
    ]
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
    console.error('Error getting token statistics:', error);
    return { total: 0, active: 0, expired: 0, revoked: 0 };
  }
};

/**
 * Start the token cleanup job
 */
export const startTokenCleanupJob = (): void => {
  // Run consolidated cleanup every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Starting token cleanup job...');
    await cleanupTokens();
  });

  // Log token statistics daily at 1 AM
  cron.schedule('0 1 * * *', async () => {
    const stats = await getTokenStatistics();
    console.log('Token Statistics:', stats);
  });

  console.log('Token cleanup jobs scheduled');
};

/**
 * Stop all cleanup jobs
 */
export const stopTokenCleanupJob = (): void => {
  cron.getTasks().forEach(task => task.stop());
  console.log('Token cleanup jobs stopped');
};
