"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllChauffeurs = exports.getChauffeurPerformance = exports.updateChauffeurProfile = exports.createNewChauffeur = exports.getChauffeurProfile = exports.removeChauffeurFromBooking = exports.assignSpecificChauffeur = exports.autoAssignChauffeurToBooking = exports.getAvailableChauffeurs = void 0;
const chauffeur_service_1 = require("../../services/chauffeur/chauffeur.service");
const controller_utils_1 = require("../../utils/controller.utils");
const response_utils_1 = require("../../utils/response.utils");
const validation_utils_1 = require("../../utils/validation.utils");
const response_utils_2 = require("../../utils/response.utils");
const sequelize_1 = require("sequelize");
class ChauffeurController extends controller_utils_1.BaseController {
    constructor() {
        super(...arguments);
        /**
         * Find available chauffeurs for a booking
         */
        this.getAvailableChauffeurs = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { startDatetime, endDatetime, vehicleType, city, minRating, maxHourlyRate, languages, experienceLevel } = req.query;
            (0, validation_utils_1.validateRequiredFields)({ startDatetime, endDatetime }, ['startDatetime', 'endDatetime']);
            const availableChauffeurs = yield (0, chauffeur_service_1.findAvailableChauffeurs)({
                startDatetime: new Date(startDatetime),
                endDatetime: new Date(endDatetime),
                vehicleType: vehicleType,
                city: city,
                minRating: minRating ? Number(minRating) : undefined,
                maxHourlyRate: maxHourlyRate ? Number(maxHourlyRate) : undefined,
                languages: languages ? languages.split(',') : undefined,
                experienceLevel: experienceLevel,
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
            (0, response_utils_1.sendSuccess)(res, 'Available chauffeurs retrieved successfully', {
                count: formattedChauffeurs.length,
                chauffeurs: formattedChauffeurs,
            });
        }));
        /**
         * Auto-assign best available chauffeur to booking
         */
        this.autoAssignChauffeurToBooking = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const bookingId = this.getValidatedId(req, 'bookingId');
            const { vehicleType, minRating, maxHourlyRate, languages } = req.body;
            const result = yield (0, chauffeur_service_1.autoAssignChauffeur)(bookingId, {
                vehicleType,
                minRating,
                maxHourlyRate,
                languages,
            });
            if (!result) {
                return (0, response_utils_1.sendSuccess)(res, 'No available chauffeurs found for this booking', null, 404);
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
            (0, response_utils_1.sendSuccess)(res, 'Chauffeur assigned successfully', responseData);
        }));
        /**
         * Manually assign specific chauffeur to booking
         */
        this.assignSpecificChauffeur = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const bookingId = this.getValidatedId(req, 'bookingId');
            const chauffeurId = this.getValidatedId(req, 'chauffeurId');
            const result = yield (0, chauffeur_service_1.assignChauffeurToBooking)(bookingId, chauffeurId);
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
            (0, response_utils_1.sendSuccess)(res, 'Chauffeur assigned to booking successfully', responseData);
        }));
        /**
         * Remove chauffeur from booking
         */
        this.removeChauffeurFromBooking = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const bookingId = this.getValidatedId(req, 'bookingId');
            yield (0, chauffeur_service_1.releaseChauffeurFromBooking)(bookingId);
            (0, response_utils_1.sendSuccess)(res, 'Chauffeur removed from booking successfully');
        }));
        /**
         * Get detailed chauffeur information
         */
        this.getChauffeurProfile = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const chauffeurId = this.getValidatedId(req, 'chauffeurId');
            const chauffeurDetails = yield (0, chauffeur_service_1.getChauffeurDetails)(chauffeurId);
            (0, response_utils_1.sendSuccess)(res, 'Chauffeur details retrieved successfully', chauffeurDetails);
        }));
        /**
         * Create new chauffeur (Admin only)
         */
        this.createNewChauffeur = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const chauffeurData = req.body;
            const newChauffeur = yield (0, chauffeur_service_1.createChauffeur)(chauffeurData);
            const responseData = {
                id: newChauffeur.id,
                fullName: newChauffeur.fullName,
                email: newChauffeur.email,
                phone: newChauffeur.phone,
                status: newChauffeur.status,
                isVerified: newChauffeur.isVerified,
            };
            (0, response_utils_1.sendCreated)(res, 'Chauffeur created successfully', responseData);
        }));
        /**
         * Update chauffeur information
         */
        this.updateChauffeurProfile = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const chauffeurId = this.getValidatedId(req, 'chauffeurId');
            const updateData = req.body;
            const updatedChauffeur = yield (0, chauffeur_service_1.updateChauffeur)(chauffeurId, updateData);
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
            (0, response_utils_1.sendSuccess)(res, 'Chauffeur updated successfully', responseData);
        }));
        /**
         * Get chauffeur performance metrics (Admin only)
         */
        this.getChauffeurPerformance = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const chauffeurId = this.getValidatedId(req, 'chauffeurId');
            const metrics = yield (0, chauffeur_service_1.getChauffeurMetrics)(chauffeurId);
            (0, response_utils_1.sendSuccess)(res, 'Chauffeur metrics retrieved successfully', metrics);
        }));
        /**
         * Get all chauffeurs (Admin only)
         */
        this.getAllChauffeurs = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const { status, city, experienceLevel } = req.query;
            const { page, limit, offset } = (0, response_utils_2.parsePaginationParams)(req.query);
            const { Chauffeur } = yield Promise.resolve().then(() => __importStar(require('../../models')));
            const whereConditions = {};
            if (status) {
                whereConditions.status = status;
            }
            if (city) {
                whereConditions.city = { [sequelize_1.Op.iLike]: `%${city}%` };
            }
            if (experienceLevel) {
                whereConditions.experienceLevel = experienceLevel;
            }
            const { count, rows: chauffeurs } = yield Chauffeur.findAndCountAll({
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
            (0, response_utils_1.sendSuccessWithPagination)(res, 'Chauffeurs retrieved successfully', chauffeurs, {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit),
            });
        }));
    }
}
const chauffeurController = new ChauffeurController();
exports.getAvailableChauffeurs = chauffeurController.getAvailableChauffeurs, exports.autoAssignChauffeurToBooking = chauffeurController.autoAssignChauffeurToBooking, exports.assignSpecificChauffeur = chauffeurController.assignSpecificChauffeur, exports.removeChauffeurFromBooking = chauffeurController.removeChauffeurFromBooking, exports.getChauffeurProfile = chauffeurController.getChauffeurProfile, exports.createNewChauffeur = chauffeurController.createNewChauffeur, exports.updateChauffeurProfile = chauffeurController.updateChauffeurProfile, exports.getChauffeurPerformance = chauffeurController.getChauffeurPerformance, exports.getAllChauffeurs = chauffeurController.getAllChauffeurs;
//# sourceMappingURL=chauffeur.controller.js.map