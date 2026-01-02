import { BaseApiService } from '../base';
import type { ApiResponse, Vehicle, VehicleStats, VehicleEnums, VehicleFilters } from '../../../common/interfaces';

export class VehicleService extends BaseApiService {
  constructor() {
    super('/vehicles');
  }

  /**
   * Get all vehicles with filtering and sorting
   */
  async getAll(params?: VehicleFilters): Promise<any> {
    return super.getAll<Vehicle>(params);
  }

  /**
   * Get vehicle by ID (with media)
   */
  async getVehicleById(vehicleId: string): Promise<ApiResponse<Vehicle>> {
    return this.getById<Vehicle>(`/${vehicleId}`);
  }

  /**
   * Get vehicle statistics
   */
  async getStats(): Promise<ApiResponse<VehicleStats>> {
    return this.get<VehicleStats>('/stats');
  }

  /**
   * Get vehicle body-type summary
   */
  async getBodyTypeSummary(): Promise<ApiResponse<{ bodyType: string; count: number }[]>> {
    return this.get<{ bodyType: string; count: number }[]>('/body-types/summary');
  }

  /**
   * Get filter metadata (sidebar filters)
   */
  async getFilterMetadata(): Promise<
    ApiResponse<{
      bodyTypes: { bodyType: string; count: number }[];
      brands: { make: string; count: number }[];
    }>
  > {
    return this.get<{
      bodyTypes: { bodyType: string; count: number }[];
      brands: { make: string; count: number }[];
    }>('/filters/metadata');
  }
}

export const vehicleService = new VehicleService();