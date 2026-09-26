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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googlePlacesService = void 0;
const axios_1 = __importDefault(require("axios"));
class GooglePlacesService {
    constructor() {
        this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
        if (!this.apiKey) {
            console.warn('GOOGLE_MAPS_API_KEY not configured. Google Places features will be disabled.');
        }
    }
    /**
     * Check if Google Places service is available
     */
    isAvailable() {
        return !!this.apiKey;
    }
    /**
     * Get place autocomplete predictions using New Places API
     * @param options - Autocomplete options
     * @returns Array of place predictions
     */
    getAutocompletePredictions(options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            if (!this.isAvailable()) {
                throw new Error('Google Places service is not configured');
            }
            const { input, restrictToDubai = true } = options;
            // Validate input
            if (!input || input.trim().length < 3) {
                return [];
            }
            try {
                const requestBody = {
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
                const response = yield axios_1.default.post('https://places.googleapis.com/v1/places:autocomplete', requestBody, {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': this.apiKey,
                    },
                });
                console.log('Google Places API (New) Response:', {
                    suggestionsCount: ((_a = response.data.suggestions) === null || _a === void 0 ? void 0 : _a.length) || 0,
                });
                if (response.data.suggestions && response.data.suggestions.length > 0) {
                    return response.data.suggestions.map((suggestion) => {
                        var _a, _b, _c, _d, _e, _f;
                        const placePrediction = suggestion.placePrediction;
                        return {
                            placeId: placePrediction.placeId || placePrediction.place,
                            description: ((_a = placePrediction.text) === null || _a === void 0 ? void 0 : _a.text) || '',
                            mainText: ((_c = (_b = placePrediction.structuredFormat) === null || _b === void 0 ? void 0 : _b.mainText) === null || _c === void 0 ? void 0 : _c.text) || ((_d = placePrediction.text) === null || _d === void 0 ? void 0 : _d.text) || '',
                            secondaryText: ((_f = (_e = placePrediction.structuredFormat) === null || _e === void 0 ? void 0 : _e.secondaryText) === null || _f === void 0 ? void 0 : _f.text) || '',
                        };
                    });
                }
                return [];
            }
            catch (error) {
                console.error('Error with New Places API:', {
                    message: error.message,
                    status: (_b = error.response) === null || _b === void 0 ? void 0 : _b.status,
                    statusText: (_c = error.response) === null || _c === void 0 ? void 0 : _c.statusText,
                    data: (_d = error.response) === null || _d === void 0 ? void 0 : _d.data,
                });
                throw new Error('Failed to fetch place suggestions');
            }
        });
    }
    /**
     * Get place details by place ID using New Places API
     * @param placeId - Google Place ID
     * @returns Place details including coordinates
     */
    getPlaceDetails(placeId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            if (!this.isAvailable()) {
                throw new Error('Google Places service is not configured');
            }
            if (!placeId) {
                throw new Error('Place ID is required');
            }
            try {
                console.log('Getting place details for:', placeId);
                const response = yield axios_1.default.get(`https://places.googleapis.com/v1/${placeId}`, {
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
                    name: ((_a = place.displayName) === null || _a === void 0 ? void 0 : _a.text) || '',
                    formattedAddress: place.formattedAddress || '',
                    latitude: (_b = place.location) === null || _b === void 0 ? void 0 : _b.latitude,
                    longitude: (_c = place.location) === null || _c === void 0 ? void 0 : _c.longitude,
                    addressComponents: place.addressComponents || [],
                };
            }
            catch (error) {
                console.error('Error fetching place details:', {
                    message: error.message,
                    status: (_d = error.response) === null || _d === void 0 ? void 0 : _d.status,
                    data: (_e = error.response) === null || _e === void 0 ? void 0 : _e.data,
                });
                throw new Error('Failed to fetch place details');
            }
        });
    }
}
exports.googlePlacesService = new GooglePlacesService();
//# sourceMappingURL=googlePlaces.service.js.map