import { Request, Response } from 'express';
import { stripe } from '../../services/payment/stripe.service';
import * as paymentService from '../../services/payment/payment.service';
import { ExternalStripeData } from '../../services/payment/payment.service';
import { sequelize } from '../../models';
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
      // Verify webhook signature
      event = stripe.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      Logger.error('Webhook signature verification failed', { error: err.message });
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Process webhook in transaction to ensure consistency
    const transaction = await sequelize.transaction();

    try {
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

            if (paymentType === 'DEPOSIT' || paymentType === 'FULL') {
              await paymentService.processDepositPayment(bookingId, 'ONLINE', undefined, stripeData, paymentType);
            } else if (paymentType === 'BALANCE') {
              await paymentService.processBalancePayment(bookingId, 'ONLINE', undefined, stripeData);
            } else {
              Logger.warn('Unknown payment type in webhook', { paymentType, bookingId });
            }
          } else {
            Logger.warn('No booking ID in payment intent metadata', { intentId: paymentIntent.id });
          }
          break;

        case 'payment_intent.payment_failed':
          const failedIntent = event.data.object;
          Logger.warn('PaymentIntent failed!', { 
            id: failedIntent.id, 
            error: failedIntent.last_payment_error?.message,
            bookingId: failedIntent.metadata?.bookingId 
          });
          
          // TODO: Handle failure (e.g., notify user, mark payment as failed, release booking)
          // For now, just log the failure
          break;

        case 'payment_intent.canceled':
          const canceledIntent = event.data.object;
          Logger.info('PaymentIntent was canceled', { 
            id: canceledIntent.id,
            bookingId: canceledIntent.metadata?.bookingId 
          });
          
          // TODO: Handle cancellation (e.g., release booking, notify user)
          break;

        default:
          Logger.info(`Unhandled event type ${event.type}`);
      }

      await transaction.commit();
      Logger.info('Webhook processed successfully', { eventType: event.type, eventId: event.id });

    } catch (error) {
      await transaction.rollback();
      Logger.error('Webhook processing failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        eventType: event.type,
        eventId: event.id 
      });
      
      // Return 500 to trigger Stripe retry
      res.status(500).json({ 
        error: 'Webhook processing failed',
        eventId: event.id 
      });
      return;
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true, eventId: event.id });
  });
}

export const paymentWebhookController = new PaymentWebhookController();
export const { handleWebhook } = paymentWebhookController;
