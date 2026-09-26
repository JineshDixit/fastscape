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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bookingController = __importStar(require("../controller/booking/booking.controller"));
const authenticateUser_1 = require("../services/middleware/authenticateUser");
const express_validator_1 = require("express-validator");
const validation_1 = require("../services/middleware/validation");
const router = (0, express_1.Router)();
// All booking routes require authentication
router.use(authenticateUser_1.authenticateUser);
// Create booking
router.post('/', [
    (0, express_validator_1.body)('vehicleId').isUUID().withMessage('Valid vehicle ID is required'),
    (0, express_validator_1.body)('startDatetime').isISO8601().withMessage('Valid start date is required'),
    (0, express_validator_1.body)('endDatetime').isISO8601().withMessage('Valid end date is required'),
    (0, express_validator_1.body)('pickupLocation')
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Pickup location must be between 3 and 200 characters'),
    (0, express_validator_1.body)('dropoffLocation')
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('Dropoff location must be between 3 and 200 characters'),
    validation_1.handleValidationErrors,
], bookingController.createBooking);
// Get user bookings
router.get('/', bookingController.getUserBookings);
// Get upcoming bookings
router.get('/upcoming', bookingController.getUpcomingBookings);
// Get active bookings
router.get('/active', bookingController.getActiveBookings);
// Get booking statistics
router.get('/stats', bookingController.getBookingStats);
// Get booking history
router.get('/history', bookingController.getBookingHistory);
// Get booking by ID
router.get('/:bookingId', bookingController.getBookingById);
// Update booking
router.put('/:bookingId', [
    (0, express_validator_1.body)('startDatetime').optional().isISO8601().withMessage('Valid start date is required'),
    (0, express_validator_1.body)('endDatetime').optional().isISO8601().withMessage('Valid end date is required'),
    (0, express_validator_1.body)('pickupLocation')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Pickup location must be between 5 and 200 characters'),
    (0, express_validator_1.body)('dropoffLocation')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Dropoff location must be between 5 and 200 characters'),
    validation_1.handleValidationErrors,
], bookingController.updateBooking);
// Cancel booking
router.delete('/:bookingId', bookingController.cancelBooking);
exports.default = router;
//# sourceMappingURL=booking.routes.js.map