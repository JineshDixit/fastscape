/**
 * Payment Gateway Service
 * 
 * Service layer that integrates payment gateways with the existing payment system.
 * Provides logging, error handling, and abstraction over different gateway implementations.
 */

import {
    PaymentGatewayInterface,
    PaymentGatewayType,
    CreatePaymentIntentRequest,
    PaymentIntentResponse,
    PaymentConfirmationResponse,
    PaymentRefundResponse,
    PaymentGatewayEvent,
    PaymentGatewayEventType,
} from './paymentGateway.interface';
import { paymentGatewayFactory, PaymentGatewayFactoryImpl } from './paymentGatewayFactory';
import { Payment, BookingFinancial } from '../../models';
import { createError } from '../middleware/errorHandler';
import Logger from '../../utils/logger';
import { EventEmitter } from 'events';

export class PaymentGatewayService extends EventEmitter {
    private static instance: PaymentGatewayService;
    private currentGateway: PaymentGatewayInterface | null = null;
    private currentGatewayType: PaymentGatewayType | null = null;

    private constructor() {
        super();
        this.initializeDefaultGateway();
    }

    static getInstance(): PaymentGatewayService {
        if (!PaymentGatewayService.instance) {
            PaymentGatewayService.instance = new PaymentGatewayService();
        }
        return PaymentGatewayService.instance;
    }

    /**
     * Initialize the default payment gateway
     */
    private async initializeDefaultGateway(): Promise<void> {
        try {
            // Use mock gateway by default, can be overridden via environment
            const gatewayType: PaymentGatewayType = (process.env.PAYMENT_GATEWAY_TYPE as PaymentGatewayType) || 'mock';
            const config = PaymentGatewayFactoryImpl.getGatewayConfigFromEnv(gatewayType);

            this.currentGateway = paymentGatewayFactory.createGateway(gatewayType, config);
            this.currentGatewayType = gatewayType;

            Logger.info('Payment gateway service initialized', {
                gatewayType,
                environment: config.environment
            });
        } catch (error) {
            Logger.error('Failed to initialize payment gateway service', { error: (error as Error).message });
            throw error;
        }
    }

    /**
     * Switch to a different payment gateway
     */
    async switchGateway(gatewayType: PaymentGatewayType): Promise<void> {
        try {
            const config = PaymentGatewayFactoryImpl.getGatewayConfigFromEnv(gatewayType);
            this.currentGateway = paymentGatewayFactory.createGateway(gatewayType, config);
            this.currentGatewayType = gatewayType;

            Logger.info('Switched to payment gateway', { gatewayType });
        } catch (error) {
            Logger.error('Failed to switch payment gateway', {
                gatewayType,
                error: (error as Error).message
            });
            throw error;
        }
    }

    /**
     * Create a payment intent for a booking
     */
    async createPaymentIntent(
        bookingId: string,
        amount: number,
        currency: string,
        description?: string
    ): Promise<PaymentIntentResponse> {
        if (!this.currentGateway) {
            throw createError('Payment gateway not initialized', 500);
        }

        const request: CreatePaymentIntentRequest = {
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
            const response = await this.currentGateway.createPaymentIntent(request);

            // Log payment intent creation
            await this.logPaymentActivity({
                bookingId,
                action: 'payment_intent_created',
                gatewayType: this.currentGatewayType!,
                paymentIntentId: response.paymentIntentId,
                amount,
                currency,
                success: response.success,
                error: response.error?.message,
            });

            if (response.success) {
                Logger.info('Payment intent created successfully', {
                    bookingId,
                    paymentIntentId: response.paymentIntentId,
                    amount,
                    currency,
                    gatewayType: this.currentGatewayType,
                });
            } else {
                Logger.error('Payment intent creation failed', {
                    bookingId,
                    amount,
                    currency,
                    error: response.error,
                    gatewayType: this.currentGatewayType,
                });
            }

            return response;
        } catch (error) {
            Logger.error('Payment intent creation error', {
                bookingId,
                amount,
                currency,
                error: (error as Error).message,
                gatewayType: this.currentGatewayType,
            });

            await this.logPaymentActivity({
                bookingId,
                action: 'payment_intent_creation_error',
                gatewayType: this.currentGatewayType!,
                amount,
                currency,
                success: false,
                error: (error as Error).message,
            });

            throw error;
        }
    }

    /**
     * Confirm a payment intent
     */
    async confirmPaymentIntent(
        paymentIntentId: string,
        paymentMethodId?: string
    ): Promise<PaymentConfirmationResponse> {
        if (!this.currentGateway) {
            throw createError('Payment gateway not initialized', 500);
        }

        try {
            const response = await this.currentGateway.confirmPaymentIntent(paymentIntentId, paymentMethodId);

            // Extract booking ID from payment intent metadata if available
            const statusResponse = await this.currentGateway.getPaymentStatus(paymentIntentId);
            const bookingId = statusResponse.success ? 'unknown' : 'unknown'; // Would be extracted from metadata in real implementation

            // Log payment confirmation
            await this.logPaymentActivity({
                bookingId,
                action: 'payment_confirmed',
                gatewayType: this.currentGatewayType!,
                paymentIntentId,
                paymentMethodId,
                success: response.success,
                error: response.error?.message,
            });

            if (response.success) {
                Logger.info('Payment confirmed successfully', {
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
            } else {
                Logger.error('Payment confirmation failed', {
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
        } catch (error) {
            Logger.error('Payment confirmation error', {
                paymentIntentId,
                error: (error as Error).message,
                gatewayType: this.currentGatewayType,
            });

            await this.logPaymentActivity({
                bookingId: 'unknown',
                action: 'payment_confirmation_error',
                gatewayType: this.currentGatewayType!,
                paymentIntentId,
                success: false,
                error: (error as Error).message,
            });

            throw error;
        }
    }

    /**
     * Process a refund
     */
    async processRefund(
        paymentIntentId: string,
        amount?: number,
        reason?: string
    ): Promise<PaymentRefundResponse> {
        if (!this.currentGateway) {
            throw createError('Payment gateway not initialized', 500);
        }

        try {
            const refundAmount = amount ? Math.round(amount * 100) : undefined; // Convert to cents
            const response = await this.currentGateway.refundPayment(paymentIntentId, refundAmount, reason);

            // Log refund processing
            await this.logPaymentActivity({
                bookingId: 'unknown', // Would be extracted from payment intent metadata
                action: 'refund_processed',
                gatewayType: this.currentGatewayType!,
                paymentIntentId,
                refundId: response.refundId,
                amount: response.refundedAmount / 100, // Convert back from cents
                success: response.success,
                error: response.error?.message,
                metadata: { reason },
            });

            if (response.success) {
                Logger.info('Refund processed successfully', {
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
            } else {
                Logger.error('Refund processing failed', {
                    paymentIntentId,
                    error: response.error,
                    gatewayType: this.currentGatewayType,
                });
            }

            return response;
        } catch (error) {
            Logger.error('Refund processing error', {
                paymentIntentId,
                error: (error as Error).message,
                gatewayType: this.currentGatewayType,
            });

            await this.logPaymentActivity({
                bookingId: 'unknown',
                action: 'refund_processing_error',
                gatewayType: this.currentGatewayType!,
                paymentIntentId,
                success: false,
                error: (error as Error).message,
            });

            throw error;
        }
    }

    /**
     * Handle webhook events from payment gateway
     */
    async handleWebhook(payload: any, signature: string): Promise<void> {
        if (!this.currentGateway) {
            throw createError('Payment gateway not initialized', 500);
        }

        try {
            const response = await this.currentGateway.handleWebhook(payload, signature);

            if (response.success) {
                Logger.info('Webhook processed successfully', {
                    eventType: response.eventType,
                    paymentIntentId: response.paymentIntentId,
                    gatewayType: this.currentGatewayType,
                });

                // Emit webhook event
                if (response.paymentIntentId) {
                    this.emitPaymentEvent(response.eventType as PaymentGatewayEventType, response.paymentIntentId, payload);
                }
            } else {
                Logger.error('Webhook processing failed', {
                    error: response.error,
                    gatewayType: this.currentGatewayType,
                });
            }
        } catch (error) {
            Logger.error('Webhook handling error', {
                error: (error as Error).message,
                gatewayType: this.currentGatewayType,
            });
            throw error;
        }
    }

    /**
     * Get current gateway information
     */
    getGatewayInfo() {
        if (!this.currentGateway) {
            return null;
        }
        return {
            ...this.currentGateway.getGatewayInfo(),
            currentType: this.currentGatewayType,
        };
    }

    /**
     * Log payment activity for audit and debugging
     */
    private async logPaymentActivity(activity: PaymentActivity): Promise<void> {
        try {
            // In a real implementation, this would save to a payment_logs table
            Logger.info('Payment activity logged', activity);

            // For now, we'll just log to the application logger
            // Future implementation could save to database for audit trail
        } catch (error) {
            Logger.error('Failed to log payment activity', {
                error: (error as Error).message,
                activity
            });
        }
    }

    /**
     * Emit payment gateway events
     */
    private emitPaymentEvent(
        eventType: PaymentGatewayEventType,
        paymentIntentId: string,
        data: any
    ): void {
        const event: PaymentGatewayEvent = {
            type: eventType,
            paymentIntentId,
            timestamp: new Date(),
            data,
            gatewayType: this.currentGatewayType!,
        };

        this.emit('paymentEvent', event);
        Logger.info('Payment event emitted', { eventType, paymentIntentId });
    }
}

interface PaymentActivity {
    bookingId: string;
    action: string;
    gatewayType: PaymentGatewayType;
    paymentIntentId?: string;
    paymentMethodId?: string;
    refundId?: string;
    amount?: number;
    currency?: string;
    success: boolean;
    error?: string;
    metadata?: Record<string, any>;
    timestamp?: Date;
}

// Export singleton instance
export const paymentGatewayService = PaymentGatewayService.getInstance();