"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BOOKING_ATTRIBUTES = exports.VEHICLE_LIST_ATTRIBUTES = exports.USER_SAFE_ATTRIBUTES = exports.EXCLUDE_SENSITIVE_ATTRIBUTES = exports.buildPaginationOptions = exports.buildDateConflictConditions = exports.buildStandardOrder = exports.buildArrayContainsConditions = exports.buildDateRangeConditions = void 0;
const sequelize_1 = require("sequelize");
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
 * Uses exclusive boundaries: [start, end)
 * A booking starting at exactly the end of another is NOT a conflict.
 */
const buildDateConflictConditions = (startDate, endDate, startField = 'startDatetime', endField = 'endDatetime') => {
    return {
        [sequelize_1.Op.and]: [{ [startField]: { [sequelize_1.Op.lt]: endDate } }, { [endField]: { [sequelize_1.Op.gt]: startDate } }],
    };
};
exports.buildDateConflictConditions = buildDateConflictConditions;
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
    'firstName',
    'lastName',
    'email',
    'phone',
    'dateOfBirth',
    'nationality',
    'city',
    'state',
    'zipCode',
    'country',
    'isBlocked',
    'verificationStatus',
    'verificationDate',
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
    'pricePerDay',
    'isAvailable',
    'exteriorColor',
    'interiorColor',
    'fuelType',
    'transmission',
    'bodyType',
    'passengerCapacity',
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