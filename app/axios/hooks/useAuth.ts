'use client';

import { useState, useCallback, useEffect } from 'react';
import { authService } from '../services/auth';
import type { LoginRequest, RegisterRequest, User, ForgotPasswordRequest, ResetPasswordRequest } from '@/common/interfaces';
import { authCookies } from '@/utils/cookies';
import { useRouter } from 'next/navigation';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: ResetPasswordRequest) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Initial check for authentication
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authCookies.isAuthenticated();
      setIsAuthenticated(isAuth);
      
      if (isAuth) {
        // Try to recover user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
           try {
             setUser(JSON.parse(storedUser));
           } catch {
             localStorage.removeItem('user');
           }
        }
      }
    };
    checkAuth();
  }, []);

  const saveUser = (user: User) => {
     setUser(user);
     localStorage.setItem('user', JSON.stringify(user));
  };
  
  const removeUser = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(data);
      if (response.success && response.data) {
        saveUser(response.data.user);
        setIsAuthenticated(true);
        // Optional: Redirect or close modal handled by component
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(data);
      if (response.success && response.data) {
        saveUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      removeUser();
      setIsAuthenticated(false);
      router.push('/');
    } catch (err: any) {
      console.error('Logout error:', err);
      // Force cleanup even if API fails
      authCookies.clearAll();
      removeUser();
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const forgotPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.forgotPassword(email);
      if (!response.success) {
        setError(response.message || 'Failed to send reset email');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (data: ResetPasswordRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.resetPassword(data);
      if (!response.success) {
        setError(response.message || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.verifyOtp(email, otp);
      if (!response.success) {
        setError(response.message || 'Invalid OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyOtp,
    clearError,
  };
};
