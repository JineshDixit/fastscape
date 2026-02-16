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
        // Don't clear auth state immediately, might be a temporary API issue
        console.log('API error, but keeping current auth state');
      }
    } catch (error: any) {
      console.error('Error fetching user:', error);
      // Only clear auth state if it's a 401 (unauthorized) error
      if (error?.response?.status === 401) {
        console.log('401 error, clearing auth state');
        clearAuthState();
      } else {
        console.log('Non-401 error, keeping current auth state');
      }
    }
  }, [clearAuthState]);

  // Refresh authentication token
  const refreshAuth = useCallback(async () => {
    try {
      const refreshToken = authCookies.getRefreshToken();
      if (refreshToken) {
        console.log('Refreshing token...');
        const response = await authService.refreshToken(refreshToken);

        if (response.success) {
          console.log('Token refreshed successfully');
          // Wait a moment for cookies to be properly set
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Verify the new token is valid before fetching user data
          if (authCookies.isAuthenticated()) {
            // After successful token refresh, fetch updated user data
            await fetchCurrentUser();
          } else {
            throw new Error('New token validation failed after refresh');
          }
        } else {
          throw new Error('Token refresh failed');
        }
      } else {
        throw new Error('No refresh token available');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthState();
      throw error; // Re-throw to let caller handle it
    }
  }, [fetchCurrentUser, clearAuthState]);

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
          try {
            await refreshAuth();
          } catch (error) {
            console.error('Failed to refresh token during auth check:', error);
            // Don't immediately clear state, let periodic check handle it
          }
        }
      } else {
        // Check if we have a refresh token to try refreshing
        const refreshToken = authCookies.getRefreshToken();
        if (refreshToken) {
          console.log('Access token expired but refresh token exists, attempting refresh...');
          try {
            await refreshAuth();
            console.log('Token refresh successful during auth check');
          } catch (error: any) {
            console.error('Failed to refresh token during auth check:', error);
            // Only clear state if refresh token is invalid/expired
            if (
              error?.message?.includes('Invalid or expired refresh token') ||
              error?.message?.includes('Refresh token not found')
            ) {
              console.log('Refresh token is invalid, clearing auth state');
              clearAuthState();
            } else {
              console.log('Refresh failed but token might still be valid, keeping state');
            }
          }
        } else {
          console.log('No valid token found');
          clearAuthState();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Don't clear auth state immediately on fetch errors, token might still be valid
      console.log('Auth check failed, but keeping current state');
    } finally {
      setIsLoading(false);
    }
  }, [fetchCurrentUser, clearAuthState, refreshAuth]);

  // Initialize auth check
  useEffect(() => {
    checkAuth();

    // Track refresh failures to prevent infinite loops
    let refreshFailureCount = 0;
    const MAX_REFRESH_FAILURES = 3;

    // Listen for storage events from other tabs (token updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_new_access_token' && e.newValue) {
        console.log('Detected token refresh in another tab, updating state...');
        fetchCurrentUser();
        refreshFailureCount = 0; // Reset failure count on successful refresh from other tab
      }
      if (e.key === 'access_token' && !e.newValue) {
        console.log('Detected logout in another tab, clearing state...');
        clearAuthState();
        router.push('/');
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Set up periodic auth check every 1 minute
    const interval = setInterval(() => {
      const hasValidToken = authCookies.isAuthenticated();
      const needsRefresh = authCookies.needsRefresh();
      const hasRefreshToken = !!authCookies.getRefreshToken();

      // If token is valid but nearing expiry, or if token is expired but we have a refresh token
      if ((hasValidToken && needsRefresh) || (!hasValidToken && hasRefreshToken)) {
        // Check if we've exceeded max failures
        if (refreshFailureCount >= MAX_REFRESH_FAILURES) {
          console.log('Max refresh failures reached, clearing auth state');
          clearAuthState();
          refreshFailureCount = 0;
          return;
        }

        console.log('Periodic check: Attempting to refresh/recover session...');
        refreshAuth()
          .then(() => {
            refreshFailureCount = 0; // Reset on success
          })
          .catch((err) => {
            refreshFailureCount++;
            console.error('Periodic refresh/recovery failed:', err, `(Attempt ${refreshFailureCount}/${MAX_REFRESH_FAILURES})`);
            // Only clear state if it's a definitive auth failure (400 or 401)
            if (err?.response?.status === 401 || err?.response?.status === 400) {
              clearAuthState();
              refreshFailureCount = 0;
            }
          });
      } else {
        // Reset failure count when not attempting refresh
        refreshFailureCount = 0;
      }
    }, 1 * TIME_CONSTANTS.ONE_MINUTE);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [checkAuth, refreshAuth, fetchCurrentUser, clearAuthState, router]);

  const login = useCallback(
    async (data: LoginRequest) => {
      console.log('Login attempt started');
      setIsLoading(true);
      setError(null);

      try {
        const response = await authService.login(data);
        console.log('Login response:', response);

        if (response.success && response.data) {
          console.log('Login successful, fetching user data');
          // After successful login, fetch user data from API
          try {
            await fetchCurrentUser();
          } catch (fetchError) {
            console.error('Failed to fetch user after login:', fetchError);
            // User has valid tokens but couldn't fetch profile
            // Set a generic error but don't fail the login
            setError('Login successful but failed to load profile. Please refresh the page.');
          }
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
    },
    [fetchCurrentUser, handleAuthError],
  );

  const register = useCallback(
    async (data: RegisterRequest) => {
      console.log('Registration attempt started');
      setIsLoading(true);
      setError(null);

      try {
        const response = await authService.register(data);
        console.log('Registration response:', response);

        if (response.success && response.data) {
          console.log('Registration successful, fetching user data');
          // After successful registration, fetch user data from API
          try {
            await fetchCurrentUser();
          } catch (fetchError) {
            console.error('Failed to fetch user after registration:', fetchError);
            // User has valid tokens but couldn't fetch profile
            setError('Registration successful but failed to load profile. Please refresh the page.');
          }
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
    },
    [fetchCurrentUser, handleAuthError],
  );

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

  const forgotPassword = useCallback(
    async (email: string) => {
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
    },
    [handleAuthError],
  );

  const resetPassword = useCallback(
    async (data: ResetPasswordRequest) => {
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
    },
    [handleAuthError],
  );

  const verifyOtp = useCallback(
    async (email: string, otp: string) => {
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
    },
    [handleAuthError],
  );

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
