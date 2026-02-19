export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    isActive: boolean;
    roles: Array<{
      id: string;
      name: string;
      description: string;
      isActive: boolean;
    }>;
    permissions: string[];
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: string;
    refreshTokenExpiresAt: string;
  };
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  isActive: boolean;
  preferredLanguage: string;
  roles: Array<{
    id: string;
    name: string;
    description: string;
    isActive: boolean;
  }>;
  permissions: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface TokenInfo {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  accessTokenExpired: boolean;
  refreshTokenExpired: boolean;
  accessExpiresAt: string | null;
  refreshExpiresAt: string | null;
  timeUntilExpiry: number | null;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordResetData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface UseAuthReturn {
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<LoginResponse>;
  getProfile: () => Promise<User>;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (roleName: string) => boolean;
}

export type TokenStatus = TokenInfo & {
  timeUntilExpiryFormatted: string | null;
  shouldLogout: boolean;
};
