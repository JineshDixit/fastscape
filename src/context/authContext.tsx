import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService } from '@/api/services/auth';
import { authCookies, COOKIE_NAMES } from '@/utils/cookies';
import type { User, LoginResponse } from '@/common/interface/authInterface';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: any) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (roleName: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const hasPermission = useCallback(
    (permission: string) => {
      return user?.permissions?.includes(permission) || false;
    },
    [user],
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]) => {
      return permissions.some((p) => user?.permissions?.includes(p)) || false;
    },
    [user],
  );

  const hasRole = useCallback(
    (roleName: string) => {
      return user?.roles?.some((r) => r.name === roleName) || false;
    },
    [user],
  );

  const refreshProfile = useCallback(async () => {
    const token = authCookies.getAccessToken();
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
      } else {
        throw new Error(response.message || 'Failed to fetch profile');
      }
    } catch (err: any) {
      console.error('Failed to sync profile:', err);
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        setUser(null);
        authService.clearTokens();
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials: any): Promise<LoginResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      if (response.success && response.data) {
        // After successful login, we have tokens in cookies.
        // The core requirement is to fetch profile fresh.
        // Although login returns user, the request said call /profile in layout.
        // We'll call refreshProfile immediately to ensure fresh data and consistency.
        setIsAuthenticated(true);
        await refreshProfile();
        return response.data;
      } else {
        const errorMsg = response.message || 'Login failed';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await refreshProfile();
    };

    initAuth();

    // Listen for storage events (e.g. logout from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === COOKIE_NAMES.ACCESS_TOKEN && !e.newValue) {
        setIsAuthenticated(false);
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        refreshProfile,
        clearError,
        hasPermission,
        hasAnyPermission,
        hasRole,
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
