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
const bookingController = __importStar(require("../controllers/booking/booking.controller"));
const authenticateUser_1 = require("../services/middleware/authenticateUser");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(authenticateUser_1.authenticateUser);
/**
 * GET /api/bookings/export
 * Export bookings to CSV with filters
 * Query params: status, paymentStatus, bookingType, userId, vehicleId, chauffeurId, startDate, endDate, search
 * Must be before /:id route to avoid route conflict
 */
router.get('/export', bookingController.exportBookings);
/**
 * GET /api/bookings/expired
 * Get all expired PENDING bookings
 * Must be before /:id route to avoid route conflict
 */
router.get('/expired', bookingController.getExpiredBookings);
/**
 * GET /api/bookings
 * Get all bookings with filters and pagination
 * Query params: status, paymentStatus, bookingType, userId, vehicleId, chauffeurId, startDate, endDate, page, limit
 */
router.get('/', bookingController.getAllBookings);
/**
 * GET /api/bookings/:id
 * Get single booking details
 */
router.get('/:id', bookingController.getBookingById);
/**
 * PUT /api/bookings/:id/status
 * Update booking status (admin override)
 * Body: { bookingStatus: string }
 */
router.put('/:id/status', bookingController.updateBookingStatus);
/**
 * PUT /api/bookings/:id/cancel
 * Cancel a booking
 * Body: { reason?: string }
 */
router.put('/:id/cancel', bookingController.cancelBooking);
/**
 * DELETE /api/bookings/:id/cleanup
 * Cleanup an expired booking (soft delete)
 */
router.delete('/:id/cleanup', bookingController.cleanupExpiredBooking);
exports.default = router;
//# sourceMappingURL=booking.routes.js.map