"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const locationController = __importStar(require("../controllers/location/location.controller"));
const authenticateUser_1 = require("../services/middleware/authenticateUser");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(authenticateUser_1.authenticateUser);
/**
 * GET /api/locations/export
 * Export locations to CSV with filters
 * Query params: city, isActive, search
 * Must be before /:id route to avoid route conflict
 */
router.get('/export', locationController.exportLocations);
/**
 * GET /api/locations/cities
 * Get all unique cities
 */
router.get('/cities', locationController.getAllCities);
/**
 * GET /api/locations
 * Get all locations with filters
 * Query params: city, isActive, search, page, limit, sortBy, sortOrder
 */
router.get('/', locationController.getAllLocations);
/**
 * GET /api/locations/:id
 * Get single location by ID
 */
router.get('/:id', locationController.getLocationById);
/**
 * POST /api/locations
 * Create a new location
 */
router.post('/', locationController.createLocation);
/**
 * PUT /api/locations/:id
 * Update location details
 */
router.put('/:id', locationController.updateLocation);
/**
 * PATCH /api/locations/:id/toggle-status
 * Toggle location active status
 */
router.patch('/:id/toggle-status', locationController.toggleLocationStatus);
/**
 * DELETE /api/locations/:id
 * Delete location
 */
router.delete('/:id', locationController.deleteLocation);
exports.default = router;
//# sourceMappingURL=location.routes.js.map