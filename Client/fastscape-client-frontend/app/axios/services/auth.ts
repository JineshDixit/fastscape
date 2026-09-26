import { BaseApiService } from '../base';
import { authCookies, TIME_CONSTANTS } from '@/utils/cookies';
import type {
  ApiResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ResetPasswordRequest,
} from '@/common/interfaces';

class AuthService extends BaseApiService {
  constructor() {
    super('/auth');
  }

  /**
   * User Registration
   */
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.post<AuthResponse>('/register', data);
    if (response.success && response.data) {
      this.handleTokenResponse(response.data);
    }
    return response;
  }

  /**
   * User Login
   */
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.post<AuthResponse>('/login', data);
    if (response.success && response.data) {
      this.handleTokenResponse(response.data);
    }
    return response;
  }

  /**
   * Refresh Token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.post<any>('/refresh-token', { refreshToken });
    if (response.success && response.data) {
      // The refresh endpoint returns just token data, not full AuthResponse
      // So we need to structure it properly for handleTokenResponse
      const authResponse: AuthResponse = {
        user: null as any, // User data is fetched separately
        tokens: response.data,
      };
      this.handleTokenResponse(authResponse);
      return { ...response, data: authResponse };
    }
    return response;
  }

  /**
   * Forgot Password
   */
  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    return this.post<void>('/forgot-password', { email });
  }

  /**
   * Verify OTP
   */
  async verifyOtp(email: string, otp: string): Promise<ApiResponse<void>> {
    return this.post<void>('/verify-otp', { email, otp });
  }

  /**
   * Reset Password
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<void>> {
    return this.post<void>('/reset-password', data);
  }

  /**
   * Logout
   */
  async logout(): Promise<ApiResponse<void>> {
    const refreshToken = authCookies.getRefreshToken();

    if (refreshToken) {
      try {
        // Call logout API first to revoke token on server
        const response = await this.post<void>('/logout', { refreshToken });

        // Clear cookies after successful server-side revocation
        authCookies.clearAll();

        return response;
      } catch (error) {
        // Even if API call fails, clear cookies locally for security
        authCookies.clearAll();
        throw error;
      }
    }

    // No refresh token, just clear cookies
    authCookies.clearAll();
    return { success: true, data: undefined };
  }

  /**
   * Logout All Devices
   */
  async logoutAll(): Promise<ApiResponse<void>> {
    const response = await this.post<void>('/logout-all', {});
    if (response.success) {
      authCookies.clearAll();
    }
    return response;
  }

  /**
   * Helper to handle successful auth response with proper token expiration
   * Only handles tokens, not user data (user data is fetched separately via API)
   */
  private handleTokenResponse(data: AuthResponse) {
    const { tokens } = data;

    // Set tokens with correct expiration times provided by the server
    authCookies.setAccessToken(tokens.accessToken, tokens.accessTokenExpiresAt);
    authCookies.setRefreshToken(tokens.refreshToken, tokens.refreshTokenExpiresAt);
  }
}

export const authService = new AuthService();
