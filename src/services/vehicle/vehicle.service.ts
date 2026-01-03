import { PaginationOptions, VehicleFilterOptions } from '../../common/types/vehicalType';
import { Vehicle, VehicleMedia, Booking } from '../../models';
import { createError } from '../middleware/errorHandler';
import { Op } from 'sequelize';

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
  const bodyTypeRaw = await Vehicle.findAll({
    attributes: [
      'bodyType',
      'make',
      'model',
      [Vehicle.sequelize!.fn('COUNT', Vehicle.sequelize!.col('id')), 'count'],
    ],
    where: { isAvailable: true },
    group: ['bodyType', 'make', 'model'],
    raw: true,
  });

  const brandRaw = await Vehicle.findAll({
    attributes: ['make', [Vehicle.sequelize!.fn('COUNT', Vehicle.sequelize!.col('id')), 'count']],
    where: { isAvailable: true },
    group: ['make'],
    raw: true,
  });

  const bodyTypeMap = new Map<string, { count: number; vehicles: Set<string> }>();

  (bodyTypeRaw as any[]).forEach((item) => {
    const { bodyType, make, model, count } = item;
    const vehicleName = `${make} ${model}`;
    const numCount = Number(count);

    if (!bodyTypeMap.has(bodyType)) {
      bodyTypeMap.set(bodyType, { count: 0, vehicles: new Set() });
    }

    const entry = bodyTypeMap.get(bodyType)!;
    entry.count += numCount;
    entry.vehicles.add(vehicleName);
  });

  // Format Body Type Output
  const bodyTypes = Array.from(bodyTypeMap.entries()).map(([type, data]) => ({
    bodyType: type,
    count: data.count,
    vehicles: Array.from(data.vehicles).sort(),
  }));

  // Format Brand Output
  const brands = (brandRaw as any[]).map((item) => ({
    make: item.make,
    count: Number(item.count),
  }));

  return {
    bodyTypes: bodyTypes.sort((a, b) => b.count - a.count),
    brands: brands.sort((a, b) => b.count - a.count),
  };
};
