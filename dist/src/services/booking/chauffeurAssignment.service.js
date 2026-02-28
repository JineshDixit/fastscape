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
exports.releaseChauffeurOnBookingEnd = exports.triggerChauffeurAssignmentOnPayment = exports.processChauffeurAssignments = exports.assignChauffeurToBooking = void 0;
const models_1 = require("../../models");
const chauffeur_service_1 = require("../chauffeur/chauffeur.service");
const dbEnums_1 = require("../../common/enum/dbEnums");
const logger_1 = __importDefault(require("../../utils/logger"));
const sequelize_1 = require("sequelize");
const email_utils_1 = require("../../utils/email.utils");
const paymentConfig_1 = require("../../config/payment/paymentConfig");
/**
 * Automatic chauffeur assignment service
 * Handles assigning chauffeurs to CHAUFFEUR type bookings when payment is completed
 */
/**
 * Check if a booking is eligible for chauffeur assignment
 */
const isEligibleForChauffeurAssignment = (booking) => {
    const isTypeChauffeur = booking.bookingType === dbEnums_1.dbEnums.BOOKING_TYPE[1];
    const isPaidOrPartial = booking.paymentStatus === dbEnums_1.dbEnums.PAYMENT_STATUS[2] || booking.paymentStatus === dbEnums_1.dbEnums.PAYMENT_STATUS[1];
    const noChauffeur = !booking.chauffeurId;
    const isActive = ['CONFIRMED', 'PICKED_UP'].includes(booking.bookingStatus);
    if (!isTypeChauffeur || !isPaidOrPartial || !noChauffeur || !isActive) {
        logger_1.default.info('Booking not eligible for chauffeur assignment - detailed check:', {
            bookingId: booking.id,
            isTypeChauffeur,
            paymentStatus: booking.paymentStatus,
            isPaidOrPartial,
            hasChauffeurId: !!booking.chauffeurId,
            bookingStatus: booking.bookingStatus,
            isActive,
        });
    }
    return isTypeChauffeur && isPaidOrPartial && noChauffeur && isActive;
};
/**
 * Assign chauffeur to a single booking
 */
const assignChauffeurToBooking = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const transaction = yield models_1.sequelize.transaction();
    logger_1.default.info('Assigning chauffeur to booking', {
        bookingId,
    });
    try {
        // Get booking with vehicle and financial info
        const booking = yield models_1.Booking.findByPk(bookingId, {
            include: [
                {
                    model: models_1.Vehicle,
                    as: 'vehicle',
                    attributes: ['id', 'make', 'model', 'bodyType'],
                    required: true, // Force INNER JOIN to avoid "FOR UPDATE cannot be applied to the nullable side of an outer join" error
                },
            ],
            transaction,
            lock: true,
        });
        logger_1.default.info('Booking found', {
            bookingId,
            booking,
        });
        if (!booking) {
            yield transaction.rollback();
            return { success: false, error: 'Booking not found' };
        }
        // Check eligibility
        if (!isEligibleForChauffeurAssignment(booking)) {
            yield transaction.rollback();
            return {
                success: false,
                error: `Booking not eligible for chauffeur assignment. ` +
                    `Type: ${booking.bookingType}, ` +
                    `Payment: ${booking.paymentStatus}, ` +
                    `Status: ${booking.bookingStatus}, ` +
                    `HasChauffeur: ${!!booking.chauffeurId}`,
            };
        }
        logger_1.default.info('Attempting auto-assignment for eligible booking', {
            bookingId,
            vehicleType: (_a = booking.vehicle) === null || _a === void 0 ? void 0 : _a.bodyType,
            startDatetime: booking.startDatetime,
            endDatetime: booking.endDatetime,
        });
        // Attempt to assign chauffeur using config values
        const chauffeurAssignment = yield (0, chauffeur_service_1.autoAssignChauffeur)(bookingId, {
            vehicleType: (_b = booking.vehicle) === null || _b === void 0 ? void 0 : _b.bodyType,
            minRating: paymentConfig_1.paymentConfig.minChauffeurRating,
            maxHourlyRate: paymentConfig_1.paymentConfig.maxChauffeurHourlyRate,
            isVerified: paymentConfig_1.paymentConfig.requireVerifiedChauffeurs,
        }, transaction);
        if (chauffeurAssignment) {
            yield transaction.commit();
            logger_1.default.info('Chauffeur auto-assigned successfully', {
                bookingId,
                chauffeurId: chauffeurAssignment.chauffeur.id,
                chauffeurName: chauffeurAssignment.chauffeur.fullName,
                chauffeurRating: chauffeurAssignment.chauffeur.rating,
            });
            // Send chauffeur assignment email (non-blocking)
            (0, email_utils_1.sendChauffeurAssignment)(bookingId).catch((error) => {
                logger_1.default.error('Failed to send chauffeur assignment email', { bookingId, error });
            });
            return {
                success: true,
                chauffeur: chauffeurAssignment.chauffeur,
            };
        }
        else {
            yield transaction.rollback();
            logger_1.default.warn('No available chauffeurs found for booking', {
                bookingId,
                vehicleType: (_c = booking.vehicle) === null || _c === void 0 ? void 0 : _c.bodyType,
            });
            return {
                success: false,
                error: 'No available chauffeurs found matching the criteria',
            };
        }
    }
    catch (error) {
        if (transaction)
            yield transaction.rollback();
        logger_1.default.error('Failed to assign chauffeur to booking - Exception caught', {
            bookingId,
            error: (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? error === null || error === void 0 ? void 0 : error.stack : undefined,
        });
        return {
            success: false,
            error: (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error occurred',
        };
    }
});
exports.assignChauffeurToBooking = assignChauffeurToBooking;
/**
 * Process chauffeur assignment for multiple bookings (batch processing)
 */
const processChauffeurAssignments = (bookingIds) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find bookings eligible for chauffeur assignment
        const whereClause = {
            bookingType: dbEnums_1.dbEnums.BOOKING_TYPE[1], // 'CHAUFFEUR'
            paymentStatus: { [sequelize_1.Op.in]: [dbEnums_1.dbEnums.PAYMENT_STATUS[1], dbEnums_1.dbEnums.PAYMENT_STATUS[2]] }, // 'PARTIALLY_PAID' or 'PAID'
            chauffeurId: null,
            bookingStatus: {
                [sequelize_1.Op.in]: ['CONFIRMED', 'PICKED_UP'],
            },
        };
        if (bookingIds && bookingIds.length > 0) {
            whereClause.id = { [sequelize_1.Op.in]: bookingIds };
        }
        const eligibleBookings = yield models_1.Booking.findAll({
            where: whereClause,
            attributes: ['id'],
            order: [['createdAt', 'ASC']],
            limit: 50, // Process in batches to avoid overwhelming
        });
        logger_1.default.info(`Found ${eligibleBookings.length} bookings eligible for chauffeur assignment`);
        const results = [];
        let successful = 0;
        let failed = 0;
        for (const booking of eligibleBookings) {
            const result = yield (0, exports.assignChauffeurToBooking)(booking.id);
            results.push({
                bookingId: booking.id,
                success: result.success,
                chauffeur: result.chauffeur,
                error: result.error,
            });
            if (result.success) {
                successful++;
            }
            else {
                failed++;
            }
            // Add small delay between assignments to avoid race conditions
            yield new Promise((resolve) => setTimeout(resolve, 100));
        }
        logger_1.default.info('Chauffeur assignment batch completed', {
            processed: eligibleBookings.length,
            successful,
            failed,
        });
        return {
            processed: eligibleBookings.length,
            successful,
            failed,
            results,
        };
    }
    catch (error) {
        logger_1.default.error('Failed to process chauffeur assignments batch', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return {
            processed: 0,
            successful: 0,
            failed: 0,
            results: [],
        };
    }
});
exports.processChauffeurAssignments = processChauffeurAssignments;
/**
 * Trigger chauffeur assignment when booking payment is completed
 * This function should be called whenever a booking's payment status changes to PAID
 */
const triggerChauffeurAssignmentOnPayment = (bookingId, paymentType) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        logger_1.default.info('Triggering chauffeur assignment on payment completion', {
            bookingId,
            paymentType,
        });
        const result = yield (0, exports.assignChauffeurToBooking)(bookingId);
        if (result.success) {
            logger_1.default.info('Chauffeur assignment triggered successfully on payment', {
                bookingId,
                paymentType,
                chauffeurId: (_a = result.chauffeur) === null || _a === void 0 ? void 0 : _a.id,
                chauffeurName: (_b = result.chauffeur) === null || _b === void 0 ? void 0 : _b.fullName,
            });
        }
        else {
            logger_1.default.warn('Chauffeur assignment failed on payment trigger', {
                bookingId,
                paymentType,
                error: result.error,
            });
        }
    }
    catch (error) {
        logger_1.default.error('Error triggering chauffeur assignment on payment - Exception caught', {
            bookingId,
            paymentType,
            error: (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error',
            stack: process.env.NODE_ENV === 'development' ? error === null || error === void 0 ? void 0 : error.stack : undefined,
        });
    }
});
exports.triggerChauffeurAssignmentOnPayment = triggerChauffeurAssignmentOnPayment;
/**
 * Release chauffeur when booking is cancelled or completed
 */
const releaseChauffeurOnBookingEnd = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const booking = yield models_1.Booking.findByPk(bookingId, {
            include: [{ model: models_1.Chauffeur, as: 'chauffeur' }],
        });
        if (!booking || !booking.chauffeurId) {
            return; // No chauffeur to release
        }
        const { chauffeur } = booking;
        if (chauffeur) {
            // Update chauffeur status back to AVAILABLE
            yield chauffeur.update({
                status: 'AVAILABLE',
                lastActiveAt: new Date(),
            });
            // Increment total trips if booking was completed
            if (booking.bookingStatus === dbEnums_1.dbEnums.BOOKING_STATUS[5]) {
                // 'COMPLETED'
                yield chauffeur.update({
                    totalTrips: chauffeur.totalTrips + 1,
                });
            }
            logger_1.default.info('Chauffeur released from booking', {
                bookingId,
                chauffeurId: chauffeur.id,
                chauffeurName: chauffeur.fullName,
                bookingStatus: booking.bookingStatus,
                newTotalTrips: chauffeur.totalTrips + 1,
            });
        }
    }
    catch (error) {
        logger_1.default.error('Failed to release chauffeur from booking', {
            bookingId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
exports.releaseChauffeurOnBookingEnd = releaseChauffeurOnBookingEnd;
//# sourceMappingURL=chauffeurAssignment.service.js.map