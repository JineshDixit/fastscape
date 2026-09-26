import { BaseApiService } from '../base';
import type { ApiResponse } from '../../common/interface/apiInterface';
import { authCookies } from '@/utils/cookies';
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  User,
  PasswordChangeData,
  PasswordResetData,
  TokenInfo,
} from '@/common/interface/authInterface';
import { AUTH } from '@/common/constant/auth';

/**
 * Authentication API service with optimized token management
 */
class AuthService extends BaseApiService {
  private refreshPromise: Promise<string> | null = null;
  private autoRefreshInterval: number | null = null;

  private getLoginPath(): string {
    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
    const loginPath = `${baseUrl}/login`;
    return loginPath.startsWith('/') ? loginPath : `/${loginPath}`;
  }

  constructor() {
    super('/auth');
  }

  // ===== AUTHENTICATION METHODS =====

  /**
   * Login user and store authentication data
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.post<LoginResponse, LoginRequest>('/login', credentials);

    if (response.success && response.data) {
      this.storeAuthenticationData(response.data);
      this.startAutoRefresh();
    }

    return response;
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    return this.post<LoginResponse, RegisterRequest>('/register', userData);
  }

  /**
   * Logout user and clear all authentication data
   */
  async logout(): Promise<ApiResponse<void>> {
    const refreshToken = authCookies.getRefreshToken();

    if (!refreshToken) {
      this.clearTokens();
      return {
        success: true,
        data: undefined,
        message: 'Logged out locally',
      };
    }

    try {
      const response = await this.post<void, { refreshToken: string }>('/logout', { refreshToken });
      this.clearTokens();

      if (import.meta.env.DEV) {
        console.log('Logout successful - All cookies cleared');
      }

      return response;
    } catch (error) {
      // Even if API call fails, clear cookies locally
      this.clearTokens();

      if (import.meta.env.DEV) {
        console.log('Logout API failed but cookies cleared locally');
      }

      throw error;
    }
  }

  /**
   * Store authentication data in cookies
   */
  private storeAuthenticationData(data: LoginResponse): void {
    const { tokens } = data;

    if (import.meta.env.DEV) {
      console.log('Storing authentication data:', {
        accessTokenLength: tokens.accessToken.length,
        refreshTokenLength: tokens.refreshToken.length,
        accessExpiresAt: tokens.accessTokenExpiresAt,
        refreshExpiresAt: tokens.refreshTokenExpiresAt,
      });
    }

    // Store tokens
    authCookies.setAccessToken(tokens.accessToken, tokens.accessTokenExpiresAt);
    authCookies.setRefreshToken(tokens.refreshToken, tokens.refreshTokenExpiresAt);

    if (import.meta.env.DEV) {
      console.log('Tokens stored successfully in cookies');
    }
  }

  /**
   * Get current user profile from API (fresh data)
   */
  async getProfile(): Promise<ApiResponse<User>> {
    return this.get<User>('/profile');
  }

  /**
   * Update user profile and sync with cookies
   */
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.patch<User, Partial<User>>('/profile', userData);
  }

  // ===== PASSWORD MANAGEMENT METHODS =====

  /**
   * Change user password
   */
  async changePassword(data: PasswordChangeData): Promise<ApiResponse<void>> {
    return this.post<void>('/change-password', data);
  }

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    return this.post<void>('/forgot-password', { email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: PasswordResetData): Promise<ApiResponse<void>> {
    return this.post<void>('/reset-password', data);
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    return this.post<void>('/verify-email', { token });
  }

  // ===== TOKEN MANAGEMENT METHODS =====

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getValidAccessToken(): Promise<string | null> {
    // If we're already refreshing, wait for that to complete
    if (this.refreshPromise) {
      try {
        return await this.refreshPromise;
      } catch {
        // If the refresh failed, continue with normal flow
      }
    }

    const currentToken = authCookies.getAccessToken();

    // If we have a valid non-expired access token, return it
    if (currentToken && !this.isTokenExpired()) {
      return currentToken;
    }

    // Check if we have refresh token
    const refreshToken = authCookies.getRefreshToken();
    if (!refreshToken) {
      if (import.meta.env.DEV) {
        console.warn('Cannot refresh: No refresh token available');
      }
      return null;
    }

    // Check if refresh token is actually expired
    if (this.isRefreshTokenExpired()) {
      if (import.meta.env.DEV) {
        console.warn('Refresh token expired - cannot refresh access token');
      }
      // Don't immediately logout here - let the calling code handle it
      return null;
    }

    try {
      if (import.meta.env.DEV) {
        console.log('Access token expired, attempting refresh...');
      }
      return await this.refreshAccessToken();
    } catch (error) {
      console.error('Failed to get valid access token:', error);
      // Don't automatically logout here - let the calling code handle auth errors
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = authCookies.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Implement cross-tab lock using localStorage
    if (typeof window !== 'undefined') {
      const isLocked = () => {
        const lock = localStorage.getItem('auth_refresh_lock');
        if (!lock) return false;
        const lockTime = parseInt(lock, 10);
        return !isNaN(lockTime) && Date.now() - lockTime < 10000; // 10s timeout
      };

      if (isLocked()) {
        if (import.meta.env.DEV) {
          console.log('🔄 Token refresh currently locked by another tab, waiting...');
        }

        // Wait for lock to be released or new tokens to appear
        let waitAttempts = 0;
        const maxAttempts = 10; // Max 5 seconds

        while (isLocked() && waitAttempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          waitAttempts++;

          // Check if tokens were updated while we were waiting
          const currentToken = authCookies.getAccessToken();
          if (currentToken && !this.isTokenExpired()) {
            if (import.meta.env.DEV) {
              console.log('✅ New token detected from another tab, skipping redundant refresh');
            }
            return currentToken;
          }
        }

        // If we timed out and it's still locked, something might be wrong with the lock,
        // but let's check one last time for the token.
        const finalCheckToken = authCookies.getAccessToken();
        if (finalCheckToken && !this.isTokenExpired()) {
          return finalCheckToken;
        }

        if (import.meta.env.DEV && isLocked()) {
          console.warn('⚠️ Refresh lock timeout - proceeding anyway');
        }
      }

      // Acquire lock
      localStorage.setItem('auth_refresh_lock', Date.now().toString());
    }

    this.refreshPromise = this.performTokenRefresh(refreshToken);

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
      // Release lock
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_refresh_lock');
      }
    }
  }

  /**
   * Public refresh token method for external use
   */
  async refreshToken(): Promise<ApiResponse<{ accessToken: string; accessTokenExpiresAt: string }>> {
    const newToken = await this.refreshAccessToken();

    return {
      success: true,
      data: {
        accessToken: newToken,
        accessTokenExpiresAt: authCookies.getTokenExpiresAt() || '',
      },
    };
  }

  /**
   * Perform the actual token refresh API call
   */
  private async performTokenRefresh(refreshToken: string): Promise<string> {
    try {
      const response = await this.post<RefreshTokenResponse, RefreshTokenRequest>('/refresh', {
        refreshToken,
      });

      if (!response.success || !response.data) {
        throw new Error('Invalid refresh response');
      }

      const { accessToken, accessTokenExpiresAt, refreshToken: newRefreshToken, refreshTokenExpiresAt } = response.data;

      // Update tokens in cookies
      authCookies.setAccessToken(accessToken, accessTokenExpiresAt);

      if (newRefreshToken && refreshTokenExpiresAt) {
        authCookies.setRefreshToken(newRefreshToken, refreshTokenExpiresAt);
      }

      if (import.meta.env.DEV) {
        console.log('Token refreshed successfully');
      }

      return accessToken;
    } catch (error: any) {
      if (this.isRefreshTokenError(error)) {
        this.handleRefreshTokenExpiry();
        throw new Error('Refresh token expired');
      }
      throw error;
    }
  }

  /**
   * Check if error indicates refresh token expiry (not network errors)
   */
  private isRefreshTokenError(error: any): boolean {
    // Only treat as auth error if we get a proper HTTP response with 401/403
    // Network errors (no response) should not trigger logout
    return error.response?.status === 401 || error.response?.status === 403;
  }

  // ===== TOKEN VALIDATION METHODS =====

  /**
   * Check if access token is expired or will expire soon
   */
  isTokenExpired(): boolean {
    const expiresAt = authCookies.getTokenExpiresAt();
    if (!expiresAt) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ No access token expiration found');
      }
      return true;
    }

    const now = Date.now();
    const expires = new Date(expiresAt).getTime();
    const timeUntilExpiry = expires - now;
    const isExpired = now >= expires - AUTH.REFRESH_THRESHOLD;

    if (import.meta.env.DEV && timeUntilExpiry < AUTH.REFRESH_THRESHOLD * 2) {
      console.log(
        `🕐 Token expires in ${Math.round(timeUntilExpiry / 1000)}s, threshold: ${AUTH.REFRESH_THRESHOLD / 1000}s, should refresh: ${isExpired}`,
      );
    }

    return isExpired;
  }

  /**
   * Check if refresh token is expired
   */
  isRefreshTokenExpired(): boolean {
    const refreshExpiresAt = authCookies.getRefreshExpiresAt();
    if (!refreshExpiresAt) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ No refresh token expiration found');
      }
      return true;
    }

    const now = Date.now();
    const expires = new Date(refreshExpiresAt).getTime();
    const timeUntilExpiry = expires - now;
    const isExpired = now >= expires;

    if (import.meta.env.DEV && timeUntilExpiry < 10 * 60 * 1000) {
      // Log if less than 10 minutes left
      console.log(`🔄 Refresh token expires in ${Math.round(timeUntilExpiry / 1000)}s, expired: ${isExpired}`);
    }

    return isExpired;
  }

  // ===== AUTO-REFRESH METHODS =====

  /**
   * Proactively refresh token if it's close to expiring
   */
  async proactiveRefresh(): Promise<void> {
    if (this.shouldRefreshToken()) {
      try {
        await this.refreshAccessToken();
        if (import.meta.env.DEV) {
          console.log('✅ Proactive token refresh completed');
        }
      } catch (error: any) {
        // Only trigger logout if it's an auth error (401/403), not a transient network error
        if (this.isRefreshTokenError(error)) {
          console.error('❌ Proactive refresh failed with auth error - logging out');
          this.handleRefreshTokenExpiry();
        } else {
          console.warn('⚠️ Proactive refresh failed with transient error - will retry later', error.message);
          // Don't logout on network errors - let the next interval retry
        }
      }
    } else if (this.isRefreshTokenExpired()) {
      if (import.meta.env.DEV) {
        console.log('❌ Refresh token expired - stopping auto refresh');
      }
      this.handleRefreshTokenExpiry();
    }
  }

  /**
   * Check if token should be refreshed
   */
  private shouldRefreshToken(): boolean {
    return this.isTokenExpired() && !this.isRefreshTokenExpired();
  }

  /**
   * Start automatic token refresh monitoring
   */
  startAutoRefresh(): void {
    this.stopAutoRefresh(); // Clear any existing interval

    this.autoRefreshInterval = setInterval(async () => {
      if (authCookies.getAccessToken() || authCookies.getRefreshToken()) {
        await this.proactiveRefresh();
      } else {
        this.stopAutoRefresh();
      }
    }, AUTH.AUTO_REFRESH_INTERVAL);

    // Initial check after a short delay
    setTimeout(() => this.proactiveRefresh(), AUTH.INITIAL_CHECK_DELAY);
  }

  /**
   * Stop automatic token refresh monitoring
   */
  stopAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  // ===== CLEANUP AND UTILITY METHODS =====

  /**
   * Clear all tokens and stop monitoring
   */
  clearTokens(options: { broadcast?: boolean } = {}): void {
    authCookies.clearAll(options);
    this.refreshPromise = null;
    this.stopAutoRefresh();
  }

  /**
   * Handle refresh token expiry by logging out and redirecting
   */
  private handleRefreshTokenExpiry(): void {
    if (import.meta.env.DEV) {
      console.log('Refresh token expired - logging out user');
    }

    this.clearTokens();

    // Only redirect in browser environment and not already on login page
    if (typeof window !== 'undefined') {
      const loginPath = this.getLoginPath();
      const currentPath = window.location.pathname.replace(/\/+$/, '');
      const normalizedLoginPath = loginPath.replace(/\/+$/, '');

      if (currentPath !== normalizedLoginPath) {
        window.location.href = loginPath;
      }
    }
  }

  /**
   * Force logout due to refresh token expiry
   */
  forceLogout(): void {
    if (import.meta.env.DEV) {
      console.log('Force logout triggered due to refresh token expiry');
    }
    this.handleRefreshTokenExpiry();
  }

  // ===== STATUS AND PERMISSION METHODS =====

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return authCookies.isAuthenticated();
  }

  /**
   * Get access token from cookies
   */
  getAccessToken(): string | null {
    return authCookies.getAccessToken();
  }

  /**
   * Check if user should be logged out (refresh token expired)
   */
  shouldLogout(): boolean {
    return this.isRefreshTokenExpired() && !!authCookies.getAccessToken();
  }

  /**
   * Get comprehensive token information
   */
  getTokenInfo(): TokenInfo {
    const accessExpiresAt = authCookies.getTokenExpiresAt();
    const refreshExpiresAt = authCookies.getRefreshExpiresAt();

    let timeUntilExpiry: number | null = null;
    const now = Date.now();

    // Prioritize refresh token expiry if access token is expired or missing
    if (accessExpiresAt) {
      const accessExpires = new Date(accessExpiresAt).getTime();
      const accessTimeUntil = accessExpires - now;

      if (accessTimeUntil > 0) {
        timeUntilExpiry = accessTimeUntil;
      }
    }

    // If access token is expired or missing, check refresh token
    if ((!timeUntilExpiry || timeUntilExpiry <= 0) && refreshExpiresAt) {
      const refreshExpires = new Date(refreshExpiresAt).getTime();
      const refreshTimeUntil = refreshExpires - now;

      if (refreshTimeUntil > 0) {
        timeUntilExpiry = refreshTimeUntil;
      }
    }

    return {
      hasAccessToken: !!authCookies.getAccessToken(),
      hasRefreshToken: !!authCookies.getRefreshToken(),
      accessTokenExpired: this.isTokenExpired(),
      refreshTokenExpired: this.isRefreshTokenExpired(),
      accessExpiresAt,
      refreshExpiresAt,
      timeUntilExpiry,
    };
  }
}

export const authService = new AuthService();

if (typeof window !== 'undefined' && (authCookies.getAccessToken() || authCookies.getRefreshToken())) {
  authService.startAutoRefresh();
}
