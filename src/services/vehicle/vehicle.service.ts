import { Vehicle, VehicleCreationAttributes } from '../../models/vehicle.model';
import { VehicleMedia, VehicleMediaCreationAttributes } from '../../models/vehicleMedia.model';
import { Op, Transaction } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { dbEnums } from '../../common/enum/dbEnums';
import { createError } from '../middleware/errorHandler';
import { sequelize } from '../../models';

export interface CreateVehicleRequest extends Omit<VehicleCreationAttributes, 'id'> {}

export interface UpdateVehicleRequest extends Partial<Omit<VehicleCreationAttributes, 'id'>> {}

export interface VehicleImageFiles {
  frontImage?: Express.Multer.File[];
  backImage?: Express.Multer.File[];
  leftSideImage?: Express.Multer.File[];
  rightSideImage?: Express.Multer.File[];
  frontLeftImage?: Express.Multer.File[];
  frontRightImage?: Express.Multer.File[];
  interiorFrontImage?: Express.Multer.File[];
  interiorBackImage?: Express.Multer.File[];
  dashboardImage?: Express.Multer.File[];
  engineImage?: Express.Multer.File[];
}

export interface VehicleFilterOptions {
  make?: string;
  model?: string;
  bodyType?: typeof dbEnums.VEHICLE_BODY_TYPE[number];
  transmission?: typeof dbEnums.TRANSMISSION_TYPE[number];
  fuelType?: typeof dbEnums.FUEL_TYPE[number];
  isAvailable?: boolean;
  minPrice?: number;
  maxPrice?: number;
  year?: number;
  search?: string;
  city?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

const uploadDir = path.join(process.cwd(), 'uploads', 'vehicles');

/**
 * Ensure upload directory exists
 */
const ensureUploadDirectoryExists = (): void => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

/**
 * Get file extension from filename
 */
const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || 'jpg';
};

/**
 * Handle vehicle image uploads
 */
const handleVehicleImages = async (
  vehicleId: string,
  imageFiles: VehicleImageFiles,
  transaction?: Transaction
): Promise<void> => {
  const vehicleDir = path.join(uploadDir, vehicleId);
  
  // Ensure vehicle directory exists
  if (!fs.existsSync(vehicleDir)) {
    fs.mkdirSync(vehicleDir, { recursive: true });
  }

  // Find or create vehicle media record
  let vehicleMedia = await VehicleMedia.findOne({
    where: { vehicleId },
    transaction,
  });

  if (!vehicleMedia) {
    vehicleMedia = await VehicleMedia.create(
      {
        vehicleId,
        isPrimary: true,
      },
      { transaction }
    );
  }

  const imageUpdates: Partial<VehicleMediaCreationAttributes> = {};

  // Process each image type
  const imageTypes = [
    'frontImage',
    'backImage',
    'leftSideImage',
    'rightSideImage',
    'frontLeftImage',
    'frontRightImage',
    'interiorFrontImage',
    'interiorBackImage',
    'dashboardImage',
    'engineImage',
  ] as const;

  for (const imageType of imageTypes) {
    const files = imageFiles[imageType];
    if (files && files.length > 0) {
      const file = files[0]; // Take the first file
      const fileName = `${imageType}_${Date.now()}_${uuidv4()}.${getFileExtension(file.originalname)}`;
      const filePath = path.join(vehicleDir, fileName);

      // Save file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Store relative path in database
      const relativePath = path.join('uploads', 'vehicles', vehicleId, fileName);
      imageUpdates[imageType] = relativePath;

      // Delete old image if exists
      const oldImagePath = vehicleMedia[imageType];
      if (oldImagePath && fs.existsSync(path.join(process.cwd(), oldImagePath))) {
        fs.unlinkSync(path.join(process.cwd(), oldImagePath));
      }
    }
  }

  // Update vehicle media record
  if (Object.keys(imageUpdates).length > 0) {
    await vehicleMedia.update(imageUpdates, { transaction });
  }
};

/**
 * Delete vehicle images
 */
const deleteVehicleImages = async (vehicleId: string, transaction?: Transaction): Promise<void> => {
  const vehicleMedia = await VehicleMedia.findOne({
    where: { vehicleId },
    transaction,
  });

  if (vehicleMedia) {
    // Delete physical files
    const vehicleDir = path.join(uploadDir, vehicleId);
    if (fs.existsSync(vehicleDir)) {
      fs.rmSync(vehicleDir, { recursive: true, force: true });
    }

    // Delete database record
    await vehicleMedia.destroy({ transaction });
  }
};

/**
 * Create a new vehicle
 */
export const createVehicle = async (
  vehicleData: CreateVehicleRequest,
  imageFiles?: VehicleImageFiles
): Promise<Vehicle> => {
  const transaction = await sequelize.transaction();
  
  try {
    ensureUploadDirectoryExists();

    // Create vehicle record
    const vehicle = await Vehicle.create(vehicleData, { transaction });

    // Handle image uploads if provided
    if (imageFiles) {
      await handleVehicleImages(vehicle.id, imageFiles, transaction);
    }

    await transaction.commit();

    // Return vehicle with media
    return await getVehicleById(vehicle.id);
  } catch (error) {
    await transaction.rollback();
    throw createError(`Failed to create vehicle: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
};

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
  pagination: PaginationOptions = {}
): Promise<{
  vehicles: Vehicle[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
  } = pagination;

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

  if (filters.city) {
    whereClause.city = { [Op.iLike]: `%${filters.city}%` };
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
 * Update vehicle
 */
export const updateVehicle = async (
  vehicleId: string,
  updateData: UpdateVehicleRequest,
  imageFiles?: VehicleImageFiles
): Promise<Vehicle> => {
  const transaction = await sequelize.transaction();
  
  try {
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      throw createError('Vehicle not found', 404);
    }

    // Update vehicle data
    await vehicle.update(updateData, { transaction });

    // Handle image updates if provided
    if (imageFiles) {
      await handleVehicleImages(vehicleId, imageFiles, transaction);
    }

    await transaction.commit();

    return await getVehicleById(vehicleId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Delete vehicle
 */
export const deleteVehicle = async (vehicleId: string): Promise<void> => {
  const transaction = await sequelize.transaction();
  
  try {
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      throw createError('Vehicle not found', 404);
    }

    // Delete associated media files
    await deleteVehicleImages(vehicleId, transaction);

    // Delete vehicle record
    await vehicle.destroy({ transaction });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
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
    attributes: [
      'bodyType',
      [Vehicle.sequelize!.fn('COUNT', Vehicle.sequelize!.col('id')), 'count'],
    ],
    group: ['bodyType'],
    raw: true,
  });

  const byBodyType: Record<string, number> = {};
  bodyTypeStats.forEach((stat: any) => {
    byBodyType[stat.bodyType] = parseInt(stat.count);
  });

  // Get stats by fuel type
  const fuelTypeStats = await Vehicle.findAll({
    attributes: [
      'fuelType',
      [Vehicle.sequelize!.fn('COUNT', Vehicle.sequelize!.col('id')), 'count'],
    ],
    group: ['fuelType'],
    raw: true,
  });

  const byFuelType: Record<string, number> = {};
  fuelTypeStats.forEach((stat: any) => {
    byFuelType[stat.fuelType] = parseInt(stat.count);
  });

  // Get average price
  const avgPriceResult = await Vehicle.findOne({
    attributes: [
      [Vehicle.sequelize!.fn('AVG', Vehicle.sequelize!.col('pricePerDay')), 'avgPrice'],
    ],
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

/**
 * Toggle vehicle availability
 */
export const toggleVehicleAvailability = async (vehicleId: string): Promise<Vehicle> => {
  const transaction = await sequelize.transaction();
  
  try {
    const vehicle = await Vehicle.findByPk(vehicleId);
    if (!vehicle) {
      throw createError('Vehicle not found', 404);
    }

    await vehicle.update(
      { isAvailable: !vehicle.isAvailable },
      { transaction }
    );

    await transaction.commit();

    return await getVehicleById(vehicleId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Bulk update vehicle availability
 */
export const bulkUpdateVehicleAvailability = async (
  vehicleIds: string[],
  isAvailable: boolean
): Promise<number> => {
  const transaction = await sequelize.transaction();
  
  try {
    const [affectedCount] = await Vehicle.update(
      { isAvailable },
      {
        where: {
          id: {
            [Op.in]: vehicleIds,
          },
        },
        transaction,
      }
    );

    await transaction.commit();

    return affectedCount;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Get vehicle image URL
 */
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  
  // Return full URL for serving images
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  return `${baseUrl}/${imagePath}`;
};