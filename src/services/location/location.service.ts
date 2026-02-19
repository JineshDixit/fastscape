import { Op } from 'sequelize';
import { Location } from '../../models';

interface LocationFilters {
  city?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

interface CreateLocationDto {
  name: string;
  city: string;
  code?: string;
  isActive?: boolean;
}

interface LocationListResult {
  locations: Location[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get all locations with filtering and pagination
 */
export const getAllLocations = async (filters: LocationFilters): Promise<LocationListResult> => {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 100);
  const offset = (page - 1) * limit;

  const where: any = {};

  if (filters.city) {
    where.city = filters.city;
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  // Search by name, city, or code
  if (filters.search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${filters.search}%` } },
      { city: { [Op.iLike]: `%${filters.search}%` } },
      { code: { [Op.iLike]: `%${filters.search}%` } },
    ];
  }

  // Sorting logic
  let order: any = [['createdAt', 'DESC']];
  if (filters.sortBy) {
    const sortOrder = filters.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    order = [[filters.sortBy, sortOrder]];
  }

  const { rows: locations, count: total } = await Location.findAndCountAll({
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
};

/**
 * Get single location by ID
 */
export const getLocationById = async (locationId: string): Promise<Location> => {
  const location = await Location.findByPk(locationId);

  if (!location) {
    throw new Error('Location not found');
  }

  return location;
};

/**
 * Create a new location
 */
export const createLocation = async (data: CreateLocationDto): Promise<Location> => {
  // Check for duplicate name or code
  const existingLocation = await Location.findOne({
    where: {
      [Op.or]: [
        { name: data.name },
        ...(data.code ? [{ code: data.code }] : []),
      ],
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

  return await Location.create({
    ...data,
    isActive: data.isActive !== undefined ? data.isActive : true,
  });
};

/**
 * Update location details
 */
export const updateLocation = async (locationId: string, data: Partial<CreateLocationDto>): Promise<Location> => {
  const location = await Location.findByPk(locationId);

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
      const existingLocation = await Location.findOne({
        where: {
          [Op.or]: duplicateConditions,
          id: { [Op.ne]: locationId },
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

  await location.update(data);
  return location;
};

/**
 * Toggle location active status
 */
export const toggleLocationStatus = async (locationId: string): Promise<Location> => {
  const location = await Location.findByPk(locationId);

  if (!location) {
    throw new Error('Location not found');
  }

  await location.update({ isActive: !location.isActive });
  return location;
};

/**
 * Delete location
 */
export const deleteLocation = async (locationId: string): Promise<void> => {
  const location = await Location.findByPk(locationId);

  if (!location) {
    throw new Error('Location not found');
  }

  await location.destroy();
};

/**
 * Get all unique cities
 */
export const getAllCities = async (): Promise<string[]> => {
  const locations = await Location.findAll({
    attributes: ['city'],
    group: ['city'],
    order: [['city', 'ASC']],
  });

  return locations.map((loc) => loc.city);
};

/**
 * Export locations to CSV with filters
 */
export const exportLocationsToCSV = async (filters: LocationFilters): Promise<Location[]> => {
  const where: any = {};

  if (filters.city) {
    where.city = filters.city;
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${filters.search}%` } },
      { city: { [Op.iLike]: `%${filters.search}%` } },
      { code: { [Op.iLike]: `%${filters.search}%` } },
    ];
  }

  const locations = await Location.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: 5000,
  });

  return locations;
};
