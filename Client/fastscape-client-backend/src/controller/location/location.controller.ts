import { Response } from 'express';
import { BaseController } from '../../utils/controller.utils';
import { sendSuccess } from '../../utils/response.utils';
import { AuthenticatedRequest } from 'expressTypes';
import { locationService } from '../../services/location/location.service';
import { googlePlacesService } from '../../services/location/googlePlaces.service';

class LocationController extends BaseController {
  /**
   * Get all active locations
   * Optional query params: type, city
   */
  getLocations = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { type, city } = req.query;

    const locations = await locationService.getLocations({
      city: city as string,
    });

    sendSuccess(res, 'Locations fetched successfully', locations);
  });

  /**
   * Get Google Places autocomplete predictions
   * Query params: input (required), restrictToDubai (optional, default: true)
   */
  getPlacesAutocomplete = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { input, restrictToDubai } = req.query;

    if (!input || typeof input !== 'string') {
      throw new Error('Input query parameter is required');
    }

    const predictions = await googlePlacesService.getAutocompletePredictions({
      input,
      restrictToDubai: restrictToDubai !== 'false', // Default to true
    });

    sendSuccess(res, 'Place predictions fetched successfully', predictions);
  });

  /**
   * Get place details by place ID
   * Query params: placeId (required)
   */
  getPlaceDetails = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { placeId } = req.query;

    if (!placeId || typeof placeId !== 'string') {
      throw new Error('Place ID query parameter is required');
    }

    const placeDetails = await googlePlacesService.getPlaceDetails(placeId);

    sendSuccess(res, 'Place details fetched successfully', placeDetails);
  });
}

export const locationController = new LocationController();
