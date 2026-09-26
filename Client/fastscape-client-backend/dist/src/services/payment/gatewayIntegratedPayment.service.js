"use strict";
/**
 * Gateway Integrated Payment Service
 *
 * Enhanced payment service that integrates payment gateways with the existing
 * Fastscape payment system. Provides a bridge between the gateway interface
 * and the current payment processing logic.
 */
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
exports.handlePaymentWebhook = exports.getEnhancedPaymentSummary = exports.processPaymentRefund = exports.processOnlineFullPayment = exports.processOnlineBalancePayment = exports.processOnlineDepositPayment = exports.createPaymentIntentForBooking = void 0;
const enhancedPayment_service_1 = require("./enhancedPayment.service");
const paymentGatewayService_1 = require("./paymentGatewayService");
const models_1 = require("../../models");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Create payment intent for online payments
 */
const createPaymentIntentForBooking = (bookingId_1, paymentType_1, ...args_1) => __awaiter(void 0, [bookingId_1, paymentType_1, ...args_1], void 0, function* (bookingId, paymentType, currency = 'USD') {
    try {
        // Calculate payment amount based on type
        const calculation = yield (0, enhancedPayment_service_1.calculatePaymentBreakdown)(bookingId);
        let amount;
        let description;
        switch (paymentType) {
            case 'DEPOSIT':
                amount = calculation.depositAmount;
                description = `Deposit payment for booking ${bookingId}`;
                break;
            case 'BALANCE':
                amount = calculation.balanceAmount + calculation.delayChargeAmount;
                description = `Balance payment for booking ${bookingId}`;
                break;
            case 'FULL':
                amount = calculation.totalAmount;
                description = `Full payment for booking ${bookingId}`;
                break;
            default:
                throw (0, errorHandler_1.createError)('Invalid payment type', 400);
        }
        // Create payment intent through gateway service
        const response = yield paymentGatewayService_1.paymentGatewayService.createPaymentIntent(bookingId, amount, currency, description);
        logger_1.default.info('Payment intent created for booking', {
            bookingId,
            paymentType,
            amount,
            currency,
            paymentIntentId: response.paymentIntentId,
            success: response.success,
        });
        return response;
    }
    catch (error) {
        logger_1.default.error('Failed to create payment intent for booking', {
            bookingId,
            paymentType,
            error: error.message,
        });
        throw error;
    }
});
exports.createPaymentIntentForBooking = createPaymentIntentForBooking;
/**
 * Process online deposit payment with gateway integration
 */
const processOnlineDepositPayment = (bookingId, paymentIntentId, paymentMethodId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // Confirm payment through gateway
        const confirmation = yield paymentGatewayService_1.paymentGatewayService.confirmPaymentIntent(paymentIntentId, paymentMethodId);
        if (!confirmation.success) {
            logger_1.default.error('Payment confirmation failed', {
                bookingId,
                paymentIntentId,
                error: confirmation.error,
            });
            throw (0, errorHandler_1.createError)(((_a = confirmation.error) === null || _a === void 0 ? void 0 : _a.message) || 'Payment confirmation failed', 400);
        }
        // Process deposit payment in the system
        const result = yield (0, enhancedPayment_service_1.processDepositPayment)(bookingId, 'ONLINE', paymentIntentId);
        // Update payment record with gateway information
        if (confirmation.chargeId) {
            yield result.payment.update({
                metadata: Object.assign(Object.assign({}, result.payment.metadata), { chargeId: confirmation.chargeId, receiptUrl: confirmation.receiptUrl, gatewayType: (_b = paymentGatewayService_1.paymentGatewayService.getGatewayInfo()) === null || _b === void 0 ? void 0 : _b.currentType }),
            });
        }
        logger_1.default.info('Online deposit payment processed successfully', {
            bookingId,
            paymentIntentId,
            chargeId: confirmation.chargeId,
            amount: result.payment.amount,
        });
        return {
            payment: result.payment,
            financial: result.financial,
            confirmation,
        };
    }
    catch (error) {
        logger_1.default.error('Failed to process online deposit payment', {
            bookingId,
            paymentIntentId,
            error: error.message,
        });
        throw error;
    }
});
exports.processOnlineDepositPayment = processOnlineDepositPayment;
/**
 * Process online balance payment with gateway integration
 */
const processOnlineBalancePayment = (bookingId, paymentIntentId, paymentMethodId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // Confirm payment through gateway
        const confirmation = yield paymentGatewayService_1.paymentGatewayService.confirmPaymentIntent(paymentIntentId, paymentMethodId);
        if (!confirmation.success) {
            logger_1.default.error('Balance payment confirmation failed', {
                bookingId,
                paymentIntentId,
                error: confirmation.error,
            });
            throw (0, errorHandler_1.createError)(((_a = confirmation.error) === null || _a === void 0 ? void 0 : _a.message) || 'Payment confirmation failed', 400);
        }
        // Process balance payment in the system
        const result = yield (0, enhancedPayment_service_1.processBalancePayment)(bookingId, 'ONLINE', paymentIntentId);
        // Update payment record with gateway information
        if (confirmation.chargeId) {
            yield result.payment.update({
                metadata: Object.assign(Object.assign({}, result.payment.metadata), { chargeId: confirmation.chargeId, receiptUrl: confirmation.receiptUrl, gatewayType: (_b = paymentGatewayService_1.paymentGatewayService.getGatewayInfo()) === null || _b === void 0 ? void 0 : _b.currentType }),
            });
        }
        logger_1.default.info('Online balance payment processed successfully', {
            bookingId,
            paymentIntentId,
            chargeId: confirmation.chargeId,
            amount: result.payment.amount,
        });
        return {
            payment: result.payment,
            financial: result.financial,
            confirmation,
        };
    }
    catch (error) {
        logger_1.default.error('Failed to process online balance payment', {
            bookingId,
            paymentIntentId,
            error: error.message,
        });
        throw error;
    }
});
exports.processOnlineBalancePayment = processOnlineBalancePayment;
/**
 * Process full payment (deposit + balance) with gateway integration
 */
const processOnlineFullPayment = (bookingId, paymentIntentId, paymentMethodId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // Confirm payment through gateway
        const confirmation = yield paymentGatewayService_1.paymentGatewayService.confirmPaymentIntent(paymentIntentId, paymentMethodId);
        if (!confirmation.success) {
            logger_1.default.error('Full payment confirmation failed', {
                bookingId,
                paymentIntentId,
                error: confirmation.error,
            });
            throw (0, errorHandler_1.createError)(((_a = confirmation.error) === null || _a === void 0 ? void 0 : _a.message) || 'Payment confirmation failed', 400);
        }
        // Get payment calculation
        const calculation = yield (0, enhancedPayment_service_1.calculatePaymentBreakdown)(bookingId);
        // Process deposit payment first
        const depositResult = yield (0, enhancedPayment_service_1.processDepositPayment)(bookingId, 'ONLINE', paymentIntentId);
        // Process balance payment
        const balanceResult = yield (0, enhancedPayment_service_1.processBalancePayment)(bookingId, 'ONLINE', paymentIntentId);
        // Update both payment records with gateway information
        const gatewayMetadata = {
            chargeId: confirmation.chargeId,
            receiptUrl: confirmation.receiptUrl,
            gatewayType: (_b = paymentGatewayService_1.paymentGatewayService.getGatewayInfo()) === null || _b === void 0 ? void 0 : _b.currentType,
            fullPaymentIntent: paymentIntentId,
        };
        yield depositResult.payment.update({
            metadata: Object.assign(Object.assign({}, depositResult.payment.metadata), gatewayMetadata),
        });
        yield balanceResult.payment.update({
            metadata: Object.assign(Object.assign({}, balanceResult.payment.metadata), gatewayMetadata),
        });
        logger_1.default.info('Online full payment processed successfully', {
            bookingId,
            paymentIntentId,
            chargeId: confirmation.chargeId,
            totalAmount: calculation.totalAmount,
        });
        return {
            payments: [depositResult.payment, balanceResult.payment],
            financial: balanceResult.financial,
            confirmation,
        };
    }
    catch (error) {
        logger_1.default.error('Failed to process online full payment', {
            bookingId,
            paymentIntentId,
            error: error.message,
        });
        throw error;
    }
});
exports.processOnlineFullPayment = processOnlineFullPayment;
/**
 * Process refund through payment gateway
 */
const processPaymentRefund = (paymentId, amount, reason) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const payment = yield models_1.Payment.findByPk(paymentId);
        if (!payment) {
            throw (0, errorHandler_1.createError)('Payment not found', 404);
        }
        if (!payment.stripePaymentIntentId) {
            throw (0, errorHandler_1.createError)('Payment was not processed through gateway, cannot refund online', 400);
        }
        // Process refund through gateway
        const refundResponse = yield paymentGatewayService_1.paymentGatewayService.processRefund(payment.stripePaymentIntentId, amount, reason);
        if (refundResponse.success) {
            // Update payment record with refund information
            yield payment.update({
                paymentStatus: 'REFUNDED',
                metadata: Object.assign(Object.assign({}, payment.metadata), { refundId: refundResponse.refundId, refundedAmount: refundResponse.refundedAmount, refundReason: reason, refundedAt: new Date() }),
            });
            logger_1.default.info('Payment refund processed successfully', {
                paymentId,
                refundId: refundResponse.refundId,
                refundedAmount: refundResponse.refundedAmount,
                reason,
            });
            return {
                success: true,
                refundId: refundResponse.refundId,
            };
        }
        else {
            logger_1.default.error('Payment refund failed', {
                paymentId,
                error: refundResponse.error,
            });
            return {
                success: false,
                error: ((_a = refundResponse.error) === null || _a === void 0 ? void 0 : _a.message) || 'Refund processing failed',
            };
        }
    }
    catch (error) {
        logger_1.default.error('Failed to process payment refund', {
            paymentId,
            error: error.message,
        });
        return {
            success: false,
            error: error.message,
        };
    }
});
exports.processPaymentRefund = processPaymentRefund;
/**
 * Get enhanced payment summary with gateway information
 */
const getEnhancedPaymentSummary = (bookingId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const summary = yield (0, enhancedPayment_service_1.getPaymentSummary)(bookingId);
        // Add gateway information to payments
        const enhancedPayments = summary.payments.map((payment) => {
            var _a;
            return (Object.assign(Object.assign({}, payment), { gatewayInfo: ((_a = payment.metadata) === null || _a === void 0 ? void 0 : _a.gatewayType) ? {
                    gatewayType: payment.metadata.gatewayType,
                    chargeId: payment.metadata.chargeId,
                    receiptUrl: payment.metadata.receiptUrl,
                } : null }));
        });
        return Object.assign(Object.assign({}, summary), { payments: enhancedPayments, gatewayInfo: paymentGatewayService_1.paymentGatewayService.getGatewayInfo() });
    }
    catch (error) {
        logger_1.default.error('Failed to get enhanced payment summary', {
            bookingId,
            error: error.message,
        });
        throw error;
    }
});
exports.getEnhancedPaymentSummary = getEnhancedPaymentSummary;
/**
 * Handle payment gateway webhook events
 */
const handlePaymentWebhook = (payload, signature) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield paymentGatewayService_1.paymentGatewayService.handleWebhook(payload, signature);
        // Additional webhook processing logic can be added here
        // For example, updating payment statuses, sending notifications, etc.
        logger_1.default.info('Payment webhook processed successfully');
    }
    catch (error) {
        logger_1.default.error('Failed to handle payment webhook', {
            error: error.message,
        });
        throw error;
    }
});
exports.handlePaymentWebhook = handlePaymentWebhook;
//# sourceMappingURL=gatewayIntegratedPayment.service.js.map