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
exports.handleWebhook = exports.paymentWebhookController = void 0;
const stripe_service_1 = require("../../services/payment/stripe.service");
const paymentService = __importStar(require("../../services/payment/payment.service"));
const models_1 = require("../../models");
const logger_1 = __importDefault(require("../../utils/logger"));
const controller_utils_1 = require("../../utils/controller.utils");
class PaymentWebhookController extends controller_utils_1.BaseController {
    constructor() {
        super(...arguments);
        /**
         * Handle Stripe webhooks
         */
        this.handleWebhook = this.asyncHandler((req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const sig = req.headers['stripe-signature'];
            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock';
            let event;
            try {
                // Verify webhook signature
                event = stripe_service_1.stripe.constructEvent(req.body, sig, webhookSecret);
            }
            catch (err) {
                logger_1.default.error('Webhook signature verification failed', { error: err.message });
                res.status(400).send(`Webhook Error: ${err.message}`);
                return;
            }
            // Process webhook in transaction to ensure consistency
            const transaction = yield models_1.sequelize.transaction();
            try {
                // Check for duplicate webhook event (idempotency)
                const [webhookRecord, created] = yield models_1.WebhookEvent.findOrCreate({
                    where: { eventId: event.id },
                    defaults: {
                        eventId: event.id,
                        eventType: event.type,
                        provider: 'stripe',
                        payload: event,
                        processed: false,
                        retryCount: 0,
                    },
                    transaction,
                });
                if (!created && webhookRecord.processed) {
                    logger_1.default.info('Duplicate webhook event - already processed', { eventId: event.id });
                    yield transaction.commit();
                    res.json({ received: true, eventId: event.id, duplicate: true });
                    return;
                }
                // Increment retry count
                yield webhookRecord.update({ retryCount: webhookRecord.retryCount + 1 }, { transaction });
                // Handle the event
                switch (event.type) {
                    case 'payment_intent.succeeded':
                        const paymentIntent = event.data.object;
                        logger_1.default.info('PaymentIntent was successful!', { id: paymentIntent.id });
                        // Synchronize state
                        const bookingId = paymentIntent.metadata.bookingId;
                        const paymentType = paymentIntent.metadata.paymentType;
                        if (bookingId) {
                            // Prepare Stripe data for the service
                            const stripeData = {
                                amountReceived: paymentIntent.amount_received / 100, // Convert cents to units
                                currency: paymentIntent.currency,
                                paymentIntentId: paymentIntent.id,
                                chargeId: paymentIntent.latest_charge, // Use latest_charge if available
                                metadata: paymentIntent.metadata,
                            };
                            if (paymentType === 'DEPOSIT' || paymentType === 'FULL') {
                                yield paymentService.processDepositPayment(bookingId, 'ONLINE', undefined, stripeData, paymentType);
                            }
                            else if (paymentType === 'BALANCE') {
                                yield paymentService.processBalancePayment(bookingId, 'ONLINE', undefined, stripeData);
                            }
                            else {
                                logger_1.default.warn('Unknown payment type in webhook', { paymentType, bookingId });
                            }
                        }
                        else {
                            logger_1.default.warn('No booking ID in payment intent metadata', { intentId: paymentIntent.id });
                        }
                        break;
                    case 'payment_intent.payment_failed':
                        const failedIntent = event.data.object;
                        logger_1.default.warn('PaymentIntent failed!', {
                            id: failedIntent.id,
                            error: (_a = failedIntent.last_payment_error) === null || _a === void 0 ? void 0 : _a.message,
                            bookingId: (_b = failedIntent.metadata) === null || _b === void 0 ? void 0 : _b.bookingId,
                        });
                        // TODO: Handle failure (e.g., notify user, mark payment as failed, release booking)
                        // For now, just log the failure
                        break;
                    case 'payment_intent.canceled':
                        const canceledIntent = event.data.object;
                        logger_1.default.info('PaymentIntent was canceled', {
                            id: canceledIntent.id,
                            bookingId: (_c = canceledIntent.metadata) === null || _c === void 0 ? void 0 : _c.bookingId,
                        });
                        // TODO: Handle cancellation (e.g., release booking, notify user)
                        break;
                    default:
                        logger_1.default.info(`Unhandled event type ${event.type}`);
                }
                // Mark webhook as processed
                yield webhookRecord.update({
                    processed: true,
                    processedAt: new Date(),
                    error: null,
                }, { transaction });
                yield transaction.commit();
                logger_1.default.info('Webhook processed successfully', { eventType: event.type, eventId: event.id });
            }
            catch (error) {
                yield transaction.rollback();
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                // Try to update webhook event with error (outside transaction)
                try {
                    yield models_1.WebhookEvent.update({
                        error: errorMessage,
                        processed: false,
                    }, { where: { eventId: event.id } });
                }
                catch (updateError) {
                    logger_1.default.error('Failed to update webhook event error', { eventId: event.id, updateError });
                }
                logger_1.default.error('Webhook processing failed', {
                    error: errorMessage,
                    eventType: event.type,
                    eventId: event.id,
                });
                // Return 500 to trigger Stripe retry
                res.status(500).json({
                    error: 'Webhook processing failed',
                    eventId: event.id,
                });
                return;
            }
            // Return a 200 response to acknowledge receipt of the event
            res.json({ received: true, eventId: event.id });
        }));
    }
}
exports.paymentWebhookController = new PaymentWebhookController();
exports.handleWebhook = exports.paymentWebhookController.handleWebhook;
//# sourceMappingURL=paymentWebhook.controller.js.map