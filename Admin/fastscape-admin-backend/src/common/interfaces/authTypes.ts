import { Request } from 'express';

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

export interface LegalContentBlock {
  id: string;
  kind: 'heading' | 'paragraph' | 'bullet_list' | 'numbered_list' | 'quote';
  text?: string;
  items?: string[];
}

export interface LegalContentResponse {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  blocks: LegalContentBlock[];
  version: number;
  isActive: boolean;
  isDeleted: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedBy?: string | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LegalContentVersionResponse {
  id: string;
  legalContentId: string;
  version: number;
  title: string;
  description?: string | null;
  blocks: LegalContentBlock[];
  changeNote?: string | null;
  createdBy?: string | null;
  createdAt: Date;
}

export interface CreateLegalContentRequest {
  slug: string;
  title: string;
  description?: string;
  blocks?: LegalContentBlock[];
  isActive?: boolean;
}

export interface UpdateLegalContentRequest {
  title?: string;
  description?: string;
  blocks?: LegalContentBlock[];
  isActive?: boolean;
  changeNote?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
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
}
