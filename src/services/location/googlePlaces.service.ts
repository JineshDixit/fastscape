import axios from 'axios';

interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface AutocompleteOptions {
  input: string;
  restrictToDubai?: boolean;
}

class GooglePlacesService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';

    if (!this.apiKey) {
      console.warn('GOOGLE_MAPS_API_KEY not configured. Google Places features will be disabled.');
    }
  }

  /**
   * Check if Google Places service is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get place autocomplete predictions using New Places API
   * @param options - Autocomplete options
   * @returns Array of place predictions
   */
  async getAutocompletePredictions(options: AutocompleteOptions): Promise<PlacePrediction[]> {
    if (!this.isAvailable()) {
      throw new Error('Google Places service is not configured');
    }

    const { input, restrictToDubai = true } = options;

    // Validate input
    if (!input || input.trim().length < 3) {
      return [];
    }

    try {
      const requestBody: any = {
        input: input.trim(),
        includedRegionCodes: ['ae'], // Restrict to UAE
      };

      // Add location bias for Dubai if enabled
      if (restrictToDubai) {
        requestBody.locationBias = {
          circle: {
            center: {
              latitude: 25.2048,
              longitude: 55.2708,
            },
            radius: 50000, // 50km
          },
        };
      }

      console.log('Google Places API (New) Request:', {
        input: input.trim(),
        restrictToDubai,
      });

      const response = await axios.post('https://places.googleapis.com/v1/places:autocomplete', requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
        },
      });

      console.log('Google Places API (New) Response:', {
        suggestionsCount: response.data.suggestions?.length || 0,
      });

      if (response.data.suggestions && response.data.suggestions.length > 0) {
        return response.data.suggestions.map((suggestion: any) => {
          const placePrediction = suggestion.placePrediction;
          return {
            placeId: placePrediction.placeId || placePrediction.place,
            description: placePrediction.text?.text || '',
            mainText: placePrediction.structuredFormat?.mainText?.text || placePrediction.text?.text || '',
            secondaryText: placePrediction.structuredFormat?.secondaryText?.text || '',
          };
        });
      }

      return [];
    } catch (error: any) {
      console.error('Error with New Places API:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw new Error('Failed to fetch place suggestions');
    }
  }

  /**
   * Get place details by place ID using New Places API
   * @param placeId - Google Place ID
   * @returns Place details including coordinates
   */
  async getPlaceDetails(placeId: string) {
    if (!this.isAvailable()) {
      throw new Error('Google Places service is not configured');
    }

    if (!placeId) {
      throw new Error('Place ID is required');
    }

    try {
      console.log('Getting place details for:', placeId);

      const response = await axios.get(`https://places.googleapis.com/v1/${placeId}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,addressComponents',
        },
      });

      console.log('Place details retrieved');

      const place = response.data;
      return {
        placeId: place.id,
        name: place.displayName?.text || '',
        formattedAddress: place.formattedAddress || '',
        latitude: place.location?.latitude,
        longitude: place.location?.longitude,
        addressComponents: place.addressComponents || [],
      };
    } catch (error: any) {
      console.error('Error fetching place details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error('Failed to fetch place details');
    }
  }
}

export const googlePlacesService = new GooglePlacesService();
