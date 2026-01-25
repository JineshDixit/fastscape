import { Response } from 'express';
import { BaseController } from '../../utils/controller.utils';
import { sendSuccess } from '../../utils/response.utils';
import { AuthenticatedRequest } from 'expressTypes';
import { locationService } from '../../services/location/location.service';

class LocationController extends BaseController {
  /**
   * Get all active locations
   * Optional query params: type, city
   */
  getLocations = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { type, city } = req.query;

    const locations = await locationService.getLocations({
      type: type as string,
      city: city as string,
    });

    sendSuccess(res, 'Locations fetched successfully', locations);
  });
}

export const locationController = new LocationController();
