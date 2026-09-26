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
exports.exportBookingsToCSV = exports.cleanupExpiredBooking = exports.getExpiredBookings = exports.cancelBooking = exports.updateBookingStatus = exports.getBookingById = exports.getAllBookings = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
const logger_1 = __importDefault(require("../../config/logger"));
/**
 * Get all bookings with filtering and pagination
 */
const getAllBookings = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const offset = (page - 1) * limit;
    const where = {};
    if (filters.status) {
        where.bookingStatus = filters.status;
    }
    if (filters.paymentStatus) {
        where.paymentStatus = filters.paymentStatus;
    }
    if (filters.bookingType) {
        where.bookingType = filters.bookingType;
    }
    if (filters.userId) {
        where.userId = filters.userId;
    }
    if (filters.vehicleId) {
        where.vehicleId = filters.vehicleId;
    }
    if (filters.chauffeurId) {
        where.chauffeurId = filters.chauffeurId;
    }
    if (filters.startDate) {
        where.startDatetime = {
            [sequelize_1.Op.gte]: new Date(filters.startDate),
        };
    }
    if (filters.endDate) {
        where.endDatetime = {
            [sequelize_1.Op.lte]: new Date(filters.endDate),
        };
    }
    // Server-side search logic
    if (filters.search) {
        const searchCondition = {
            [sequelize_1.Op.or]: [
                { id: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { '$User.firstName$': { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { '$User.lastName$': { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { '$Vehicle.make$': { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { '$Vehicle.model$': { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            ],
        };
        Object.assign(where, searchCondition);
    }
    // Sorting logic
    let order = [['createdAt', 'DESC']];
    if (filters.sortBy) {
        const sortOrder = ((_a = filters.sortOrder) === null || _a === void 0 ? void 0 : _a.toUpperCase()) === 'ASC' ? 'ASC' : 'DESC';
        const field = filters.sortBy;
        // Map frontend column names to backend sorting
        if (field === 'user') {
            order = [[{ model: models_1.User, as: 'User' }, 'firstName', sortOrder]];
        }
        else if (field === 'vehicle') {
            order = [[{ model: models_1.Vehicle, as: 'Vehicle' }, 'make', sortOrder]];
        }
        else if (field === 'chauffeur') {
            order = [[{ model: models_1.Chauffeur, as: 'Chauffeur' }, 'fullName', sortOrder]];
        }
        else if (field === 'amount') {
            order = [[{ model: models_1.BookingFinancial, as: 'BookingFinancial' }, 'totalAmount', sortOrder]];
        }
        else {
            // Direct fields: bookingType, bookingStatus, paymentStatus, startDatetime, endDatetime, createdAt
            order = [[field, sortOrder]];
        }
    }
    const { rows: bookings, count: total } = yield models_1.Booking.findAndCountAll({
        where,
        include: [
            {
                model: models_1.User,
                attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
            },
            {
                model: models_1.Vehicle,
                attributes: ['id', 'make', 'model', 'year', 'bodyType'],
            },
            {
                model: models_1.Chauffeur,
                attributes: ['id', 'fullName', 'phone', 'rating', 'status'],
                required: false,
            },
            {
                model: models_1.BookingFinancial,
                required: false,
            },
            {
                model: models_1.Payment,
                required: false,
            },
        ],
        order,
        limit,
        offset,
        distinct: true, // Crucial for correct count with includes
    });
    return {
        bookings,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
});
exports.getAllBookings = getAllBookings;
/**
 * Get single booking by ID with full details
 */
const getBookingById = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield models_1.Booking.findByPk(bookingId, {
        include: [
            {
                model: models_1.User,
                attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'verificationStatus'],
            },
            {
                model: models_1.Vehicle,
                attributes: [
                    'id',
                    'make',
                    'model',
                    'year',
                    'bodyType',
                    'pricePerDay',
                    'depositPercentage',
                    'delayChargePerHour',
                ],
            },
            {
                model: models_1.Chauffeur,
                attributes: ['id', 'fullName', 'phone', 'email', 'rating', 'hourlyRate', 'status'],
                required: false,
            },
            {
                model: models_1.BookingFinancial,
                required: false,
            },
            {
                model: models_1.Payment,
                required: false,
                order: [['createdAt', 'DESC']],
            },
        ],
    });
});
exports.getBookingById = getBookingById;
/**
 * Update booking status with validation
 */
const updateBookingStatus = (bookingId, newStatus) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = Date.now();
    logger_1.default.info('Updating booking status', { bookingId, newStatus });
    const transaction = yield models_1.sequelize.transaction();
    try {
        const booking = yield models_1.Booking.findByPk(bookingId, {
            transaction,
            lock: true,
        });
        if (!booking) {
            logger_1.default.error('Booking not found for status update', { bookingId });
            throw new Error('Booking not found');
        }
        logger_1.default.debug('Current booking state', {
            bookingId,
            currentStatus: booking.bookingStatus,
            paymentStatus: booking.paymentStatus,
            chauffeurId: booking.chauffeurId,
        });
        // Validate status transitions
        if (newStatus === 'CONFIRMED') {
            // Cannot confirm without payment
            const hasPayment = yield models_1.Payment.findOne({
                where: {
                    bookingId,
                    paymentStatus: 'PAID',
                },
                transaction,
            });
            if (!hasPayment) {
                logger_1.default.warn('Cannot confirm booking without payment', { bookingId });
                throw new Error('Cannot confirm booking without payment');
            }
            logger_1.default.debug('Payment verified for booking confirmation', { bookingId });
        }
        if (newStatus === 'CANCELLED' && booking.chauffeurId) {
            logger_1.default.debug('Releasing chauffeur due to cancellation', {
                bookingId,
                chauffeurId: booking.chauffeurId,
            });
            yield models_1.Chauffeur.update({ status: 'AVAILABLE' }, {
                where: { id: booking.chauffeurId },
                transaction,
            });
            logger_1.default.info('Chauffeur released', { chauffeurId: booking.chauffeurId });
        }
        if (newStatus === 'COMPLETED') {
            // Cannot complete without being dropped off
            if (booking.bookingStatus !== 'DROPPED_OFF') {
                logger_1.default.warn('Cannot complete booking without DROPPED_OFF status', {
                    bookingId,
                    currentStatus: booking.bookingStatus,
                });
                throw new Error('Booking must be in DROPPED_OFF status before completion');
            }
            // Increment chauffeur trip count if applicable
            if (booking.chauffeurId) {
                logger_1.default.debug('Incrementing chauffeur trip count', {
                    bookingId,
                    chauffeurId: booking.chauffeurId,
                });
                yield models_1.Chauffeur.increment('totalTrips', {
                    where: { id: booking.chauffeurId },
                    transaction,
                });
                yield models_1.Chauffeur.update({ status: 'AVAILABLE' }, {
                    where: { id: booking.chauffeurId },
                    transaction,
                });
                logger_1.default.info('Chauffeur trip count incremented and status updated', {
                    chauffeurId: booking.chauffeurId,
                });
            }
        }
        const previousStatus = booking.bookingStatus;
        yield booking.update({ bookingStatus: newStatus }, { transaction });
        yield transaction.commit();
        const duration = Date.now() - startTime;
        logger_1.default.info('Booking status updated successfully', {
            bookingId,
            previousStatus,
            newStatus,
            duration: `${duration}ms`,
        });
        return booking;
    }
    catch (error) {
        yield transaction.rollback();
        logger_1.default.error('Failed to update booking status, transaction rolled back', {
            bookingId,
            newStatus,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
});
exports.updateBookingStatus = updateBookingStatus;
/**
 * Cancel booking with optional reason
 */
const cancelBooking = (bookingId, reason) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = Date.now();
    logger_1.default.info('Cancelling booking', { bookingId, reason });
    const transaction = yield models_1.sequelize.transaction();
    try {
        const booking = yield models_1.Booking.findByPk(bookingId, {
            transaction,
            lock: true,
        });
        if (!booking) {
            logger_1.default.error('Booking not found for cancellation', { bookingId });
            throw new Error('Booking not found');
        }
        if (booking.bookingStatus === 'COMPLETED' || booking.bookingStatus === 'CANCELLED') {
            logger_1.default.warn('Cannot cancel booking with current status', {
                bookingId,
                currentStatus: booking.bookingStatus,
            });
            throw new Error(`Cannot cancel booking with status ${booking.bookingStatus}`);
        }
        // Release chauffeur if assigned
        if (booking.chauffeurId) {
            logger_1.default.debug('Releasing chauffeur due to booking cancellation', {
                bookingId,
                chauffeurId: booking.chauffeurId,
            });
            yield models_1.Chauffeur.update({ status: 'AVAILABLE' }, {
                where: { id: booking.chauffeurId },
                transaction,
            });
            logger_1.default.info('Chauffeur released', { chauffeurId: booking.chauffeurId });
        }
        yield booking.update({
            bookingStatus: 'CANCELLED',
            notes: reason ? `${booking.notes || ''}\nCancellation reason: ${reason}`.trim() : booking.notes,
        }, { transaction });
        yield transaction.commit();
        const duration = Date.now() - startTime;
        logger_1.default.info('Booking cancelled successfully', {
            bookingId,
            reason,
            duration: `${duration}ms`,
        });
        return booking;
    }
    catch (error) {
        yield transaction.rollback();
        logger_1.default.error('Failed to cancel booking, transaction rolled back', {
            bookingId,
            reason,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
});
exports.cancelBooking = cancelBooking;
/**
 * Get expired PENDING bookings
 */
const getExpiredBookings = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield models_1.Booking.findAll({
        where: {
            bookingStatus: 'PENDING',
            expiresAt: {
                [sequelize_1.Op.lt]: new Date(),
            },
        },
        include: [
            {
                model: models_1.User,
                attributes: ['id', 'firstName', 'lastName', 'email'],
            },
            {
                model: models_1.Vehicle,
                attributes: ['id', 'make', 'model'],
            },
        ],
        order: [['expiresAt', 'ASC']],
    });
});
exports.getExpiredBookings = getExpiredBookings;
/**
 * Cleanup (soft delete) an expired booking
 */
const cleanupExpiredBooking = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = Date.now();
    logger_1.default.info('Cleaning up expired booking', { bookingId });
    const transaction = yield models_1.sequelize.transaction();
    try {
        const booking = yield models_1.Booking.findByPk(bookingId, {
            transaction,
            lock: true,
        });
        if (!booking) {
            logger_1.default.error('Booking not found for cleanup', { bookingId });
            throw new Error('Booking not found');
        }
        if (booking.bookingStatus !== 'PENDING') {
            logger_1.default.warn('Can only cleanup PENDING bookings', {
                bookingId,
                currentStatus: booking.bookingStatus,
            });
            throw new Error('Can only cleanup PENDING bookings');
        }
        if (booking.expiresAt && new Date() <= new Date(booking.expiresAt)) {
            logger_1.default.warn('Booking has not expired yet', {
                bookingId,
                expiresAt: booking.expiresAt,
                now: new Date(),
            });
            throw new Error('Booking has not expired yet');
        }
        // Release chauffeur if assigned
        if (booking.chauffeurId) {
            logger_1.default.debug('Releasing chauffeur during expired booking cleanup', {
                bookingId,
                chauffeurId: booking.chauffeurId,
            });
            yield models_1.Chauffeur.update({ status: 'AVAILABLE' }, {
                where: { id: booking.chauffeurId },
                transaction,
            });
        }
        // Mark as cancelled instead of hard delete (safer approach)
        yield booking.update({
            bookingStatus: 'CANCELLED',
            notes: `${booking.notes || ''}\nAuto-cancelled: Expired on ${booking.expiresAt}`.trim(),
        }, { transaction });
        yield transaction.commit();
        const duration = Date.now() - startTime;
        logger_1.default.info('Expired booking cleaned up successfully', {
            bookingId,
            expiresAt: booking.expiresAt,
            duration: `${duration}ms`,
        });
    }
    catch (error) {
        yield transaction.rollback();
        logger_1.default.error('Failed to cleanup expired booking, transaction rolled back', {
            bookingId,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
});
exports.cleanupExpiredBooking = cleanupExpiredBooking;
/**
 * Export bookings to CSV with filters
 */
const exportBookingsToCSV = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    const where = {};
    if (filters.status) {
        where.bookingStatus = filters.status;
    }
    if (filters.paymentStatus) {
        where.paymentStatus = filters.paymentStatus;
    }
    if (filters.bookingType) {
        where.bookingType = filters.bookingType;
    }
    if (filters.userId) {
        where.userId = filters.userId;
    }
    if (filters.vehicleId) {
        where.vehicleId = filters.vehicleId;
    }
    if (filters.chauffeurId) {
        where.chauffeurId = filters.chauffeurId;
    }
    if (filters.startDate) {
        where.startDatetime = {
            [sequelize_1.Op.gte]: new Date(filters.startDate),
        };
    }
    if (filters.endDate) {
        where.endDatetime = {
            [sequelize_1.Op.lte]: new Date(filters.endDate),
        };
    }
    // Server-side search logic
    if (filters.search) {
        const searchCondition = {
            [sequelize_1.Op.or]: [
                { id: { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { '$User.firstName$': { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { '$User.lastName$': { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { '$Vehicle.make$': { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
                { '$Vehicle.model$': { [sequelize_1.Op.iLike]: `%${filters.search}%` } },
            ],
        };
        Object.assign(where, searchCondition);
    }
    const bookings = yield models_1.Booking.findAll({
        where,
        include: [
            {
                model: models_1.User,
                attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
            },
            {
                model: models_1.Vehicle,
                attributes: ['id', 'make', 'model', 'year', 'bodyType'],
            },
            {
                model: models_1.Chauffeur,
                attributes: ['id', 'fullName', 'phone'],
                required: false,
            },
            {
                model: models_1.BookingFinancial,
                required: false,
            },
            {
                model: models_1.Payment,
                required: false,
            },
        ],
        order: [['createdAt', 'DESC']],
        limit: 5000, // Limit to prevent memory issues
    });
    return bookings;
});
exports.exportBookingsToCSV = exportBookingsToCSV;
//# sourceMappingURL=booking.service.js.map