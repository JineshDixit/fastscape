import { BaseApiService } from "../base";
import type { ApiResponse } from "@/common/interface/apiInterface";
import type {
  Vehicle,
  VehicleStats,
  VehicleEnums,
  VehicleFilters,
  VehicleBulkUpdateResponse,
} from "@/common/interface/vehicleInterface";

export class VehicleService extends BaseApiService {
  constructor() {
    super("/vehicles");
  }

  /**
   * Get all vehicles with filtering and sorting
   */
  async getAll(params?: VehicleFilters): Promise<any> {
    // The API returns a PaginatedResponse structure, which BaseApiService.getAll handles if passed params
    // However, if the API response structure for this specfic endpoint differs slightly or we want strict typing on standard getAll:
    return super.getAll<Vehicle>(params);
  }

  /**
   * Get vehicle statistics
   */
  async getStats(): Promise<ApiResponse<VehicleStats>> {
    return this.get<VehicleStats>("/stats");
  }

  /**
   * Get vehicle enums (dropdown options)
   */
  async getEnums(): Promise<ApiResponse<VehicleEnums>> {
    return this.get<VehicleEnums>("/enums");
  }

  /**
   * Create a new vehicle with image uploads
   * @param data FormData object containing fields and files
   */
  async createVehicle(data: FormData): Promise<ApiResponse<Vehicle>> {
    // We override the default create to handle FormData and specific headers if needed,
    // though axios handles FormData automatically.
    return this.post<Vehicle, FormData>("", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  /**
   * Update an existing vehicle
   * @param id Vehicle ID
   * @param data FormData object
   */
  async updateVehicle(
    id: string,
    data: FormData
  ): Promise<ApiResponse<Vehicle>> {
    return this.put<Vehicle, FormData>(`/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  /**
   * Toggle vehicle availability status
   */
  async toggleAvailability(id: string): Promise<ApiResponse<Vehicle>> {
    return this.patch<Vehicle>(`/${id}/toggle-availability`);
  }

  /**
   * Bulk update vehicle availability
   */
  async bulkUpdateAvailability(
    ids: string[],
    isAvailable: boolean
  ): Promise<ApiResponse<VehicleBulkUpdateResponse>> {
    return this.patch<VehicleBulkUpdateResponse>("/bulk/update-availability", {
      vehicleIds: ids,
      isAvailable,
    });
  }
}

export const vehicleService = new VehicleService();
