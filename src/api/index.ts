import { authService } from './services/auth';

export { default as apiClient } from './client';
export { BaseApiService } from './base';
export { authService };
export { roleService, policyService, vehicleService } from './services/admin';
export { authCookies, COOKIE_NAMES } from '@/utils/cookies';

// Export common interfaces
export * from '../common/interface/apiInterface';

/**
 * Simplified check for authentication status.
 * Note: Use useAuthContext() in components for reactive state.
 */
export const isAuthenticated = (): boolean => {
  return authService.isAuthenticated();
};