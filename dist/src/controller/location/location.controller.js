"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationController = void 0;
const controller_utils_1 = require("../../utils/controller.utils");
const response_utils_1 = require("../../utils/response.utils");
const location_service_1 = require("../../services/location/location.service");
const googlePlaces_service_1 = require("../../services/location/googlePlaces.service");
class LocationController extends controller_utils_1.BaseController {
    constructor() {
        super(...arguments);
        /**
         * Get all active locations
         * Optional query params: type, city
         */
        this.getLocations = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { type, city } = req.query;
            const locations = yield location_service_1.locationService.getLocations({
                city: city,
            });
            (0, response_utils_1.sendSuccess)(res, 'Locations fetched successfully', locations);
        }));
        /**
         * Get Google Places autocomplete predictions
         * Query params: input (required), restrictToDubai (optional, default: true)
         */
        this.getPlacesAutocomplete = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { input, restrictToDubai } = req.query;
            if (!input || typeof input !== 'string') {
                throw new Error('Input query parameter is required');
            }
            const predictions = yield googlePlaces_service_1.googlePlacesService.getAutocompletePredictions({
                input,
                restrictToDubai: restrictToDubai !== 'false', // Default to true
            });
            (0, response_utils_1.sendSuccess)(res, 'Place predictions fetched successfully', predictions);
        }));
        /**
         * Get place details by place ID
         * Query params: placeId (required)
         */
        this.getPlaceDetails = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { placeId } = req.query;
            if (!placeId || typeof placeId !== 'string') {
                throw new Error('Place ID query parameter is required');
            }
            const placeDetails = yield googlePlaces_service_1.googlePlacesService.getPlaceDetails(placeId);
            (0, response_utils_1.sendSuccess)(res, 'Place details fetched successfully', placeDetails);
        }));
    }
}
exports.locationController = new LocationController();
//# sourceMappingURL=location.controller.js.map