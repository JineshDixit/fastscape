import { useState, useEffect } from 'react';
import { authService } from '@/api/services/auth';
import type { AuthState } from '@/common/interface/routeInterface';

/**
 * Hook to manage authentication state for route protection
 */
export const useAuthGuard = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: null,
    isLoading: true,
    user: null
  });

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const tokenInfo = authService.getTokenInfo();
        
        // No tokens means not authenticated
        if (!tokenInfo.hasAccessToken && !tokenInfo.hasRefreshToken) {
          if (isMounted) {
            setAuthState({
              isAuthenticated: false,
              isLoading: false,
              user: null
            });
          }
          return;
        }

        // Refresh token expired means session ended
        if (tokenInfo.refreshTokenExpired) {
          authService.clearTokens();
          if (isMounted) {
            setAuthState({
              isAuthenticated: false,
              isLoading: false,
              user: null
            });
          }
          return;
        }

        // Try to get valid access token (will refresh if needed)
        const validToken = await authService.getValidAccessToken();
        
        if (validToken) {
          const user = authService.getCurrentUser();
          if (isMounted) {
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              user
            });
          }
        } else {
          if (isMounted) {
            setAuthState({
              isAuthenticated: false,
              isLoading: false,
              user: null
            });
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        authService.clearTokens();
        if (isMounted) {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null
          });
        }
      }
    };

    checkAuth();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return authState;
};