"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const location_controller_1 = require("../controller/location/location.controller");
const router = (0, express_1.Router)();
// Get all locations (existing)
router.get('/', location_controller_1.locationController.getLocations);
// Google Places autocomplete
router.get('/places/autocomplete', location_controller_1.locationController.getPlacesAutocomplete);
// Get place details by place ID
router.get('/places/details', location_controller_1.locationController.getPlaceDetails);
exports.default = router;
//# sourceMappingURL=location.routes.js.map