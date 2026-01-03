import { User } from '../../models';
import { createError } from '../middleware/errorHandler';
import { Op } from 'sequelize';
import { LocationSearchQuery, UserLocationData, UserWithLocation } from '../../common/types/userTypes';

/**
 * Update user location information
 */
export const updateUserLocation = async (userId: string, locationData: UserLocationData): Promise<User> => {
  const user = await User.findByPk(userId);

  if (!user) {
    throw createError('User not found', 404);
  }

  await user.update(locationData);
  return user.reload();
};

/**
 * Get users by location
 */
export const getUsersByLocation = async (query: LocationSearchQuery): Promise<UserWithLocation[]> => {
  const { city, state, country } = query;

  const whereConditions: any = {
    isBlocked: false,
  };

  if (city) {
    whereConditions.city = { [Op.iLike]: `%${city}%` };
  }

  if (state) {
    whereConditions.state = { [Op.iLike]: `%${state}%` };
  }

  if (country) {
    whereConditions.country = { [Op.iLike]: `%${country}%` };
  }

  const users = await User.findAll({
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

  return users.map((user) => ({
    ...user.toJSON(),
    locationSummary: [user.city, user.state, user.country].filter(Boolean).join(', '),
    addressCompleteness: getAddressCompleteness(user),
  }));
};

/**
 * Get users in same city as given user
 */
export const getUsersInSameCity = async (userId: string): Promise<UserWithLocation[]> => {
  const user = await User.findByPk(userId, {
    attributes: ['city', 'state', 'country'],
  });

  if (!user || !user.city) {
    return [];
  }

  return getUsersByLocation({
    city: user.city,
    state: user.state,
    country: user.country,
  });
};

/**
 * Get location statistics
 */
export const getLocationStatistics = async () => {
  const stats = await User.findAll({
    attributes: ['country', 'state', 'city', [User.sequelize!.fn('COUNT', User.sequelize!.col('id')), 'userCount']],
    where: {
      isBlocked: false,
    },
    group: ['country', 'state', 'city'],
    order: [[User.sequelize!.fn('COUNT', User.sequelize!.col('id')), 'DESC']],
    raw: true,
  });

  const totalUsers = await User.count({ where: { isBlocked: false } });

  const addressCompleteness = await User.findAll({
    attributes: [
      [
        User.sequelize!.literal(`
          CASE 
            WHEN city IS NOT NULL AND state IS NOT NULL AND country IS NOT NULL THEN 'COMPLETE'
            WHEN city IS NOT NULL OR state IS NOT NULL OR country IS NOT NULL THEN 'PARTIAL'
            ELSE 'MISSING'
          END
        `),
        'completeness',
      ],
      [User.sequelize!.fn('COUNT', User.sequelize!.col('id')), 'count'],
    ],
    where: {
      isBlocked: false,
    },
    group: [User.sequelize!.literal('completeness') as any],
    raw: true,
  });

  return {
    totalUsers,
    locationBreakdown: stats,
    addressCompleteness,
  };
};

/**
 * Find users near a specific location (for future geo-location features)
 */
export const findUsersNearLocation = async (
  targetCity: string,
  targetState?: string,
  targetCountry?: string,
): Promise<UserWithLocation[]> => {
  const whereConditions: any = {
    isBlocked: false,
  };

  // Exact city match first
  whereConditions[Op.or] = [{ city: { [Op.iLike]: targetCity } }];

  // If state provided, include state matches
  if (targetState) {
    whereConditions[Op.or].push({ state: { [Op.iLike]: targetState } });
  }

  // If country provided, include country matches
  if (targetCountry) {
    whereConditions[Op.or].push({ country: { [Op.iLike]: targetCountry } });
  }

  const users = await User.findAll({
    where: whereConditions,
    attributes: ['id', 'fullName', 'email', 'phone', 'homeAddress', 'city', 'state', 'zipCode', 'country', 'createdAt'],
    order: [
      // Prioritize exact city matches
      [User.sequelize!.literal(`CASE WHEN city ILIKE '${targetCity}' THEN 0 ELSE 1 END`), 'ASC'],
      ['fullName', 'ASC'],
    ],
    limit: 50,
  });

  return users.map((user) => ({
    ...user.toJSON(),
    locationSummary: [user.city, user.state, user.country].filter(Boolean).join(', '),
    addressCompleteness: getAddressCompleteness(user),
  }));
};

/**
 * Validate and normalize address data
 */
export const validateAndNormalizeAddress = (locationData: UserLocationData): UserLocationData => {
  const normalized: UserLocationData = {};

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

/**
 * Helper function to determine address completeness
 */
function getAddressCompleteness(user: User): 'COMPLETE' | 'PARTIAL' | 'MISSING' {
  const hasCity = !!user.city;
  const hasState = !!user.state;
  const hasCountry = !!user.country;

  if (hasCity && hasState && hasCountry) {
    return 'COMPLETE';
  } else if (hasCity || hasState || hasCountry) {
    return 'PARTIAL';
  } else {
    return 'MISSING';
  }
}

/**
 * Bulk update user locations from CSV or external data
 */
export const bulkUpdateUserLocations = async (
  updates: Array<{ userId: string; locationData: UserLocationData }>,
): Promise<{ success: number; failed: number; errors: string[] }> => {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const update of updates) {
    try {
      await updateUserLocation(update.userId, update.locationData);
      success++;
    } catch (error) {
      failed++;
      errors.push(`User ${update.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { success, failed, errors };
};
