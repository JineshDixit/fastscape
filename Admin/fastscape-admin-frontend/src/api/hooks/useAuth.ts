import { useCallback } from 'react';
import { useAuthContext } from '@/context/authContext';
import { authService } from '../services/auth';
import type { LoginRequest, LoginResponse, UseAuthReturn, User } from '@/common/interface/authInterface';

/**
 * Custom hook for authentication operations, now using global AuthContext
 */
export const useAuth = (): UseAuthReturn => {
  const {
    isAuthenticated,
    isLoading,
    error,
    login: contextLogin,
    logout: contextLogout,
    clearError,
    refreshProfile,
    hasPermission,
    hasAnyPermission,
    hasRole,
  } = useAuthContext();

  const login = useCallback(
    async (credentials: LoginRequest): Promise<LoginResponse> => {
      return await contextLogin(credentials);
    },
    [contextLogin],
  );

  const logout = useCallback(async (): Promise<void> => {
    await contextLogout();
  }, [contextLogout]);

  const register = useCallback(async (userData: any): Promise<LoginResponse> => {
    const response = await authService.register(userData);
    if (!response.success) {
      throw new Error(response.message || 'Registration failed');
    }
    return response.data;
  }, []);

  const getProfile = useCallback(async (): Promise<User> => {
    await refreshProfile();
    const response = await authService.getProfile();
    if (!response.success) {
      throw new Error(response.message || 'Failed to get profile');
    }
    return response.data;
  }, [refreshProfile]);

  return {
    login,
    logout,
    register,
    getProfile,
    isAuthenticated,
    isLoading,
    error,
    clearError,
    hasPermission,
    hasAnyPermission,
    hasRole,
  };
};
