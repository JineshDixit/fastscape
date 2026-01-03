import { PaginationOptions, VehicleFilterOptions } from '../../common/types/vehicalType';
import { Vehicle, VehicleMedia, Booking } from '../../models';
import { createError } from '../middleware/errorHandler';
import { Op } from 'sequelize';

/**
 * Get vehicle by ID with media
 */
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

/**
 * Get all vehicles with filtering and pagination
 */
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

  // Build where clause
  const whereClause: any = {};

  if (filters.make) {
    whereClause.make = { [Op.iLike]: `%${filters.make}%` };
  }

  if (filters.model) {
    whereClause.model = { [Op.iLike]: `%${filters.model}%` };
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

/**
 * Get vehicle statistics
 */
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

  // Get stats by body type
  const bodyTypeStats = await Vehicle.findAll({
    attributes: ['body_type', [Vehicle.sequelize!.fn('COUNT', Vehicle.sequelize!.col('id')), 'count']],
    group: ['body_type'],
    raw: true,
  });

  const byBodyType: Record<string, number> = {};
  bodyTypeStats.forEach((stat: any) => {
    byBodyType[stat.body_type] = parseInt(stat.count);
  });

  // Get stats by fuel type
  const fuelTypeStats = await Vehicle.findAll({
    attributes: ['fuel_type', [Vehicle.sequelize!.fn('COUNT', Vehicle.sequelize!.col('id')), 'count']],
    group: ['fuel_type'],
    raw: true,
  });

  const byFuelType: Record<string, number> = {};
  fuelTypeStats.forEach((stat: any) => {
    byFuelType[stat.fuel_type] = parseInt(stat.count);
  });

  // Get average price
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
    attributes: ['body_type', [Vehicle.sequelize!.fn('COUNT', Vehicle.sequelize!.col('id')), 'count']],
    where: { isAvailable: true },
    group: ['body_type'],
    raw: true,
  });

  return results.map((r: any) => ({
    bodyType: r.body_type,
    count: Number(r.count),
  }));
};

export const getBodyTypeFilterCounts = async () => {
  const results = await Vehicle.findAll({
    attributes: ['body_type', [Vehicle.sequelize!.fn('COUNT', Vehicle.sequelize!.col('id')), 'count']],
    where: { isAvailable: true },
    group: ['body_type'],
    raw: true,
  });

  return results;
};

export const getBrandFilterCounts = async () => {
  const results = await Vehicle.findAll({
    attributes: ['make', [Vehicle.sequelize!.fn('COUNT', Vehicle.sequelize!.col('id')), 'count']],
    where: { isAvailable: true },
    group: ['make'],
    raw: true,
  });

  return results;
};

export const getVehicleFilterMetadata = async () => {
  const [bodyTypes, brands] = await Promise.all([getBodyTypeFilterCounts(), getBrandFilterCounts()]);

  return {
    bodyTypes,
    brands,
  };
};
