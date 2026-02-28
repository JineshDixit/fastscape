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
exports.exportBookings = exports.cleanupExpiredBooking = exports.getExpiredBookings = exports.cancelBooking = exports.updateBookingStatus = exports.getBookingById = exports.getAllBookings = void 0;
const bookingService = __importStar(require("../../services/booking/booking.service"));
/**
 * GET /api/bookings
 * Get all bookings with filters and pagination
 */
const getAllBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filters = {
            status: req.query.status,
            paymentStatus: req.query.paymentStatus,
            bookingType: req.query.bookingType,
            userId: req.query.userId,
            vehicleId: req.query.vehicleId,
            chauffeurId: req.query.chauffeurId,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
            search: req.query.search,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder || 'DESC',
        };
        const result = yield bookingService.getAllBookings(filters);
        res.status(200).json({
            success: true,
            data: result.bookings,
            pagination: result.pagination,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch bookings',
                code: 'BOOKING_FETCH_ERROR',
            },
        });
    }
});
exports.getAllBookings = getAllBookings;
/**
 * GET /api/bookings/:id
 * Get single booking details
 */
const getBookingById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const booking = yield bookingService.getBookingById(id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Booking not found',
                    code: 'BOOKING_NOT_FOUND',
                },
            });
        }
        res.status(200).json({
            success: true,
            data: booking,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch booking',
                code: 'BOOKING_FETCH_ERROR',
            },
        });
    }
});
exports.getBookingById = getBookingById;
/**
 * PUT /api/bookings/:id/status
 * Update booking status (admin override)
 */
const updateBookingStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { bookingStatus } = req.body;
        if (!bookingStatus) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'bookingStatus is required',
                    code: 'MISSING_STATUS',
                },
            });
        }
        const validStatuses = ['PENDING', 'CONFIRMED', 'PICKED_UP', 'DROPPED_OFF', 'CANCELLED', 'COMPLETED'];
        if (!validStatuses.includes(bookingStatus)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
                    code: 'INVALID_STATUS',
                },
            });
        }
        const booking = yield bookingService.updateBookingStatus(id, bookingStatus);
        res.status(200).json({
            success: true,
            data: booking,
            message: `Booking status updated to ${bookingStatus}`,
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to update booking status',
                code: 'STATUS_UPDATE_ERROR',
            },
        });
    }
});
exports.updateBookingStatus = updateBookingStatus;
/**
 * PUT /api/bookings/:id/cancel
 * Cancel a booking
 */
const cancelBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const booking = yield bookingService.cancelBooking(id, reason);
        res.status(200).json({
            success: true,
            data: booking,
            message: 'Booking cancelled successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to cancel booking',
                code: 'CANCELLATION_ERROR',
            },
        });
    }
});
exports.cancelBooking = cancelBooking;
/**
 * GET /api/bookings/expired
 * Get all expired PENDING bookings
 */
const getExpiredBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bookings = yield bookingService.getExpiredBookings();
        res.status(200).json({
            success: true,
            data: bookings,
            count: bookings.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch expired bookings',
                code: 'EXPIRED_FETCH_ERROR',
            },
        });
    }
});
exports.getExpiredBookings = getExpiredBookings;
/**
 * DELETE /api/bookings/:id/cleanup
 * Cleanup an expired booking (soft delete)
 */
const cleanupExpiredBooking = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield bookingService.cleanupExpiredBooking(id);
        res.status(200).json({
            success: true,
            message: 'Expired booking cleaned up successfully',
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to cleanup booking',
                code: 'CLEANUP_ERROR',
            },
        });
    }
});
exports.cleanupExpiredBooking = cleanupExpiredBooking;
/**
 * GET /api/bookings/export
 * Export bookings to CSV with filters
 */
const exportBookings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { CSVExportService } = yield Promise.resolve().then(() => __importStar(require('../../services/csv/csvExport.service')));
        const filters = {
            status: req.query.status,
            paymentStatus: req.query.paymentStatus,
            bookingType: req.query.bookingType,
            userId: req.query.userId,
            vehicleId: req.query.vehicleId,
            chauffeurId: req.query.chauffeurId,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            search: req.query.search,
        };
        const bookings = yield bookingService.exportBookingsToCSV(filters);
        const columns = [
            { key: 'id', label: 'Booking ID' },
            { key: 'User.firstName', label: 'Client First Name' },
            { key: 'User.lastName', label: 'Client Last Name' },
            { key: 'User.email', label: 'Client Email' },
            { key: 'User.phone', label: 'Client Phone' },
            { key: 'Vehicle.make', label: 'Vehicle Make' },
            { key: 'Vehicle.model', label: 'Vehicle Model' },
            { key: 'Vehicle.year', label: 'Vehicle Year' },
            { key: 'bookingType', label: 'Booking Type' },
            { key: 'bookingStatus', label: 'Status' },
            { key: 'paymentStatus', label: 'Payment Status' },
            {
                key: 'startDatetime',
                label: 'Start Date',
                format: CSVExportService.formatDateTime,
            },
            {
                key: 'endDatetime',
                label: 'End Date',
                format: CSVExportService.formatDateTime,
            },
            { key: 'Chauffeur.fullName', label: 'Chauffeur Name' },
            { key: 'Chauffeur.phone', label: 'Chauffeur Phone' },
            {
                key: 'BookingFinancial.totalAmount',
                label: 'Total Amount',
                format: (val) => CSVExportService.formatCurrency(val),
            },
            {
                key: 'createdAt',
                label: 'Created At',
                format: CSVExportService.formatDateTime,
            },
        ];
        const csv = CSVExportService.generateCSV(bookings, columns);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=bookings-${Date.now()}.csv`);
        res.status(200).send(csv);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to export bookings',
                code: 'EXPORT_ERROR',
            },
        });
    }
});
exports.exportBookings = exportBookings;
//# sourceMappingURL=booking.controller.js.map