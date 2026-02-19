import { BaseApiService } from '../base';
import type { ApiResponse } from '@/common/interface/apiInterface';

// Admin User Types
export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  isActive: boolean;
  roles?: Role[];
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface UpdateAdminUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
}

// Role Types
export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  policies?: Policy[];
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

// Policy Types
export interface Policy {
  id: string;
  name: string;
  permissions: string[];
  description?: string;
  isActive: boolean;
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

// Assignment Types
export interface AssignRoleRequest {
  adminUserId: string;
  roleId: string;
}

export interface AssignPolicyRequest {
  roleId: string;
  policyId: string;
}

// List Response Types
export interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
  totalPages: number;
}

export interface RoleListResponse {
  roles: Role[];
  total: number;
  totalPages: number;
}

export interface PolicyListResponse {
  policies: Policy[];
  total: number;
  totalPages: number;
}

// Filter Types
export interface AdminUserFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface RoleFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  includePolicies?: boolean;
}

export interface PolicyFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

/**
 * Admin User Management Service
 */
class AdminUserService extends BaseApiService {
  constructor() {
    super('/admin-users');
  }

  async getAllAdminUsers(filters: AdminUserFilters = {}): Promise<AdminUserListResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await this.get<AdminUser[]>(`?${params.toString()}`);
    // Backend returns array directly in data field, not wrapped in an object
    return {
      users: response.data || [],
      total: (response as any).pagination?.total || 0,
      totalPages: (response as any).pagination?.totalPages || 0,
    };
  }

  async getAdminUserById(id: string): Promise<AdminUser> {
    const response = await this.get<AdminUser>(`/${id}`);
    return response.data!;
  }

  async createAdminUser(userData: CreateAdminUserRequest): Promise<AdminUser> {
    const response = await this.post<AdminUser, CreateAdminUserRequest>('/', userData);
    return response.data!;
  }

  async updateAdminUser(id: string, userData: UpdateAdminUserRequest): Promise<AdminUser> {
    const response = await this.put<AdminUser, UpdateAdminUserRequest>(`/${id}`, userData);
    return response.data!;
  }

  async updateAdminUserPassword(id: string, newPassword: string): Promise<void> {
    await this.put<void, { newPassword: string }>(`/${id}/password`, { newPassword });
  }

  async activateAdminUser(id: string): Promise<AdminUser> {
    const response = await this.put<AdminUser>(`/${id}/activate`);
    return response.data!;
  }

  async deactivateAdminUser(id: string): Promise<AdminUser> {
    const response = await this.put<AdminUser>(`/${id}/deactivate`);
    return response.data!;
  }

  async deleteAdminUser(id: string): Promise<void> {
    await this.delete(`/${id}`);
  }
}

/**
 * Role Management Service
 */
class RoleService extends BaseApiService {
  constructor() {
    super('/roles');
  }

  async getAllRoles(filters: RoleFilters = {}): Promise<RoleListResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await this.get<Role[]>(`?${params.toString()}`);
    // Backend returns array directly in data field, not wrapped in an object
    return {
      roles: response.data || [],
      total: (response as any).pagination?.total || 0,
      totalPages: (response as any).pagination?.totalPages || 0,
    };
  }

  async getRoleById(id: string): Promise<Role> {
    const response = await this.get<Role>(`/${id}`);
    return response.data!;
  }

  async createRole(roleData: CreateRoleRequest): Promise<Role> {
    const response = await this.post<Role, CreateRoleRequest>('/', roleData);
    return response.data!;
  }

  async updateRole(id: string, roleData: UpdateRoleRequest): Promise<Role> {
    const response = await this.put<Role, UpdateRoleRequest>(`/${id}`, roleData);
    return response.data!;
  }

  async activateRole(id: string): Promise<Role> {
    const response = await this.put<Role>(`/${id}/activate`);
    return response.data!;
  }

  async deactivateRole(id: string): Promise<Role> {
    const response = await this.put<Role>(`/${id}/deactivate`);
    return response.data!;
  }

  async deleteRole(id: string): Promise<void> {
    await this.delete(`/${id}`);
  }
}

/**
 * Policy Management Service
 */
class PolicyService extends BaseApiService {
  constructor() {
    super('/policies');
  }

  async getAllPolicies(filters: PolicyFilters = {}): Promise<PolicyListResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await this.get<Policy[]>(`?${params.toString()}`);
    // Backend returns array directly in data field, not wrapped in an object
    return {
      policies: response.data || [],
      total: (response as any).pagination?.total || 0,
      totalPages: (response as any).pagination?.totalPages || 0,
    };
  }

  async getPolicyById(id: string): Promise<Policy> {
    const response = await this.get<Policy>(`/${id}`);
    return response.data!;
  }

  async createPolicy(policyData: CreatePolicyRequest): Promise<Policy> {
    const response = await this.post<Policy, CreatePolicyRequest>('/', policyData);
    return response.data!;
  }

  async updatePolicy(id: string, policyData: UpdatePolicyRequest): Promise<Policy> {
    const response = await this.put<Policy, UpdatePolicyRequest>(`/${id}`, policyData);
    return response.data!;
  }

  async activatePolicy(id: string): Promise<Policy> {
    const response = await this.put<Policy>(`/${id}/activate`);
    return response.data!;
  }

  async deactivatePolicy(id: string): Promise<Policy> {
    const response = await this.put<Policy>(`/${id}/deactivate`);
    return response.data!;
  }

  async deletePolicy(id: string): Promise<void> {
    await this.delete(`/${id}`);
  }

  async addPermission(id: string, permission: string): Promise<Policy> {
    const response = await this.put<Policy, { permission: string }>(`/${id}/permissions`, { permission });
    return response.data!;
  }

  async removePermission(id: string, permission: string): Promise<Policy> {
    const response = await this.delete<Policy>(`/${id}/permissions`, { data: { permission } });
    return response.data!;
  }
}

/**
 * Role-Policy Assignment Service
 */
class RolePolicyService extends BaseApiService {
  constructor() {
    super('/role-policies');
  }

  async assignPolicy(roleId: string, policyId: string): Promise<Role> {
    const response = await this.post<Role, AssignPolicyRequest>('/assign', { roleId, policyId });
    return response.data!;
  }

  async removePolicy(roleId: string, policyId: string): Promise<Role> {
    const response = await this.post<Role, AssignPolicyRequest>('/remove', { roleId, policyId });
    return response.data!;
  }

  async getRolePolicies(roleId: string): Promise<ApiResponse<Policy[]>> {
    return await this.get<Policy[]>(`/role/${roleId}/policies`);
  }

  async getPolicyRoles(policyId: string): Promise<Role[]> {
    const response = await this.get<Role[]>(`/policy/${policyId}/roles`);
    return response.data!;
  }

  async bulkAssignPolicies(roleId: string, policyIds: string[]): Promise<Role> {
    const response = await this.put<Role, { policyIds: string[] }>(`/role/${roleId}/policies/bulk`, { policyIds });
    return response.data!;
  }

  async removeAllPolicies(roleId: string): Promise<Role> {
    const response = await this.delete<Role>(`/role/${roleId}/policies`);
    return response.data!;
  }
}

/**
 * Admin User-Role Assignment Service
 */
class AdminUserRoleService extends BaseApiService {
  constructor() {
    super('/admin-user-roles');
  }

  async assignRoleToUser(adminUserId: string, roleId: string): Promise<AdminUser> {
    const response = await this.post<AdminUser, AssignRoleRequest>('/assign', { adminUserId, roleId });
    return response.data!;
  }

  async removeRoleFromUser(adminUserId: string, roleId: string): Promise<AdminUser> {
    const response = await this.post<AdminUser, AssignRoleRequest>('/remove', { adminUserId, roleId });
    return response.data!;
  }

  async getUserRoles(adminUserId: string): Promise<Role[]> {
    const response = await this.get<Role[]>(`/user/${adminUserId}/roles`);
    return response.data!;
  }

  async getRoleUsers(roleId: string): Promise<AdminUser[]> {
    const response = await this.get<AdminUser[]>(`/role/${roleId}/users`);
    return response.data!;
  }

  async getUserPermissions(adminUserId: string): Promise<string[]> {
    const response = await this.get<string[]>(`/user/${adminUserId}/permissions`);
    return response.data!;
  }

  async bulkAssignRoles(adminUserId: string, roleIds: string[]): Promise<AdminUser> {
    const response = await this.put<AdminUser, { roleIds: string[] }>(`/user/${adminUserId}/roles/bulk`, { roleIds });
    return response.data!;
  }

  async removeAllRoles(adminUserId: string): Promise<AdminUser> {
    const response = await this.delete<AdminUser>(`/user/${adminUserId}/roles`);
    return response.data!;
  }
}

// Export service instances
export const adminUserService = new AdminUserService();
export const roleService = new RoleService();
export const policyService = new PolicyService();
export const rolePolicyService = new RolePolicyService();
export const adminUserRoleService = new AdminUserRoleService();