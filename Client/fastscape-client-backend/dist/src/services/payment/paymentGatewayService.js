"use strict";
/**
 * Payment Gateway Service
 *
 * Service layer that integrates payment gateways with the existing payment system.
 * Provides logging, error handling, and abstraction over different gateway implementations.
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
exports.paymentGatewayService = exports.PaymentGatewayService = void 0;
const paymentGatewayFactory_1 = require("./paymentGatewayFactory");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = __importDefault(require("../../utils/logger"));
const events_1 = require("events");
class PaymentGatewayService extends events_1.EventEmitter {
    constructor() {
        super();
        this.currentGateway = null;
        this.currentGatewayType = null;
        this.initializeDefaultGateway();
    }
    static getInstance() {
        if (!PaymentGatewayService.instance) {
            PaymentGatewayService.instance = new PaymentGatewayService();
        }
        return PaymentGatewayService.instance;
    }
    /**
     * Initialize the default payment gateway
     */
    initializeDefaultGateway() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Use mock gateway by default, can be overridden via environment
                const gatewayType = process.env.PAYMENT_GATEWAY_TYPE || 'mock';
                const config = paymentGatewayFactory_1.PaymentGatewayFactoryImpl.getGatewayConfigFromEnv(gatewayType);
                this.currentGateway = paymentGatewayFactory_1.paymentGatewayFactory.createGateway(gatewayType, config);
                this.currentGatewayType = gatewayType;
                logger_1.default.info('Payment gateway service initialized', {
                    gatewayType,
                    environment: config.environment
                });
            }
            catch (error) {
                logger_1.default.error('Failed to initialize payment gateway service', { error: error.message });
                throw error;
            }
        });
    }
    /**
     * Switch to a different payment gateway
     */
    switchGateway(gatewayType) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const config = paymentGatewayFactory_1.PaymentGatewayFactoryImpl.getGatewayConfigFromEnv(gatewayType);
                this.currentGateway = paymentGatewayFactory_1.paymentGatewayFactory.createGateway(gatewayType, config);
                this.currentGatewayType = gatewayType;
                logger_1.default.info('Switched to payment gateway', { gatewayType });
            }
            catch (error) {
                logger_1.default.error('Failed to switch payment gateway', {
                    gatewayType,
                    error: error.message
                });
                throw error;
            }
        });
    }
    /**
     * Create a payment intent for a booking
     */
    createPaymentIntent(bookingId, amount, currency, description) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.currentGateway) {
                throw (0, errorHandler_1.createError)('Payment gateway not initialized', 500);
            }
            const request = {
                amount: Math.round(amount * 100), // Convert to cents
                currency: currency.toLowerCase(),
                paymentMethodTypes: ['card'],
                description: description || `Payment for booking ${bookingId}`,
                metadata: {
                    bookingId,
                    source: 'fastscape_booking_system',
                    timestamp: new Date().toISOString(),
                },
                automaticPaymentMethods: true,
            };
            try {
                const response = yield this.currentGateway.createPaymentIntent(request);
                // Log payment intent creation
                yield this.logPaymentActivity({
                    bookingId,
                    action: 'payment_intent_created',
                    gatewayType: this.currentGatewayType,
                    paymentIntentId: response.paymentIntentId,
                    amount,
                    currency,
                    success: response.success,
                    error: (_a = response.error) === null || _a === void 0 ? void 0 : _a.message,
                });
                if (response.success) {
                    logger_1.default.info('Payment intent created successfully', {
                        bookingId,
                        paymentIntentId: response.paymentIntentId,
                        amount,
                        currency,
                        gatewayType: this.currentGatewayType,
                    });
                }
                else {
                    logger_1.default.error('Payment intent creation failed', {
                        bookingId,
                        amount,
                        currency,
                        error: response.error,
                        gatewayType: this.currentGatewayType,
                    });
                }
                return response;
            }
            catch (error) {
                logger_1.default.error('Payment intent creation error', {
                    bookingId,
                    amount,
                    currency,
                    error: error.message,
                    gatewayType: this.currentGatewayType,
                });
                yield this.logPaymentActivity({
                    bookingId,
                    action: 'payment_intent_creation_error',
                    gatewayType: this.currentGatewayType,
                    amount,
                    currency,
                    success: false,
                    error: error.message,
                });
                throw error;
            }
        });
    }
    /**
     * Confirm a payment intent
     */
    confirmPaymentIntent(paymentIntentId, paymentMethodId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.currentGateway) {
                throw (0, errorHandler_1.createError)('Payment gateway not initialized', 500);
            }
            try {
                const response = yield this.currentGateway.confirmPaymentIntent(paymentIntentId, paymentMethodId);
                // Extract booking ID from payment intent metadata if available
                const statusResponse = yield this.currentGateway.getPaymentStatus(paymentIntentId);
                const bookingId = statusResponse.success ? 'unknown' : 'unknown'; // Would be extracted from metadata in real implementation
                // Log payment confirmation
                yield this.logPaymentActivity({
                    bookingId,
                    action: 'payment_confirmed',
                    gatewayType: this.currentGatewayType,
                    paymentIntentId,
                    paymentMethodId,
                    success: response.success,
                    error: (_a = response.error) === null || _a === void 0 ? void 0 : _a.message,
                });
                if (response.success) {
                    logger_1.default.info('Payment confirmed successfully', {
                        paymentIntentId,
                        chargeId: response.chargeId,
                        status: response.status,
                        gatewayType: this.currentGatewayType,
                    });
                    // Emit payment success event
                    this.emitPaymentEvent('payment.succeeded', paymentIntentId, {
                        chargeId: response.chargeId,
                        receiptUrl: response.receiptUrl,
                    });
                }
                else {
                    logger_1.default.error('Payment confirmation failed', {
                        paymentIntentId,
                        error: response.error,
                        gatewayType: this.currentGatewayType,
                    });
                    // Emit payment failure event
                    this.emitPaymentEvent('payment.failed', paymentIntentId, {
                        error: response.error,
                    });
                }
                return response;
            }
            catch (error) {
                logger_1.default.error('Payment confirmation error', {
                    paymentIntentId,
                    error: error.message,
                    gatewayType: this.currentGatewayType,
                });
                yield this.logPaymentActivity({
                    bookingId: 'unknown',
                    action: 'payment_confirmation_error',
                    gatewayType: this.currentGatewayType,
                    paymentIntentId,
                    success: false,
                    error: error.message,
                });
                throw error;
            }
        });
    }
    /**
     * Process a refund
     */
    processRefund(paymentIntentId, amount, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.currentGateway) {
                throw (0, errorHandler_1.createError)('Payment gateway not initialized', 500);
            }
            try {
                const refundAmount = amount ? Math.round(amount * 100) : undefined; // Convert to cents
                const response = yield this.currentGateway.refundPayment(paymentIntentId, refundAmount, reason);
                // Log refund processing
                yield this.logPaymentActivity({
                    bookingId: 'unknown', // Would be extracted from payment intent metadata
                    action: 'refund_processed',
                    gatewayType: this.currentGatewayType,
                    paymentIntentId,
                    refundId: response.refundId,
                    amount: response.refundedAmount / 100, // Convert back from cents
                    success: response.success,
                    error: (_a = response.error) === null || _a === void 0 ? void 0 : _a.message,
                    metadata: { reason },
                });
                if (response.success) {
                    logger_1.default.info('Refund processed successfully', {
                        paymentIntentId,
                        refundId: response.refundId,
                        refundedAmount: response.refundedAmount,
                        reason,
                        gatewayType: this.currentGatewayType,
                    });
                    // Emit refund event
                    this.emitPaymentEvent('payment.refunded', paymentIntentId, {
                        refundId: response.refundId,
                        refundedAmount: response.refundedAmount,
                        reason,
                    });
                }
                else {
                    logger_1.default.error('Refund processing failed', {
                        paymentIntentId,
                        error: response.error,
                        gatewayType: this.currentGatewayType,
                    });
                }
                return response;
            }
            catch (error) {
                logger_1.default.error('Refund processing error', {
                    paymentIntentId,
                    error: error.message,
                    gatewayType: this.currentGatewayType,
                });
                yield this.logPaymentActivity({
                    bookingId: 'unknown',
                    action: 'refund_processing_error',
                    gatewayType: this.currentGatewayType,
                    paymentIntentId,
                    success: false,
                    error: error.message,
                });
                throw error;
            }
        });
    }
    /**
     * Handle webhook events from payment gateway
     */
    handleWebhook(payload, signature) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.currentGateway) {
                throw (0, errorHandler_1.createError)('Payment gateway not initialized', 500);
            }
            try {
                const response = yield this.currentGateway.handleWebhook(payload, signature);
                if (response.success) {
                    logger_1.default.info('Webhook processed successfully', {
                        eventType: response.eventType,
                        paymentIntentId: response.paymentIntentId,
                        gatewayType: this.currentGatewayType,
                    });
                    // Emit webhook event
                    if (response.paymentIntentId) {
                        this.emitPaymentEvent(response.eventType, response.paymentIntentId, payload);
                    }
                }
                else {
                    logger_1.default.error('Webhook processing failed', {
                        error: response.error,
                        gatewayType: this.currentGatewayType,
                    });
                }
            }
            catch (error) {
                logger_1.default.error('Webhook handling error', {
                    error: error.message,
                    gatewayType: this.currentGatewayType,
                });
                throw error;
            }
        });
    }
    /**
     * Get current gateway information
     */
    getGatewayInfo() {
        if (!this.currentGateway) {
            return null;
        }
        return Object.assign(Object.assign({}, this.currentGateway.getGatewayInfo()), { currentType: this.currentGatewayType });
    }
    /**
     * Log payment activity for audit and debugging
     */
    logPaymentActivity(activity) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // In a real implementation, this would save to a payment_logs table
                logger_1.default.info('Payment activity logged', activity);
                // For now, we'll just log to the application logger
                // Future implementation could save to database for audit trail
            }
            catch (error) {
                logger_1.default.error('Failed to log payment activity', {
                    error: error.message,
                    activity
                });
            }
        });
    }
    /**
     * Emit payment gateway events
     */
    emitPaymentEvent(eventType, paymentIntentId, data) {
        const event = {
            type: eventType,
            paymentIntentId,
            timestamp: new Date(),
            data,
            gatewayType: this.currentGatewayType,
        };
        this.emit('paymentEvent', event);
        logger_1.default.info('Payment event emitted', { eventType, paymentIntentId });
    }
}
exports.PaymentGatewayService = PaymentGatewayService;
// Export singleton instance
exports.paymentGatewayService = PaymentGatewayService.getInstance();
//# sourceMappingURL=paymentGatewayService.js.map