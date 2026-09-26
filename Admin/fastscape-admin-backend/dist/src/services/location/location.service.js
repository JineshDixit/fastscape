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
exports.exportLocationsToCSV = exports.getAllCities = exports.deleteLocation = exports.toggleLocationStatus = exports.updateLocation = exports.createLocation = exports.getLocationById = exports.getAllLocations = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
/**
 * Get all locations with filtering and pagination
 */
const getAllLocations = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const offset = (page - 1) * limit;
    const where = {};
    if (filters.city) {
        where.city = filters.city;
    }
    if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
    }
    // Search by name, city, or code
    if (filters.search) {
        where[sequelize_1.Op.or] = [
            { name: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { city: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { code: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
        ];
    }
    // Sorting logic
    let order = [['createdAt', 'DESC']];
    if (filters.sortBy) {
        const sortOrder = ((_a = filters.sortOrder) === null || _a === void 0 ? void 0 : _a.toUpperCase()) === 'ASC' ? 'ASC' : 'DESC';
        order = [[filters.sortBy, sortOrder]];
    }
    const { rows: locations, count: total } = yield models_1.Location.findAndCountAll({
        where,
        order,
        limit,
        offset,
    });
    return {
        locations,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
});
exports.getAllLocations = getAllLocations;
/**
 * Get single location by ID
 */
const getLocationById = (locationId) => __awaiter(void 0, void 0, void 0, function* () {
    const location = yield models_1.Location.findByPk(locationId);
    if (!location) {
        throw new Error('Location not found');
    }
    return location;
});
exports.getLocationById = getLocationById;
/**
 * Create a new location
 */
const createLocation = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // Check for duplicate name or code
    const existingLocation = yield models_1.Location.findOne({
        where: {
            [sequelize_1.Op.or]: [{ name: data.name }, ...(data.code ? [{ code: data.code }] : [])],
        },
    });
    if (existingLocation) {
        if (existingLocation.name === data.name) {
            throw new Error('Location with this name already exists');
        }
        if (data.code && existingLocation.code === data.code) {
            throw new Error('Location with this code already exists');
        }
    }
    return yield models_1.Location.create(Object.assign(Object.assign({}, data), { isActive: data.isActive !== undefined ? data.isActive : true }));
});
exports.createLocation = createLocation;
/**
 * Update location details
 */
const updateLocation = (locationId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const location = yield models_1.Location.findByPk(locationId);
    if (!location) {
        throw new Error('Location not found');
    }
    // Check for duplicate name or code if they're being updated
    if (data.name || data.code) {
        const duplicateConditions = [];
        if (data.name && data.name !== location.name) {
            duplicateConditions.push({ name: data.name });
        }
        if (data.code && data.code !== location.code) {
            duplicateConditions.push({ code: data.code });
        }
        if (duplicateConditions.length > 0) {
            const existingLocation = yield models_1.Location.findOne({
                where: {
                    [sequelize_1.Op.or]: duplicateConditions,
                    id: { [sequelize_1.Op.ne]: locationId },
                },
            });
            if (existingLocation) {
                if (data.name && existingLocation.name === data.name) {
                    throw new Error('Location with this name already exists');
                }
                if (data.code && existingLocation.code === data.code) {
                    throw new Error('Location with this code already exists');
                }
            }
        }
    }
    yield location.update(data);
    return location;
});
exports.updateLocation = updateLocation;
/**
 * Toggle location active status
 */
const toggleLocationStatus = (locationId) => __awaiter(void 0, void 0, void 0, function* () {
    const location = yield models_1.Location.findByPk(locationId);
    if (!location) {
        throw new Error('Location not found');
    }
    yield location.update({ isActive: !location.isActive });
    return location;
});
exports.toggleLocationStatus = toggleLocationStatus;
/**
 * Delete location
 */
const deleteLocation = (locationId) => __awaiter(void 0, void 0, void 0, function* () {
    const location = yield models_1.Location.findByPk(locationId);
    if (!location) {
        throw new Error('Location not found');
    }
    yield location.destroy();
});
exports.deleteLocation = deleteLocation;
/**
 * Get all unique cities
 */
const getAllCities = () => __awaiter(void 0, void 0, void 0, function* () {
    const locations = yield models_1.Location.findAll({
        attributes: ['city'],
        group: ['city'],
        order: [['city', 'ASC']],
    });
    return locations.map((loc) => loc.city);
});
exports.getAllCities = getAllCities;
/**
 * Export locations to CSV with filters
 */
const exportLocationsToCSV = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    const where = {};
    if (filters.city) {
        where.city = filters.city;
    }
    if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
    }
    if (filters.search) {
        where[sequelize_1.Op.or] = [
            { name: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { city: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            { code: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
        ];
    }
    const locations = yield models_1.Location.findAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: 5000,
    });
    return locations;
});
exports.exportLocationsToCSV = exportLocationsToCSV;
//# sourceMappingURL=location.service.js.map