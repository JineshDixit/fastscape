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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkVehicleAvailability = exports.getVehicleFilterMetadata = exports.getVehicleBodyTypeSummary = exports.getVehicleStats = exports.getAvailableVehicles = exports.getUnavailableVehicleIds = exports.getVehicles = exports.getVehicleById = exports.getMostPopularCar = void 0;
const models_1 = require("../../models");
const location_model_1 = require("../../models/location.model");
const errorHandler_1 = require("../middleware/errorHandler");
const sequelize_1 = require("sequelize");
const validation_utils_1 = require("../../utils/validation.utils");
const database_utils_1 = require("../../utils/database.utils");
/**
 * Get most popular car (most booked vehicle)
 */
const getMostPopularCar = () => __awaiter(void 0, void 0, void 0, function* () {
    // Find vehicle with most bookings
    const bookingStats = yield models_1.Booking.findAll({
        attributes: [
            ['vehicle_id', 'vehicleId'],
            [sequelize_1.Sequelize.fn('COUNT', sequelize_1.Sequelize.col('vehicle_id')), 'bookingCount'],
        ],
        group: ['vehicle_id'],
        order: [[sequelize_1.Sequelize.literal('"bookingCount"'), 'DESC']],
        limit: 1,
        raw: true,
    });
    if (!bookingStats || bookingStats.length === 0) {
        // If no bookings found, return most recently added available vehicle
        const fallbackVehicle = yield models_1.Vehicle.findOne({
            where: { isAvailable: true },
            include: [
                {
                    model: models_1.VehicleMedia,
                    as: 'media',
                },
            ],
            order: [['createdAt', 'DESC']],
        });
        if (!fallbackVehicle) {
            throw (0, errorHandler_1.createError)('No vehicles available', 404);
        }
        return Object.assign(Object.assign({}, fallbackVehicle.toJSON()), { bookingCount: 0 });
    }
    const mostBookedVehicleId = bookingStats[0].vehicleId;
    const bookingCount = parseInt(bookingStats[0].bookingCount);
    // Get full vehicle details with media
    const vehicle = yield models_1.Vehicle.findByPk(mostBookedVehicleId, {
        include: [
            {
                model: models_1.VehicleMedia,
                as: 'media',
            },
        ],
    });
    if (!vehicle) {
        throw (0, errorHandler_1.createError)('Most popular vehicle not found', 404);
    }
    return Object.assign(Object.assign({}, vehicle.toJSON()), { bookingCount });
});
exports.getMostPopularCar = getMostPopularCar;
const getVehicleById = (vehicleId) => __awaiter(void 0, void 0, void 0, function* () {
    const vehicle = yield models_1.Vehicle.findByPk(vehicleId, {
        include: [
            {
                model: models_1.VehicleMedia,
                as: 'media',
            },
        ],
    });
    if (!vehicle) {
        throw (0, errorHandler_1.createError)('Vehicle not found', 404);
    }
    return vehicle;
});
exports.getVehicleById = getVehicleById;
const getVehicles = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (filters = {}, pagination = {}) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = pagination;
    const offset = (page - 1) * limit;
    const whereClause = {};
    if (filters.make && (!Array.isArray(filters.make) || filters.make.length > 0)) {
        whereClause.make = Array.isArray(filters.make) ? { [sequelize_1.Op.in]: filters.make } : { [sequelize_1.Op.iLike]: `%${filters.make}%` };
    }
    if (filters.model && (!Array.isArray(filters.model) || filters.model.length > 0)) {
        const models = Array.isArray(filters.model) ? filters.model : [filters.model];
        // Allow matching either the specific model OR the full 'Make Model' display name
        const modelConditions = models.map((m) => ({
            [sequelize_1.Op.or]: [
                { model: { [sequelize_1.Op.iLike]: m } },
                sequelize_1.Sequelize.where(sequelize_1.Sequelize.fn('CONCAT', sequelize_1.Sequelize.col('make'), ' ', sequelize_1.Sequelize.col('model')), {
                    [sequelize_1.Op.iLike]: m,
                }),
            ],
        }));
        if (whereClause[sequelize_1.Op.or]) {
            // If Op.or already exists, combine conditions
            whereClause[sequelize_1.Op.and] = [{ [sequelize_1.Op.or]: whereClause[sequelize_1.Op.or] }, { [sequelize_1.Op.or]: modelConditions }];
            delete whereClause[sequelize_1.Op.or];
        }
        else {
            whereClause[sequelize_1.Op.or] = modelConditions;
        }
    }
    if (filters.bodyType && (!Array.isArray(filters.bodyType) || filters.bodyType.length > 0)) {
        whereClause.bodyType = Array.isArray(filters.bodyType) ? { [sequelize_1.Op.in]: filters.bodyType } : filters.bodyType;
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
    if (filters.search) {
        const searchConditions = [
            { make: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { model: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { trim: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { exteriorColor: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
        ];
        if (whereClause[sequelize_1.Op.or]) {
            // If Op.or already exists, combine conditions
            whereClause[sequelize_1.Op.and] = [{ [sequelize_1.Op.or]: whereClause[sequelize_1.Op.or] }, { [sequelize_1.Op.or]: searchConditions }];
            delete whereClause[sequelize_1.Op.or];
        }
        else {
            whereClause[sequelize_1.Op.or] = searchConditions;
        }
    }
    const { count, rows } = yield models_1.Vehicle.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: models_1.VehicleMedia,
                as: 'media',
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
 * Get IDs of vehicles that are unavailable for a given date range and location
 */
const getUnavailableVehicleIds = (searchQuery) => __awaiter(void 0, void 0, void 0, function* () {
    const { pickupLocation, pickupDate, dropoffDate, bookingType } = searchQuery;
    let unavailableVehicleIds = [];
    // 1. Find all vehicles that have conflicting bookings in the given range
    if (pickupDate && dropoffDate) {
        const { start, end } = (0, validation_utils_1.normalizeBookingDates)(pickupDate, dropoffDate);
        const conflictingBookings = yield models_1.Booking.findAll({
            attributes: ['vehicleId'],
            where: Object.assign({ bookingStatus: {
                    [sequelize_1.Op.notIn]: ['CANCELLED', 'COMPLETED'],
                } }, (0, database_utils_1.buildDateConflictConditions)(start, end)),
            raw: true,
        });
        unavailableVehicleIds = conflictingBookings.map((b) => b.vehicleId);
    }
    const locationWhereClause = {};
    // 2. Add location filtering for SELF_DRIVE bookings
    if (pickupLocation && bookingType === 'SELF_DRIVE') {
        const location = yield location_model_1.Location.findOne({
            where: {
                [sequelize_1.Op.and]: [{ name: { [sequelize_1.Op.iLike]: `%${pickupLocation.trim()}%` } }, { isActive: true }],
            },
            attributes: ['id'],
        });
        if (location) {
            locationWhereClause.locationId = location.id;
        }
        else {
            // If location not found, force empty results
            locationWhereClause.id = { [sequelize_1.Op.in]: [] };
        }
    }
    return { unavailableVehicleIds, locationWhereClause };
});
exports.getUnavailableVehicleIds = getUnavailableVehicleIds;
const getAvailableVehicles = (searchQuery_1, ...args_1) => __awaiter(void 0, [searchQuery_1, ...args_1], void 0, function* (searchQuery, pagination = {}) {
    const { pickupLocation, pickupDate, dropoffDate, bookingType } = searchQuery, otherFilters = __rest(searchQuery, ["pickupLocation", "pickupDate", "dropoffDate", "bookingType"]);
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = pagination;
    const offset = (page - 1) * limit;
    // 1. Get availability and location restrictions
    const { unavailableVehicleIds, locationWhereClause } = yield (0, exports.getUnavailableVehicleIds)({
        pickupLocation,
        pickupDate,
        dropoffDate,
        bookingType,
    });
    // 2. Build where clause for available vehicles
    const whereClause = Object.assign({ isAvailable: true, id: { [sequelize_1.Op.notIn]: unavailableVehicleIds } }, locationWhereClause);
    // Apply additional filters
    if (otherFilters.make && (!Array.isArray(otherFilters.make) || otherFilters.make.length > 0)) {
        whereClause.make = Array.isArray(otherFilters.make)
            ? { [sequelize_1.Op.in]: otherFilters.make }
            : { [sequelize_1.Op.iLike]: `%${otherFilters.make}%` };
    }
    if (otherFilters.model && (!Array.isArray(otherFilters.model) || otherFilters.model.length > 0)) {
        const models = Array.isArray(otherFilters.model) ? otherFilters.model : [otherFilters.model];
        // Allow matching either the specific model OR the full 'Make Model' display name
        const modelConditions = models.map((m) => ({
            [sequelize_1.Op.or]: [
                { model: { [sequelize_1.Op.iLike]: m } },
                sequelize_1.Sequelize.where(sequelize_1.Sequelize.fn('CONCAT', sequelize_1.Sequelize.col('make'), ' ', sequelize_1.Sequelize.col('model')), {
                    [sequelize_1.Op.iLike]: m,
                }),
            ],
        }));
        if (whereClause[sequelize_1.Op.or]) {
            // If Op.or already exists, combine conditions
            whereClause[sequelize_1.Op.and] = [{ [sequelize_1.Op.or]: whereClause[sequelize_1.Op.or] }, { [sequelize_1.Op.or]: modelConditions }];
            delete whereClause[sequelize_1.Op.or];
        }
        else {
            whereClause[sequelize_1.Op.or] = modelConditions;
        }
    }
    if (otherFilters.bodyType && (!Array.isArray(otherFilters.bodyType) || otherFilters.bodyType.length > 0)) {
        whereClause.bodyType = Array.isArray(otherFilters.bodyType)
            ? { [sequelize_1.Op.in]: otherFilters.bodyType }
            : otherFilters.bodyType;
    }
    if (otherFilters.transmission)
        whereClause.transmission = otherFilters.transmission;
    if (otherFilters.fuelType)
        whereClause.fuelType = otherFilters.fuelType;
    if (otherFilters.minPrice || otherFilters.maxPrice) {
        whereClause.pricePerDay = {};
        if (otherFilters.minPrice)
            whereClause.pricePerDay[sequelize_1.Op.gte] = otherFilters.minPrice;
        if (otherFilters.maxPrice)
            whereClause.pricePerDay[sequelize_1.Op.lte] = otherFilters.maxPrice;
    }
    if (otherFilters.search) {
        const searchConditions = [
            { make: { [sequelize_1.Op.iLike]: `%${otherFilters.search}%` } },
            { model: { [sequelize_1.Op.iLike]: `%${otherFilters.search}%` } },
            { trim: { [sequelize_1.Op.iLike]: `%${otherFilters.search}%` } },
        ];
        if (whereClause[sequelize_1.Op.or]) {
            // If Op.or already exists, combine conditions
            whereClause[sequelize_1.Op.and] = [{ [sequelize_1.Op.or]: whereClause[sequelize_1.Op.or] }, { [sequelize_1.Op.or]: searchConditions }];
            delete whereClause[sequelize_1.Op.or];
        }
        else {
            whereClause[sequelize_1.Op.or] = searchConditions;
        }
    }
    // 3. Query vehicles
    const { count, rows } = yield models_1.Vehicle.findAndCountAll({
        where: whereClause,
        include: [
            {
                model: models_1.VehicleMedia,
                as: 'media',
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
exports.getAvailableVehicles = getAvailableVehicles;
const getVehicleStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const total = yield models_1.Vehicle.count();
    const available = yield models_1.Vehicle.count({ where: { isAvailable: true } });
    const unavailable = total - available;
    const bodyTypeStats = yield models_1.Vehicle.findAll({
        attributes: ['body_type', [models_1.Vehicle.sequelize.fn('COUNT', models_1.Vehicle.sequelize.col('id')), 'count']],
        group: ['body_type'],
        raw: true,
    });
    const byBodyType = {};
    bodyTypeStats.forEach((stat) => {
        byBodyType[stat.body_type] = parseInt(stat.count);
    });
    const fuelTypeStats = yield models_1.Vehicle.findAll({
        attributes: ['fuel_type', [models_1.Vehicle.sequelize.fn('COUNT', models_1.Vehicle.sequelize.col('id')), 'count']],
        group: ['fuel_type'],
        raw: true,
    });
    const byFuelType = {};
    fuelTypeStats.forEach((stat) => {
        byFuelType[stat.fuel_type] = parseInt(stat.count);
    });
    const avgPriceResult = yield models_1.Vehicle.findOne({
        attributes: [[models_1.Vehicle.sequelize.fn('AVG', models_1.Vehicle.sequelize.col('price_per_day')), 'avgPrice']],
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
const getVehicleBodyTypeSummary = () => __awaiter(void 0, void 0, void 0, function* () {
    const results = yield models_1.Vehicle.findAll({
        attributes: ['bodyType', [models_1.Vehicle.sequelize.fn('COUNT', models_1.Vehicle.sequelize.col('id')), 'count']],
        where: { isAvailable: true },
        group: ['bodyType'],
        raw: true,
    });
    return results.map((r) => ({
        bodyType: r.bodyType,
        count: Number(r.count),
    }));
});
exports.getVehicleBodyTypeSummary = getVehicleBodyTypeSummary;
const getVehicleFilterMetadata = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (searchQuery = {}) {
    const { unavailableVehicleIds, locationWhereClause } = yield (0, exports.getUnavailableVehicleIds)(searchQuery);
    const baseWhereClause = Object.assign({ isAvailable: true, id: { [sequelize_1.Op.notIn]: unavailableVehicleIds } }, locationWhereClause);
    // Use explicit aliases to ensure raw results match expected keys exactly
    const bodyTypeRaw = yield models_1.Vehicle.findAll({
        attributes: [
            ['body_type', 'bodyType'],
            'make',
            'model',
            [models_1.Vehicle.sequelize.fn('COUNT', models_1.Vehicle.sequelize.col('id')), 'count'],
        ],
        where: baseWhereClause,
        group: ['body_type', 'make', 'model'],
        raw: true,
    });
    const brandRaw = yield models_1.Vehicle.findAll({
        attributes: ['make', 'model', [models_1.Vehicle.sequelize.fn('COUNT', models_1.Vehicle.sequelize.col('id')), 'count']],
        where: baseWhereClause,
        group: ['make', 'model'],
        raw: true,
    });
    const bodyTypeMap = new Map();
    bodyTypeRaw.forEach((item) => {
        const { bodyType, make, model, count } = item;
        if (!bodyTypeMap.has(bodyType)) {
            bodyTypeMap.set(bodyType, { count: 0, models: new Set() });
        }
        const entry = bodyTypeMap.get(bodyType);
        entry.count += Number(count);
        if (make && model)
            entry.models.add(`${make} ${model}`);
    });
    const brandMap = new Map();
    brandRaw.forEach((item) => {
        const { make, model, count } = item;
        if (!brandMap.has(make)) {
            brandMap.set(make, { count: 0, models: new Set() });
        }
        const entry = brandMap.get(make);
        entry.count += Number(count);
        if (make && model)
            entry.models.add(`${make} ${model}`);
    });
    const bodyTypes = Array.from(bodyTypeMap.entries()).map(([type, data]) => ({
        bodyType: type,
        count: data.count,
        models: Array.from(data.models).sort(),
    }));
    const brands = Array.from(brandMap.entries()).map(([make, data]) => ({
        make: make,
        count: data.count,
        models: Array.from(data.models).sort(),
    }));
    return {
        bodyTypes: bodyTypes.sort((a, b) => b.count - a.count),
        brands: brands.sort((a, b) => b.count - a.count),
    };
});
exports.getVehicleFilterMetadata = getVehicleFilterMetadata;
const checkVehicleAvailability = (vehicleId, pickupDate, dropoffDate, excludeUserId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Check if vehicle exists and is generally available
    const vehicle = yield models_1.Vehicle.findByPk(vehicleId);
    if (!vehicle) {
        throw (0, errorHandler_1.createError)('Vehicle not found', 404);
    }
    if (!vehicle.isAvailable) {
        return { isAvailable: false };
    }
    // 2. Validate and normalize dates
    const { start, end } = (0, validation_utils_1.normalizeBookingDates)(pickupDate, dropoffDate);
    // 3. Check for conflicting bookings (exclude user's own bookings if specified)
    const whereConditions = Object.assign({ vehicleId, bookingStatus: {
            [sequelize_1.Op.notIn]: ['CANCELLED', 'COMPLETED'],
        } }, (0, database_utils_1.buildDateConflictConditions)(start, end));
    // Exclude the user's own bookings from the conflict check
    if (excludeUserId) {
        whereConditions.userId = {
            [sequelize_1.Op.ne]: excludeUserId,
        };
    }
    const conflictingBooking = yield models_1.Booking.findOne({
        where: whereConditions,
    });
    return { isAvailable: !conflictingBooking };
});
exports.checkVehicleAvailability = checkVehicleAvailability;
//# sourceMappingURL=vehicle.service.js.map