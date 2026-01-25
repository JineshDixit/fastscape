import { BaseApiService } from '../base';
import type { ApiResponse, Location } from '../../../common/interfaces';

export class LocationService extends BaseApiService {
  constructor() {
    super('/locations');
  }

  /**
   * Get all active locations
   */
  async getLocations(): Promise<ApiResponse<Location[]>> {
    return this.get<Location[]>(''); // GET /api/v1/locations
  }
}

export const locationService = new LocationService();
