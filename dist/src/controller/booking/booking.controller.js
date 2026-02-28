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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelBooking = exports.updateBooking = exports.getBookingById = exports.getBookingHistory = exports.getBookingStats = exports.getActiveBookings = exports.getUpcomingBookings = exports.getUserBookings = exports.createBooking = void 0;
const bookingService = __importStar(require("../../services/booking/booking.service"));
const controller_utils_1 = require("../../utils/controller.utils");
const response_utils_1 = require("../../utils/response.utils");
const logger_1 = __importDefault(require("../../utils/logger"));
class BookingController extends controller_utils_1.BaseController {
    constructor() {
        super(...arguments);
        /**
         * Create a new booking
         */
        this.createBooking = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = this.ensureAuthenticated(req);
            const bookingData = Object.assign(Object.assign({}, req.body), { userId });
            logger_1.default.info(`Creating ${bookingData.bookingType || 'UNKNOWN'} booking`, { userId, bookingData });
            const booking = yield bookingService.createBooking(bookingData);
            logger_1.default.info(`Booking created successfully: ${booking.id} (${booking.bookingType})`, {
                bookingId: booking.id,
                userId,
            });
            (0, response_utils_1.sendCreated)(res, 'Booking created successfully', booking);
        }));
        /**
         * Get user bookings
         */
        this.getUserBookings = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = this.ensureAuthenticated(req);
            const bookings = yield bookingService.getUserBookings(userId);
            (0, response_utils_1.sendSuccess)(res, 'Bookings retrieved successfully', bookings);
        }));
        /**
         * Get upcoming bookings (next 30 days)
         */
        this.getUpcomingBookings = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = this.ensureAuthenticated(req);
            const bookings = yield bookingService.getUpcomingBookings(userId);
            (0, response_utils_1.sendSuccess)(res, 'Upcoming bookings retrieved successfully', bookings);
        }));
        /**
         * Get active bookings (currently ongoing)
         */
        this.getActiveBookings = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = this.ensureAuthenticated(req);
            const bookings = yield bookingService.getActiveBookings(userId);
            (0, response_utils_1.sendSuccess)(res, 'Active bookings retrieved successfully', bookings);
        }));
        /**
         * Get booking statistics
         */
        this.getBookingStats = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = this.ensureAuthenticated(req);
            const stats = yield bookingService.getBookingStats(userId);
            (0, response_utils_1.sendSuccess)(res, 'Booking statistics retrieved successfully', stats);
        }));
        /**
         * Get booking history with filters
         */
        this.getBookingHistory = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = this.ensureAuthenticated(req);
            const { year, month, status, vehicleType } = req.query;
            const params = {
                year: year ? parseInt(year) : undefined,
                month: month ? parseInt(month) : undefined,
                status: status,
                vehicleType: vehicleType,
            };
            const bookings = yield bookingService.getBookingHistory(userId, params);
            (0, response_utils_1.sendSuccess)(res, 'Booking history retrieved successfully', bookings);
        }));
        /**
         * Get booking by ID
         */
        this.getBookingById = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = this.ensureAuthenticated(req);
            const bookingId = this.getValidatedId(req, 'bookingId');
            const booking = yield bookingService.getBookingById(bookingId, userId);
            (0, response_utils_1.sendSuccess)(res, 'Booking retrieved successfully', booking);
        }));
        /**
         * Update booking
         */
        this.updateBooking = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = this.ensureAuthenticated(req);
            const bookingId = this.getValidatedId(req, 'bookingId');
            const updateData = req.body;
            const booking = yield bookingService.updateBooking(bookingId, userId, updateData);
            (0, response_utils_1.sendSuccess)(res, 'Booking updated successfully', booking);
        }));
        /**
         * Cancel booking
         */
        this.cancelBooking = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = this.ensureAuthenticated(req);
            const bookingId = this.getValidatedId(req, 'bookingId');
            yield bookingService.cancelBooking(bookingId, userId);
            (0, response_utils_1.sendSuccess)(res, 'Booking cancelled successfully');
        }));
    }
}
const bookingController = new BookingController();
exports.createBooking = bookingController.createBooking, exports.getUserBookings = bookingController.getUserBookings, exports.getUpcomingBookings = bookingController.getUpcomingBookings, exports.getActiveBookings = bookingController.getActiveBookings, exports.getBookingStats = bookingController.getBookingStats, exports.getBookingHistory = bookingController.getBookingHistory, exports.getBookingById = bookingController.getBookingById, exports.updateBooking = bookingController.updateBooking, exports.cancelBooking = bookingController.cancelBooking;
//# sourceMappingURL=booking.controller.js.map