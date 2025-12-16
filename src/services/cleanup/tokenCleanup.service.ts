import { RefreshToken } from '../../common/models';
import { Op } from 'sequelize';

/**
 * Clean up expired refresh tokens
 */
export const cleanupExpiredTokens = async (): Promise<void> => {
  try {
    const result = await RefreshToken.destroy({
      where: {
        [Op.or]: [
          { expiresAt: { [Op.lt]: new Date() } },
          { isRevoked: true }
        ]
      }
    });
    
    console.log(`Cleaned up ${result} expired/revoked refresh tokens`);
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
};

/**
 * Clean up old revoked tokens (older than 30 days)
 */
export const cleanupOldRevokedTokens = async (): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await RefreshToken.destroy({
      where: {
        isRevoked: true,
        updatedAt: { [Op.lt]: thirtyDaysAgo }
      }
    });
    
    console.log(`Cleaned up ${result} old revoked refresh tokens`);
  } catch (error) {
    console.error('Error cleaning up old revoked tokens:', error);
  }
};

/**
 * Start periodic cleanup job
 */
export const startTokenCleanupJob = (): void => {
  // Run cleanup every hour
  setInterval(async () => {
    await cleanupExpiredTokens();
  }, 60 * 60 * 1000);
  
  // Run old token cleanup once a day
  setInterval(async () => {
    await cleanupOldRevokedTokens();
  }, 24 * 60 * 60 * 1000);
  
  console.log('Token cleanup job started');
};