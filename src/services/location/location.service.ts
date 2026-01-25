import { Op } from 'sequelize';
import { Location } from '../../models';

class LocationService {
  /**
   * Get all active locations with optional filtering
   * @param query - Query parameters (type, city)
   */
  async getLocations(query: { type?: string; city?: string }) {
    const { type, city } = query;

    const whereClause: any = {
      isActive: true,
    };

    if (type) {
      whereClause.type = type;
    }

    if (city) {
      whereClause.city = { [Op.iLike]: `%${city}%` };
    }

    const locations = await Location.findAll({
      where: whereClause,
      order: [['name', 'ASC']],
    });

    return locations;
  }
}

export const locationService = new LocationService();
