import { Router } from 'express';
import { locationController } from '../controller/location/location.controller';

const router = Router();

// Get all locations (existing)
router.get('/', locationController.getLocations);

// Google Places autocomplete
router.get('/places/autocomplete', locationController.getPlacesAutocomplete);

// Get place details by place ID
router.get('/places/details', locationController.getPlaceDetails);

export default router;
