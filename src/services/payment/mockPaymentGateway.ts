/**
 * Mock Payment Gateway Implementation
 * 
 * This implementation simulates payment processing for testing purposes.
 * It provides realistic responses and behavior without actual payment processing.
 */

import {
    PaymentGatewayInterface,
    PaymentGatewayConfig,
    CreatePaymentIntentRequest,
    PaymentIntentResponse,
    PaymentConfirmationResponse,
    PaymentCaptureResponse,
    PaymentRefundResponse,
    PaymentStatusResponse,
    PaymentMethodValidationResponse,
    WebhookHandleResponse,
    PaymentGatewayInfo,
    PaymentIntentStatus,
    RefundStatus,
    PaymentGatewayError,
} from './paymentGateway.interface';
import { randomUUID } from 'crypto';
import Logger from '../../utils/logger';

export class MockPaymentGateway implements PaymentGatewayInterface {
    private config: PaymentGatewayConfig | null = null;
    private paymentIntents: Map<string, MockPaymentIntent> = new Map();
    private refunds: Map<string, MockRefund> = new Map();

    async initialize(config: PaymentGatewayConfig): Promise<void> {
        this.config = config;
        Logger.info('Mock Payment Gateway initialized', {
            environment: config.environment,
            currency: config.currency,
        });
    }

    async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntentResponse> {
        if (!this.config) {
            throw new Error('Payment gateway not initialized');
        }

        const paymentIntentId = `pi_mock_${randomUUID().replace(/-/g, '')}`;
        const clientSecret = `${paymentIntentId}_secret_${randomUUID().substring(0, 8)}`;

        // Simulate validation errors for specific amounts
        if (request.amount <= 0) {
            return {
                success: false,
                paymentIntentId: '',
                status: 'requires_payment_method',
                amount: request.amount,
                currency: request.currency,
                error: {
                    code: 'amount_too_small',
                    message: 'Amount must be greater than 0',
                    type: 'validation_error',
                },
            };
        }

        // Create mock payment intent
        const mockIntent: MockPaymentIntent = {
            id: paymentIntentId,
            amount: request.amount,
            currency: request.currency,
            status: 'requires_confirmation',
            clientSecret,
            description: request.description,
            metadata: request.metadata || {},
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.paymentIntents.set(paymentIntentId, mockIntent);

        Logger.info('Mock payment intent created', {
            paymentIntentId,
            amount: request.amount,
            currency: request.currency,
        });

        return {
            success: true,
            paymentIntentId,
            clientSecret,
            status: 'requires_confirmation',
            amount: request.amount,
            currency: request.currency,
            metadata: request.metadata,
        };
    }

    async confirmPaymentIntent(
        paymentIntentId: string,
        paymentMethodId?: string
    ): Promise<PaymentConfirmationResponse> {
        const intent = this.paymentIntents.get(paymentIntentId);

        if (!intent) {
            return {
                success: false,
                paymentIntentId,
                status: 'requires_payment_method',
                error: {
                    code: 'payment_intent_not_found',
                    message: 'Payment intent not found',
                    type: 'api_error',
                },
            };
        }

        // Simulate different scenarios based on payment method ID
        if (paymentMethodId === 'pm_card_declined') {
            intent.status = 'requires_payment_method';
            intent.updatedAt = new Date();

            Logger.warn('Mock payment declined', { paymentIntentId, paymentMethodId });

            return {
                success: false,
                paymentIntentId,
                status: 'requires_payment_method',
                error: {
                    code: 'card_declined',
                    message: 'Your card was declined',
                    type: 'card_error',
                    declineCode: 'generic_decline',
                },
            };
        }

        if (paymentMethodId === 'pm_card_requires_action') {
            intent.status = 'requires_action';
            intent.updatedAt = new Date();

            Logger.info('Mock payment requires action', { paymentIntentId, paymentMethodId });

            return {
                success: true,
                paymentIntentId,
                status: 'requires_action',
            };
        }

        // Simulate successful payment
        const chargeId = `ch_mock_${randomUUID().replace(/-/g, '')}`;
        intent.status = 'succeeded';
        intent.chargeId = chargeId;
        intent.receiptUrl = `https://mock-gateway.com/receipts/${chargeId}`;
        intent.updatedAt = new Date();

        Logger.info('Mock payment confirmed successfully', {
            paymentIntentId,
            chargeId,
            amount: intent.amount,
        });

        return {
            success: true,
            paymentIntentId,
            status: 'succeeded',
            chargeId,
            receiptUrl: intent.receiptUrl,
        };
    }

    async capturePayment(paymentIntentId: string, amount?: number): Promise<PaymentCaptureResponse> {
        const intent = this.paymentIntents.get(paymentIntentId);

        if (!intent) {
            return {
                success: false,
                paymentIntentId,
                chargeId: '',
                capturedAmount: 0,
                currency: '',
                error: {
                    code: 'payment_intent_not_found',
                    message: 'Payment intent not found',
                    type: 'api_error',
                },
            };
        }

        if (intent.status !== 'requires_capture') {
            return {
                success: false,
                paymentIntentId,
                chargeId: intent.chargeId || '',
                capturedAmount: 0,
                currency: intent.currency,
                error: {
                    code: 'payment_intent_not_capturable',
                    message: 'Payment intent cannot be captured in current state',
                    type: 'api_error',
                },
            };
        }

        const captureAmount = amount || intent.amount;
        const chargeId = intent.chargeId || `ch_mock_${randomUUID().replace(/-/g, '')}`;

        intent.status = 'succeeded';
        intent.chargeId = chargeId;
        intent.capturedAmount = captureAmount;
        intent.updatedAt = new Date();

        Logger.info('Mock payment captured', {
            paymentIntentId,
            chargeId,
            captureAmount,
        });

        return {
            success: true,
            paymentIntentId,
            chargeId,
            capturedAmount: captureAmount,
            currency: intent.currency,
        };
    }

    async refundPayment(
        paymentIntentId: string,
        amount?: number,
        reason?: string
    ): Promise<PaymentRefundResponse> {
        const intent = this.paymentIntents.get(paymentIntentId);

        if (!intent) {
            return {
                success: false,
                refundId: '',
                paymentIntentId,
                refundedAmount: 0,
                currency: '',
                status: 'failed',
                error: {
                    code: 'payment_intent_not_found',
                    message: 'Payment intent not found',
                    type: 'api_error',
                },
            };
        }

        if (intent.status !== 'succeeded') {
            return {
                success: false,
                refundId: '',
                paymentIntentId,
                refundedAmount: 0,
                currency: intent.currency,
                status: 'failed',
                error: {
                    code: 'payment_not_refundable',
                    message: 'Payment cannot be refunded in current state',
                    type: 'api_error',
                },
            };
        }

        const refundAmount = amount || intent.amount;
        const refundId = `re_mock_${randomUUID().replace(/-/g, '')}`;

        const mockRefund: MockRefund = {
            id: refundId,
            paymentIntentId,
            amount: refundAmount,
            currency: intent.currency,
            status: 'succeeded',
            reason: reason || 'requested_by_customer',
            createdAt: new Date(),
        };

        this.refunds.set(refundId, mockRefund);

        Logger.info('Mock refund processed', {
            refundId,
            paymentIntentId,
            refundAmount,
            reason,
        });

        return {
            success: true,
            refundId,
            paymentIntentId,
            refundedAmount: refundAmount,
            currency: intent.currency,
            status: 'succeeded',
            reason,
        };
    }

    async getPaymentStatus(paymentIntentId: string): Promise<PaymentStatusResponse> {
        const intent = this.paymentIntents.get(paymentIntentId);

        if (!intent) {
            return {
                success: false,
                paymentIntentId,
                status: 'requires_payment_method',
                amount: 0,
                currency: '',
                error: {
                    code: 'payment_intent_not_found',
                    message: 'Payment intent not found',
                    type: 'api_error',
                },
            };
        }

        // Get refunds for this payment intent
        const refunds = Array.from(this.refunds.values())
            .filter(refund => refund.paymentIntentId === paymentIntentId)
            .map(refund => ({
                id: refund.id,
                amount: refund.amount,
                currency: refund.currency,
                status: refund.status,
                reason: refund.reason,
                createdAt: refund.createdAt,
            }));

        return {
            success: true,
            paymentIntentId,
            status: intent.status,
            amount: intent.amount,
            currency: intent.currency,
            chargeId: intent.chargeId,
            refunds,
        };
    }

    async validatePaymentMethod(paymentMethodId: string): Promise<PaymentMethodValidationResponse> {
        // Simulate validation based on payment method ID patterns
        if (paymentMethodId.startsWith('pm_card_')) {
            const isValid = !paymentMethodId.includes('invalid');

            return {
                success: true,
                paymentMethodId,
                isValid,
                type: 'card',
                last4: isValid ? '4242' : undefined,
                expiryMonth: isValid ? 12 : undefined,
                expiryYear: isValid ? 2025 : undefined,
                error: isValid ? undefined : {
                    code: 'invalid_payment_method',
                    message: 'Payment method is invalid',
                    type: 'validation_error',
                },
            };
        }

        return {
            success: false,
            paymentMethodId,
            isValid: false,
            type: 'unknown',
            error: {
                code: 'payment_method_not_found',
                message: 'Payment method not found',
                type: 'api_error',
            },
        };
    }

    async handleWebhook(payload: any, signature: string): Promise<WebhookHandleResponse> {
        // Simulate webhook signature validation
        if (!signature || signature === 'invalid_signature') {
            return {
                success: false,
                eventType: 'unknown',
                processed: false,
                error: {
                    code: 'invalid_signature',
                    message: 'Webhook signature is invalid',
                    type: 'authentication_error',
                },
            };
        }

        const eventType = payload.type || 'payment.succeeded';
        const paymentIntentId = payload.data?.object?.id;

        Logger.info('Mock webhook received', {
            eventType,
            paymentIntentId,
            signature: signature.substring(0, 10) + '...',
        });

        return {
            success: true,
            eventType,
            paymentIntentId,
            processed: true,
        };
    }

    getGatewayInfo(): PaymentGatewayInfo {
        return {
            name: 'Mock Payment Gateway',
            version: '1.0.0',
            supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
            supportedPaymentMethods: ['card', 'bank_transfer', 'digital_wallet'],
            features: {
                supportsRefunds: true,
                supportsPartialRefunds: true,
                supportsCapture: true,
                supportsWebhooks: true,
                supportsRecurring: false,
                supportsMultiCurrency: true,
            },
        };
    }
}

interface MockPaymentIntent {
    id: string;
    amount: number;
    currency: string;
    status: PaymentIntentStatus;
    clientSecret: string;
    description?: string;
    metadata: Record<string, any>;
    chargeId?: string;
    receiptUrl?: string;
    capturedAmount?: number;
    createdAt: Date;
    updatedAt: Date;
}

interface MockRefund {
    id: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
    status: RefundStatus;
    reason?: string;
    createdAt: Date;
}