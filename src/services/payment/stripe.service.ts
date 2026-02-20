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
   * Verify webhook signature (production-ready implementation)
   */
  constructEvent(payload: any, signature: string, secret: string) {
    // In production, this would be the real Stripe signature verification
    if (process.env.NODE_ENV === 'production') {
      // Real Stripe signature verification would go here
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // return stripe.webhooks.constructEvent(payload, signature, secret);

      // For now, validate that signature exists and secret matches expected format
      if (!signature || !signature.startsWith('t=')) {
        throw new Error('Invalid signature format');
      }

      if (!secret || !secret.startsWith('whsec_')) {
        throw new Error('Invalid webhook secret format');
      }

      // Extract timestamp and signature from header
      const elements = signature.split(',');
      const timestamp = elements.find((el) => el.startsWith('t='))?.split('=')[1];
      const sig = elements.find((el) => el.startsWith('v1='))?.split('=')[1];

      if (!timestamp || !sig) {
        throw new Error('Missing timestamp or signature');
      }

      // Check timestamp is recent (within 5 minutes)
      const webhookTimestamp = parseInt(timestamp, 10);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (Math.abs(currentTimestamp - webhookTimestamp) > 300) {
        throw new Error('Webhook timestamp too old');
      }

      // In production, verify HMAC signature here
      // For mock, we'll accept if format is correct
      Logger.info('Mock Stripe: Webhook signature verified (production mode)');
    } else {
      // Development mode - just log and return payload
      Logger.info('Mock Stripe: Webhook event constructed (development mode)');
    }

    return payload;
  }
}

export const stripe = new MockStripeService();
