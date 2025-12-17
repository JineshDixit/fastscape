import { VehicleFilters } from '../../common/types/vehicalType';
import { Vehicle, VehicleMedia, Booking } from '../../common/models';
import { createError } from '../middleware/errorHandler';
import { Op } from 'sequelize';

/**
 * Get available vehicles - Pure business logic
 * @param {VehicleFilters} filters - Object containing filters for the vehicle search
 * @returns {Promise<Vehicle[]>} - Promise that resolves with an array of vehicles
 * @throws {Error} - If any of the filters are invalid or if the end date is before the start date
 */
export const getAvailableVehicles = async (filters: VehicleFilters): Promise<Vehicle[]> => {
  const whereClause: any = {
    isAvailable: true
  };

  // Apply filters
  if (filters.bodyType) {
    whereClause.bodyType = filters.bodyType;
  }
  
  if (filters.fuelType) {
    whereClause.fuelType = filters.fuelType;
  }
  
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    whereClause.pricePerDay = {};
    if (filters.minPrice !== undefined) {
      whereClause.pricePerDay[Op.gte] = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      whereClause.pricePerDay[Op.lte] = filters.maxPrice;
    }
  }

  // Check availability for specific dates
  if (filters.startDate && filters.endDate) {
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);
    
    if (startDate >= endDate) {
      throw createError('End date must be after start date', 400);
    }

    // Find vehicles that are NOT booked during the requested period
    const bookedVehicles = await Booking.findAll({
      where: {
        bookingStatus: ['PENDING', 'CONFIRMED'],
        [Op.or]: [
          {
            startDatetime: {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            endDatetime: {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            [Op.and]: [
              { startDatetime: { [Op.lte]: startDate } },
              { endDatetime: { [Op.gte]: endDate } }
            ]
          }
        ]
      },
      attributes: ['vehicleId']
    });

    const bookedVehicleIds = bookedVehicles.map(booking => booking.vehicleId);
    
    if (bookedVehicleIds.length > 0) {
      whereClause.id = { [Op.notIn]: bookedVehicleIds };
    }
  }

  const vehicles = await Vehicle.findAll({
    where: whereClause,
    include: [
      {
        model: VehicleMedia,
        attributes: ['id', 'mediaType', 'mediaUrl']
      }
    ],
    order: [['pricePerDay', 'ASC']]
  });

  return vehicles;
};

/**
 * Retrieves a vehicle by ID
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise<Vehicle>} - Promise resolving to a vehicle object
 * @throws {Error} - Vehicle ID is required
 * @throws {Error} - Vehicle not found
 */
export const getVehicleById = async (vehicleId: string): Promise<Vehicle> => {
  if (!vehicleId) {
    throw createError('Vehicle ID is required', 400);
  }

  const vehicle = await Vehicle.findByPk(vehicleId, {
    include: [
      {
        model: VehicleMedia,
        attributes: ['id', 'mediaType', 'mediaUrl']
      }
    ]
  });

  if (!vehicle) {
    throw createError('Vehicle not found', 404);
  }

  return vehicle;
};


/**
 * Searches for vehicles based on the provided query and filters
 * @param {string} query - Search query
 * @param {Object} filters - Object containing filters for the vehicle search
 * @returns {Promise<Vehicle[]>} - Promise resolving to an array of vehicle objects
 * @throws {Error} - Search query must be at least 2 characters long
 */
export const searchVehicles = async (query: string, filters: any): Promise<Vehicle[]> => {
  if (!query || query.trim().length < 2) {
    throw createError('Search query must be at least 2 characters long', 400);
  }

  const searchTerm = `%${query.trim()}%`;
  
  const whereClause: any = {
    isAvailable: true,
    [Op.or]: [
      { make: { [Op.iLike]: searchTerm } },
      { model: { [Op.iLike]: searchTerm } },
      { trim: { [Op.iLike]: searchTerm } },
      { bodyType: { [Op.iLike]: searchTerm } },
      { fuelType: { [Op.iLike]: searchTerm } }
    ]
  };

  // Apply additional filters
  if (filters.bodyType) {
    whereClause.bodyType = filters.bodyType;
  }
  
  if (filters.fuelType) {
    whereClause.fuelType = filters.fuelType;
  }

  const vehicles = await Vehicle.findAll({
    where: whereClause,
    include: [
      {
        model: VehicleMedia,
        attributes: ['id', 'mediaType', 'mediaUrl'],
        limit: 1 
      }
    ],
    order: [['pricePerDay', 'ASC']],
    limit: 20
  });

  return vehicles;
};