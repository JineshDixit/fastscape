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

/**
 * Service for Vehicle management
 */
export class VehicleService extends BaseApiService {
  constructor() {
    super('/vehicles');
  }

  async getStats(): Promise<ApiResponse<any>> {
    return this.get('/stats');
  }

  async getEnums(): Promise<ApiResponse<any>> {
    return this.get('/enums');
  }

  async toggleAvailability(id: string): Promise<ApiResponse<any>> {
    return this.patch(`/${id}/toggle-availability`);
  }

  async bulkUpdateAvailability(ids: string[], isAvailable: boolean): Promise<ApiResponse<any>> {
    return this.patch('/bulk/update-availability', { ids, isAvailable });
  }
}

export const roleService = new RoleService();
export const policyService = new PolicyService();
export const vehicleService = new VehicleService();
