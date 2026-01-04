'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { authService } from '@/app/axios/services/auth';
import type {
  LoginRequest,
  RegisterRequest,
  User,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ApiResponse,
  AuthResponse,
} from '@/common/interfaces';
import { authCookies } from '@/utils/cookies';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<ApiResponse<AuthResponse>>;
  register: (data: RegisterRequest) => Promise<ApiResponse<AuthResponse>>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<ApiResponse<void>>;
  resetPassword: (data: ResetPasswordRequest) => Promise<ApiResponse<void>>;
  verifyOtp: (email: string, otp: string) => Promise<ApiResponse<void>>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authCookies.isAuthenticated();
      setIsAuthenticated(isAuth);

      if (isAuth) {
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
      } else {
        setError(response.message || 'Login failed');
      }
      return response;
    } catch (err: any) {
      const message = err.message || 'Login failed';
      setError(message);
      return { success: false, message, data: null } as any;
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
      return response;
    } catch (err: any) {
      const message = err.message || 'Registration failed';
      setError(message);
      return { success: false, message, data: null } as any;
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
      return response;
    } catch (err: any) {
      const message = err.message || 'Failed to send reset email';
      setError(message);
      return { success: false, message } as any;
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
      return response;
    } catch (err: any) {
      const message = err.message || 'Failed to reset password';
      setError(message);
      return { success: false, message } as any;
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
      return response;
    } catch (err: any) {
      const message = err.message || 'Invalid OTP';
      setError(message);
      return { success: false, message } as any;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
