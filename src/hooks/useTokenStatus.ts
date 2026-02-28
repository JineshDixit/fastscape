import { useState, useEffect } from 'react';
import { authService } from '@/api/services/auth';
import type { TokenStatus } from '@/common/interface/authInterface';

/**
 * Hook to monitor token status and expiration
 */
export const useTokenStatus = (refreshInterval: number = 30000) => {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>({
    hasAccessToken: false,
    hasRefreshToken: false,
    accessTokenExpired: true,
    refreshTokenExpired: true,
    accessExpiresAt: null,
    refreshExpiresAt: null,
    timeUntilExpiry: null,
    timeUntilExpiryFormatted: null,
    shouldLogout: false,
  });

  const formatTimeUntilExpiry = (milliseconds: number | null): string | null => {
    if (!milliseconds || milliseconds <= 0) return null;

    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const updateTokenStatus = () => {
    const info = authService.getTokenInfo();
    const shouldLogout = authService.shouldLogout();

    setTokenStatus({
      ...info,
      timeUntilExpiryFormatted: formatTimeUntilExpiry(info.timeUntilExpiry),
      shouldLogout,
    });

    // Don't handle logout here - let authService handle it centrally
    // This prevents race conditions with multiple logout mechanisms
  };

  useEffect(() => {
    // Initial update
    updateTokenStatus();

    // Set up interval to update status
    const interval = setInterval(updateTokenStatus, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const refreshToken = async () => {
    try {
      await authService.refreshAccessToken();
      updateTokenStatus();
      return true;
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      return false;
    }
  };

  const clearTokens = () => {
    authService.clearTokens();
    updateTokenStatus();
  };

  return {
    ...tokenStatus,
    refreshToken,
    clearTokens,
    refresh: updateTokenStatus,
  };
};
