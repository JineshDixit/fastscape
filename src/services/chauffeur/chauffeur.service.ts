import {
  ChauffeurAvailabilityQuery,
  CreateChauffeurData,
  UpdateChauffeurData,
} from '../../common/types/chauffeurTypes';
import { Chauffeur, ChauffeurReview, Booking, Vehicle } from '../../models';
import { createError } from '../middleware/errorHandler';
import { Op } from 'sequelize';

/**
 * Find available chauffeurs for a booking
 */
export const findAvailableChauffeurs = async (query: ChauffeurAvailabilityQuery): Promise<Chauffeur[]> => {
  const {
    startDatetime,
    endDatetime,
    vehicleType,
    city,
    minRating = 0,
    maxHourlyRate = 1000,
    languages,
    experienceLevel,
  } = query;

  // Build where conditions
  const whereConditions: any = {
    status: 'AVAILABLE',
    isVerified: true,
    rating: { [Op.gte]: minRating },
    hourlyRate: { [Op.lte]: maxHourlyRate },
  };

  if (city) {
    whereConditions.city = { [Op.iLike]: `%${city}%` };
  }

  if (vehicleType) {
    whereConditions.specializations = {
      [Op.contains]: [vehicleType],
    };
  }

  if (languages && languages.length > 0) {
    whereConditions.languages = {
      [Op.overlap]: languages,
    };
  }

  if (experienceLevel) {
    whereConditions.experienceLevel = experienceLevel;
  }

  // Find chauffeurs not busy during the requested time
  const busyChauffeurIds = await Booking.findAll({
    where: {
      chauffeurId: { [Op.ne]: null },
      bookingStatus: ['CONFIRMED', 'PICKED_UP'],
      [Op.or]: [
        {
          startDatetime: {
            [Op.between]: [startDatetime, endDatetime],
          },
        },
        {
          endDatetime: {
            [Op.between]: [startDatetime, endDatetime],
          },
        },
        {
          [Op.and]: [{ startDatetime: { [Op.lte]: startDatetime } }, { endDatetime: { [Op.gte]: endDatetime } }],
        },
      ],
    },
    attributes: ['chauffeurId'],
  });

  const busyIds = busyChauffeurIds.map((booking) => booking.chauffeurId);

  if (busyIds.length > 0) {
    whereConditions.id = { [Op.notIn]: busyIds };
  }

  return Chauffeur.findAll({
    where: whereConditions,
    order: [
      ['rating', 'DESC'],
      ['totalTrips', 'DESC'],
      ['hourlyRate', 'ASC'],
    ],
    limit: 20,
  });
};

/**
 * Auto-assign best available chauffeur
 */
export const autoAssignChauffeur = async (
  bookingId: string,
  preferences?: {
    vehicleType?: string;
    minRating?: number;
    maxHourlyRate?: number;
    languages?: string[];
  },
): Promise<{ chauffeur: Chauffeur; booking: Booking } | null> => {
  const booking = await Booking.findByPk(bookingId, {
    include: [{ model: Vehicle, attributes: ['bodyType'] }],
  });

  if (!booking) {
    throw createError('Booking not found', 404);
  }

  if (booking.bookingType !== 'CHAUFFEUR') {
    throw createError('Booking is not a chauffeur booking', 400);
  }

  const vehicle = (booking as any).Vehicle;
  const availableChauffeurs = await findAvailableChauffeurs({
    startDatetime: booking.startDatetime,
    endDatetime: booking.endDatetime,
    vehicleType: preferences?.vehicleType || vehicle?.bodyType,
    minRating: preferences?.minRating || 4.0,
    maxHourlyRate: preferences?.maxHourlyRate,
    languages: preferences?.languages,
  });

  if (availableChauffeurs.length === 0) {
    return null;
  }

  // Select the best chauffeur (highest rating, most trips, lowest rate)
  const selectedChauffeur = availableChauffeurs[0];

  // Assign chauffeur to booking
  await booking.update({
    chauffeurId: selectedChauffeur.id,
  });

  // Update chauffeur status
  await selectedChauffeur.update({
    status: 'BUSY',
    lastActiveAt: new Date(),
  });

  return {
    chauffeur: selectedChauffeur,
    booking: await booking.reload(),
  };
};

/**
 * Manually assign chauffeur to booking
 */
export const assignChauffeurToBooking = async (
  bookingId: string,
  chauffeurId: string,
): Promise<{ chauffeur: Chauffeur; booking: Booking }> => {
  const booking = await Booking.findByPk(bookingId);
  const chauffeur = await Chauffeur.findByPk(chauffeurId);

  if (!booking) {
    throw createError('Booking not found', 404);
  }

  if (!chauffeur) {
    throw createError('Chauffeur not found', 404);
  }

  if (booking.bookingType !== 'CHAUFFEUR') {
    throw createError('Booking is not a chauffeur booking', 400);
  }

  if (chauffeur.status !== 'AVAILABLE') {
    throw createError('Chauffeur is not available', 400);
  }

  if (!chauffeur.isVerified) {
    throw createError('Chauffeur is not verified', 400);
  }

  // Check if chauffeur is available during booking time
  const conflictingBooking = await Booking.findOne({
    where: {
      chauffeurId,
      bookingStatus: ['CONFIRMED', 'PICKED_UP'],
      [Op.or]: [
        {
          startDatetime: {
            [Op.between]: [booking.startDatetime, booking.endDatetime],
          },
        },
        {
          endDatetime: {
            [Op.between]: [booking.startDatetime, booking.endDatetime],
          },
        },
        {
          [Op.and]: [
            { startDatetime: { [Op.lte]: booking.startDatetime } },
            { endDatetime: { [Op.gte]: booking.endDatetime } },
          ],
        },
      ],
    },
  });

  if (conflictingBooking) {
    throw createError('Chauffeur is already booked for this time period', 409);
  }

  // Assign chauffeur
  await booking.update({ chauffeurId });
  await chauffeur.update({
    status: 'BUSY',
    lastActiveAt: new Date(),
  });

  return {
    chauffeur,
    booking: await booking.reload(),
  };
};

/**
 * Release chauffeur from booking
 */
export const releaseChauffeurFromBooking = async (bookingId: string): Promise<void> => {
  const booking = await Booking.findByPk(bookingId, {
    include: [{ model: Chauffeur }],
  });

  if (!booking || !booking.chauffeurId) {
    return;
  }

  const chauffeur = (booking as any).Chauffeur;
  if (chauffeur) {
    await chauffeur.update({
      status: 'AVAILABLE',
      lastActiveAt: new Date(),
    });

    // Increment total trips if booking was completed
    if (booking.bookingStatus === 'COMPLETED') {
      await chauffeur.update({
        totalTrips: chauffeur.totalTrips + 1,
      });
    }
  }

  await booking.update({ chauffeurId: null });
};

/**
 * Get chauffeur details with reviews
 */
export const getChauffeurDetails = async (chauffeurId: string) => {
  const chauffeur = await Chauffeur.findByPk(chauffeurId, {
    include: [
      {
        model: ChauffeurReview,
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Booking,
            attributes: ['id', 'startDatetime', 'endDatetime'],
          },
        ],
      },
    ],
  });

  if (!chauffeur) {
    throw createError('Chauffeur not found', 404);
  }

  // Calculate detailed ratings
  const reviews = (chauffeur as any).ChauffeurReviews || [];
  const totalReviews = reviews.length;

  const averageRatings = {
    overall: chauffeur.rating,
    drivingSkill: 0,
    punctuality: 0,
    professionalism: 0,
    vehicleCondition: 0,
    recommendationRate: 0,
  };

  if (totalReviews > 0) {
    averageRatings.drivingSkill = reviews.reduce((sum: number, r: any) => sum + r.drivingSkillRating, 0) / totalReviews;
    averageRatings.punctuality = reviews.reduce((sum: number, r: any) => sum + r.punctualityRating, 0) / totalReviews;
    averageRatings.professionalism =
      reviews.reduce((sum: number, r: any) => sum + r.professionalismRating, 0) / totalReviews;
    averageRatings.vehicleCondition =
      reviews.reduce((sum: number, r: any) => sum + r.vehicleConditionRating, 0) / totalReviews;
    averageRatings.recommendationRate = (reviews.filter((r: any) => r.wouldRecommend).length / totalReviews) * 100;
  }

  return {
    chauffeur: {
      id: chauffeur.id,
      fullName: chauffeur.fullName,
      profilePhoto: chauffeur.profilePhoto,
      experienceLevel: chauffeur.experienceLevel,
      yearsOfExperience: chauffeur.yearsOfExperience,
      languages: chauffeur.languages,
      specializations: chauffeur.specializations,
      hourlyRate: chauffeur.hourlyRate,
      currency: chauffeur.currency,
      rating: chauffeur.rating,
      totalTrips: chauffeur.totalTrips,
      city: chauffeur.city,
      state: chauffeur.state,
      joinedAt: chauffeur.joinedAt,
    },
    ratings: averageRatings,
    totalReviews,
    recentReviews: reviews.slice(0, 5).map((review: any) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      booking: review.Booking,
    })),
  };
};

/**
 * Create new chauffeur
 */
export const createChauffeur = async (data: CreateChauffeurData): Promise<Chauffeur> => {
  // Check for existing email or phone
  const existingChauffeur = await Chauffeur.findOne({
    where: {
      [Op.or]: [{ email: data.email }, { phone: data.phone }, { licenseNumber: data.licenseNumber }],
    },
  });

  if (existingChauffeur) {
    throw createError('Chauffeur with this email, phone, or license number already exists', 409);
  }

  return Chauffeur.create({
    ...data,
    joinedAt: new Date(),
  });
};

/**
 * Update chauffeur
 */
export const updateChauffeur = async (chauffeurId: string, data: UpdateChauffeurData): Promise<Chauffeur> => {
  const chauffeur = await Chauffeur.findByPk(chauffeurId);

  if (!chauffeur) {
    throw createError('Chauffeur not found', 404);
  }

  await chauffeur.update(data);
  return chauffeur.reload();
};

/**
 * Get chauffeur performance metrics
 */
export const getChauffeurMetrics = async (chauffeurId: string) => {
  const chauffeur = await Chauffeur.findByPk(chauffeurId);

  if (!chauffeur) {
    throw createError('Chauffeur not found', 404);
  }

  // Get booking statistics
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

  // Get review statistics
  const reviews = await ChauffeurReview.findAll({
    where: { chauffeurId },
    attributes: [
      'rating',
      'drivingSkillRating',
      'punctualityRating',
      'professionalismRating',
      'vehicleConditionRating',
      'wouldRecommend',
    ],
  });

  const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
  const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

  return {
    chauffeur: {
      id: chauffeur.id,
      fullName: chauffeur.fullName,
      status: chauffeur.status,
      rating: chauffeur.rating,
      totalTrips: chauffeur.totalTrips,
    },
    metrics: {
      totalBookings,
      completedBookings,
      cancelledBookings,
      completionRate: Math.round(completionRate * 100) / 100,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      totalReviews: reviews.length,
      averageRating: chauffeur.rating,
    },
    detailedRatings:
      reviews.length > 0
        ? {
            drivingSkill: reviews.reduce((sum, r) => sum + r.drivingSkillRating, 0) / reviews.length,
            punctuality: reviews.reduce((sum, r) => sum + r.punctualityRating, 0) / reviews.length,
            professionalism: reviews.reduce((sum, r) => sum + r.professionalismRating, 0) / reviews.length,
            vehicleCondition: reviews.reduce((sum, r) => sum + r.vehicleConditionRating, 0) / reviews.length,
            recommendationRate: (reviews.filter((r) => r.wouldRecommend).length / reviews.length) * 100,
          }
        : null,
  };
};

/**
 * Update chauffeur rating based on reviews
 */
export const updateChauffeurRating = async (chauffeurId: string): Promise<void> => {
  const reviews = await ChauffeurReview.findAll({
    where: { chauffeurId },
    attributes: ['rating'],
  });

  if (reviews.length === 0) return;

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  await Chauffeur.update({ rating: Math.round(averageRating * 100) / 100 }, { where: { id: chauffeurId } });
};
