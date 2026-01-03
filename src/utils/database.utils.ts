import { Op, WhereOptions, OrderItem } from 'sequelize';

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
