import { RefreshToken } from '../../common/models';
import { Op } from 'sequelize';

/**
 * Clean up expired refresh tokens from the database. This function
 * deletes all refresh tokens that have expired or have been
 * revoked.
 * 
 * @returns {Promise<void>} - Promise resolving to void
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
 * Clean up revoked refresh tokens that are older than 30 days.
 * This function is used to periodically clean up old revoked tokens
 * from the database to prevent database bloat.
 * 
 * @returns {Promise<void>} - Promise resolving to void
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
 * Starts a job to periodically clean up expired and revoked refresh tokens
 * 
 * The job will run every hour to clean up expired tokens and once a day to clean up
 * old revoked tokens. This is done to prevent database bloat.
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