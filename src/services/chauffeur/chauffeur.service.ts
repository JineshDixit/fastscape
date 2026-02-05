import { Op } from 'sequelize';
import { Chauffeur, Booking, ChauffeurReview, sequelize } from '../../models';

interface ChauffeurFilters {
  status?: string;
  isVerified?: boolean;
  minRating?: number;
  city?: string;
  page?: number;
  limit?: number;
}

interface CreateChauffeurDto {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string | Date;
  nationality: string;
  licenseNumber: string;
  licenseExpiryDate: string | Date;
  licenseIssuingCountry: string;
  experienceLevel: string;
  yearsOfExperience: number;
  hourlyRate: number;
  currency?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  languages?: string[];
  specializations?: string[];
  notes?: string;
  profilePhoto?: string;
}

interface ChauffeurListResult {
  chauffeurs: Chauffeur[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get all chauffeurs with filtering and pagination
 */
export const getAllChauffeurs = async (filters: ChauffeurFilters): Promise<ChauffeurListResult> => {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 100);
  const offset = (page - 1) * limit;

  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.isVerified !== undefined) {
    where.isVerified = filters.isVerified;
  }

  if (filters.minRating) {
    where.rating = {
      [Op.gte]: filters.minRating,
    };
  }

  if (filters.city) {
    where.city = filters.city;
  }

  const { rows: chauffeurs, count: total } = await Chauffeur.findAndCountAll({
    where,
    order: [
      ['rating', 'DESC'],
      ['totalTrips', 'DESC'],
    ],
    limit,
    offset,
  });

  return {
    chauffeurs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single chauffeur by ID with booking history and performance metrics
 */
export const getChauffeurById = async (chauffeurId: string) => {
  const chauffeur = await Chauffeur.findByPk(chauffeurId);

  if (!chauffeur) {
    throw new Error('Chauffeur not found');
  }

  // Get booking history
  const bookings = await Booking.findAll({
    where: { chauffeurId },
    attributes: ['id', 'bookingStatus', 'paymentStatus', 'startDatetime', 'endDatetime', 'createdAt'],
    order: [['createdAt', 'DESC']],
    limit: 20,
  });

  // Get reviews
  const reviews = await ChauffeurReview.findAll({
    where: { chauffeurId },
    order: [['createdAt', 'DESC']],
    limit: 10,
  });

  // Calculate performance metrics
  const totalBookings = await Booking.count({
    where: { chauffeurId },
  });

  const completedBookings = await Booking.count({
    where: {
      chauffeurId,
      bookingStatus: 'COMPLETED',
    },
  });

  const cancelledBookings = await Booking.count({
    where: {
      chauffeurId,
      bookingStatus: 'CANCELLED',
    },
  });

  const averageRatings =
    reviews.length > 0
      ? {
          overall: reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length,
          drivingSkill: reviews.reduce((sum, r) => sum + r.drivingSkillRating, 0) / reviews.length,
          punctuality: reviews.reduce((sum, r) => sum + r.punctualityRating, 0) / reviews.length,
          professionalism: reviews.reduce((sum, r) => sum + r.professionalismRating, 0) / reviews.length,
          vehicleCondition: reviews.reduce((sum, r) => sum + r.vehicleConditionRating, 0) / reviews.length,
          recommendationRate: (reviews.filter((r) => r.wouldRecommend).length / reviews.length) * 100,
        }
      : null;

  return {
    chauffeur,
    bookingHistory: bookings,
    recentReviews: reviews,
    performanceMetrics: {
      totalBookings,
      completedBookings,
      cancelledBookings,
      completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
      cancellationRate: totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0,
      averageRatings,
      totalReviews: reviews.length,
    },
  };
};

/**
 * Verify a chauffeur (mark as verified)
 */
export const verifyChauffeur = async (chauffeurId: string): Promise<Chauffeur> => {
  const chauffeur = await Chauffeur.findByPk(chauffeurId);

  if (!chauffeur) {
    throw new Error('Chauffeur not found');
  }

  if (chauffeur.isVerified) {
    throw new Error('Chauffeur is already verified');
  }

  await chauffeur.update({ isVerified: true });
  return chauffeur;
};

/**
 * Update chauffeur status
 */
export const updateChauffeurStatus = async (chauffeurId: string, newStatus: string): Promise<Chauffeur> => {
  const validStatuses = ['AVAILABLE', 'BUSY', 'OFF_DUTY', 'ON_BREAK'];

  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const chauffeur = await Chauffeur.findByPk(chauffeurId);

  if (!chauffeur) {
    throw new Error('Chauffeur not found');
  }

  await chauffeur.update({
    status: newStatus,
    lastActiveAt: new Date(),
  });

  return chauffeur;
};

/**
 * Create a new chauffeur
 */
export const createChauffeur = async (data: CreateChauffeurDto): Promise<Chauffeur> => {
  // Check for existing duplicates
  const existingChauffeur = await Chauffeur.findOne({
    where: {
      [Op.or]: [{ email: data.email }, { phone: data.phone }, { licenseNumber: data.licenseNumber }],
    },
  });

  if (existingChauffeur) {
    if (existingChauffeur.email === data.email) throw new Error('Email already executing');
    if (existingChauffeur.phone === data.phone) throw new Error('Phone number already exists');
    if (existingChauffeur.licenseNumber === data.licenseNumber) throw new Error('License number already exists');
  }

  return await Chauffeur.create({
      ...data,
      status: 'AVAILABLE',
      isVerified: false,
      rating: 5.0,
      totalTrips: 0,
      joinedAt: new Date(),
    });
};

/**
 * Delete (Soft Delete) a chauffeur
 * Sets status to OFF_DUTY and isVerified to false
 */
export const deleteChauffeur = async (chauffeurId: string): Promise<void> => {
  const chauffeur = await Chauffeur.findByPk(chauffeurId);

  if (!chauffeur) {
    throw new Error('Chauffeur not found');
  }

  // Check if active bookings exist?
  // Logic: Allow "deleting" (marking inactive) even if bookings exist, but maybe warn?
  // For now, simple update.

  await chauffeur.update({
    status: 'OFF_DUTY',
    isVerified: false,
    notes: `${chauffeur.notes || ''}\n[DELETED] Account deactivated by admin on ${new Date().toISOString()}`.trim(),
  });
};
