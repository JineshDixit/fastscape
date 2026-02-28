import { BaseApiService } from '../base';
import type {
  ApiResponse,
  Vehicle,
  VehicleStats,
  VehicleEnums,
  VehicleFilters,
  VehicleListResponse,
  VehicleSearchParams,
} from '../../../common/interfaces';

export class VehicleService extends BaseApiService {
  constructor() {
    super('/vehicles');
  }

  /**
   * Get all vehicles with filtering and sorting
   */
  async getVehicles(params?: VehicleFilters): Promise<ApiResponse<VehicleListResponse>> {
    return this.get<VehicleListResponse>('', { params });
  }

  /**
   * Search available vehicles with pickup/dropoff dates and location
   */
  async searchAvailableVehicles(params: VehicleSearchParams): Promise<ApiResponse<VehicleListResponse>> {
    return this.get<VehicleListResponse>('/available', { params });
  }

  /**
   * Get vehicle by ID (with media)
   */
  async getVehicleById(vehicleId: string): Promise<ApiResponse<Vehicle>> {
    return this.getById<Vehicle>(vehicleId);
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

  async getFilterMetadata(params?: VehicleSearchParams): Promise<
    ApiResponse<{
      bodyTypes: { bodyType: string; count: number; models: string[] }[];
      brands: { make: string; count: number; models: string[] }[];
    }>
  > {
    return this.get<{
      bodyTypes: { bodyType: string; count: number; models: string[] }[];
      brands: { make: string; count: number; models: string[] }[];
    }>('/filters/metadata', { params });
  }
  /**
   * Get most popular car (most booked vehicle)
   */
  async getMostPopularCar(): Promise<ApiResponse<Vehicle & { bookingCount: number }>> {
    return this.get<Vehicle & { bookingCount: number }>('/most-popular');
  }

  /**
   * Check if a specific vehicle is available for a date range
   */
  async checkAvailability(
    vehicleId: string,
    pickupDate: string,
    dropoffDate: string,
  ): Promise<ApiResponse<{ isAvailable: boolean }>> {
    return this.get<{ isAvailable: boolean }>(`/${vehicleId}/availability`, {
      params: { pickupDate, dropoffDate },
    });
  }
}

export const vehicleService = new VehicleService();
