import cron from 'node-cron';
import { Op } from 'sequelize';
import { RefreshToken } from '../../models';

/**
 * Clean up expired refresh tokens
 */
export const cleanupExpiredTokens = async (): Promise<void> => {
  try {
    const deletedCount = await RefreshToken.destroy({
      where: {
        [Op.or]: [
          {
            expiresAt: {
              [Op.lt]: new Date(),
            },
          },
          {
            isRevoked: true,
            createdAt: {
              [Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days old
            },
          },
        ],
      },
    });

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} expired/revoked refresh tokens`);
    }
  } catch (error) {
    console.error('Error cleaning up expired refresh tokens:', error);
  }
};

/**
 * Clean up old revoked tokens (older than 30 days)
 */
export const cleanupOldRevokedTokens = async (): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const deletedCount = await RefreshToken.destroy({
      where: {
        isRevoked: true,
        updatedAt: {
          [Op.lt]: thirtyDaysAgo,
        },
      },
    });

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old revoked refresh tokens`);
    }
  } catch (error) {
    console.error('Error cleaning up old revoked refresh tokens:', error);
  }
};

/**
 * Clean up tokens for inactive users
 */
export const cleanupInactiveUserTokens = async (): Promise<void> => {
  try {
    // This would require a join with User table
    // For now, we'll implement a simpler version
    const deletedCount = await RefreshToken.destroy({
      where: {
        createdAt: {
          [Op.lt]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days old
        },
      },
    });

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} very old refresh tokens`);
    }
  } catch (error) {
    console.error('Error cleaning up inactive user refresh tokens:', error);
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
          expiresAt: {
            [Op.gt]: now,
          },
        },
      }),
      RefreshToken.count({
        where: {
          isRevoked: false,
          expiresAt: {
            [Op.lt]: now,
          },
        },
      }),
      RefreshToken.count({
        where: {
          isRevoked: true,
        },
      }),
    ]);

    return { total, active, expired, revoked };
  } catch (error) {
    console.error('Error getting token statistics:', error);
    return { total: 0, active: 0, expired: 0, revoked: 0 };
  }
};

/**
 * Start the token cleanup job
 */
export const startTokenCleanupJob = (): void => {
  // Run cleanup every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Starting token cleanup job...');
    await cleanupExpiredTokens();
  });

  // Run old revoked token cleanup daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Starting old revoked token cleanup job...');
    await cleanupOldRevokedTokens();
  });

  // Run inactive user token cleanup weekly on Sunday at 3 AM
  cron.schedule('0 3 * * 0', async () => {
    console.log('Starting inactive user token cleanup job...');
    await cleanupInactiveUserTokens();
  });

  // Log token statistics daily at 1 AM
  cron.schedule('0 1 * * *', async () => {
    const stats = await getTokenStatistics();
    console.log('Token Statistics:', stats);
  });

  console.log('Token cleanup jobs scheduled');
};

/**
 * Stop all cleanup jobs (for testing or shutdown)
 */
export const stopTokenCleanupJob = (): void => {
  cron.getTasks().forEach(task => task.stop());
  console.log('Token cleanup jobs stopped');
};