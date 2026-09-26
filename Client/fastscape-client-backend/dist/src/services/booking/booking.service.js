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
exports.cancelBooking = exports.updateBooking = exports.getBookingById = exports.getBookingHistory = exports.getBookingStats = exports.getActiveBookings = exports.getUpcomingBookings = exports.getUserBookings = exports.createBooking = void 0;
const models_1 = require("../../models");
const sequelize_1 = require("sequelize");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_utils_1 = require("../../utils/validation.utils");
const database_utils_1 = require("../../utils/database.utils");
const dbEnums_1 = require("../../common/enum/dbEnums");
const chauffeurAssignment_service_1 = require("./chauffeurAssignment.service");
const logger_1 = __importDefault(require("../../utils/logger"));
const email_utils_1 = require("../../utils/email.utils");
const paymentConfig_1 = require("../../config/payment/paymentConfig");
// Chauffeur attributes for booking responses
const CHAUFFEUR_ATTRIBUTES = ['id', 'fullName', 'phone', 'rating', 'totalTrips', 'experienceLevel', 'languages'];
// Booking status state machine using enum values
const BOOKING_STATUS_TRANSITIONS = {
    [dbEnums_1.dbEnums.BOOKING_STATUS[0]]: [dbEnums_1.dbEnums.BOOKING_STATUS[1], dbEnums_1.dbEnums.BOOKING_STATUS[4]], // PENDING -> [CONFIRMED, CANCELLED]
    [dbEnums_1.dbEnums.BOOKING_STATUS[1]]: [dbEnums_1.dbEnums.BOOKING_STATUS[2], dbEnums_1.dbEnums.BOOKING_STATUS[4]], // CONFIRMED -> [PICKED_UP, CANCELLED]
    [dbEnums_1.dbEnums.BOOKING_STATUS[2]]: [dbEnums_1.dbEnums.BOOKING_STATUS[3], dbEnums_1.dbEnums.BOOKING_STATUS[4]], // PICKED_UP -> [DROPPED_OFF, CANCELLED]
    [dbEnums_1.dbEnums.BOOKING_STATUS[3]]: [dbEnums_1.dbEnums.BOOKING_STATUS[5]], // DROPPED_OFF -> [COMPLETED]
    [dbEnums_1.dbEnums.BOOKING_STATUS[5]]: [], // COMPLETED -> [] (terminal state)
    [dbEnums_1.dbEnums.BOOKING_STATUS[4]]: [], // CANCELLED -> [] (terminal state)
};
/**
 * Validate booking status transition
 */
const validateStatusTransition = (currentStatus, newStatus) => {
    const allowedTransitions = BOOKING_STATUS_TRANSITIONS[currentStatus];
    return (allowedTransitions === null || allowedTransitions === void 0 ? void 0 : allowedTransitions.includes(newStatus)) || false;
};
/**
 * Create a new booking
 */
const createBooking = (bookingData) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, vehicleId, startDatetime, endDatetime, pickupLocation, dropoffLocation } = bookingData;
    // Validate required fields
    (0, validation_utils_1.validateRequiredFields)(bookingData, [
        'userId',
        'vehicleId',
        'startDatetime',
        'endDatetime',
        'pickupLocation',
        'dropoffLocation',
    ]);
    // Validate and normalize dates
    const { start, end } = (0, validation_utils_1.normalizeBookingDates)(startDatetime, endDatetime);
    // Use transaction to prevent race conditions
    const transaction = yield models_1.sequelize.transaction();
    try {
        const now = new Date();
        // First, clean up expired bookings for this vehicle to prevent false conflicts
        yield models_1.Booking.update({ bookingStatus: dbEnums_1.dbEnums.BOOKING_STATUS[4] }, // 'CANCELLED'
        {
            where: {
                vehicleId,
                bookingStatus: dbEnums_1.dbEnums.BOOKING_STATUS[0], // 'PENDING'
                expiresAt: { [sequelize_1.Op.lt]: now },
            },
            transaction,
        });
        // Check if vehicle exists and is available with a lock
        const vehicle = yield models_1.Vehicle.findByPk(vehicleId, {
            transaction,
            lock: true,
        });
        if (!vehicle) {
            throw (0, errorHandler_1.createError)('Vehicle not found', 404);
        }
        if (!vehicle.isAvailable) {
            logger_1.default.warn('Booking attempted on unavailable vehicle', { vehicleId, userId });
            throw (0, errorHandler_1.createError)('Vehicle is not available', 400);
        }
        // Check for conflicting bookings within transaction (after cleanup)
        const conflictingBooking = yield models_1.Booking.findOne({
            where: {
                vehicleId,
                [sequelize_1.Op.and]: [
                    (0, database_utils_1.buildDateConflictConditions)(start, end),
                    {
                        [sequelize_1.Op.or]: [
                            { bookingStatus: dbEnums_1.dbEnums.BOOKING_STATUS[1] }, // 'CONFIRMED'
                            { bookingStatus: dbEnums_1.dbEnums.BOOKING_STATUS[2] }, // 'PICKED_UP'
                            { bookingStatus: dbEnums_1.dbEnums.BOOKING_STATUS[3] }, // 'DROPPED_OFF'
                            {
                                bookingStatus: dbEnums_1.dbEnums.BOOKING_STATUS[0], // 'PENDING'
                                [sequelize_1.Op.or]: [{ expiresAt: { [sequelize_1.Op.eq]: null } }, { expiresAt: { [sequelize_1.Op.gt]: now } }],
                            },
                        ],
                    },
                ],
            },
            transaction,
            lock: true, // Add row-level locking
        });
        if (conflictingBooking) {
            // If the conflicting booking is PENDING and belongs to the same user,
            // return it instead of throwing error (idempotency for session recovery)
            if (conflictingBooking.userId === userId && conflictingBooking.bookingStatus === dbEnums_1.dbEnums.BOOKING_STATUS[0]) {
                logger_1.default.info('Found existing pending booking for user, returning it', {
                    bookingId: conflictingBooking.id,
                    userId,
                    vehicleId,
                });
                yield transaction.commit(); // Commit transaction as we're returning existing
                return conflictingBooking;
            }
            logger_1.default.warn('Booking conflict detected', { vehicleId, start, end, conflictingBookingId: conflictingBooking.id });
            throw (0, errorHandler_1.createError)('Vehicle is already booked for the selected dates', 409);
        }
        // Set expiration using config
        const expiresAt = new Date(now.getTime() + paymentConfig_1.paymentConfig.bookingExpirationMinutes * 60000);
        // Create booking within transaction
        const booking = yield models_1.Booking.create({
            userId,
            vehicleId,
            startDatetime: start,
            endDatetime: end,
            pickupLocation,
            dropoffLocation,
            bookingType: bookingData.bookingType || dbEnums_1.dbEnums.BOOKING_TYPE[0], // 'SELF_DRIVE'
            paymentMethod: bookingData.paymentMethod || dbEnums_1.dbEnums.PAYMENT_METHOD[2], // 'ONLINE'
            bookingStatus: dbEnums_1.dbEnums.BOOKING_STATUS[0], // 'PENDING'
            paymentStatus: dbEnums_1.dbEnums.PAYMENT_STATUS[0], // 'UNPAID'
            notes: bookingData.notes,
            expiresAt,
        }, { transaction });
        yield transaction.commit();
        logger_1.default.info('Booking created successfully', { bookingId: booking.id, userId, vehicleId });
        return booking;
    }
    catch (error) {
        if (transaction)
            yield transaction.rollback();
        logger_1.default.error('Booking transaction failed', { error });
        throw error;
    }
});
exports.createBooking = createBooking;
/**
 * Retrieves all bookings for a given user ID
 */
const getUserBookings = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw (0, errorHandler_1.createError)('User ID is required', 400);
    }
    return yield models_1.Booking.findAll({
        where: { userId },
        attributes: database_utils_1.BOOKING_ATTRIBUTES,
        include: [
            {
                model: models_1.Vehicle,
                as: 'vehicle',
                attributes: database_utils_1.VEHICLE_LIST_ATTRIBUTES,
            },
            {
                model: models_1.Chauffeur,
                as: 'chauffeur',
                attributes: CHAUFFEUR_ATTRIBUTES,
                required: false,
            },
        ],
        order: [['createdAt', 'DESC']],
    });
});
exports.getUserBookings = getUserBookings;
/**
 * Get upcoming bookings (next 30 days)
 */
const getUpcomingBookings = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw (0, errorHandler_1.createError)('User ID is required', 400);
    }
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return yield models_1.Booking.findAll({
        where: {
            userId,
            startDatetime: {
                [sequelize_1.Op.gt]: now,
                [sequelize_1.Op.lte]: thirtyDaysFromNow,
            },
            bookingStatus: {
                [sequelize_1.Op.in]: [
                    dbEnums_1.dbEnums.BOOKING_STATUS[0], // PENDING
                    dbEnums_1.dbEnums.BOOKING_STATUS[1], // CONFIRMED
                ],
            },
        },
        attributes: database_utils_1.BOOKING_ATTRIBUTES,
        include: [
            {
                model: models_1.Vehicle,
                as: 'vehicle',
                attributes: database_utils_1.VEHICLE_LIST_ATTRIBUTES,
            },
            {
                model: models_1.Chauffeur,
                as: 'chauffeur',
                attributes: CHAUFFEUR_ATTRIBUTES,
                required: false,
            },
        ],
        order: [['startDatetime', 'ASC']],
    });
});
exports.getUpcomingBookings = getUpcomingBookings;
/**
 * Get active bookings (currently ongoing)
 */
const getActiveBookings = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw (0, errorHandler_1.createError)('User ID is required', 400);
    }
    const now = new Date();
    return yield models_1.Booking.findAll({
        where: {
            userId,
            [sequelize_1.Op.or]: [
                {
                    // Currently picked up
                    bookingStatus: dbEnums_1.dbEnums.BOOKING_STATUS[2], // PICKED_UP
                },
                {
                    // Confirmed and within booking period
                    bookingStatus: dbEnums_1.dbEnums.BOOKING_STATUS[1], // CONFIRMED
                    startDatetime: { [sequelize_1.Op.lte]: now },
                    endDatetime: { [sequelize_1.Op.gte]: now },
                },
            ],
        },
        attributes: database_utils_1.BOOKING_ATTRIBUTES,
        include: [
            {
                model: models_1.Vehicle,
                as: 'vehicle',
                attributes: database_utils_1.VEHICLE_LIST_ATTRIBUTES,
            },
            {
                model: models_1.Chauffeur,
                as: 'chauffeur',
                attributes: CHAUFFEUR_ATTRIBUTES,
                required: false,
            },
        ],
        order: [['startDatetime', 'ASC']],
    });
});
exports.getActiveBookings = getActiveBookings;
/**
 * Get booking statistics for a user
 */
const getBookingStats = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw (0, errorHandler_1.createError)('User ID is required', 400);
    }
    const bookings = yield models_1.Booking.findAll({
        where: { userId },
        attributes: ['bookingStatus'],
    });
    return {
        total: bookings.length,
        pending: bookings.filter((b) => b.bookingStatus === dbEnums_1.dbEnums.BOOKING_STATUS[0]).length,
        confirmed: bookings.filter((b) => b.bookingStatus === dbEnums_1.dbEnums.BOOKING_STATUS[1]).length,
        active: bookings.filter((b) => b.bookingStatus === dbEnums_1.dbEnums.BOOKING_STATUS[2] || b.bookingStatus === dbEnums_1.dbEnums.BOOKING_STATUS[1]).length,
        completed: bookings.filter((b) => b.bookingStatus === dbEnums_1.dbEnums.BOOKING_STATUS[5]).length,
        cancelled: bookings.filter((b) => b.bookingStatus === dbEnums_1.dbEnums.BOOKING_STATUS[4]).length,
        totalSpent: 0, // TODO: Calculate from payments
        averageRating: 0, // TODO: Calculate from reviews
    };
});
exports.getBookingStats = getBookingStats;
/**
 * Get booking history with optional filters
 */
const getBookingHistory = (userId, params) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw (0, errorHandler_1.createError)('User ID is required', 400);
    }
    const whereConditions = {
        userId,
        bookingStatus: {
            [sequelize_1.Op.in]: [
                dbEnums_1.dbEnums.BOOKING_STATUS[3], // DROPPED_OFF
                dbEnums_1.dbEnums.BOOKING_STATUS[4], // CANCELLED
                dbEnums_1.dbEnums.BOOKING_STATUS[5], // COMPLETED
            ],
        },
    };
    // Filter by specific status if provided
    if (params === null || params === void 0 ? void 0 : params.status) {
        whereConditions.bookingStatus = params.status;
    }
    // Filter by year
    if (params === null || params === void 0 ? void 0 : params.year) {
        const startOfYear = new Date(params.year, 0, 1);
        const endOfYear = new Date(params.year, 11, 31, 23, 59, 59);
        whereConditions.startDatetime = {
            [sequelize_1.Op.between]: [startOfYear, endOfYear],
        };
    }
    // Filter by month (requires year)
    if ((params === null || params === void 0 ? void 0 : params.month) && (params === null || params === void 0 ? void 0 : params.year)) {
        const startOfMonth = new Date(params.year, params.month - 1, 1);
        const endOfMonth = new Date(params.year, params.month, 0, 23, 59, 59);
        whereConditions.startDatetime = {
            [sequelize_1.Op.between]: [startOfMonth, endOfMonth],
        };
    }
    const includeOptions = [
        {
            model: models_1.Vehicle,
            as: 'vehicle',
            attributes: database_utils_1.VEHICLE_LIST_ATTRIBUTES,
        },
    ];
    // Filter by vehicle type if provided
    if (params === null || params === void 0 ? void 0 : params.vehicleType) {
        includeOptions[0].where = { bodyType: params.vehicleType };
    }
    return yield models_1.Booking.findAll({
        where: whereConditions,
        attributes: database_utils_1.BOOKING_ATTRIBUTES,
        include: includeOptions.concat([
            {
                model: models_1.Chauffeur,
                as: 'chauffeur',
                attributes: CHAUFFEUR_ATTRIBUTES,
                required: false,
            },
        ]),
        order: [['startDatetime', 'DESC']],
    });
});
exports.getBookingHistory = getBookingHistory;
/**
 * Retrieves a booking by ID and user ID
 */
const getBookingById = (bookingId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!bookingId || !userId) {
        throw (0, errorHandler_1.createError)('Booking ID and User ID are required', 400);
    }
    const booking = yield models_1.Booking.findOne({
        where: { id: bookingId, userId },
        attributes: database_utils_1.BOOKING_ATTRIBUTES,
        include: [
            {
                model: models_1.Vehicle,
                as: 'vehicle',
                attributes: [...database_utils_1.VEHICLE_LIST_ATTRIBUTES, 'exteriorColor'],
            },
            {
                model: models_1.Chauffeur,
                as: 'chauffeur',
                attributes: CHAUFFEUR_ATTRIBUTES,
                required: false,
            },
        ],
    });
    if (!booking) {
        throw (0, errorHandler_1.createError)('Booking not found', 404);
    }
    return booking;
});
exports.getBookingById = getBookingById;
/**
 * Updates a booking by ID and user ID with the provided data
 */
const updateBooking = (bookingId, userId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    if (!bookingId || !userId) {
        throw (0, errorHandler_1.createError)('Booking ID and User ID are required', 400);
    }
    const booking = yield models_1.Booking.findOne({
        where: { id: bookingId, userId },
    });
    if (!booking) {
        throw (0, errorHandler_1.createError)('Booking not found', 404);
    }
    // Check if booking can be updated
    if (booking.bookingStatus === dbEnums_1.dbEnums.BOOKING_STATUS[4] || booking.bookingStatus === dbEnums_1.dbEnums.BOOKING_STATUS[5]) {
        // 'CANCELLED' or 'COMPLETED'
        throw (0, errorHandler_1.createError)('Cannot update cancelled or completed booking', 400);
    }
    // Validate status transition if bookingStatus is being updated
    if (updateData.bookingStatus &&
        updateData.bookingStatus !== booking.bookingStatus &&
        !validateStatusTransition(booking.bookingStatus, updateData.bookingStatus)) {
        throw (0, errorHandler_1.createError)(`Invalid status transition from ${booking.bookingStatus} to ${updateData.bookingStatus}`, 400);
    }
    // Validate and normalize dates if provided
    if (updateData.startDatetime || updateData.endDatetime) {
        const { start, end } = (0, validation_utils_1.normalizeBookingDates)(updateData.startDatetime || booking.startDatetime, updateData.endDatetime || booking.endDatetime);
        updateData.startDatetime = start;
        updateData.endDatetime = end;
    }
    // Update booking
    yield booking.update(updateData);
    logger_1.default.info('Booking updated', { bookingId, updates: Object.keys(updateData) });
    return booking;
});
exports.updateBooking = updateBooking;
/**
 * Cancels a booking by ID and user ID
 */
const cancelBooking = (bookingId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!bookingId || !userId) {
        throw (0, errorHandler_1.createError)('Booking ID and User ID are required', 400);
    }
    const booking = yield models_1.Booking.findOne({
        where: { id: bookingId, userId },
    });
    if (!booking) {
        throw (0, errorHandler_1.createError)('Booking not found', 404);
    }
    // Check if booking can be cancelled
    if (booking.bookingStatus === dbEnums_1.dbEnums.BOOKING_STATUS[4]) {
        // 'CANCELLED'
        throw (0, errorHandler_1.createError)('Booking is already cancelled', 400);
    }
    if (booking.bookingStatus === dbEnums_1.dbEnums.BOOKING_STATUS[5]) {
        // 'COMPLETED'
        throw (0, errorHandler_1.createError)('Cannot cancel completed booking', 400);
    }
    // Update booking status
    yield booking.update({ bookingStatus: dbEnums_1.dbEnums.BOOKING_STATUS[4] }); // 'CANCELLED'
    // Release chauffeur if this was a chauffeur booking
    if (booking.bookingType === dbEnums_1.dbEnums.BOOKING_TYPE[1]) {
        // 'CHAUFFEUR'
        yield (0, chauffeurAssignment_service_1.releaseChauffeurOnBookingEnd)(bookingId);
    }
    // Send cancellation email (non-blocking)
    (0, email_utils_1.sendBookingCancellation)(bookingId).catch((error) => {
        logger_1.default.error('Failed to send booking cancellation email', { bookingId, error });
    });
    logger_1.default.info('Booking cancelled', { bookingId, userId });
});
exports.cancelBooking = cancelBooking;
//# sourceMappingURL=booking.service.js.map