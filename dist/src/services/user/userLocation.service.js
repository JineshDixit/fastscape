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
exports.bulkUpdateUserLocations = exports.validateAndNormalizeAddress = exports.findUsersNearLocation = exports.getLocationStatistics = exports.getUsersInSameCity = exports.getUsersByLocation = exports.updateUserLocation = void 0;
const models_1 = require("../../models");
const errorHandler_1 = require("../middleware/errorHandler");
const sequelize_1 = require("sequelize");
/**
 * Update user location information
 */
const updateUserLocation = (userId, locationData) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield models_1.User.findByPk(userId);
    if (!user) {
        throw (0, errorHandler_1.createError)('User not found', 404);
    }
    yield user.update(locationData);
    return user.reload();
});
exports.updateUserLocation = updateUserLocation;
/**
 * Get users by location
 */
const getUsersByLocation = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { city, state, country } = query;
    const whereConditions = {
        isBlocked: false,
    };
    if (city) {
        whereConditions.city = { [sequelize_1.Op.iLike]: `%${city}%` };
    }
    if (state) {
        whereConditions.state = { [sequelize_1.Op.iLike]: `%${state}%` };
    }
    if (country) {
        whereConditions.country = { [sequelize_1.Op.iLike]: `%${country}%` };
    }
    const users = yield models_1.User.findAll({
        where: whereConditions,
        attributes: [
            'id',
            'fullName',
            'email',
            'phone',
            'homeAddress',
            'city',
            'state',
            'zipCode',
            'country',
            'nationality',
            'createdAt',
        ],
        order: [['fullName', 'ASC']],
    });
    return users.map((user) => (Object.assign(Object.assign({}, user.toJSON()), { locationSummary: [user.city, user.state, user.country].filter(Boolean).join(', '), addressCompleteness: getAddressCompleteness(user) })));
});
exports.getUsersByLocation = getUsersByLocation;
/**
 * Get users in same city as given user
 */
const getUsersInSameCity = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield models_1.User.findByPk(userId, {
        attributes: ['city', 'state', 'country'],
    });
    if (!user || !user.city) {
        return [];
    }
    return (0, exports.getUsersByLocation)({
        city: user.city,
        state: user.state,
        country: user.country,
    });
});
exports.getUsersInSameCity = getUsersInSameCity;
/**
 * Get location statistics
 */
const getLocationStatistics = () => __awaiter(void 0, void 0, void 0, function* () {
    const stats = yield models_1.User.findAll({
        attributes: ['country', 'state', 'city', [models_1.User.sequelize.fn('COUNT', models_1.User.sequelize.col('id')), 'userCount']],
        where: {
            isBlocked: false,
        },
        group: ['country', 'state', 'city'],
        order: [[models_1.User.sequelize.fn('COUNT', models_1.User.sequelize.col('id')), 'DESC']],
        raw: true,
    });
    const totalUsers = yield models_1.User.count({ where: { isBlocked: false } });
    const addressCompleteness = yield models_1.User.findAll({
        attributes: [
            [
                models_1.User.sequelize.literal(`
          CASE 
            WHEN city IS NOT NULL AND state IS NOT NULL AND country IS NOT NULL THEN 'COMPLETE'
            WHEN city IS NOT NULL OR state IS NOT NULL OR country IS NOT NULL THEN 'PARTIAL'
            ELSE 'MISSING'
          END
        `),
                'completeness',
            ],
            [models_1.User.sequelize.fn('COUNT', models_1.User.sequelize.col('id')), 'count'],
        ],
        where: {
            isBlocked: false,
        },
        group: [models_1.User.sequelize.literal('completeness')],
        raw: true,
    });
    return {
        totalUsers,
        locationBreakdown: stats,
        addressCompleteness,
    };
});
exports.getLocationStatistics = getLocationStatistics;
/**
 * Find users near a specific location (for future geo-location features)
 */
const findUsersNearLocation = (targetCity, targetState, targetCountry) => __awaiter(void 0, void 0, void 0, function* () {
    const whereConditions = {
        isBlocked: false,
    };
    // Exact city match first
    whereConditions[sequelize_1.Op.or] = [{ city: { [sequelize_1.Op.iLike]: targetCity } }];
    // If state provided, include state matches
    if (targetState) {
        whereConditions[sequelize_1.Op.or].push({ state: { [sequelize_1.Op.iLike]: targetState } });
    }
    // If country provided, include country matches
    if (targetCountry) {
        whereConditions[sequelize_1.Op.or].push({ country: { [sequelize_1.Op.iLike]: targetCountry } });
    }
    const users = yield models_1.User.findAll({
        where: whereConditions,
        attributes: ['id', 'fullName', 'email', 'phone', 'homeAddress', 'city', 'state', 'zipCode', 'country', 'createdAt'],
        order: [
            // Prioritize exact city matches
            [models_1.User.sequelize.literal(`CASE WHEN city ILIKE '${targetCity}' THEN 0 ELSE 1 END`), 'ASC'],
            ['fullName', 'ASC'],
        ],
        limit: 50,
    });
    return users.map((user) => (Object.assign(Object.assign({}, user.toJSON()), { locationSummary: [user.city, user.state, user.country].filter(Boolean).join(', '), addressCompleteness: getAddressCompleteness(user) })));
});
exports.findUsersNearLocation = findUsersNearLocation;
/**
 * Validate and normalize address data
 */
const validateAndNormalizeAddress = (locationData) => {
    const normalized = {};
    if (locationData.homeAddress) {
        normalized.homeAddress = locationData.homeAddress.trim();
    }
    if (locationData.city) {
        normalized.city = locationData.city.trim();
    }
    if (locationData.state) {
        normalized.state = locationData.state.trim();
    }
    if (locationData.zipCode) {
        normalized.zipCode = locationData.zipCode.trim().toUpperCase();
    }
    if (locationData.country) {
        normalized.country = locationData.country.trim();
    }
    return normalized;
};
exports.validateAndNormalizeAddress = validateAndNormalizeAddress;
/**
 * Helper function to determine address completeness
 */
function getAddressCompleteness(user) {
    const hasCity = !!user.city;
    const hasState = !!user.state;
    const hasCountry = !!user.country;
    if (hasCity && hasState && hasCountry) {
        return 'COMPLETE';
    }
    else if (hasCity || hasState || hasCountry) {
        return 'PARTIAL';
    }
    else {
        return 'MISSING';
    }
}
/**
 * Bulk update user locations from CSV or external data
 */
const bulkUpdateUserLocations = (updates) => __awaiter(void 0, void 0, void 0, function* () {
    let success = 0;
    let failed = 0;
    const errors = [];
    for (const update of updates) {
        try {
            yield (0, exports.updateUserLocation)(update.userId, update.locationData);
            success++;
        }
        catch (error) {
            failed++;
            errors.push(`User ${update.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    return { success, failed, errors };
});
exports.bulkUpdateUserLocations = bulkUpdateUserLocations;
//# sourceMappingURL=userLocation.service.js.map