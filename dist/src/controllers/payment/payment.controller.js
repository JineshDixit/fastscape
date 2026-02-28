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
exports.processRefund = exports.markPaymentPaid = exports.getOverduePayments = exports.getPaymentSummary = exports.getPaymentById = exports.getAllPayments = void 0;
const paymentService = __importStar(require("../../services/payment/payment.service"));
const logger_1 = __importDefault(require("../../config/logger"));
/**
 * GET /api/payments
 * Get all payments with filters and pagination
 */
const getAllPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger_1.default.debug('Fetching payments with filters', { query: req.query });
        const filters = {
            bookingId: req.query.bookingId,
            userId: req.query.userId,
            paymentType: req.query.paymentType,
            paymentStatus: req.query.paymentStatus,
            paymentMethod: req.query.paymentMethod,
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        };
        const result = yield paymentService.getAllPayments(filters);
        logger_1.default.info(`Retrieved ${result.payments.length} payments`, {
            total: result.pagination.total,
            page: result.pagination.page,
        });
        res.status(200).json({
            success: true,
            data: result.payments,
            pagination: result.pagination,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to fetch payments', { error: error.message, stack: error.stack });
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch payments',
                code: 'PAYMENT_FETCH_ERROR',
            },
        });
    }
});
exports.getAllPayments = getAllPayments;
/**
 * GET /api/payments/:id
 * Get single payment details
 */
const getPaymentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const payment = yield paymentService.getPaymentById(id);
        if (!payment) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Payment not found',
                    code: 'PAYMENT_NOT_FOUND',
                },
            });
        }
        res.status(200).json({
            success: true,
            data: payment,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch payment',
                code: 'PAYMENT_FETCH_ERROR',
            },
        });
    }
});
exports.getPaymentById = getPaymentById;
/**
 * GET /api/payments/summary/:bookingId
 * Get payment summary for a booking
 */
const getPaymentSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { bookingId } = req.params;
        const summary = yield paymentService.getPaymentSummary(bookingId);
        res.status(200).json({
            success: true,
            data: summary,
        });
    }
    catch (error) {
        res.status(404).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch payment summary',
                code: 'SUMMARY_FETCH_ERROR',
            },
        });
    }
});
exports.getPaymentSummary = getPaymentSummary;
/**
 * GET /api/payments/overdue
 * Get all overdue payments
 */
const getOverduePayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payments = yield paymentService.getOverduePayments();
        res.status(200).json({
            success: true,
            data: payments,
            count: payments.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                message: error.message || 'Failed to fetch overdue payments',
                code: 'OVERDUE_FETCH_ERROR',
            },
        });
    }
});
exports.getOverduePayments = getOverduePayments;
/**
 * PUT /api/payments/:id/mark-paid
 * Mark a payment as paid (admin override)
 */
const markPaymentPaid = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { paidAt, notes } = req.body;
        logger_1.default.info(`Marking payment ${id} as paid`, { paidAt, notes });
        const payment = yield paymentService.markPaymentPaid(id, paidAt ? new Date(paidAt) : undefined, notes);
        logger_1.default.info(`Payment ${id} marked as paid successfully`, {
            paymentId: payment.id,
            amount: payment.amount,
        });
        res.status(200).json({
            success: true,
            data: payment,
            message: 'Payment marked as paid successfully',
        });
    }
    catch (error) {
        logger_1.default.error(`Failed to mark payment ${req.params.id} as paid`, {
            error: error.message,
            stack: error.stack,
        });
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to mark payment as paid',
                code: 'MARK_PAID_ERROR',
            },
        });
    }
});
exports.markPaymentPaid = markPaymentPaid;
/**
 * POST /api/payments/refund/:bookingId
 * Process a refund for a booking
 */
const processRefund = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { bookingId } = req.params;
        const { refundAmount, reason, stripeRefundId } = req.body;
        logger_1.default.info(`Processing refund for booking ${bookingId}`, {
            refundAmount,
            reason,
            stripeRefundId,
        });
        if (!refundAmount || refundAmount <= 0) {
            logger_1.default.warn(`Invalid refund amount for booking ${bookingId}`, { refundAmount });
            return res.status(400).json({
                success: false,
                error: {
                    message: 'refundAmount is required and must be greater than 0',
                    code: 'INVALID_REFUND_AMOUNT',
                },
            });
        }
        if (!reason) {
            logger_1.default.warn(`Missing refund reason for booking ${bookingId}`);
            return res.status(400).json({
                success: false,
                error: {
                    message: 'reason is required for processing refunds',
                    code: 'MISSING_REASON',
                },
            });
        }
        const result = yield paymentService.processRefund(bookingId, parseFloat(refundAmount), reason, stripeRefundId);
        logger_1.default.info(`Refund processed successfully for booking ${bookingId}`, {
            refundAmount,
            refundId: result.payment.id,
        });
        res.status(200).json({
            success: true,
            data: result,
            message: `Refund of ${refundAmount} processed successfully`,
        });
    }
    catch (error) {
        logger_1.default.error(`Failed to process refund for booking ${req.params.bookingId}`, {
            error: error.message,
            stack: error.stack,
            refundAmount: req.body.refundAmount,
        });
        res.status(400).json({
            success: false,
            error: {
                message: error.message || 'Failed to process refund',
                code: 'REFUND_ERROR',
            },
        });
    }
});
exports.processRefund = processRefund;
//# sourceMappingURL=payment.controller.js.map