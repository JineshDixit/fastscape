"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOOKING_ATTRIBUTES = exports.VEHICLE_LIST_ATTRIBUTES = exports.USER_SAFE_ATTRIBUTES = exports.EXCLUDE_SENSITIVE_ATTRIBUTES = exports.buildPaginationOptions = exports.mergeWhereConditions = exports.buildDateConflictConditions = exports.buildStandardOrder = exports.buildArrayContainsConditions = exports.buildNumericRangeConditions = exports.buildDateRangeConditions = exports.buildSearchConditions = void 0;
const sequelize_1 = require("sequelize");
/**
 * Build where conditions for search queries
 */
const buildSearchConditions = (searchTerm, searchFields) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
        return {};
    }
    const term = `%${searchTerm.trim()}%`;
    return {
        [sequelize_1.Op.or]: searchFields.map((field) => ({
            [field]: { [sequelize_1.Op.iLike]: term },
        })),
    };
};
exports.buildSearchConditions = buildSearchConditions;
/**
 * Build date range conditions
 */
const buildDateRangeConditions = (dateField = 'createdAt', startDate, endDate) => {
    const conditions = {};
    if (startDate) {
        conditions[dateField] = Object.assign(Object.assign({}, conditions[dateField]), { [sequelize_1.Op.gte]: new Date(startDate) });
    }
    if (endDate) {
        conditions[dateField] = Object.assign(Object.assign({}, conditions[dateField]), { [sequelize_1.Op.lte]: new Date(endDate) });
    }
    return conditions;
};
exports.buildDateRangeConditions = buildDateRangeConditions;
/**
 * Build numeric range conditions
 */
const buildNumericRangeConditions = (field, minValue, maxValue) => {
    const conditions = {};
    if (minValue !== undefined) {
        conditions[field] = Object.assign(Object.assign({}, conditions[field]), { [sequelize_1.Op.gte]: minValue });
    }
    if (maxValue !== undefined) {
        conditions[field] = Object.assign(Object.assign({}, conditions[field]), { [sequelize_1.Op.lte]: maxValue });
    }
    return conditions;
};
exports.buildNumericRangeConditions = buildNumericRangeConditions;
/**
 * Build array contains conditions
 */
const buildArrayContainsConditions = (values, field) => {
    if (!values || values.length === 0) {
        return {};
    }
    return {
        [field]: {
            [sequelize_1.Op.overlap]: values,
        },
    };
};
exports.buildArrayContainsConditions = buildArrayContainsConditions;
/**
 * Build standard ordering
 */
const buildStandardOrder = (sortBy = 'createdAt', sortOrder = 'DESC') => {
    return [[sortBy, sortOrder]];
};
exports.buildStandardOrder = buildStandardOrder;
/**
 * Build conflict check conditions for date ranges
 */
const buildDateConflictConditions = (startDate, endDate, startField = 'startDatetime', endField = 'endDatetime') => {
    return {
        [sequelize_1.Op.or]: [
            {
                [startField]: {
                    [sequelize_1.Op.between]: [startDate, endDate],
                },
            },
            {
                [endField]: {
                    [sequelize_1.Op.between]: [startDate, endDate],
                },
            },
            {
                [sequelize_1.Op.and]: [{ [startField]: { [sequelize_1.Op.lte]: startDate } }, { [endField]: { [sequelize_1.Op.gte]: endDate } }],
            },
        ],
    };
};
exports.buildDateConflictConditions = buildDateConflictConditions;
/**
 * Merge where conditions
 */
const mergeWhereConditions = (...conditions) => {
    return conditions.reduce((merged, condition) => {
        return Object.assign(Object.assign({}, merged), condition);
    }, {});
};
exports.mergeWhereConditions = mergeWhereConditions;
/**
 * Build pagination options
 */
const buildPaginationOptions = (page, limit) => ({
    limit,
    offset: (page - 1) * limit,
});
exports.buildPaginationOptions = buildPaginationOptions;
/**
 * Standard attributes to exclude sensitive data
 */
exports.EXCLUDE_SENSITIVE_ATTRIBUTES = ['passwordHash', 'password'];
/**
 * Standard user attributes (excluding sensitive data)
 */
exports.USER_SAFE_ATTRIBUTES = [
    'id',
    'fullName',
    'email',
    'phone',
    'dateOfBirth',
    'nationality',
    'city',
    'state',
    'zipCode',
    'country',
    'isBlocked',
    'createdAt',
    'updatedAt',
];
/**
 * Standard vehicle attributes for listings
 */
exports.VEHICLE_LIST_ATTRIBUTES = [
    'id',
    'make',
    'model',
    'year',
    'bodyType',
    'fuelType',
    'pricePerDay',
    'currency',
    'isAvailable',
    'exteriorColor',
];
/**
 * Standard booking attributes
 */
exports.BOOKING_ATTRIBUTES = [
    'id',
    'userId',
    'vehicleId',
    'chauffeurId',
    'startDatetime',
    'endDatetime',
    'pickupLocation',
    'dropoffLocation',
    'bookingStatus',
    'paymentStatus',
    'bookingType',
    'paymentMethod',
    'actualPickupDatetime',
    'actualDropoffDatetime',
    'delayChargeApplied',
    'delayHours',
    'createdAt',
    'updatedAt',
];
//# sourceMappingURL=database.utils.js.map