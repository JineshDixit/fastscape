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
exports.checkVehicleAvailability = exports.getMostPopularCar = exports.getAvailableVehicles = exports.getVehicleFilterMetadata = exports.getVehicleBodyTypeSummary = exports.getVehicleStats = exports.getVehicleById = exports.getVehicles = void 0;
const vehicleService = __importStar(require("../../services/vehicle/vehicle.service"));
const controller_utils_1 = require("../../utils/controller.utils");
const response_utils_1 = require("../../utils/response.utils");
const errorHandler_1 = require("../../services/middleware/errorHandler");
class VehicleController extends controller_utils_1.BaseController {
    constructor() {
        super(...arguments);
        /**
         * Get all vehicles with filtering and pagination
         */
        this.getVehicles = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
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
                search: req.query.search,
            };
            const pagination = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 10,
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'DESC',
            };
            const result = yield vehicleService.getVehicles(filters, pagination);
            (0, response_utils_1.sendSuccess)(res, 'Vehicles retrieved successfully', result);
        }));
        /**
         * Get vehicle by ID with media
         */
        this.getVehicleById = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const id = this.getValidatedId(req, 'id');
            const result = yield vehicleService.getVehicleById(id);
            (0, response_utils_1.sendSuccess)(res, 'Vehicle retrieved successfully', result);
        }));
        /**
         * Get vehicle statistics
         */
        this.getVehicleStats = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const stats = yield vehicleService.getVehicleStats();
            (0, response_utils_1.sendSuccess)(res, 'Vehicle statistics retrieved successfully', stats);
        }));
        /**
         * Get vehicle body type summary
         */
        this.getVehicleBodyTypeSummary = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield vehicleService.getVehicleBodyTypeSummary();
            (0, response_utils_1.sendSuccess)(res, 'Vehicle body type summary retrieved successfully', result);
        }));
        /**
         * Get vehicle filter metadata
         */
        this.getVehicleFilterMetadata = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const searchQuery = {
                pickupLocation: req.query.pickupLocation,
                pickupDate: req.query.pickupDate,
                dropoffDate: req.query.dropoffDate,
                bookingType: req.query.bookingType,
            };
            const result = yield vehicleService.getVehicleFilterMetadata(searchQuery);
            (0, response_utils_1.sendSuccess)(res, 'Vehicle filter metadata retrieved successfully', result);
        }));
        /**
         * Search for available vehicles based on date range and location
         */
        this.getAvailableVehicles = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const searchQuery = {
                pickupLocation: req.query.pickupLocation,
                pickupDate: req.query.pickupDate,
                dropoffDate: req.query.dropoffDate,
                bookingType: req.query.bookingType,
                make: req.query.make,
                model: req.query.model,
                bodyType: req.query.bodyType,
                transmission: req.query.transmission,
                fuelType: req.query.fuelType,
                minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
                maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
                search: req.query.search,
            };
            const pagination = {
                page: req.query.page ? parseInt(req.query.page) : 1,
                limit: req.query.limit ? parseInt(req.query.limit) : 10,
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'DESC',
            };
            const result = yield vehicleService.getAvailableVehicles(searchQuery, pagination);
            (0, response_utils_1.sendSuccess)(res, 'Available vehicles retrieved successfully', result);
        }));
        /**
         * Get most popular car (most booked vehicle)
         */
        this.getMostPopularCar = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const result = yield vehicleService.getMostPopularCar();
            (0, response_utils_1.sendSuccess)(res, 'Most popular car retrieved successfully', result);
        }));
        /**
         * Check if a specific vehicle is available for a date range
         */
        this.checkVehicleAvailability = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const id = this.getValidatedId(req, 'id');
            const pickupDate = req.query.pickupDate;
            const dropoffDate = req.query.dropoffDate;
            const excludeUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Exclude current user's bookings
            if (!pickupDate || !dropoffDate) {
                throw (0, errorHandler_1.createError)('pickupDate and dropoffDate are required', 400);
            }
            const result = yield vehicleService.checkVehicleAvailability(id, pickupDate, dropoffDate, excludeUserId);
            (0, response_utils_1.sendSuccess)(res, 'Vehicle availability checked successfully', result);
        }));
    }
}
const vehicleController = new VehicleController();
exports.getVehicles = vehicleController.getVehicles, exports.getVehicleById = vehicleController.getVehicleById, exports.getVehicleStats = vehicleController.getVehicleStats, exports.getVehicleBodyTypeSummary = vehicleController.getVehicleBodyTypeSummary, exports.getVehicleFilterMetadata = vehicleController.getVehicleFilterMetadata, exports.getAvailableVehicles = vehicleController.getAvailableVehicles, exports.getMostPopularCar = vehicleController.getMostPopularCar, exports.checkVehicleAvailability = vehicleController.checkVehicleAvailability;
//# sourceMappingURL=vehicle.controller.js.map