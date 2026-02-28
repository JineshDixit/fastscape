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
exports.testAssignChauffeur = exports.assignChauffeurToBooking = void 0;
const chauffeur_service_1 = require("../../services/chauffeur/chauffeur.service");
const controller_utils_1 = require("../../utils/controller.utils");
const response_utils_1 = require("../../utils/response.utils");
const logger_1 = __importDefault(require("../../utils/logger"));
class BookingFixController extends controller_utils_1.BaseController {
    constructor() {
        super(...arguments);
        /**
         * Manually trigger chauffeur assignment for a specific booking
         * This is a temporary fix for existing bookings without chauffeurs
         */
        this.assignChauffeurToBooking = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const bookingId = this.getValidatedId(req, 'bookingId');
            logger_1.default.info('Manual chauffeur assignment requested', { bookingId });
            try {
                const result = yield (0, chauffeur_service_1.autoAssignChauffeur)(bookingId);
                if (result) {
                    logger_1.default.info('Chauffeur assigned successfully', {
                        bookingId,
                        chauffeurId: result.chauffeur.id
                    });
                    const responseData = {
                        booking: result.booking,
                        chauffeur: {
                            id: result.chauffeur.id,
                            fullName: result.chauffeur.fullName,
                            phone: result.chauffeur.phone,
                            rating: result.chauffeur.rating,
                            experienceLevel: result.chauffeur.experienceLevel,
                        }
                    };
                    (0, response_utils_1.sendSuccess)(res, 'Chauffeur assigned successfully', responseData);
                }
                else {
                    logger_1.default.warn('No available chauffeurs found', { bookingId });
                    (0, response_utils_1.sendSuccess)(res, 'No available chauffeurs found for this booking', null, 404);
                }
            }
            catch (error) {
                logger_1.default.error('Failed to assign chauffeur', { bookingId, error: error.message });
                throw error;
            }
        }));
        /**
         * Public endpoint for testing chauffeur assignment (no auth required)
         */
        this.testAssignChauffeur = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const bookingId = '95c94082-d0a0-47db-8e4a-10a509ccc563'; // Hardcoded for testing
            logger_1.default.info('Test chauffeur assignment requested', { bookingId });
            try {
                const result = yield (0, chauffeur_service_1.autoAssignChauffeur)(bookingId);
                if (result) {
                    logger_1.default.info('Test: Chauffeur assigned successfully', {
                        bookingId,
                        chauffeurId: result.chauffeur.id
                    });
                    const responseData = {
                        success: true,
                        bookingId,
                        chauffeur: {
                            id: result.chauffeur.id,
                            fullName: result.chauffeur.fullName,
                            phone: result.chauffeur.phone,
                            rating: result.chauffeur.rating,
                            experienceLevel: result.chauffeur.experienceLevel,
                        },
                        message: 'Chauffeur assigned successfully to booking'
                    };
                    res.status(200).json(responseData);
                }
                else {
                    logger_1.default.warn('Test: No available chauffeurs found', { bookingId });
                    res.status(404).json({
                        success: false,
                        bookingId,
                        message: 'No available chauffeurs found for this booking',
                        possibleReasons: [
                            'No chauffeurs are available during the booking time',
                            'No chauffeurs match the vehicle type requirements',
                            'All chauffeurs are already booked'
                        ]
                    });
                }
            }
            catch (error) {
                logger_1.default.error('Test: Failed to assign chauffeur', { bookingId, error: error.message });
                res.status(500).json({
                    success: false,
                    bookingId,
                    message: 'Failed to assign chauffeur',
                    error: error.message
                });
            }
        }));
    }
}
const bookingFixController = new BookingFixController();
exports.assignChauffeurToBooking = bookingFixController.assignChauffeurToBooking, exports.testAssignChauffeur = bookingFixController.testAssignChauffeur;
//# sourceMappingURL=booking-fix.controller.js.map