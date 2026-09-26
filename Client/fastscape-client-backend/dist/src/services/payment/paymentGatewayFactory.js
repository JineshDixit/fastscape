"use strict";
/**
 * Payment Gateway Factory
 *
 * Factory for creating and managing payment gateway instances.
 * Supports multiple gateway types and provides centralized configuration.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentGatewayFactory = exports.PaymentGatewayFactoryImpl = void 0;
const mockPaymentGateway_1 = require("./mockPaymentGateway");
const logger_1 = __importDefault(require("../../utils/logger"));
class PaymentGatewayFactoryImpl {
    constructor() {
        this.gateways = new Map();
    }
    static getInstance() {
        if (!PaymentGatewayFactoryImpl.instance) {
            PaymentGatewayFactoryImpl.instance = new PaymentGatewayFactoryImpl();
        }
        return PaymentGatewayFactoryImpl.instance;
    }
    createGateway(type, config) {
        // Check if gateway already exists and is configured
        const existingGateway = this.gateways.get(type);
        if (existingGateway) {
            logger_1.default.info('Reusing existing payment gateway', { type });
            return existingGateway;
        }
        let gateway;
        switch (type) {
            case 'mock':
                gateway = new mockPaymentGateway_1.MockPaymentGateway();
                break;
            case 'stripe':
                // Future Stripe implementation
                throw new Error('Stripe gateway not yet implemented. Use mock gateway for testing.');
            case 'paypal':
                // Future PayPal implementation
                throw new Error('PayPal gateway not yet implemented. Use mock gateway for testing.');
            case 'square':
                // Future Square implementation
                throw new Error('Square gateway not yet implemented. Use mock gateway for testing.');
            default:
                throw new Error(`Unsupported payment gateway type: ${type}`);
        }
        // Initialize the gateway
        gateway.initialize(config).catch(error => {
            logger_1.default.error('Failed to initialize payment gateway', { type, error: error.message });
            throw error;
        });
        // Cache the gateway instance
        this.gateways.set(type, gateway);
        logger_1.default.info('Payment gateway created and initialized', {
            type,
            environment: config.environment,
            currency: config.currency
        });
        return gateway;
    }
    getSupportedGateways() {
        return ['mock', 'stripe', 'paypal', 'square'];
    }
    /**
     * Get an existing gateway instance
     */
    getGateway(type) {
        return this.gateways.get(type) || null;
    }
    /**
     * Remove a gateway instance (useful for testing or reconfiguration)
     */
    removeGateway(type) {
        return this.gateways.delete(type);
    }
    /**
     * Clear all gateway instances
     */
    clearGateways() {
        this.gateways.clear();
        logger_1.default.info('All payment gateways cleared');
    }
    /**
     * Get gateway configuration from environment variables
     */
    static getGatewayConfigFromEnv(type) {
        const environment = (process.env.NODE_ENV === 'production') ? 'production' : 'sandbox';
        const currency = process.env.DEFAULT_CURRENCY || 'USD';
        switch (type) {
            case 'mock':
                return {
                    apiKey: 'mock_api_key',
                    secretKey: 'mock_secret_key',
                    webhookSecret: 'mock_webhook_secret',
                    environment,
                    currency,
                    metadata: {
                        mockMode: true,
                        testingEnabled: true,
                    },
                };
            case 'stripe':
                return {
                    apiKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
                    secretKey: process.env.STRIPE_SECRET_KEY || '',
                    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
                    environment,
                    currency,
                    metadata: {
                        webhookEndpoint: process.env.STRIPE_WEBHOOK_ENDPOINT || '/webhooks/stripe',
                    },
                };
            case 'paypal':
                return {
                    apiKey: process.env.PAYPAL_CLIENT_ID || '',
                    secretKey: process.env.PAYPAL_CLIENT_SECRET || '',
                    webhookSecret: process.env.PAYPAL_WEBHOOK_SECRET || '',
                    environment,
                    currency,
                    metadata: {
                        webhookEndpoint: process.env.PAYPAL_WEBHOOK_ENDPOINT || '/webhooks/paypal',
                    },
                };
            case 'square':
                return {
                    apiKey: process.env.SQUARE_APPLICATION_ID || '',
                    secretKey: process.env.SQUARE_ACCESS_TOKEN || '',
                    webhookSecret: process.env.SQUARE_WEBHOOK_SECRET || '',
                    environment,
                    currency,
                    metadata: {
                        locationId: process.env.SQUARE_LOCATION_ID || '',
                        webhookEndpoint: process.env.SQUARE_WEBHOOK_ENDPOINT || '/webhooks/square',
                    },
                };
            default:
                throw new Error(`No environment configuration available for gateway type: ${type}`);
        }
    }
}
exports.PaymentGatewayFactoryImpl = PaymentGatewayFactoryImpl;
// Export singleton instance
exports.paymentGatewayFactory = PaymentGatewayFactoryImpl.getInstance();
//# sourceMappingURL=paymentGatewayFactory.js.map