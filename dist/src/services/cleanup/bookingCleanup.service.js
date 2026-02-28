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
exports.getExpiredBookingStats = exports.scheduleBookingCleanup = exports.cleanupExpiredBookings = void 0;
const models_1 = require("../../models");
const sequelize_1 = require("sequelize");
const dbEnums_1 = require("../../common/enum/dbEnums");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Clean up expired pending bookings
 */
const cleanupExpiredBookings = () => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield models_1.sequelize.transaction();
    try {
        const now = new Date();
        // Find expired pending bookings
        const expiredBookings = yield models_1.Booking.findAll({
            where: {
                bookingStatus: dbEnums_1.dbEnums.BOOKING_STATUS[0], // 'PENDING'
                expiresAt: {
                    [sequelize_1.Op.lt]: now,
                },
            },
            transaction,
            lock: true,
        });
        if (expiredBookings.length === 0) {
            yield transaction.commit();
            return 0;
        }
        const expiredBookingIds = expiredBookings.map((booking) => booking.id);
        // Update expired bookings to CANCELLED
        const [affectedCount] = yield models_1.Booking.update({
            bookingStatus: dbEnums_1.dbEnums.BOOKING_STATUS[4], // 'CANCELLED'
            notes: 'Automatically cancelled due to payment timeout',
        }, {
            where: {
                id: { [sequelize_1.Op.in]: expiredBookingIds },
            },
            transaction,
        });
        yield transaction.commit();
        logger_1.default.info('Expired bookings cleaned up', {
            count: affectedCount,
            bookingIds: expiredBookingIds,
        });
        return affectedCount;
    }
    catch (error) {
        yield transaction.rollback();
        logger_1.default.error('Failed to cleanup expired bookings', { error });
        throw error;
    }
});
exports.cleanupExpiredBookings = cleanupExpiredBookings;
/**
 * Schedule cleanup job to run every 5 minutes
 */
const scheduleBookingCleanup = () => {
    const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
    const runCleanup = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const cleanedCount = yield (0, exports.cleanupExpiredBookings)();
            if (cleanedCount > 0) {
                logger_1.default.info('Booking cleanup completed', { cleanedCount });
            }
        }
        catch (error) {
            logger_1.default.error('Booking cleanup failed', { error });
        }
    });
    // Run immediately on startup
    runCleanup();
    // Schedule recurring cleanup
    setInterval(runCleanup, CLEANUP_INTERVAL);
    logger_1.default.info('Booking cleanup scheduler started', { intervalMinutes: 5 });
};
exports.scheduleBookingCleanup = scheduleBookingCleanup;
/**
 * Get statistics about expired bookings
 */
const getExpiredBookingStats = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const expiredCount = yield models_1.Booking.count({
        where: {
            bookingStatus: dbEnums_1.dbEnums.BOOKING_STATUS[0], // 'PENDING'
            expiresAt: {
                [sequelize_1.Op.lt]: now,
            },
        },
    });
    const soonToExpireCount = yield models_1.Booking.count({
        where: {
            bookingStatus: dbEnums_1.dbEnums.BOOKING_STATUS[0], // 'PENDING'
            expiresAt: {
                [sequelize_1.Op.between]: [now, new Date(now.getTime() + 5 * 60000)], // Next 5 minutes
            },
        },
    });
    return {
        expiredCount,
        soonToExpireCount,
    };
});
exports.getExpiredBookingStats = getExpiredBookingStats;
//# sourceMappingURL=bookingCleanup.service.js.map