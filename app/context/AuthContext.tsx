'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { authService } from '@/app/axios/services/auth';
import { userService } from '@/app/axios/services/user';
import type {
  LoginRequest,
  RegisterRequest,
  User,
  ResetPasswordRequest,
  ApiResponse,
  AuthResponse,
} from '@/common/interfaces';
import { authCookies, TIME_CONSTANTS } from '@/utils/cookies';
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
  refreshAuth: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const clearError = useCallback(() => setError(null), []);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    authCookies.clearAll();
  }, []);

  const handleAuthError = useCallback((err: any, fallbackMessage: string) => {
    const message = err?.response?.data?.message || err?.message || fallbackMessage;
    setError(message);
    return { success: false, message, data: null } as ApiResponse<any>;
  }, []);

  // Fetch current user from API
  const fetchCurrentUser = useCallback(async () => {
    try {
      console.log('Fetching current user from API');
      const response = await userService.getProfile();
      
      if (response.success && response.data) {
        console.log('User fetched successfully:', response.data);
        setUser(response.data);
        setIsAuthenticated(true);
      } else {
        console.log('Failed to fetch user:', response.message);
        clearAuthState();
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      clearAuthState();
    }
  }, [clearAuthState]);

  // Check authentication status and fetch user if authenticated
  const checkAuth = useCallback(async () => {
    try {
      const hasValidToken = authCookies.isAuthenticated();
      console.log('Token validation result:', hasValidToken);

      if (hasValidToken) {
        // Token exists and is valid, fetch user data
        await fetchCurrentUser();
        
        // Check if token needs refresh
        if (authCookies.needsRefresh()) {
          console.log('Token needs refresh, refreshing...');
          await refreshAuth();
        }
      } else {
        console.log('No valid token found');
        clearAuthState();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      clearAuthState();
    } finally {
      setIsLoading(false);
    }
  }, [fetchCurrentUser, clearAuthState]);

  // Refresh authentication token
  const refreshAuth = useCallback(async () => {
    try {
      const refreshToken = authCookies.getRefreshToken();
      if (refreshToken) {
        console.log('Refreshing token...');
        const response = await authService.refreshToken(refreshToken);
        
        if (response.success) {
          console.log('Token refreshed successfully');
          // After successful token refresh, fetch updated user data
          await fetchCurrentUser();
        } else {
          throw new Error('Token refresh failed');
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthState();
    }
  }, [fetchCurrentUser, clearAuthState]);

  // Initialize auth check
  useEffect(() => {
    checkAuth();
    
    // Set up periodic auth check every 5 minutes
    const interval = setInterval(() => {
      if (authCookies.isAuthenticated()) {
        checkAuth();
      }
    }, 5 * TIME_CONSTANTS.ONE_MINUTE);
    
    return () => clearInterval(interval);
  }, [checkAuth]);

  const login = useCallback(async (data: LoginRequest) => {
    console.log('Login attempt started');
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(data);
      console.log('Login response:', response);
      
      if (response.success && response.data) {
        console.log('Login successful, fetching user data');
        // After successful login, fetch user data from API
        await fetchCurrentUser();
      } else {
        console.log('Login failed:', response.message);
        setError(response.message || 'Login failed');
      }
      return response;
    } catch (err: any) {
      console.error('Login error:', err);
      return handleAuthError(err, 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }, [fetchCurrentUser, handleAuthError]);

  const register = useCallback(async (data: RegisterRequest) => {
    console.log('Registration attempt started');
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(data);
      console.log('Registration response:', response);
      
      if (response.success && response.data) {
        console.log('Registration successful, fetching user data');
        // After successful registration, fetch user data from API
        await fetchCurrentUser();
      } else {
        console.log('Registration failed:', response.message);
        setError(response.message || 'Registration failed');
      }
      return response;
    } catch (err: any) {
      console.error('Registration error:', err);
      return handleAuthError(err, 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  }, [fetchCurrentUser, handleAuthError]);

  const logout = useCallback(async () => {
    console.log('Logout initiated');
    setIsLoading(true);
    
    try {
      await authService.logout();
      console.log('Logout API call successful');
    } catch (err: any) {
      console.error('Logout API error:', err);
    } finally {
      // Always clear local state regardless of API call success
      clearAuthState();
      setIsLoading(false);
      router.push('/');
      console.log('Logout completed, redirected to home');
    }
  }, [router, clearAuthState]);

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
      return handleAuthError(err, 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthError]);

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
      return handleAuthError(err, 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthError]);

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
      return handleAuthError(err, 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthError]);

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
        refreshAuth,
        fetchCurrentUser,
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
