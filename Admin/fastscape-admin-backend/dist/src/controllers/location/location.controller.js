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
exports.exportLocations = exports.deleteLocation = exports.toggleLocationStatus = exports.updateLocation = exports.createLocation = exports.getLocationById = exports.getAllCities = exports.getAllLocations = void 0;
const locationService = __importStar(require("../../services/location/location.service"));
/**
 * GET /api/locations
 * Get all locations with filters and pagination
 */
const getAllLocations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filters = {
            city: req.query.city,
            isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
            search: req.query.search,
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder,
        };
        const result = yield locationService.getAllLocations(filters);
        res.status(200).json({
            success: true,
            data: result.locations,
            pagination: result.pagination,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch locations',
                code: 'LOCATION_FETCH_ERROR',
            },
        });
    }
});
exports.getAllLocations = getAllLocations;
/**
 * GET /api/locations/cities
 * Get all unique cities
 */
const getAllCities = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cities = yield locationService.getAllCities();
        res.status(200).json({
            success: true,
            data: cities,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch cities',
                code: 'CITIES_FETCH_ERROR',
            },
        });
    }
});
exports.getAllCities = getAllCities;
/**
 * GET /api/locations/:id
 * Get single location by ID
 */
const getLocationById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const location = yield locationService.getLocationById(id);
        res.status(200).json({
            success: true,
            data: location,
        });
    }
    catch (error) {
        res.status(404).json({
            success: false,
            error: {
                message: error.message || 'Location not found',
                code: 'LOCATION_NOT_FOUND',
            },
        });
    }
});
exports.getLocationById = getLocationById;
/**
 * POST /api/locations
 * Create a new location
 */
const createLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const location = yield locationService.createLocation(req.body);
        res.status(201).json({
            success: true,
            data: location,
            message: 'Location created successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to create location',
                code: 'CREATE_ERROR',
            },
        });
    }
});
exports.createLocation = createLocation;
/**
 * PUT /api/locations/:id
 * Update location details
 */
const updateLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const location = yield locationService.updateLocation(id, req.body);
        res.status(200).json({
            success: true,
            data: location,
            message: 'Location updated successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to update location',
                code: 'UPDATE_ERROR',
            },
        });
    }
});
exports.updateLocation = updateLocation;
/**
 * PATCH /api/locations/:id/toggle-status
 * Toggle location active status
 */
const toggleLocationStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const location = yield locationService.toggleLocationStatus(id);
        res.status(200).json({
            success: true,
            data: location,
            message: `Location ${location.isActive ? 'activated' : 'deactivated'} successfully`,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to toggle location status',
                code: 'TOGGLE_STATUS_ERROR',
            },
        });
    }
});
exports.toggleLocationStatus = toggleLocationStatus;
/**
 * DELETE /api/locations/:id
 * Delete location
 */
const deleteLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield locationService.deleteLocation(id);
        res.status(200).json({
            success: true,
            message: 'Location deleted successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to delete location',
                code: 'DELETE_ERROR',
            },
        });
    }
});
exports.deleteLocation = deleteLocation;
/**
 * GET /api/locations/export
 * Export locations to CSV with filters
 */
const exportLocations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { CSVExportService } = yield Promise.resolve().then(() => __importStar(require('../../services/csv/csvExport.service')));
        const filters = {
            city: req.query.city,
            isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
            search: req.query.search,
        };
        const locations = yield locationService.exportLocationsToCSV(filters);
        const columns = [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'code', label: 'Code' },
            { key: 'city', label: 'City' },
            {
                key: 'isActive',
                label: 'Active',
                format: CSVExportService.formatBoolean,
            },
            {
                key: 'createdAt',
                label: 'Created At',
                format: CSVExportService.formatDateTime,
            },
            {
                key: 'updatedAt',
                label: 'Updated At',
                format: CSVExportService.formatDateTime,
            },
        ];
        const csv = CSVExportService.generateCSV(locations, columns);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=locations-${Date.now()}.csv`);
        res.status(200).send(csv);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to export locations',
                code: 'EXPORT_ERROR',
            },
        });
    }
});
exports.exportLocations = exportLocations;
//# sourceMappingURL=location.controller.js.map