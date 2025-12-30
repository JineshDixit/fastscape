import { BaseApiService } from '../base';
import type { ApiResponse } from '@/common/interface/apiInterface';

/**
 * Service for Role management
 */
export class RoleService extends BaseApiService {
  constructor() {
    super('/roles');
  }

  async activate(id: string): Promise<ApiResponse<any>> {
    return this.put(`/${id}/activate`);
  }

  async deactivate(id: string): Promise<ApiResponse<any>> {
    return this.put(`/${id}/deactivate`);
  }

  async getByName(name: string): Promise<ApiResponse<any>> {
    return this.get(`/name/${name}`);
  }
}

/**
 * Service for Policy management
 */
export class PolicyService extends BaseApiService {
  constructor() {
    super('/policies');
  }

  async getByName(name: string): Promise<ApiResponse<any>> {
    return this.get(`/name/${name}`);
  }

  async addPermissions(id: string, permissions: string[]): Promise<ApiResponse<any>> {
    return this.post(`/${id}/permissions`, { permissions });
  }

  async removePermissions(id: string, permissions: string[]): Promise<ApiResponse<any>> {
    return this.delete(`/${id}/permissions`, { data: { permissions } });
  }
}

// export const vehicleService = new VehicleService(); // Moved to services/vehicle.ts
export const roleService = new RoleService();
export const policyService = new PolicyService();
