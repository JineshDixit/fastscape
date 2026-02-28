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
exports.getVehicleEnumsController = exports.bulkUpdateAvailabilityController = exports.toggleAvailabilityController = exports.getVehicleStatsController = exports.deleteVehicleController = exports.updateVehicleController = exports.getVehicleByIdController = exports.getVehiclesController = exports.createVehicleController = void 0;
const vehicle_service_1 = require("../../services/vehicle/vehicle.service");
const express_validator_1 = require("express-validator");
const response_utils_1 = require("../../utils/response.utils");
const errorHandler_1 = require("../../services/middleware/errorHandler");
const dbEnums_1 = require("../../common/enum/dbEnums");
/**
 * Create a new vehicle
 */
const createVehicleController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            throw (0, errorHandler_1.createError)('Validation failed', 400);
        }
        const vehicleData = {
            make: req.body.make,
            model: req.body.model,
            trim: req.body.trim,
            year: parseInt(req.body.year),
            exteriorColor: req.body.exteriorColor,
            interiorColor: req.body.interiorColor,
            bodyType: req.body.bodyType,
            transmission: req.body.transmission,
            drivetrain: req.body.drivetrain,
            engine: req.body.engine,
            horsepower: parseInt(req.body.horsepower),
            fuelType: req.body.fuelType,
            fuelConsumption: req.body.fuelConsumption,
            pricePerDay: parseFloat(req.body.pricePerDay),
            delayChargePerHour: req.body.delayChargePerHour ? parseFloat(req.body.delayChargePerHour) : undefined,
            depositPercentage: req.body.depositPercentage ? parseFloat(req.body.depositPercentage) : undefined,
            currency: req.body.currency || 'USD',
            isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable === 'true' : true,
            passengerCapacity: req.body.passengerCapacity ? parseInt(req.body.passengerCapacity) : 5,
            locationId: req.body.locationId || undefined,
        };
        // Handle image files
        const imageFiles = req.files;
        const vehicle = yield (0, vehicle_service_1.createVehicle)(vehicleData, imageFiles);
        (0, response_utils_1.sendCreated)(res, 'Vehicle created successfully', vehicle);
    }
    catch (error) {
        next(error);
    }
});
exports.createVehicleController = createVehicleController;
/**
 * Get all vehicles with filtering and pagination
 */
const getVehiclesController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filters = {
            make: req.query.make,
            model: req.query.model,
            bodyType: req.query.bodyType,
            transmission: req.query.transmission,
            fuelType: req.query.fuelType,
            isAvailable: req.query.isAvailable ? req.query.isAvailable === 'true' : undefined,
            minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
            maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
            year: req.query.year ? parseInt(req.query.year) : undefined,
            passengerCapacity: req.query.passengerCapacity ? parseInt(req.query.passengerCapacity) : undefined,
            search: req.query.search,
        };
        const pagination = {
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 10,
            sortBy: req.query.sortBy || 'createdAt',
            sortOrder: req.query.sortOrder || 'DESC',
        };
        const result = yield (0, vehicle_service_1.getVehicles)(filters, pagination);
        (0, response_utils_1.sendSuccess)(res, 'Vehicles retrieved successfully', result);
    }
    catch (error) {
        next(error);
    }
});
exports.getVehiclesController = getVehiclesController;
/**
 * Get vehicle by ID
 */
const getVehicleByIdController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const vehicle = yield (0, vehicle_service_1.getVehicleById)(id);
        (0, response_utils_1.sendSuccess)(res, 'Vehicle retrieved successfully', vehicle);
    }
    catch (error) {
        next(error);
    }
});
exports.getVehicleByIdController = getVehicleByIdController;
/**
 * Update vehicle
 */
const updateVehicleController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            throw (0, errorHandler_1.createError)('Validation failed', 400);
        }
        const { id } = req.params;
        const updateData = {};
        // Only include fields that are provided
        if (req.body.make !== undefined)
            updateData.make = req.body.make;
        if (req.body.model !== undefined)
            updateData.model = req.body.model;
        if (req.body.trim !== undefined)
            updateData.trim = req.body.trim;
        if (req.body.year !== undefined)
            updateData.year = parseInt(req.body.year);
        if (req.body.exteriorColor !== undefined)
            updateData.exteriorColor = req.body.exteriorColor;
        if (req.body.interiorColor !== undefined)
            updateData.interiorColor = req.body.interiorColor;
        if (req.body.bodyType !== undefined)
            updateData.bodyType = req.body.bodyType;
        if (req.body.transmission !== undefined)
            updateData.transmission = req.body.transmission;
        if (req.body.drivetrain !== undefined)
            updateData.drivetrain = req.body.drivetrain;
        if (req.body.engine !== undefined)
            updateData.engine = req.body.engine;
        if (req.body.horsepower !== undefined)
            updateData.horsepower = parseInt(req.body.horsepower);
        if (req.body.fuelType !== undefined)
            updateData.fuelType = req.body.fuelType;
        if (req.body.fuelConsumption !== undefined)
            updateData.fuelConsumption = req.body.fuelConsumption;
        if (req.body.pricePerDay !== undefined)
            updateData.pricePerDay = parseFloat(req.body.pricePerDay);
        if (req.body.delayChargePerHour !== undefined)
            updateData.delayChargePerHour = parseFloat(req.body.delayChargePerHour);
        if (req.body.depositPercentage !== undefined)
            updateData.depositPercentage = parseFloat(req.body.depositPercentage);
        if (req.body.currency !== undefined)
            updateData.currency = req.body.currency;
        if (req.body.isAvailable !== undefined)
            updateData.isAvailable = req.body.isAvailable === 'true';
        if (req.body.passengerCapacity !== undefined)
            updateData.passengerCapacity = parseInt(req.body.passengerCapacity);
        if (req.body.locationId !== undefined)
            updateData.locationId = req.body.locationId || null;
        // Handle image files
        const imageFiles = req.files;
        const vehicle = yield (0, vehicle_service_1.updateVehicle)(id, updateData, imageFiles);
        (0, response_utils_1.sendSuccess)(res, 'Vehicle updated successfully', vehicle);
    }
    catch (error) {
        next(error);
    }
});
exports.updateVehicleController = updateVehicleController;
/**
 * Delete vehicle
 */
const deleteVehicleController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield (0, vehicle_service_1.deleteVehicle)(id);
        (0, response_utils_1.sendSuccess)(res, 'Vehicle deleted successfully');
    }
    catch (error) {
        next(error);
    }
});
exports.deleteVehicleController = deleteVehicleController;
/**
 * Get vehicle statistics
 */
const getVehicleStatsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const stats = yield (0, vehicle_service_1.getVehicleStats)();
        (0, response_utils_1.sendSuccess)(res, 'Vehicle statistics retrieved successfully', stats);
    }
    catch (error) {
        next(error);
    }
});
exports.getVehicleStatsController = getVehicleStatsController;
/**
 * Toggle vehicle availability
 */
const toggleAvailabilityController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const vehicle = yield (0, vehicle_service_1.toggleVehicleAvailability)(id);
        (0, response_utils_1.sendSuccess)(res, 'Vehicle availability updated successfully', vehicle);
    }
    catch (error) {
        next(error);
    }
});
exports.toggleAvailabilityController = toggleAvailabilityController;
/**
 * Bulk update vehicle availability
 */
const bulkUpdateAvailabilityController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            throw (0, errorHandler_1.createError)('Validation failed', 400);
        }
        const { vehicleIds, isAvailable } = req.body;
        const affectedCount = yield (0, vehicle_service_1.bulkUpdateVehicleAvailability)(vehicleIds, isAvailable);
        (0, response_utils_1.sendSuccess)(res, `${affectedCount} vehicles updated successfully`, { affectedCount });
    }
    catch (error) {
        next(error);
    }
});
exports.bulkUpdateAvailabilityController = bulkUpdateAvailabilityController;
/**
 * Get vehicle enums for form dropdowns
 */
const getVehicleEnumsController = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const enums = {
            bodyTypes: dbEnums_1.dbEnums.VEHICLE_BODY_TYPE,
            transmissionTypes: dbEnums_1.dbEnums.TRANSMISSION_TYPE,
            drivetrainTypes: dbEnums_1.dbEnums.DRIVETRAIN_TYPE,
            fuelTypes: dbEnums_1.dbEnums.FUEL_TYPE,
        };
        (0, response_utils_1.sendSuccess)(res, 'Vehicle enums retrieved successfully', enums);
    }
    catch (error) {
        next(error);
    }
});
exports.getVehicleEnumsController = getVehicleEnumsController;
//# sourceMappingURL=vehicle.controller.js.map