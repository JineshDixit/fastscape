/**
 * Gateway Integrated Payment Service
 * 
 * Enhanced payment service that integrates payment gateways with the existing
 * Fastscape payment system. Provides a bridge between the gateway interface
 * and the current payment processing logic.
 */

import {
    calculatePaymentBreakdown,
    processDepositPayment as processDepositPaymentOriginal,
    processBalancePayment as processBalancePaymentOriginal,
    getPaymentSummary,
} from './enhancedPayment.service';
import { paymentGatewayService } from './paymentGatewayService';
import { Payment, BookingFinancial, Booking } from '../../models';
import { createError } from '../middleware/errorHandler';
import Logger from '../../utils/logger';
import { PaymentIntentResponse, PaymentConfirmationResponse } from './paymentGateway.interface';

/**
 * Create payment intent for online payments
 */
export const createPaymentIntentForBooking = async (
    bookingId: string,
    paymentType: 'DEPOSIT' | 'BALANCE' | 'FULL',
    currency: string = 'USD'
): Promise<PaymentIntentResponse> => {
    try {
        // Calculate payment amount based on type
        const calculation = await calculatePaymentBreakdown(bookingId);
        let amount: number;
        let description: string;

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
                throw createError('Invalid payment type', 400);
        }

        // Create payment intent through gateway service
        const response = await paymentGatewayService.createPaymentIntent(
            bookingId,
            amount,
            currency,
            description
        );

        Logger.info('Payment intent created for booking', {
            bookingId,
            paymentType,
            amount,
            currency,
            paymentIntentId: response.paymentIntentId,
            success: response.success,
        });

        return response;
    } catch (error) {
        Logger.error('Failed to create payment intent for booking', {
            bookingId,
            paymentType,
            error: (error as Error).message,
        });
        throw error;
    }
};

/**
 * Process online deposit payment with gateway integration
 */
export const processOnlineDepositPayment = async (
    bookingId: string,
    paymentIntentId: string,
    paymentMethodId?: string
): Promise<{ payment: Payment; financial: BookingFinancial; confirmation: PaymentConfirmationResponse }> => {
    try {
        // Confirm payment through gateway
        const confirmation = await paymentGatewayService.confirmPaymentIntent(paymentIntentId, paymentMethodId);

        if (!confirmation.success) {
            Logger.error('Payment confirmation failed', {
                bookingId,
                paymentIntentId,
                error: confirmation.error,
            });
            throw createError(confirmation.error?.message || 'Payment confirmation failed', 400);
        }

        // Process deposit payment in the system
        const result = await processDepositPaymentOriginal(
            bookingId,
            'ONLINE',
            paymentIntentId
        );

        // Update payment record with gateway information
        if (confirmation.chargeId) {
            await result.payment.update({
                metadata: {
                    ...result.payment.metadata,
                    chargeId: confirmation.chargeId,
                    receiptUrl: confirmation.receiptUrl,
                    gatewayType: paymentGatewayService.getGatewayInfo()?.currentType,
                },
            });
        }

        Logger.info('Online deposit payment processed successfully', {
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
    } catch (error) {
        Logger.error('Failed to process online deposit payment', {
            bookingId,
            paymentIntentId,
            error: (error as Error).message,
        });
        throw error;
    }
};

/**
 * Process online balance payment with gateway integration
 */
export const processOnlineBalancePayment = async (
    bookingId: string,
    paymentIntentId: string,
    paymentMethodId?: string
): Promise<{ payment: Payment; financial: BookingFinancial; confirmation: PaymentConfirmationResponse }> => {
    try {
        // Confirm payment through gateway
        const confirmation = await paymentGatewayService.confirmPaymentIntent(paymentIntentId, paymentMethodId);

        if (!confirmation.success) {
            Logger.error('Balance payment confirmation failed', {
                bookingId,
                paymentIntentId,
                error: confirmation.error,
            });
            throw createError(confirmation.error?.message || 'Payment confirmation failed', 400);
        }

        // Process balance payment in the system
        const result = await processBalancePaymentOriginal(
            bookingId,
            'ONLINE',
            paymentIntentId
        );

        // Update payment record with gateway information
        if (confirmation.chargeId) {
            await result.payment.update({
                metadata: {
                    ...result.payment.metadata,
                    chargeId: confirmation.chargeId,
                    receiptUrl: confirmation.receiptUrl,
                    gatewayType: paymentGatewayService.getGatewayInfo()?.currentType,
                },
            });
        }

        Logger.info('Online balance payment processed successfully', {
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
    } catch (error) {
        Logger.error('Failed to process online balance payment', {
            bookingId,
            paymentIntentId,
            error: (error as Error).message,
        });
        throw error;
    }
};

/**
 * Process full payment (deposit + balance) with gateway integration
 */
export const processOnlineFullPayment = async (
    bookingId: string,
    paymentIntentId: string,
    paymentMethodId?: string
): Promise<{ payments: Payment[]; financial: BookingFinancial; confirmation: PaymentConfirmationResponse }> => {
    try {
        // Confirm payment through gateway
        const confirmation = await paymentGatewayService.confirmPaymentIntent(paymentIntentId, paymentMethodId);

        if (!confirmation.success) {
            Logger.error('Full payment confirmation failed', {
                bookingId,
                paymentIntentId,
                error: confirmation.error,
            });
            throw createError(confirmation.error?.message || 'Payment confirmation failed', 400);
        }

        // Get payment calculation
        const calculation = await calculatePaymentBreakdown(bookingId);

        // Process deposit payment first
        const depositResult = await processDepositPaymentOriginal(
            bookingId,
            'ONLINE',
            paymentIntentId
        );

        // Process balance payment
        const balanceResult = await processBalancePaymentOriginal(
            bookingId,
            'ONLINE',
            paymentIntentId
        );

        // Update both payment records with gateway information
        const gatewayMetadata = {
            chargeId: confirmation.chargeId,
            receiptUrl: confirmation.receiptUrl,
            gatewayType: paymentGatewayService.getGatewayInfo()?.currentType,
            fullPaymentIntent: paymentIntentId,
        };

        await depositResult.payment.update({
            metadata: { ...depositResult.payment.metadata, ...gatewayMetadata },
        });

        await balanceResult.payment.update({
            metadata: { ...balanceResult.payment.metadata, ...gatewayMetadata },
        });

        Logger.info('Online full payment processed successfully', {
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
    } catch (error) {
        Logger.error('Failed to process online full payment', {
            bookingId,
            paymentIntentId,
            error: (error as Error).message,
        });
        throw error;
    }
};

/**
 * Process refund through payment gateway
 */
export const processPaymentRefund = async (
    paymentId: string,
    amount?: number,
    reason?: string
): Promise<{ success: boolean; refundId?: string; error?: string }> => {
    try {
        const payment = await Payment.findByPk(paymentId);
        if (!payment) {
            throw createError('Payment not found', 404);
        }

        if (!payment.stripePaymentIntentId) {
            throw createError('Payment was not processed through gateway, cannot refund online', 400);
        }

        // Process refund through gateway
        const refundResponse = await paymentGatewayService.processRefund(
            payment.stripePaymentIntentId,
            amount,
            reason
        );

        if (refundResponse.success) {
            // Update payment record with refund information
            await payment.update({
                paymentStatus: 'REFUNDED',
                metadata: {
                    ...payment.metadata,
                    refundId: refundResponse.refundId,
                    refundedAmount: refundResponse.refundedAmount,
                    refundReason: reason,
                    refundedAt: new Date(),
                },
            });

            Logger.info('Payment refund processed successfully', {
                paymentId,
                refundId: refundResponse.refundId,
                refundedAmount: refundResponse.refundedAmount,
                reason,
            });

            return {
                success: true,
                refundId: refundResponse.refundId,
            };
        } else {
            Logger.error('Payment refund failed', {
                paymentId,
                error: refundResponse.error,
            });

            return {
                success: false,
                error: refundResponse.error?.message || 'Refund processing failed',
            };
        }
    } catch (error) {
        Logger.error('Failed to process payment refund', {
            paymentId,
            error: (error as Error).message,
        });

        return {
            success: false,
            error: (error as Error).message,
        };
    }
};

/**
 * Get enhanced payment summary with gateway information
 */
export const getEnhancedPaymentSummary = async (bookingId: string) => {
    try {
        const summary = await getPaymentSummary(bookingId);

        // Add gateway information to payments
        const enhancedPayments = summary.payments.map((payment: any) => ({
            ...payment,
            gatewayInfo: payment.metadata?.gatewayType ? {
                gatewayType: payment.metadata.gatewayType,
                chargeId: payment.metadata.chargeId,
                receiptUrl: payment.metadata.receiptUrl,
            } : null,
        }));

        return {
            ...summary,
            payments: enhancedPayments,
            gatewayInfo: paymentGatewayService.getGatewayInfo(),
        };
    } catch (error) {
        Logger.error('Failed to get enhanced payment summary', {
            bookingId,
            error: (error as Error).message,
        });
        throw error;
    }
};

/**
 * Handle payment gateway webhook events
 */
export const handlePaymentWebhook = async (payload: any, signature: string): Promise<void> => {
    try {
        await paymentGatewayService.handleWebhook(payload, signature);

        // Additional webhook processing logic can be added here
        // For example, updating payment statuses, sending notifications, etc.

        Logger.info('Payment webhook processed successfully');
    } catch (error) {
        Logger.error('Failed to handle payment webhook', {
            error: (error as Error).message,
        });
        throw error;
    }
};