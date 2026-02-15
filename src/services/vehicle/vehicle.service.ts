import { PaginationOptions, VehicleFilterOptions, VehicleSearchQuery } from '../../common/types/vehicalType';
import { Vehicle, VehicleMedia, Booking } from '../../models';
import { createError } from '../middleware/errorHandler';
import { Op, Sequelize } from 'sequelize';
import { normalizeBookingDates } from '../../utils/validation.utils';
import { buildDateConflictConditions } from '../../utils/database.utils';

interface MostPopularCar extends Vehicle {
  media: VehicleMedia[];
  bookingCount: number;
}

/**
 * Get most popular car (most booked vehicle)
 */
export const getMostPopularCar = async (): Promise<MostPopularCar> => {
  // Find vehicle with most bookings
  const bookingStats = await Booking.findAll({
    attributes: [
      ['vehicle_id', 'vehicleId'],
      [Sequelize.fn('COUNT', Sequelize.col('vehicle_id')), 'bookingCount']
    ],
    group: ['vehicle_id'],
    order: [[Sequelize.literal('"bookingCount"'), 'DESC']],
    limit: 1,
    raw: true
  });

  if (!bookingStats || bookingStats.length === 0) {
    // If no bookings found, return most recently added available vehicle
    const fallbackVehicle = await Vehicle.findOne({
      where: { isAvailable: true },
      include: [
        {
          model: VehicleMedia,
          as: 'media',
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    if (!fallbackVehicle) {
      throw createError('No vehicles available', 404);
    }

    return { ...fallbackVehicle.toJSON(), bookingCount: 0 } as MostPopularCar;
  }

  const mostBookedVehicleId = (bookingStats[0] as any).vehicleId;
  const bookingCount = parseInt((bookingStats[0] as any).bookingCount);

  // Get full vehicle details with media
  const vehicle = await Vehicle.findByPk(mostBookedVehicleId, {
    include: [
      {
        model: VehicleMedia,
        as: 'media',
      },
    ],
  });

  if (!vehicle) {
    throw createError('Most popular vehicle not found', 404);
  }

  return { ...vehicle.toJSON(), bookingCount } as MostPopularCar;
};

export const getVehicleById = async (vehicleId: string): Promise<Vehicle> => {
  const vehicle = await Vehicle.findByPk(vehicleId, {
    include: [
      {
        model: VehicleMedia,
        as: 'media',
      },
    ],
  });

  if (!vehicle) {
    throw createError('Vehicle not found', 404);
  }

  return vehicle;
};

export const getVehicles = async (
  filters: VehicleFilterOptions = {},
  pagination: PaginationOptions = {},
): Promise<{
  vehicles: Vehicle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = pagination;

  const offset = (page - 1) * limit;

  const whereClause: any = {};

  if (filters.make) {
    whereClause.make = Array.isArray(filters.make) ? { [Op.in]: filters.make } : { [Op.iLike]: `%${filters.make}%` };
  }

  if (filters.model) {
    const models = Array.isArray(filters.model) ? filters.model : [filters.model];
    // Allow matching either the specific model OR the full 'Make Model' display name
    whereClause[Op.or] = models.map((m) => ({
      [Op.or]: [
        { model: { [Op.iLike]: m } },
        Sequelize.where(Sequelize.fn('CONCAT', Sequelize.col('make'), ' ', Sequelize.col('model')), {
          [Op.iLike]: m,
        }),
      ],
    }));
  }

  if (filters.bodyType) {
    whereClause.bodyType = Array.isArray(filters.bodyType) ? { [Op.in]: filters.bodyType } : filters.bodyType;
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
      whereClause.pricePerDay[Op.gte] = filters.minPrice;
    }
    if (filters.maxPrice) {
      whereClause.pricePerDay[Op.lte] = filters.maxPrice;
    }
  }

  if (filters.year) {
    whereClause.year = filters.year;
  }

  if (filters.search) {
    whereClause[Op.or] = [
      { make: { [Op.iLike]: `%${filters.search}%` } },
      { model: { [Op.iLike]: `%${filters.search}%` } },
      { trim: { [Op.iLike]: `%${filters.search}%` } },
      { exteriorColor: { [Op.iLike]: `%${filters.search}%` } },
    ];
  }

  const { count, rows } = await Vehicle.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: VehicleMedia,
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
};

export const getAvailableVehicles = async (
  searchQuery: VehicleSearchQuery,
  pagination: PaginationOptions = {},
): Promise<{
  vehicles: Vehicle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const { pickupLocation, pickupDate, dropoffDate, ...otherFilters } = searchQuery;
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = pagination;
  const offset = (page - 1) * limit;

  // Normalize dates
  const { start, end } = normalizeBookingDates(pickupDate, dropoffDate);

  // 1. Find all vehicles that have conflicting bookings in the given range
  const conflictingBookings = await Booking.findAll({
    attributes: ['vehicleId'],
    where: {
      bookingStatus: {
        [Op.notIn]: ['CANCELLED', 'COMPLETED'],
      },
      ...buildDateConflictConditions(start, end),
    },
    raw: true,
  });

  const unavailableVehicleIds = conflictingBookings.map((b) => b.vehicleId);

  // 2. Build where clause for available vehicles
  const whereClause: any = {
    isAvailable: true,
    id: { [Op.notIn]: unavailableVehicleIds },
  };

  // if (pickupLocation) {
  //   whereClause.city = { [Op.iLike]: `%${pickupLocation}%` };
  // }

  // Apply additional filters
  if (otherFilters.make) {
    whereClause.make = Array.isArray(otherFilters.make)
      ? { [Op.in]: otherFilters.make }
      : { [Op.iLike]: `%${otherFilters.make}%` };
  }

  if (otherFilters.model) {
    const models = Array.isArray(otherFilters.model) ? otherFilters.model : [otherFilters.model];
    // Allow matching either the specific model OR the full 'Make Model' display name
    whereClause[Op.or] = models.map((m) => ({
      [Op.or]: [
        { model: { [Op.iLike]: m } },
        Sequelize.where(Sequelize.fn('CONCAT', Sequelize.col('make'), ' ', Sequelize.col('model')), {
          [Op.iLike]: m,
        }),
      ],
    }));
  }

  if (otherFilters.bodyType) {
    whereClause.bodyType = Array.isArray(otherFilters.bodyType)
      ? { [Op.in]: otherFilters.bodyType }
      : otherFilters.bodyType;
  }
  if (otherFilters.transmission) whereClause.transmission = otherFilters.transmission;
  if (otherFilters.fuelType) whereClause.fuelType = otherFilters.fuelType;

  if (otherFilters.minPrice || otherFilters.maxPrice) {
    whereClause.pricePerDay = {};
    if (otherFilters.minPrice) whereClause.pricePerDay[Op.gte] = otherFilters.minPrice;
    if (otherFilters.maxPrice) whereClause.pricePerDay[Op.lte] = otherFilters.maxPrice;
  }

  if (otherFilters.search) {
    whereClause[Op.or] = [
      { make: { [Op.iLike]: `%${otherFilters.search}%` } },
      { model: { [Op.iLike]: `%${otherFilters.search}%` } },
      { trim: { [Op.iLike]: `%${otherFilters.search}%` } },
    ];
  }

  // 3. Query vehicles
  const { count, rows } = await Vehicle.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: VehicleMedia,
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
};

export const getVehicleStats = async (): Promise<{
  total: number;
  available: number;
  unavailable: number;
  byBodyType: Record<string, number>;
  byFuelType: Record<string, number>;
  averagePrice: number;
}> => {
  const total = await Vehicle.count();
  const available = await Vehicle.count({ where: { isAvailable: true } });
  const unavailable = total - available;

  const bodyTypeStats = await Vehicle.findAll({
    attributes: ['body_type', [Vehicle.sequelize!.fn('COUNT', Vehicle.sequelize!.col('id')), 'count']],
    group: ['body_type'],
    raw: true,
  });

  const byBodyType: Record<string, number> = {};
  bodyTypeStats.forEach((stat: any) => {
    byBodyType[stat.body_type] = parseInt(stat.count);
  });

  const fuelTypeStats = await Vehicle.findAll({
    attributes: ['fuel_type', [Vehicle.sequelize!.fn('COUNT', Vehicle.sequelize!.col('id')), 'count']],
    group: ['fuel_type'],
    raw: true,
  });

  const byFuelType: Record<string, number> = {};
  fuelTypeStats.forEach((stat: any) => {
    byFuelType[stat.fuel_type] = parseInt(stat.count);
  });

  const avgPriceResult = await Vehicle.findOne({
    attributes: [[Vehicle.sequelize!.fn('AVG', Vehicle.sequelize!.col('price_per_day')), 'avgPrice']],
    raw: true,
  });

  const averagePrice = parseFloat((avgPriceResult as any)?.avgPrice || '0');

  return {
    total,
    available,
    unavailable,
    byBodyType,
    byFuelType,
    averagePrice,
  };
};

export const getVehicleBodyTypeSummary = async (): Promise<{ bodyType: string; count: number }[]> => {
  const results = await Vehicle.findAll({
    attributes: ['bodyType', [Vehicle.sequelize!.fn('COUNT', Vehicle.sequelize!.col('id')), 'count']],
    where: { isAvailable: true },
    group: ['bodyType'],
    raw: true,
  });

  return results.map((r: any) => ({
    bodyType: r.bodyType,
    count: Number(r.count),
  }));
};

export const getVehicleFilterMetadata = async () => {
  // Use explicit aliases to ensure raw results match expected keys exactly
  const bodyTypeRaw = await Vehicle.findAll({
    attributes: [
      ['body_type', 'bodyType'],
      'make',
      'model',
      [Vehicle.sequelize!.fn('COUNT', Vehicle.sequelize!.col('id')), 'count'],
    ],
    where: { isAvailable: true },
    group: ['body_type', 'make', 'model'],
    raw: true,
  });

  const brandRaw = await Vehicle.findAll({
    attributes: ['make', 'model', [Vehicle.sequelize!.fn('COUNT', Vehicle.sequelize!.col('id')), 'count']],
    where: { isAvailable: true },
    group: ['make', 'model'],
    raw: true,
  });

  const bodyTypeMap = new Map<string, { count: number; models: Set<string> }>();
  (bodyTypeRaw as any[]).forEach((item) => {
    const { bodyType, make, model, count } = item;
    if (!bodyTypeMap.has(bodyType)) {
      bodyTypeMap.set(bodyType, { count: 0, models: new Set() });
    }
    const entry = bodyTypeMap.get(bodyType)!;
    entry.count += Number(count);
    if (make && model) entry.models.add(`${make} ${model}`);
  });

  const brandMap = new Map<string, { count: number; models: Set<string> }>();
  (brandRaw as any[]).forEach((item) => {
    const { make, model, count } = item;
    if (!brandMap.has(make)) {
      brandMap.set(make, { count: 0, models: new Set() });
    }
    const entry = brandMap.get(make)!;
    entry.count += Number(count);
    if (make && model) entry.models.add(`${make} ${model}`);
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
};

export const checkVehicleAvailability = async (
  vehicleId: string,
  pickupDate: string,
  dropoffDate: string,
): Promise<{ isAvailable: boolean }> => {
  // 1. Check if vehicle exists and is generally available
  const vehicle = await Vehicle.findByPk(vehicleId);

  if (!vehicle) {
    throw createError('Vehicle not found', 404);
  }

  if (!vehicle.isAvailable) {
    return { isAvailable: false };
  }

  // 2. Validate and normalize dates
  const { start, end } = normalizeBookingDates(pickupDate, dropoffDate);

  // 3. Check for conflicting bookings
  const conflictingBooking = await Booking.findOne({
    where: {
      vehicleId,
      bookingStatus: {
        [Op.notIn]: ['CANCELLED', 'COMPLETED'],
      },
      ...buildDateConflictConditions(start, end),
    },
  });

  return { isAvailable: !conflictingBooking };
};
