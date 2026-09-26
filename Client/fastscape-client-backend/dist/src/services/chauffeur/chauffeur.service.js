"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateChauffeurRating = exports.getChauffeurMetrics = exports.updateChauffeur = exports.createChauffeur = exports.getChauffeurDetails = exports.releaseChauffeurFromBooking = exports.assignChauffeurToBooking = exports.autoAssignChauffeur = exports.findAvailableChauffeurs = void 0;
const models_1 = require("../../models");
const errorHandler_1 = require("../middleware/errorHandler");
const sequelize_1 = require("sequelize");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Find available chauffeurs for a booking
 */
const findAvailableChauffeurs = (query, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDatetime, endDatetime, vehicleType, city, minRating = 0, maxHourlyRate = 1000, languages, experienceLevel, } = query;
    // Build where conditions
    const whereConditions = {
        status: 'AVAILABLE',
        rating: { [sequelize_1.Op.gte]: minRating },
        hourlyRate: { [sequelize_1.Op.lte]: maxHourlyRate },
    };
    if (query.isVerified === true) {
        whereConditions.isVerified = true;
    }
    const totalChauffeurs = yield models_1.Chauffeur.count();
    const availableChauffeursList = yield models_1.Chauffeur.findAll({
        where: { status: 'AVAILABLE' },
        attributes: ['id', 'isVerified', 'specializations'],
    });
    if (process.env.NODE_ENV === 'development') {
        logger_1.default.debug('Available chauffeurs details', {
            chauffeurs: availableChauffeursList.map((c) => ({
                id: c.id,
                verified: c.isVerified,
                specs: c.specializations,
            })),
            counts: {
                total: totalChauffeurs,
                available: availableChauffeursList.length,
            },
        });
    }
    if (city) {
        whereConditions.city = { [sequelize_1.Op.iLike]: `%${city}%` };
    }
    if (vehicleType) {
        whereConditions.specializations = {
            [sequelize_1.Op.contains]: [vehicleType],
        };
    }
    if (languages && languages.length > 0) {
        whereConditions.languages = {
            [sequelize_1.Op.overlap]: languages,
        };
    }
    if (experienceLevel) {
        whereConditions.experienceLevel = experienceLevel;
    }
    // Find chauffeurs not busy during the requested time
    const busyChauffeurIds = yield models_1.Booking.findAll({
        where: {
            chauffeurId: { [sequelize_1.Op.ne]: null },
            bookingStatus: ['CONFIRMED', 'PICKED_UP'],
            [sequelize_1.Op.or]: [
                {
                    startDatetime: {
                        [sequelize_1.Op.between]: [startDatetime, endDatetime],
                    },
                },
                {
                    endDatetime: {
                        [sequelize_1.Op.between]: [startDatetime, endDatetime],
                    },
                },
                {
                    [sequelize_1.Op.and]: [{ startDatetime: { [sequelize_1.Op.lte]: startDatetime } }, { endDatetime: { [sequelize_1.Op.gte]: endDatetime } }],
                },
            ],
        },
        attributes: ['chauffeurId'],
        transaction,
    });
    const busyIds = busyChauffeurIds.map((booking) => booking.chauffeurId);
    if (busyIds.length > 0) {
        whereConditions.id = { [sequelize_1.Op.notIn]: busyIds };
    }
    const chauffeurs = yield models_1.Chauffeur.findAll({
        where: whereConditions,
        order: [
            ['rating', 'DESC'],
            ['totalTrips', 'DESC'],
            ['hourlyRate', 'ASC'],
        ],
        limit: 20,
        transaction,
    });
    logger_1.default.info(`Found ${chauffeurs.length} available chauffeurs matching criteria`, {
        foundCount: chauffeurs.length,
        city: whereConditions.city,
        status: whereConditions.status,
        isVerified: whereConditions.isVerified,
    });
    return chauffeurs;
});
exports.findAvailableChauffeurs = findAvailableChauffeurs;
/**
 * Auto-assign best available chauffeur
 */
const autoAssignChauffeur = (bookingId, preferences, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const booking = yield models_1.Booking.findByPk(bookingId, {
        include: [{ model: models_1.Vehicle, as: 'vehicle', attributes: ['bodyType'] }],
        transaction,
    });
    if (!booking) {
        throw (0, errorHandler_1.createError)('Booking not found', 404);
    }
    if (booking.bookingType !== 'CHAUFFEUR') {
        throw (0, errorHandler_1.createError)('Booking is not a chauffeur booking', 400);
    }
    const { vehicle } = booking;
    const requestedVehicleType = (preferences === null || preferences === void 0 ? void 0 : preferences.vehicleType) || (vehicle === null || vehicle === void 0 ? void 0 : vehicle.bodyType);
    if (process.env.NODE_ENV === 'development') {
        logger_1.default.debug('Auto-assign chauffeur search params', {
            bookingId,
            start: booking.startDatetime,
            end: booking.endDatetime,
            vehicleType: requestedVehicleType,
            minRating: (_a = preferences === null || preferences === void 0 ? void 0 : preferences.minRating) !== null && _a !== void 0 ? _a : 4.0,
            maxHourlyRate: preferences === null || preferences === void 0 ? void 0 : preferences.maxHourlyRate,
            hasTransaction: !!transaction,
        });
    }
    let availableChauffeurs = yield (0, exports.findAvailableChauffeurs)({
        startDatetime: booking.startDatetime,
        endDatetime: booking.endDatetime,
        vehicleType: requestedVehicleType,
        minRating: (_b = preferences === null || preferences === void 0 ? void 0 : preferences.minRating) !== null && _b !== void 0 ? _b : 4.0,
        maxHourlyRate: preferences === null || preferences === void 0 ? void 0 : preferences.maxHourlyRate,
        languages: preferences === null || preferences === void 0 ? void 0 : preferences.languages,
        isVerified: preferences === null || preferences === void 0 ? void 0 : preferences.isVerified,
    }, transaction);
    // Fallback: If no specialized chauffeur found, try without vehicleType filter
    if (availableChauffeurs.length === 0 && requestedVehicleType) {
        if (process.env.NODE_ENV === 'development') {
            logger_1.default.debug('No specialized chauffeur found, trying fallback without vehicle type filter');
        }
        availableChauffeurs = yield (0, exports.findAvailableChauffeurs)({
            startDatetime: booking.startDatetime,
            endDatetime: booking.endDatetime,
            minRating: (_c = preferences === null || preferences === void 0 ? void 0 : preferences.minRating) !== null && _c !== void 0 ? _c : 4.0,
            maxHourlyRate: preferences === null || preferences === void 0 ? void 0 : preferences.maxHourlyRate,
            languages: preferences === null || preferences === void 0 ? void 0 : preferences.languages,
            isVerified: preferences === null || preferences === void 0 ? void 0 : preferences.isVerified,
        }, transaction);
    }
    if (process.env.NODE_ENV === 'development') {
        logger_1.default.debug('Final available chauffeurs found', { count: availableChauffeurs.length });
    }
    if (availableChauffeurs.length === 0) {
        logger_1.default.warn('Auto-assignment failed: No available chauffeurs found', {
            bookingId,
            vehicleType: (preferences === null || preferences === void 0 ? void 0 : preferences.vehicleType) || (vehicle === null || vehicle === void 0 ? void 0 : vehicle.bodyType),
            minRating: (_d = preferences === null || preferences === void 0 ? void 0 : preferences.minRating) !== null && _d !== void 0 ? _d : 4.0,
            searchStartTime: booking.startDatetime,
            searchEndTime: booking.endDatetime,
        });
        return null;
    }
    // Select the best chauffeur (highest rating, most trips, lowest rate)
    const selectedChauffeur = availableChauffeurs[0];
    // Assign chauffeur to booking
    yield booking.update({
        chauffeurId: selectedChauffeur.id,
    }, { transaction });
    // Update chauffeur status
    yield selectedChauffeur.update({
        status: 'BUSY',
        lastActiveAt: new Date(),
    }, { transaction });
    return {
        chauffeur: selectedChauffeur,
        booking: yield booking.reload({ transaction }),
    };
});
exports.autoAssignChauffeur = autoAssignChauffeur;
/**
 * Manually assign chauffeur to booking
 */
const assignChauffeurToBooking = (bookingId, chauffeurId) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield models_1.Booking.findByPk(bookingId);
    const chauffeur = yield models_1.Chauffeur.findByPk(chauffeurId);
    if (!booking) {
        throw (0, errorHandler_1.createError)('Booking not found', 404);
    }
    if (!chauffeur) {
        throw (0, errorHandler_1.createError)('Chauffeur not found', 404);
    }
    if (booking.bookingType !== 'CHAUFFEUR') {
        throw (0, errorHandler_1.createError)('Booking is not a chauffeur booking', 400);
    }
    if (chauffeur.status !== 'AVAILABLE') {
        throw (0, errorHandler_1.createError)('Chauffeur is not available', 400);
    }
    if (!chauffeur.isVerified) {
        throw (0, errorHandler_1.createError)('Chauffeur is not verified', 400);
    }
    // Check if chauffeur is available during booking time
    const conflictingBooking = yield models_1.Booking.findOne({
        where: {
            chauffeurId,
            bookingStatus: ['CONFIRMED', 'PICKED_UP'],
            [sequelize_1.Op.or]: [
                {
                    startDatetime: {
                        [sequelize_1.Op.between]: [booking.startDatetime, booking.endDatetime],
                    },
                },
                {
                    endDatetime: {
                        [sequelize_1.Op.between]: [booking.startDatetime, booking.endDatetime],
                    },
                },
                {
                    [sequelize_1.Op.and]: [
                        { startDatetime: { [sequelize_1.Op.lte]: booking.startDatetime } },
                        { endDatetime: { [sequelize_1.Op.gte]: booking.endDatetime } },
                    ],
                },
            ],
        },
    });
    if (conflictingBooking) {
        throw (0, errorHandler_1.createError)('Chauffeur is already booked for this time period', 409);
    }
    // Assign chauffeur
    yield booking.update({ chauffeurId });
    yield chauffeur.update({
        status: 'BUSY',
        lastActiveAt: new Date(),
    });
    return {
        chauffeur,
        booking: yield booking.reload(),
    };
});
exports.assignChauffeurToBooking = assignChauffeurToBooking;
/**
 * Release chauffeur from booking
 */
const releaseChauffeurFromBooking = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield models_1.Booking.findByPk(bookingId, {
        include: [{ model: models_1.Chauffeur, as: 'chauffeur' }],
    });
    if (!booking || !booking.chauffeurId) {
        return;
    }
    const { chauffeur } = booking;
    if (chauffeur) {
        yield chauffeur.update({
            status: 'AVAILABLE',
            lastActiveAt: new Date(),
        });
        // Increment total trips if booking was completed
        if (booking.bookingStatus === 'COMPLETED') {
            yield chauffeur.update({
                totalTrips: chauffeur.totalTrips + 1,
            });
        }
    }
    yield booking.update({ chauffeurId: null });
});
exports.releaseChauffeurFromBooking = releaseChauffeurFromBooking;
/**
 * Get chauffeur details with reviews
 */
const getChauffeurDetails = (chauffeurId) => __awaiter(void 0, void 0, void 0, function* () {
    const chauffeur = yield models_1.Chauffeur.findByPk(chauffeurId, {
        include: [
            {
                model: models_1.ChauffeurReview,
                as: 'reviews',
                limit: 10,
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: models_1.Booking,
                        as: 'booking',
                        attributes: ['id', 'startDatetime', 'endDatetime'],
                    },
                ],
            },
        ],
    });
    if (!chauffeur) {
        throw (0, errorHandler_1.createError)('Chauffeur not found', 404);
    }
    // Calculate detailed ratings
    const reviews = chauffeur.reviews || [];
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
        averageRatings.drivingSkill = reviews.reduce((sum, r) => sum + r.drivingSkillRating, 0) / totalReviews;
        averageRatings.punctuality = reviews.reduce((sum, r) => sum + r.punctualityRating, 0) / totalReviews;
        averageRatings.professionalism =
            reviews.reduce((sum, r) => sum + r.professionalismRating, 0) / totalReviews;
        averageRatings.vehicleCondition =
            reviews.reduce((sum, r) => sum + r.vehicleConditionRating, 0) / totalReviews;
        averageRatings.recommendationRate = (reviews.filter((r) => r.wouldRecommend).length / totalReviews) * 100;
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
        recentReviews: reviews.slice(0, 5).map((review) => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            booking: review.booking,
        })),
    };
});
exports.getChauffeurDetails = getChauffeurDetails;
/**
 * Create new chauffeur
 */
const createChauffeur = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // Check for existing email or phone
    const existingChauffeur = yield models_1.Chauffeur.findOne({
        where: {
            [sequelize_1.Op.or]: [{ email: data.email }, { phone: data.phone }, { licenseNumber: data.licenseNumber }],
        },
    });
    if (existingChauffeur) {
        throw (0, errorHandler_1.createError)('Chauffeur with this email, phone, or license number already exists', 409);
    }
    return models_1.Chauffeur.create(Object.assign(Object.assign({}, data), { joinedAt: new Date() }));
});
exports.createChauffeur = createChauffeur;
/**
 * Update chauffeur
 */
const updateChauffeur = (chauffeurId, data) => __awaiter(void 0, void 0, void 0, function* () {
    const chauffeur = yield models_1.Chauffeur.findByPk(chauffeurId);
    if (!chauffeur) {
        throw (0, errorHandler_1.createError)('Chauffeur not found', 404);
    }
    yield chauffeur.update(data);
    return chauffeur.reload();
});
exports.updateChauffeur = updateChauffeur;
/**
 * Get chauffeur performance metrics
 */
const getChauffeurMetrics = (chauffeurId) => __awaiter(void 0, void 0, void 0, function* () {
    const chauffeur = yield models_1.Chauffeur.findByPk(chauffeurId);
    if (!chauffeur) {
        throw (0, errorHandler_1.createError)('Chauffeur not found', 404);
    }
    // Get booking statistics
    const totalBookings = yield models_1.Booking.count({
        where: { chauffeurId },
    });
    const completedBookings = yield models_1.Booking.count({
        where: {
            chauffeurId,
            bookingStatus: 'COMPLETED',
        },
    });
    const cancelledBookings = yield models_1.Booking.count({
        where: {
            chauffeurId,
            bookingStatus: 'CANCELLED',
        },
    });
    // Get review statistics
    const reviews = yield models_1.ChauffeurReview.findAll({
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
        detailedRatings: reviews.length > 0
            ? {
                drivingSkill: reviews.reduce((sum, r) => sum + r.drivingSkillRating, 0) / reviews.length,
                punctuality: reviews.reduce((sum, r) => sum + r.punctualityRating, 0) / reviews.length,
                professionalism: reviews.reduce((sum, r) => sum + r.professionalismRating, 0) / reviews.length,
                vehicleCondition: reviews.reduce((sum, r) => sum + r.vehicleConditionRating, 0) / reviews.length,
                recommendationRate: (reviews.filter((r) => r.wouldRecommend).length / reviews.length) * 100,
            }
            : null,
    };
});
exports.getChauffeurMetrics = getChauffeurMetrics;
/**
 * Update chauffeur rating based on reviews
 */
const updateChauffeurRating = (chauffeurId) => __awaiter(void 0, void 0, void 0, function* () {
    const reviews = yield models_1.ChauffeurReview.findAll({
        where: { chauffeurId },
        attributes: ['rating'],
    });
    if (reviews.length === 0)
        return;
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    yield models_1.Chauffeur.update({ rating: Math.round(averageRating * 100) / 100 }, { where: { id: chauffeurId } });
});
exports.updateChauffeurRating = updateChauffeurRating;
//# sourceMappingURL=chauffeur.service.js.map