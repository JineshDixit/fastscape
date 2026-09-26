import { Response } from 'express';
import { AuthenticatedRequest } from '../../common/types/expressTypes';
import {
  findAvailableChauffeurs,
  autoAssignChauffeur,
  assignChauffeurToBooking,
  releaseChauffeurFromBooking,
  getChauffeurDetails,
  createChauffeur,
  updateChauffeur,
  getChauffeurMetrics,
} from '../../services/chauffeur/chauffeur.service';
import { BaseController } from '../../utils/controller.utils';
import { sendSuccess, sendCreated, sendSuccessWithPagination } from '../../utils/response.utils';
import { validateRequiredFields } from '../../utils/validation.utils';
import { parsePaginationParams } from '../../utils/response.utils';
import { Op } from 'sequelize';

class ChauffeurController extends BaseController {
  /**
   * Find available chauffeurs for a booking
   */
  getAvailableChauffeurs = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { startDatetime, endDatetime, vehicleType, city, minRating, maxHourlyRate, languages, experienceLevel } =
      req.query;

    validateRequiredFields({ startDatetime, endDatetime }, ['startDatetime', 'endDatetime']);

    const availableChauffeurs = await findAvailableChauffeurs({
      startDatetime: new Date(startDatetime as string),
      endDatetime: new Date(endDatetime as string),
      vehicleType: vehicleType as string,
      city: city as string,
      minRating: minRating ? Number(minRating) : undefined,
      maxHourlyRate: maxHourlyRate ? Number(maxHourlyRate) : undefined,
      languages: languages ? (languages as string).split(',') : undefined,
      experienceLevel: experienceLevel as string,
    });

    const formattedChauffeurs = availableChauffeurs.map((chauffeur) => ({
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
    }));

    sendSuccess(res, 'Available chauffeurs retrieved successfully', {
      count: formattedChauffeurs.length,
      chauffeurs: formattedChauffeurs,
    });
  });

  /**
   * Auto-assign best available chauffeur to booking
   */
  autoAssignChauffeurToBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = this.getValidatedId(req, 'bookingId');
    const { vehicleType, minRating, maxHourlyRate, languages } = req.body;

    const result = await autoAssignChauffeur(bookingId, {
      vehicleType,
      minRating,
      maxHourlyRate,
      languages,
    });

    if (!result) {
      return sendSuccess(res, 'No available chauffeurs found for this booking', null, 404);
    }

    const responseData = {
      chauffeur: {
        id: result.chauffeur.id,
        fullName: result.chauffeur.fullName,
        profilePhoto: result.chauffeur.profilePhoto,
        phone: result.chauffeur.phone,
        experienceLevel: result.chauffeur.experienceLevel,
        languages: result.chauffeur.languages,
        hourlyRate: result.chauffeur.hourlyRate,
        rating: result.chauffeur.rating,
      },
      booking: result.booking,
    };

    sendSuccess(res, 'Chauffeur assigned successfully', responseData);
  });

  /**
   * Manually assign specific chauffeur to booking
   */
  assignSpecificChauffeur = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = this.getValidatedId(req, 'bookingId');
    const chauffeurId = this.getValidatedId(req, 'chauffeurId');

    const result = await assignChauffeurToBooking(bookingId, chauffeurId);

    const responseData = {
      chauffeur: {
        id: result.chauffeur.id,
        fullName: result.chauffeur.fullName,
        profilePhoto: result.chauffeur.profilePhoto,
        phone: result.chauffeur.phone,
        experienceLevel: result.chauffeur.experienceLevel,
        languages: result.chauffeur.languages,
        hourlyRate: result.chauffeur.hourlyRate,
        rating: result.chauffeur.rating,
      },
      booking: result.booking,
    };

    sendSuccess(res, 'Chauffeur assigned to booking successfully', responseData);
  });

  /**
   * Remove chauffeur from booking
   */
  removeChauffeurFromBooking = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const bookingId = this.getValidatedId(req, 'bookingId');
    await releaseChauffeurFromBooking(bookingId);
    sendSuccess(res, 'Chauffeur removed from booking successfully');
  });

  /**
   * Get detailed chauffeur information
   */
  getChauffeurProfile = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const chauffeurId = this.getValidatedId(req, 'chauffeurId');
    const chauffeurDetails = await getChauffeurDetails(chauffeurId);
    sendSuccess(res, 'Chauffeur details retrieved successfully', chauffeurDetails);
  });

  /**
   * Create new chauffeur (Admin only)
   */
  createNewChauffeur = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const chauffeurData = req.body;
    const newChauffeur = await createChauffeur(chauffeurData);

    const responseData = {
      id: newChauffeur.id,
      fullName: newChauffeur.fullName,
      email: newChauffeur.email,
      phone: newChauffeur.phone,
      status: newChauffeur.status,
      isVerified: newChauffeur.isVerified,
    };

    sendCreated(res, 'Chauffeur created successfully', responseData);
  });

  /**
   * Update chauffeur information
   */
  updateChauffeurProfile = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const chauffeurId = this.getValidatedId(req, 'chauffeurId');
    const updateData = req.body;

    const updatedChauffeur = await updateChauffeur(chauffeurId, updateData);

    const responseData = {
      id: updatedChauffeur.id,
      fullName: updatedChauffeur.fullName,
      phone: updatedChauffeur.phone,
      experienceLevel: updatedChauffeur.experienceLevel,
      languages: updatedChauffeur.languages,
      hourlyRate: updatedChauffeur.hourlyRate,
      status: updatedChauffeur.status,
      rating: updatedChauffeur.rating,
    };

    sendSuccess(res, 'Chauffeur updated successfully', responseData);
  });

  /**
   * Get chauffeur performance metrics (Admin only)
   */
  getChauffeurPerformance = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const chauffeurId = this.getValidatedId(req, 'chauffeurId');
    const metrics = await getChauffeurMetrics(chauffeurId);
    sendSuccess(res, 'Chauffeur metrics retrieved successfully', metrics);
  });

  /**
   * Get all chauffeurs (Admin only)
   */
  getAllChauffeurs = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { status, city, experienceLevel } = req.query;
    const { page, limit, offset } = parsePaginationParams(req.query);

    const { Chauffeur } = await import('../../models');

    const whereConditions: any = {};

    if (status) {
      whereConditions.status = status;
    }

    if (city) {
      whereConditions.city = { [Op.iLike]: `%${city}%` };
    }

    if (experienceLevel) {
      whereConditions.experienceLevel = experienceLevel;
    }

    const { count, rows: chauffeurs } = await Chauffeur.findAndCountAll({
      where: whereConditions,
      order: [
        ['rating', 'DESC'],
        ['totalTrips', 'DESC'],
      ],
      limit,
      offset,
      attributes: [
        'id',
        'fullName',
        'email',
        'phone',
        'profilePhoto',
        'experienceLevel',
        'yearsOfExperience',
        'languages',
        'hourlyRate',
        'currency',
        'status',
        'rating',
        'totalTrips',
        'isVerified',
        'city',
        'state',
        'joinedAt',
        'lastActiveAt',
      ],
    });

    sendSuccessWithPagination(res, 'Chauffeurs retrieved successfully', chauffeurs, {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  });
}

const chauffeurController = new ChauffeurController();

export const {
  getAvailableChauffeurs,
  autoAssignChauffeurToBooking,
  assignSpecificChauffeur,
  removeChauffeurFromBooking,
  getChauffeurProfile,
  createNewChauffeur,
  updateChauffeurProfile,
  getChauffeurPerformance,
  getAllChauffeurs,
} = chauffeurController;
