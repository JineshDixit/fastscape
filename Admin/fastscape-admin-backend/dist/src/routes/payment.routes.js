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
const paymentController = __importStar(require("../controllers/payment/payment.controller"));
const authenticateUser_1 = require("../services/middleware/authenticateUser");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(authenticateUser_1.authenticateUser);
/**
 * GET /api/payments/overdue
 * Get all overdue payments
 * Must be before other routes to avoid conflicts
 */
router.get('/overdue', paymentController.getOverduePayments);
/**
 * GET /api/payments/summary/:bookingId
 * Get payment summary for a booking
 */
router.get('/summary/:bookingId', paymentController.getPaymentSummary);
/**
 * GET /api/payments
 * Get all payments with filters
 * Query params: bookingId, userId, paymentType, paymentStatus, paymentMethod, page, limit
 */
router.get('/', paymentController.getAllPayments);
/**
 * GET /api/payments/:id
 * Get single payment details
 */
router.get('/:id', paymentController.getPaymentById);
/**
 * PUT /api/payments/:id/mark-paid
 * Mark a payment as paid (admin override)
 * Body: { paidAt?: Date, notes?: string }
 */
router.put('/:id/mark-paid', paymentController.markPaymentPaid);
/**
 * POST /api/payments/refund/:bookingId
 * Process a refund for a booking
 * Body: { refundAmount: number, reason: string, stripeRefundId?: string }
 */
router.post('/refund/:bookingId', paymentController.processRefund);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map