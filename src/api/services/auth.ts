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
    try {
      const response = await this.post<void>('/logout');
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
    const currentToken = authCookies.getAccessToken();

    // If we have a valid non-expired access token, return it
    if (currentToken && !this.isTokenExpired()) {
      return currentToken;
    }

    if (this.isRefreshTokenExpired()) {
      this.handleRefreshTokenExpiry();
      return null;
    }

    try {
      return await this.refreshAccessToken();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      this.handleRefreshTokenExpiry();
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

    this.refreshPromise = this.performTokenRefresh(refreshToken);

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
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
   * Check if error indicates refresh token expiry
   */
  private isRefreshTokenError(error: any): boolean {
    return error.response?.status === 401 || error.response?.status === 403;
  }

  // ===== TOKEN VALIDATION METHODS =====

  /**
   * Check if access token is expired or will expire soon
   */
  isTokenExpired(): boolean {
    const expiresAt = authCookies.getTokenExpiresAt();
    if (!expiresAt) return true;

    const now = Date.now();
    const expires = new Date(expiresAt).getTime();

    return now >= expires - AUTH.REFRESH_THRESHOLD;
  }

  /**
   * Check if refresh token is expired
   */
  isRefreshTokenExpired(): boolean {
    const refreshExpiresAt = authCookies.getRefreshExpiresAt();
    if (!refreshExpiresAt) return true;

    const now = Date.now();
    const expires = new Date(refreshExpiresAt).getTime();

    return now >= expires;
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
          console.log('Proactive token refresh completed');
        }
      } catch (error) {
        console.error('Proactive token refresh failed:', error);
        this.handleRefreshTokenExpiry();
      }
    } else if (this.isRefreshTokenExpired()) {
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
      if (!this.isRefreshTokenExpired()) {
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
  clearTokens(): void {
    authCookies.clearAll();
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
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
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
    if (accessExpiresAt) {
      const now = Date.now();
      const expires = new Date(accessExpiresAt).getTime();
      timeUntilExpiry = Math.max(0, expires - now);
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
