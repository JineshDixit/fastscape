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
exports.bulkUpdateVehicleAvailability = exports.toggleVehicleAvailability = exports.getVehicleStats = exports.deleteVehicle = exports.updateVehicle = exports.getVehicles = exports.getVehicleById = exports.createVehicle = void 0;
const vehicle_model_1 = require("../../models/vehicle.model");
const vehicleMedia_model_1 = require("../../models/vehicleMedia.model");
const location_model_1 = require("../../models/location.model");
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const errorHandler_1 = require("../middleware/errorHandler");
const models_1 = require("../../models");
const uploadDir = path.join(process.cwd(), 'uploads', 'vehicles');
/**
 * Ensure upload directory exists
 */
const ensureUploadDirectoryExists = () => {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
};
/**
 * Get file extension from filename
 */
const getFileExtension = (filename) => {
    var _a;
    return ((_a = filename.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || 'jpg';
};
/**
 * Handle vehicle image uploads
 */
const handleVehicleImages = (vehicleId, imageFiles, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    const vehicleDir = path.join(uploadDir, vehicleId);
    // Ensure vehicle directory exists
    if (!fs.existsSync(vehicleDir)) {
        fs.mkdirSync(vehicleDir, { recursive: true });
    }
    // Find or create vehicle media record
    let vehicleMedia = yield vehicleMedia_model_1.VehicleMedia.findOne({
        where: { vehicleId },
        transaction,
    });
    if (!vehicleMedia) {
        vehicleMedia = yield vehicleMedia_model_1.VehicleMedia.create({
            vehicleId,
            isPrimary: true,
        }, { transaction });
    }
    const imageUpdates = {};
    // Process each image type
    const imageTypes = [
        'frontImage',
        'backImage',
        'leftSideImage',
        'rightSideImage',
        'frontLeftImage',
        'frontRightImage',
        'interiorFrontImage',
        'interiorBackImage',
        'dashboardImage',
        'engineImage',
    ];
    for (const imageType of imageTypes) {
        const files = imageFiles[imageType];
        if (files && files.length > 0) {
            const file = files[0]; // Take the first file
            const fileName = `${imageType}_${Date.now()}_${(0, uuid_1.v4)()}.${getFileExtension(file.originalname)}`;
            const filePath = path.join(vehicleDir, fileName);
            // Save file to disk
            fs.writeFileSync(filePath, file.buffer);
            // Store relative path in database
            const relativePath = path.join('uploads', 'vehicles', vehicleId, fileName);
            imageUpdates[imageType] = relativePath;
            // Delete old image if exists
            const oldImagePath = vehicleMedia[imageType];
            if (oldImagePath && fs.existsSync(path.join(process.cwd(), oldImagePath))) {
                fs.unlinkSync(path.join(process.cwd(), oldImagePath));
            }
        }
    }
    // Update vehicle media record
    if (Object.keys(imageUpdates).length > 0) {
        yield vehicleMedia.update(imageUpdates, { transaction });
    }
});
/**
 * Delete vehicle images
 */
const deleteVehicleImages = (vehicleId, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    const vehicleMedia = yield vehicleMedia_model_1.VehicleMedia.findOne({
        where: { vehicleId },
        transaction,
    });
    if (vehicleMedia) {
        // Delete physical files
        const vehicleDir = path.join(uploadDir, vehicleId);
        if (fs.existsSync(vehicleDir)) {
            fs.rmSync(vehicleDir, { recursive: true, force: true });
        }
        // Delete database record
        yield vehicleMedia.destroy({ transaction });
    }
});
/**
 * Create a new vehicle
 */
const createVehicle = (vehicleData, imageFiles) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield models_1.sequelize.transaction();
    try {
        ensureUploadDirectoryExists();
        // Create vehicle record
        const vehicle = yield vehicle_model_1.Vehicle.create(vehicleData, { transaction });
        // Handle image uploads if provided
        if (imageFiles) {
            yield handleVehicleImages(vehicle.id, imageFiles, transaction);
        }
        yield transaction.commit();
        // Return vehicle with media
        return yield (0, exports.getVehicleById)(vehicle.id);
    }
    catch (error) {
        yield transaction.rollback();
        throw (0, errorHandler_1.createError)(`Failed to create vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
    }
});
exports.createVehicle = createVehicle;
/**
 * Get vehicle by ID with media and location
 */
const getVehicleById = (vehicleId) => __awaiter(void 0, void 0, void 0, function* () {
    const vehicle = yield vehicle_model_1.Vehicle.findByPk(vehicleId, {
        include: [
            {
                model: vehicleMedia_model_1.VehicleMedia,
                as: 'media',
            },
            {
                model: location_model_1.Location,
                as: 'location',
                attributes: ['id', 'name', 'city', 'code'],
            },
        ],
    });
    if (!vehicle) {
        throw (0, errorHandler_1.createError)('Vehicle not found', 404);
    }
    return vehicle;
});
exports.getVehicleById = getVehicleById;
/**
 * Get all vehicles with filtering and pagination
 */
const getVehicles = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, pagination = {}) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = pagination;
    const offset = (page - 1) * limit;
    // Build where clause
    const whereClause = {};
    if (filters.make) {
        whereClause.make = { [sequelize_1.Op.iLike]: `%${filters.make}%` };
    }
    if (filters.model) {
        whereClause.model = { [sequelize_1.Op.iLike]: `%${filters.model}%` };
    }
    if (filters.bodyType) {
        whereClause.bodyType = filters.bodyType;
    }
    if (filters.transmission) {
        whereClause.transmission = filters.transmission;
    }
    if (filters.fuelType) {
        whereClause.fuelType = filters.fuelType;
    }
    if (filters.isAvailable !== undefined) {
        whereClause.isAvailable = filters.isAvailable;
    }
    if (filters.minPrice || filters.maxPrice) {
        whereClause.pricePerDay = {};
        if (filters.minPrice) {
            whereClause.pricePerDay[sequelize_1.Op.gte] = filters.minPrice;
        }
        if (filters.maxPrice) {
            whereClause.pricePerDay[sequelize_1.Op.lte] = filters.maxPrice;
        }
    }
    if (filters.year) {
        whereClause.year = filters.year;
    }
    if (filters.city) {
        whereClause.city = { [sequelize_1.Op.iLike]: `%${filters.city}%` };
    }
    if (filters.passengerCapacity) {
        whereClause.passengerCapacity = { [sequelize_1.Op.gte]: filters.passengerCapacity };
    }
    if (filters.search) {
        whereClause[sequelize_1.Op.or] = [
            { make: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { model: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { trim: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { exteriorColor: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
        ];
    }
    const { count, rows } = yield vehicle_model_1.Vehicle.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: vehicleMedia_model_1.VehicleMedia,
                as: 'media',
            },
            {
                model: location_model_1.Location,
                as: 'location',
                attributes: ['id', 'name', 'city', 'code'],
            },
        ],
        limit,
        offset,
        order: [[sortBy, sortOrder]],
    });
    return {
        vehicles: rows,
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
    };
});
exports.getVehicles = getVehicles;
/**
 * Update vehicle
 */
const updateVehicle = (vehicleId, updateData, imageFiles) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield models_1.sequelize.transaction();
    try {
        const vehicle = yield vehicle_model_1.Vehicle.findByPk(vehicleId);
        if (!vehicle) {
            throw (0, errorHandler_1.createError)('Vehicle not found', 404);
        }
        // Update vehicle data
        yield vehicle.update(updateData, { transaction });
        // Handle image updates if provided
        if (imageFiles) {
            yield handleVehicleImages(vehicleId, imageFiles, transaction);
        }
        yield transaction.commit();
        return yield (0, exports.getVehicleById)(vehicleId);
    }
    catch (error) {
        yield transaction.rollback();
        throw error;
    }
});
exports.updateVehicle = updateVehicle;
/**
 * Delete vehicle
 */
const deleteVehicle = (vehicleId) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield models_1.sequelize.transaction();
    try {
        const vehicle = yield vehicle_model_1.Vehicle.findByPk(vehicleId);
        if (!vehicle) {
            throw (0, errorHandler_1.createError)('Vehicle not found', 404);
        }
        // Delete associated media files
        yield deleteVehicleImages(vehicleId, transaction);
        // Delete vehicle record
        yield vehicle.destroy({ transaction });
        yield transaction.commit();
    }
    catch (error) {
        yield transaction.rollback();
        throw error;
    }
});
exports.deleteVehicle = deleteVehicle;
/**
 * Get vehicle statistics
 */
const getVehicleStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const total = yield vehicle_model_1.Vehicle.count();
    const available = yield vehicle_model_1.Vehicle.count({ where: { isAvailable: true } });
    const unavailable = total - available;
    // Get stats by body type
    const bodyTypeStats = yield vehicle_model_1.Vehicle.findAll({
        attributes: ['bodyType', [vehicle_model_1.Vehicle.sequelize.fn('COUNT', vehicle_model_1.Vehicle.sequelize.col('id')), 'count']],
        group: ['bodyType'],
        raw: true,
    });
    const byBodyType = {};
    bodyTypeStats.forEach((stat) => {
        byBodyType[stat.bodyType] = parseInt(stat.count);
    });
    // Get stats by fuel type
    const fuelTypeStats = yield vehicle_model_1.Vehicle.findAll({
        attributes: ['fuelType', [vehicle_model_1.Vehicle.sequelize.fn('COUNT', vehicle_model_1.Vehicle.sequelize.col('id')), 'count']],
        group: ['fuelType'],
        raw: true,
    });
    const byFuelType = {};
    fuelTypeStats.forEach((stat) => {
        byFuelType[stat.fuelType] = parseInt(stat.count);
    });
    // Get average price
    const avgPriceResult = yield vehicle_model_1.Vehicle.findOne({
        attributes: [[vehicle_model_1.Vehicle.sequelize.fn('AVG', vehicle_model_1.Vehicle.sequelize.col('pricePerDay')), 'avgPrice']],
        raw: true,
    });
    const averagePrice = parseFloat((avgPriceResult === null || avgPriceResult === void 0 ? void 0 : avgPriceResult.avgPrice) || '0');
    return {
        total,
        available,
        unavailable,
        byBodyType,
        byFuelType,
        averagePrice,
    };
});
exports.getVehicleStats = getVehicleStats;
/**
 * Toggle vehicle availability
 */
const toggleVehicleAvailability = (vehicleId) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield models_1.sequelize.transaction();
    try {
        const vehicle = yield vehicle_model_1.Vehicle.findByPk(vehicleId);
        if (!vehicle) {
            throw (0, errorHandler_1.createError)('Vehicle not found', 404);
        }
        yield vehicle.update({ isAvailable: !vehicle.isAvailable }, { transaction });
        yield transaction.commit();
        return yield (0, exports.getVehicleById)(vehicleId);
    }
    catch (error) {
        yield transaction.rollback();
        throw error;
    }
});
exports.toggleVehicleAvailability = toggleVehicleAvailability;
/**
 * Bulk update vehicle availability
 */
const bulkUpdateVehicleAvailability = (vehicleIds, isAvailable) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield models_1.sequelize.transaction();
    try {
        const [affectedCount] = yield vehicle_model_1.Vehicle.update({ isAvailable }, {
            where: {
                id: {
                    [sequelize_1.Op.in]: vehicleIds,
                },
            },
            transaction,
        });
        yield transaction.commit();
        return affectedCount;
    }
    catch (error) {
        yield transaction.rollback();
        throw error;
    }
});
exports.bulkUpdateVehicleAvailability = bulkUpdateVehicleAvailability;
//# sourceMappingURL=vehicle.service.js.map