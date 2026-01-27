import { Request, Response } from 'express';
import { stripe } from '../../services/payment/stripe.service';
import * as paymentService from '../../services/payment/payment.service';
import { ExternalStripeData } from '../../services/payment/payment.service';
import Logger from '../../utils/logger';
import { BaseController } from '../../utils/controller.utils';

class PaymentWebhookController extends BaseController {
  /**
   * Handle Stripe webhooks
   */
  handleWebhook = this.asyncHandler(async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock';

    let event;

    try {
      // In a real app, we'd use stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
      event = stripe.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      Logger.error('Webhook signature verification failed', { error: err.message });
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        Logger.info('PaymentIntent was successful!', { id: paymentIntent.id });

        // Synchronize state
        const bookingId = paymentIntent.metadata.bookingId;
        const paymentType = paymentIntent.metadata.paymentType;

        if (bookingId) {
          // Prepare Stripe data for the service
          const stripeData: ExternalStripeData = {
            amountReceived: paymentIntent.amount_received / 100, // Convert cents to units
            currency: paymentIntent.currency,
            paymentIntentId: paymentIntent.id,
            chargeId: paymentIntent.latest_charge, // Use latest_charge if available
            metadata: paymentIntent.metadata,
          };

          if (paymentType === 'DEPOSIT') {
            await paymentService.processDepositPayment(bookingId, 'ONLINE', undefined, stripeData);
          } else if (paymentType === 'BALANCE') {
            await paymentService.processBalancePayment(bookingId, 'ONLINE', undefined, stripeData);
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        Logger.warn('PaymentIntent failed!', { id: failedIntent.id, error: failedIntent.last_payment_error?.message });
        // Handle failure (e.g., notify user, mark payment as failed)
        break;

      default:
        Logger.info(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  });
}

export const paymentWebhookController = new PaymentWebhookController();
export const { handleWebhook } = paymentWebhookController;
