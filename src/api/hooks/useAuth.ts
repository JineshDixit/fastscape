import { useState, useCallback } from 'react';
import { authService } from '../index';
import type { LoginRequest, LoginResponse, UseAuthReturn, User } from '@/common/interface/authInterface';

/**
 * Custom hook for authentication operations
 */
export const useAuth = (): UseAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<LoginResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(credentials);
      
      if (!response.success) {
        throw new Error(response.message || 'Login failed');
      }
      
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authService.logout();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Logout failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: any): Promise<LoginResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(userData);
      
      if (!response.success) {
        throw new Error(response.message || 'Registration failed');
      }
      
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getProfile = useCallback(async (): Promise<User> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.getProfile();
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get profile');
      }
      
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to get profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentUser = useCallback((): User | null => {
    return authService.getCurrentUser();
  }, []);

  return {
    login,
    logout,
    register,
    getProfile,
    getCurrentUser,
    isLoading,
    error,
    clearError,
  };
};