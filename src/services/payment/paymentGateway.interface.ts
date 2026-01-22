/**
 * Payment Gateway Interface
 * 
 * This interface defines the contract for payment gateway implementations.
 * It supports future integration with Stripe or other payment providers
 * while maintaining consistency across the payment system.
 */

export interface PaymentGatewayInterface {
    /**
     * Initialize the payment gateway with configuration
     */
    initialize(config: PaymentGatewayConfig): Promise<void>;

    /**
     * Create a payment intent for processing
     */
    createPaymentIntent(request: CreatePaymentIntentRequest): Promise<PaymentIntentResponse>;

    /**
     * Confirm a payment intent
     */
    confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentConfirmationResponse>;

    /**
     * Capture a payment (for authorized payments)
     */
    capturePayment(paymentIntentId: string, amount?: number): Promise<PaymentCaptureResponse>;

    /**
     * Refund a payment
     */
    refundPayment(paymentIntentId: string, amount?: number, reason?: string): Promise<PaymentRefundResponse>;

    /**
     * Get payment status
     */
    getPaymentStatus(paymentIntentId: string): Promise<PaymentStatusResponse>;

    /**
     * Validate payment method
     */
    validatePaymentMethod(paymentMethodId: string): Promise<PaymentMethodValidationResponse>;

    /**
     * Handle webhook events from payment gateway
     */
    handleWebhook(payload: any, signature: string): Promise<WebhookHandleResponse>;

    /**
     * Get gateway-specific metadata
     */
    getGatewayInfo(): PaymentGatewayInfo;
}

export interface PaymentGatewayConfig {
    apiKey: string;
    secretKey: string;
    webhookSecret?: string;
    environment: 'sandbox' | 'production';
    currency: string;
    metadata?: Record<string, any>;
}

export interface CreatePaymentIntentRequest {
    amount: number;
    currency: string;
    paymentMethodTypes: string[];
    description?: string;
    metadata?: Record<string, any>;
    customerId?: string;
    automaticPaymentMethods?: boolean;
}

export interface PaymentIntentResponse {
    success: boolean;
    paymentIntentId: string;
    clientSecret?: string;
    status: PaymentIntentStatus;
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
    error?: PaymentGatewayError;
}

export interface PaymentConfirmationResponse {
    success: boolean;
    paymentIntentId: string;
    status: PaymentIntentStatus;
    chargeId?: string;
    receiptUrl?: string;
    error?: PaymentGatewayError;
}

export interface PaymentCaptureResponse {
    success: boolean;
    paymentIntentId: string;
    chargeId: string;
    capturedAmount: number;
    currency: string;
    error?: PaymentGatewayError;
}

export interface PaymentRefundResponse {
    success: boolean;
    refundId: string;
    paymentIntentId: string;
    refundedAmount: number;
    currency: string;
    status: RefundStatus;
    reason?: string;
    error?: PaymentGatewayError;
}

export interface PaymentStatusResponse {
    success: boolean;
    paymentIntentId: string;
    status: PaymentIntentStatus;
    amount: number;
    currency: string;
    chargeId?: string;
    refunds?: RefundInfo[];
    error?: PaymentGatewayError;
}

export interface PaymentMethodValidationResponse {
    success: boolean;
    paymentMethodId: string;
    isValid: boolean;
    type: string;
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    error?: PaymentGatewayError;
}

export interface WebhookHandleResponse {
    success: boolean;
    eventType: string;
    paymentIntentId?: string;
    processed: boolean;
    error?: PaymentGatewayError;
}

export interface PaymentGatewayInfo {
    name: string;
    version: string;
    supportedCurrencies: string[];
    supportedPaymentMethods: string[];
    features: PaymentGatewayFeatures;
}

export interface PaymentGatewayFeatures {
    supportsRefunds: boolean;
    supportsPartialRefunds: boolean;
    supportsCapture: boolean;
    supportsWebhooks: boolean;
    supportsRecurring: boolean;
    supportsMultiCurrency: boolean;
}

export interface PaymentGatewayError {
    code: string;
    message: string;
    type: 'validation_error' | 'card_error' | 'api_error' | 'authentication_error' | 'rate_limit_error';
    param?: string;
    declineCode?: string;
}

export interface RefundInfo {
    id: string;
    amount: number;
    currency: string;
    status: RefundStatus;
    reason?: string;
    createdAt: Date;
}

export type PaymentIntentStatus =
    | 'requires_payment_method'
    | 'requires_confirmation'
    | 'requires_action'
    | 'processing'
    | 'requires_capture'
    | 'canceled'
    | 'succeeded';

export type RefundStatus =
    | 'pending'
    | 'succeeded'
    | 'failed'
    | 'canceled';

/**
 * Payment Gateway Factory
 * 
 * Factory pattern for creating payment gateway instances
 */
export interface PaymentGatewayFactory {
    createGateway(type: PaymentGatewayType, config: PaymentGatewayConfig): PaymentGatewayInterface;
    getSupportedGateways(): PaymentGatewayType[];
}

export type PaymentGatewayType = 'stripe' | 'mock' | 'paypal' | 'square';

/**
 * Payment Gateway Events
 * 
 * Events that can be emitted by payment gateways
 */
export interface PaymentGatewayEvent {
    type: PaymentGatewayEventType;
    paymentIntentId: string;
    timestamp: Date;
    data: any;
    gatewayType: PaymentGatewayType;
}

export type PaymentGatewayEventType =
    | 'payment.succeeded'
    | 'payment.failed'
    | 'payment.canceled'
    | 'payment.refunded'
    | 'payment.captured'
    | 'payment.requires_action';