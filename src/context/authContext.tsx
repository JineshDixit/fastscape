import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService } from '@/api/services/auth';
import { authCookies } from '@/utils/cookies';
import type { User, LoginResponse } from '@/common/interface/authInterface';
import { useTranslation } from 'react-i18next';
import { adminUserService } from '@/api/services/adminUserService';

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
  const { i18n } = useTranslation();

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
    // First check if we have any form of authentication (access or refresh token)
    if (!authCookies.isAuthenticated()) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      // Try to get a valid access token (this will handle refresh automatically)
      const validToken = await authService.getValidAccessToken();

      if (!validToken) {
        // No valid token could be obtained (refresh token expired)
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Get current i18n language (user's current selection, possibly from login page)
      const currentLanguage = i18n.language;

      // Now fetch the profile with the valid token
      const response = await authService.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
        
        const dbLanguage = response.data.preferredLanguage;
        
        // Compare current language with database language
        if (currentLanguage !== dbLanguage) {
          // User selected a different language (e.g., on login page)
          // Update database to match user's current choice
          console.log(`Language mismatch: current=${currentLanguage}, db=${dbLanguage}. Updating database...`);
          
          try {
            await adminUserService.updateLanguage(currentLanguage);
            console.log('Database language updated successfully');
          } catch (error) {
            console.error('Failed to update database language:', error);
            // Don't fail the login process if language update fails
            // User can still change it later from settings
          }
        } else {
          // Languages match, no action needed
          console.log(`Language in sync: ${currentLanguage}`);
        }
        
        // Ensure i18n is set to current language (should already be, but just in case)
        if (i18n.language !== currentLanguage) {
          await i18n.changeLanguage(currentLanguage);
        }
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
  }, [i18n]);

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

    // Listen for storage events (e.g. logout or token refresh from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_logout_timestamp') {
        if (import.meta.env.DEV) console.log('🚪 Logout detected from another tab');
        setIsAuthenticated(false);
        setUser(null);
        // Ensure tokens are cleared locally too
        authService.clearTokens();
      } else if (e.key === 'auth_sync_timestamp') {
        if (import.meta.env.DEV) console.log('🔄 Token update detected from another tab, syncing profile...');
        refreshProfile();
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
