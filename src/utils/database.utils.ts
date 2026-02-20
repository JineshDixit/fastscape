import { Op, WhereOptions, OrderItem } from 'sequelize';

/**
 * Build where conditions for search queries
 */
export const buildSearchConditions = (searchTerm: string, searchFields: string[]): WhereOptions => {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return {};
  }

  const term = `%${searchTerm.trim()}%`;

  return {
    [Op.or]: searchFields.map((field) => ({
      [field]: { [Op.iLike]: term },
    })),
  };
};

/**
 * Build date range conditions
 */
export const buildDateRangeConditions = (
  dateField: string = 'createdAt',
  startDate?: string | Date,
  endDate?: string | Date,
): WhereOptions => {
  const conditions: WhereOptions = {};

  if (startDate) {
    conditions[dateField] = {
      ...conditions[dateField],
      [Op.gte]: new Date(startDate),
    };
  }

  if (endDate) {
    conditions[dateField] = {
      ...conditions[dateField],
      [Op.lte]: new Date(endDate),
    };
  }

  return conditions;
};

/**
 * Build numeric range conditions
 */
export const buildNumericRangeConditions = (field: string, minValue?: number, maxValue?: number): WhereOptions => {
  const conditions: WhereOptions = {};

  if (minValue !== undefined) {
    conditions[field] = {
      ...conditions[field],
      [Op.gte]: minValue,
    };
  }

  if (maxValue !== undefined) {
    conditions[field] = {
      ...conditions[field],
      [Op.lte]: maxValue,
    };
  }

  return conditions;
};

/**
 * Build array contains conditions
 */
export const buildArrayContainsConditions = (values: string[], field: string): WhereOptions => {
  if (!values || values.length === 0) {
    return {};
  }

  return {
    [field]: {
      [Op.overlap]: values,
    },
  };
};

/**
 * Build standard ordering
 */
export const buildStandardOrder = (sortBy: string = 'createdAt', sortOrder: 'ASC' | 'DESC' = 'DESC'): OrderItem[] => {
  return [[sortBy, sortOrder]];
};

/**
 * Build conflict check conditions for date ranges
 */
export const buildDateConflictConditions = (
  startDate: Date,
  endDate: Date,
  startField: string = 'startDatetime',
  endField: string = 'endDatetime',
): WhereOptions => {
  return {
    [Op.or]: [
      {
        [startField]: {
          [Op.between]: [startDate, endDate],
        },
      },
      {
        [endField]: {
          [Op.between]: [startDate, endDate],
        },
      },
      {
        [Op.and]: [{ [startField]: { [Op.lte]: startDate } }, { [endField]: { [Op.gte]: endDate } }],
      },
    ],
  };
};

/**
 * Merge where conditions
 */
export const mergeWhereConditions = (...conditions: WhereOptions[]): WhereOptions => {
  return conditions.reduce((merged, condition) => {
    return { ...merged, ...condition };
  }, {});
};

/**
 * Build pagination options
 */
export const buildPaginationOptions = (page: number, limit: number) => ({
  limit,
  offset: (page - 1) * limit,
});

/**
 * Standard attributes to exclude sensitive data
 */
export const EXCLUDE_SENSITIVE_ATTRIBUTES = ['passwordHash', 'password'];

/**
 * Standard user attributes (excluding sensitive data)
 */
export const USER_SAFE_ATTRIBUTES = [
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
export const VEHICLE_LIST_ATTRIBUTES = [
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
export const BOOKING_ATTRIBUTES = [
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
