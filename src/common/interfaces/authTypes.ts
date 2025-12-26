export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminRegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AdminAuthResponse {
  user: AdminUserResponse;
  tokens: TokenPair;
}

export interface AdminUserResponse {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  isActive: boolean;
  roles?: RoleResponse[];
  permissions?: string[];
}

export interface RoleResponse {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface PolicyResponse {
  id: string;
  name: string;
  permissions: string[];
  description?: string;
  isActive: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  policyIds?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreatePolicyRequest {
  name: string;
  permissions: string[];
  description?: string;
}

export interface UpdatePolicyRequest {
  name?: string;
  permissions?: string[];
  description?: string;
  isActive?: boolean;
}

export interface AssignRoleRequest {
  adminUserId: string;
  roleId: string;
}

export interface AssignPolicyToRoleRequest {
  roleId: string;
  policyId: string;
}