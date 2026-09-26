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
exports.processRefund = exports.markPaymentPaid = exports.getOverduePayments = exports.getPaymentSummary = exports.getPaymentById = exports.getAllPayments = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../../models");
const logger_1 = __importDefault(require("../../config/logger"));
/**
 * Get all payments with filtering and pagination
 */
const getAllPayments = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = Date.now();
    logger_1.default.debug('Fetching payments with filters', { filters });
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const offset = (page - 1) * limit;
    const where = {};
    if (filters.bookingId) {
        where.bookingId = filters.bookingId;
    }
    if (filters.userId) {
        where.userId = filters.userId;
    }
    if (filters.paymentType) {
        where.paymentType = filters.paymentType;
    }
    if (filters.paymentStatus) {
        where.paymentStatus = filters.paymentStatus;
    }
    if (filters.paymentMethod) {
        where.paymentMethod = filters.paymentMethod;
    }
    const { rows: payments, count: total } = yield models_1.Payment.findAndCountAll({
        where,
        include: [
            {
                model: models_1.User,
                attributes: ['id', 'firstName', 'lastName', 'email'],
            },
            {
                model: models_1.Booking,
                attributes: ['id', 'bookingStatus', 'paymentStatus', 'startDatetime', 'endDatetime'],
            },
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
    });
    const duration = Date.now() - startTime;
    logger_1.default.info('Payments fetched successfully', {
        count: payments.length,
        total,
        page,
        duration: `${duration}ms`,
    });
    return {
        payments,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
});
exports.getAllPayments = getAllPayments;
/**
 * Get single payment by ID
 */
const getPaymentById = (paymentId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.debug('Fetching payment by ID', { paymentId });
    const payment = yield models_1.Payment.findByPk(paymentId, {
        include: [
            {
                model: models_1.User,
                attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
            },
            {
                model: models_1.Booking,
                attributes: ['id', 'bookingStatus', 'paymentStatus', 'startDatetime', 'endDatetime', 'vehicleId'],
            },
        ],
    });
    if (payment) {
        logger_1.default.debug('Payment found', { paymentId, amount: payment.amount, status: payment.paymentStatus });
    }
    else {
        logger_1.default.warn('Payment not found', { paymentId });
    }
    return payment;
});
exports.getPaymentById = getPaymentById;
/**
 * Get payment summary for a booking
 */
const getPaymentSummary = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.debug('Fetching payment summary', { bookingId });
    const booking = yield models_1.Booking.findByPk(bookingId, {
        include: [{ model: models_1.BookingFinancial }, { model: models_1.Payment }],
    });
    if (!booking) {
        logger_1.default.error('Booking not found for payment summary', { bookingId });
        throw new Error('Booking not found');
    }
    const payments = yield models_1.Payment.findAll({
        where: { bookingId },
        order: [['createdAt', 'ASC']],
    });
    const financial = yield models_1.BookingFinancial.findOne({
        where: { bookingId },
    });
    const summary = {
        totalPayments: payments.length,
        totalPaid: payments.reduce((sum, p) => (p.paymentStatus === 'PAID' ? sum + Number(p.amount) : sum), 0),
        pendingPayments: payments.filter((p) => p.paymentStatus === 'UNPAID').length,
    };
    logger_1.default.info('Payment summary retrieved', {
        bookingId,
        totalPayments: summary.totalPayments,
        totalPaid: summary.totalPaid,
        pendingPayments: summary.pendingPayments,
    });
    return {
        booking: {
            id: booking.id,
            bookingStatus: booking.bookingStatus,
            paymentStatus: booking.paymentStatus,
            paymentMethod: booking.paymentMethod,
        },
        financial: financial || null,
        payments,
        summary,
    };
});
exports.getPaymentSummary = getPaymentSummary;
/**
 * Get overdue payments (UNPAID payments created more than 24 hours ago)
 */
const getOverduePayments = () => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = Date.now();
    logger_1.default.debug('Fetching overdue payments');
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    const payments = yield models_1.Payment.findAll({
        where: {
            paymentStatus: 'UNPAID',
            createdAt: {
                [sequelize_1.Op.lt]: yesterday,
            },
        },
        include: [
            {
                model: models_1.User,
                attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
            },
            {
                model: models_1.Booking,
                attributes: ['id', 'bookingStatus', 'paymentStatus', 'startDatetime', 'endDatetime'],
            },
        ],
        order: [['createdAt', 'ASC']],
    });
    const duration = Date.now() - startTime;
    logger_1.default.info('Overdue payments retrieved', {
        count: payments.length,
        duration: `${duration}ms`,
    });
    return payments;
});
exports.getOverduePayments = getOverduePayments;
/**
 * Mark a payment as paid (admin override for manual payments)
 */
const markPaymentPaid = (paymentId, paidAt, notes) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = Date.now();
    logger_1.default.info('Starting mark payment as paid operation', { paymentId, paidAt, notes });
    const transaction = yield models_1.sequelize.transaction();
    try {
        const payment = yield models_1.Payment.findByPk(paymentId, {
            transaction,
            lock: true,
        });
        if (!payment) {
            logger_1.default.error('Payment not found for marking as paid', { paymentId });
            throw new Error('Payment not found');
        }
        if (payment.paymentStatus === 'PAID') {
            logger_1.default.warn('Attempted to mark already paid payment', {
                paymentId,
                currentStatus: payment.paymentStatus,
            });
            throw new Error('Payment is already marked as paid');
        }
        logger_1.default.debug('Updating payment status to PAID', {
            paymentId,
            previousStatus: payment.paymentStatus,
            amount: payment.amount,
        });
        // Update payment record
        yield payment.update({
            paymentStatus: 'PAID',
            paidAt: paidAt || new Date(),
            metadata: Object.assign(Object.assign({}, (payment.metadata || {})), { adminNotes: notes, markedPaidAt: new Date().toISOString() }),
        }, { transaction });
        // Update booking financial record
        const financial = yield models_1.BookingFinancial.findOne({
            where: { bookingId: payment.bookingId },
            transaction,
            lock: true,
        });
        if (financial) {
            const newPaidAmount = Number(financial.paidAmount) + Number(payment.amount);
            const newRemainingAmount = Math.max(0, Number(financial.totalAmount) - newPaidAmount);
            logger_1.default.debug('Updating booking financial record', {
                bookingId: payment.bookingId,
                previousPaidAmount: financial.paidAmount,
                newPaidAmount,
                newRemainingAmount,
            });
            yield financial.update({
                paidAmount: newPaidAmount,
                remainingAmount: newRemainingAmount,
            }, { transaction });
            // Update booking payment status
            const booking = yield models_1.Booking.findByPk(payment.bookingId, { transaction });
            if (booking) {
                const isFullyPaid = newPaidAmount >= Number(financial.totalAmount) - 0.01;
                const newPaymentStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';
                logger_1.default.debug('Updating booking payment status', {
                    bookingId: payment.bookingId,
                    previousStatus: booking.paymentStatus,
                    newStatus: newPaymentStatus,
                    isFullyPaid,
                });
                yield booking.update({
                    paymentStatus: newPaymentStatus,
                }, { transaction });
            }
        }
        yield transaction.commit();
        const duration = Date.now() - startTime;
        logger_1.default.info('Payment marked as paid successfully', {
            paymentId,
            bookingId: payment.bookingId,
            amount: payment.amount,
            duration: `${duration}ms`,
        });
        return payment;
    }
    catch (error) {
        yield transaction.rollback();
        logger_1.default.error('Failed to mark payment as paid, transaction rolled back', {
            paymentId,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
});
exports.markPaymentPaid = markPaymentPaid;
/**
 * Process refund for a booking
 * Creates a REFUND payment record and updates financial records
 */
const processRefund = (bookingId, refundAmount, reason, stripeRefundId) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = Date.now();
    logger_1.default.info('Starting refund processing', {
        bookingId,
        refundAmount,
        reason,
        stripeRefundId,
    });
    const transaction = yield models_1.sequelize.transaction();
    try {
        // Validate booking exists
        const booking = yield models_1.Booking.findByPk(bookingId, {
            transaction,
            lock: true,
        });
        if (!booking) {
            logger_1.default.error('Booking not found for refund', { bookingId });
            throw new Error('Booking not found');
        }
        logger_1.default.debug('Booking found for refund', {
            bookingId,
            userId: booking.userId,
            bookingStatus: booking.bookingStatus,
            paymentStatus: booking.paymentStatus,
        });
        // Get financial record
        const financial = yield models_1.BookingFinancial.findOne({
            where: { bookingId },
            transaction,
            lock: true,
        });
        if (!financial) {
            logger_1.default.error('Financial record not found for refund', { bookingId });
            throw new Error('Financial record not found for this booking');
        }
        logger_1.default.debug('Financial record retrieved', {
            bookingId,
            totalAmount: financial.totalAmount,
            paidAmount: financial.paidAmount,
            remainingAmount: financial.remainingAmount,
        });
        // Validate refund amount
        if (refundAmount <= 0) {
            logger_1.default.warn('Invalid refund amount (must be > 0)', { bookingId, refundAmount });
            throw new Error('Refund amount must be greater than 0');
        }
        if (refundAmount > Number(financial.paidAmount)) {
            logger_1.default.warn('Refund amount exceeds paid amount', {
                bookingId,
                refundAmount,
                paidAmount: financial.paidAmount,
            });
            throw new Error(`Refund amount (${refundAmount}) cannot exceed paid amount (${financial.paidAmount})`);
        }
        // Create refund payment record
        logger_1.default.debug('Creating refund payment record', {
            bookingId,
            userId: booking.userId,
            refundAmount,
        });
        const refundPayment = yield models_1.Payment.create({
            bookingId,
            userId: booking.userId,
            amount: refundAmount,
            currency: financial.currency,
            paymentType: 'REFUND',
            paymentStatus: 'REFUNDED',
            paymentMethod: booking.paymentMethod,
            stripeRefundId: stripeRefundId || null,
            paidAt: new Date(),
            metadata: {
                refundReason: reason,
                processedBy: 'admin',
                processedAt: new Date().toISOString(),
            },
        }, { transaction });
        logger_1.default.info('Refund payment record created', {
            refundPaymentId: refundPayment.id,
            bookingId,
            amount: refundAmount,
        });
        // Update financial record
        const newPaidAmount = Number(financial.paidAmount) - refundAmount;
        const newRemainingAmount = Number(financial.totalAmount) - newPaidAmount;
        logger_1.default.debug('Updating financial record after refund', {
            bookingId,
            previousPaidAmount: financial.paidAmount,
            newPaidAmount,
            newRemainingAmount,
        });
        yield financial.update({
            paidAmount: newPaidAmount,
            remainingAmount: newRemainingAmount,
        }, { transaction });
        // Update booking payment status
        let newPaymentStatus;
        if (newPaidAmount === 0) {
            newPaymentStatus = 'REFUNDED';
        }
        else if (newPaidAmount < Number(financial.totalAmount)) {
            newPaymentStatus = 'PARTIALLY_PAID';
        }
        else {
            newPaymentStatus = 'PAID';
        }
        logger_1.default.debug('Updating booking payment status after refund', {
            bookingId,
            previousStatus: booking.paymentStatus,
            newStatus: newPaymentStatus,
            newPaidAmount,
        });
        yield booking.update({
            paymentStatus: newPaymentStatus,
        }, { transaction });
        yield transaction.commit();
        const duration = Date.now() - startTime;
        logger_1.default.info('Refund processed successfully', {
            bookingId,
            refundPaymentId: refundPayment.id,
            refundAmount,
            newPaymentStatus,
            duration: `${duration}ms`,
        });
        return {
            payment: refundPayment,
            financial,
        };
    }
    catch (error) {
        yield transaction.rollback();
        logger_1.default.error('Refund processing failed, transaction rolled back', {
            bookingId,
            refundAmount,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
});
exports.processRefund = processRefund;
//# sourceMappingURL=payment.service.js.map