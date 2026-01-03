import { BaseApiService } from '../base';
import { authCookies } from '@/utils/cookies';
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
      this.handleAuthResponse(response.data);
    }
    return response;
  }

  /**
   * User Login
   */
  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.post<AuthResponse>('/login', data);
    if (response.success && response.data) {
      this.handleAuthResponse(response.data);
    }
    return response;
  }

  /**
   * Refresh Token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthResponse>> {
    const response = await this.post<AuthResponse>('/refresh-token', { refreshToken });
    if (response.success && response.data) {
      this.handleAuthResponse(response.data);
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
   * Helper to handle successful auth response
   */
  private handleAuthResponse(data: AuthResponse) {
    const { tokens } = data;
    // Assuming tokens are valid for 7 days if not specified. 
    // Ideally backend should return expiresAt or we decode JWT.
    // For now, let's set a default expiration for cookies if not provided.
    // In a real app, I'd decode the JWT to get 'exp'.
    
    // Using a default of 1 day for access, 7 days for refresh for this example 
    // or relying on what the backend might return if we parse it.
    // Since we don't have JWT decode handy, I'll set reasonable defaults.
    
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;
    const now = Date.now();

    authCookies.setAccessToken(tokens.accessToken, new Date(now + oneDay).toISOString());
    authCookies.setRefreshToken(tokens.refreshToken, new Date(now + sevenDays).toISOString());
  }
}

export const authService = new AuthService();
