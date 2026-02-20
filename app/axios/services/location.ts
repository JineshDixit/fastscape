import { BaseApiService } from '../base';
import type { ApiResponse, Location } from '../../../common/interfaces';

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  addressComponents: any[];
}

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

  /**
   * Get Google Places autocomplete predictions
   * @param input - Search query
   * @param restrictToDubai - Restrict results to Dubai area (default: true)
   */
  async getPlacesAutocomplete(input: string, restrictToDubai: boolean = true): Promise<ApiResponse<PlacePrediction[]>> {
    return this.get<PlacePrediction[]>('/places/autocomplete', {
      params: { input, restrictToDubai },
    });
  }

  /**
   * Get place details by place ID
   * @param placeId - Google Place ID
   */
  async getPlaceDetails(placeId: string): Promise<ApiResponse<PlaceDetails>> {
    return this.get<PlaceDetails>('/places/details', {
      params: { placeId },
    });
  }
}

export const locationService = new LocationService();
