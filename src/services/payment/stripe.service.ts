import Logger from '../../utils/logger';
import crypto from 'crypto';

export interface StripePaymentIntent {
  id: string;
  amount: number;
  amount_received: number;
  currency: string;
  status:
    | 'requires_payment_method'
    | 'requires_confirmation'
    | 'requires_action'
    | 'processing'
    | 'requires_capture'
    | 'canceled'
    | 'succeeded';
  client_secret: string;
  latest_charge?: string;
  metadata: Record<string, any>;
}

class MockStripeService {
  private intents = new Map<string, StripePaymentIntent>();

  /**
   * Simulate creating a PaymentIntent
   */
  async createPaymentIntent(data: {
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
  }): Promise<StripePaymentIntent> {
    const id = `pi_mock_${crypto.randomBytes(12).toString('hex')}`;
    const client_secret = `${id}_secret_${crypto.randomBytes(12).toString('hex')}`;

    const intent: StripePaymentIntent = {
      id,
      amount: data.amount,
      amount_received: 0, // Not received yet
      currency: data.currency,
      status: 'requires_payment_method',
      client_secret: client_secret,
      metadata: data.metadata || {},
    };

    this.intents.set(id, intent);
    Logger.info('Mock Stripe: PaymentIntent created', { intentId: id, amount: data.amount });
    return intent;
  }

  /**
   * Simulate retrieving a PaymentIntent or final success state
   */
  async retrievePaymentIntent(id: string): Promise<StripePaymentIntent> {
    const intent = this.intents.get(id);
    if (intent) {
      // Simulate success if retrieved
      return {
        ...intent,
        status: 'succeeded',
        amount_received: intent.amount,
        latest_charge: `ch_mock_${crypto.randomBytes(12).toString('hex')}`,
      };
    }

    // Return a dummy succeeded state for unknown IDs to avoid breaking existing code
    return {
      id,
      amount: 1000,
      amount_received: 1000,
      currency: 'usd',
      status: 'succeeded',
      client_secret: `${id}_secret_dummy`,
      latest_charge: `ch_mock_${crypto.randomBytes(12).toString('hex')}`,
      metadata: {},
    };
  }

  /**
   * Create a mock success event for a payment intent
   */
  createSuccessEvent(intent: StripePaymentIntent) {
    return {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          ...intent,
          status: 'succeeded',
          amount_received: intent.amount,
          latest_charge: `ch_mock_${crypto.randomBytes(12).toString('hex')}`,
        },
      },
    };
  }

  /**
   * Simulate a webhook event structure
   */
  constructEvent(payload: any, signature: string, secret: string) {
    // In a real application, this would verify the Stripe signature.
    // Here we just return the payload as-is.
    Logger.info('Mock Stripe: Webhook event constructed');
    return payload;
  }
}

export const stripe = new MockStripeService();
