import { authCookies } from '@/utils/cookies';
import { authService } from './services/auth';

// Export main API client
export { default as apiClient } from './client';

// Export base service class
export { BaseApiService } from './base';

// Export types
export * from '../common/interface/apiInterface';

// Export services
export { authService } from './services/auth';

// Export cookie utilities
export { authCookies, COOKIE_NAMES } from '@/utils/cookies';

// Utility functions (updated to use cookies)
export const setAuthToken = (token: string, expiresAt: string) => {
  authCookies.setAccessToken(token, expiresAt);
};

export const getAuthToken = (): string | null => {
  return authCookies.getAccessToken();
};

export const clearAuthToken = () => {
  authCookies.clearAll();
};

export const isAuthenticated = (): boolean => {
  const tokenInfo = authService.getTokenInfo();
  return tokenInfo.hasAccessToken && !tokenInfo.refreshTokenExpired;
};

// Additional utility functions
export const getCurrentUser = () => {
  return authService.getCurrentUser();
};

export const getUserPermissions = (): string[] => {
  return authService.getUserPermissions();
};

export const hasPermission = (permission: string): boolean => {
  return authService.hasPermission(permission);
};

export const hasRole = (roleName: string): boolean => {
  return authService.hasRole(roleName);
};