import { authService } from './services/auth';

export { default as apiClient } from './client';
export { BaseApiService } from './base';
export { authService };
export { roleService, policyService } from './services/admin';
export { legalContentService } from './services/adminService';
export { vehicleService } from './services/vehicle';
export { bookingService } from './services/bookingService';
export { paymentService } from './services/paymentService';
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
