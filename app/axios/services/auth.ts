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
    const response = await this.post<AuthResponse>('/refresh-token', { refreshToken });
    if (response.success && response.data) {
      this.handleTokenResponse(response.data);
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
    // Clear cookies immediately on client side
    authCookies.clearAll();
    
    if (refreshToken) {
      return this.post<void>('/logout', { refreshToken });
    }
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
    const now = Date.now();

    // Set tokens with proper expiration times
    authCookies.setAccessToken(
      tokens.accessToken, 
      new Date(now + TIME_CONSTANTS.ONE_DAY).toISOString()
    );
    authCookies.setRefreshToken(
      tokens.refreshToken, 
      new Date(now + TIME_CONSTANTS.SEVEN_DAYS).toISOString()
    );
  }
}

export const authService = new AuthService();
