# Payment Gateway System

This document describes the Payment Gateway Interface implementation for the Fastscape booking system.

## Overview

The Payment Gateway System provides a unified interface for processing payments through different payment providers. It currently includes a mock implementation for testing and is designed to easily integrate with real payment gateways like Stripe.

## Architecture

### Core Components

1. **PaymentGatewayInterface** - Defines the contract for all payment gateway implementations
2. **MockPaymentGateway** - Test implementation that simulates payment processing
3. **PaymentGatewayFactory** - Factory for creating gateway instances
4. **PaymentGatewayService** - Service layer that integrates gateways with the booking system
5. **GatewayIntegratedPayment** - Enhanced payment service with gateway integration

### Key Features

- **Gateway Abstraction** - Unified interface for different payment providers
- **Mock Implementation** - Complete test implementation for development
- **Comprehensive Logging** - Detailed logging for debugging and audit trails
- **Error Handling** - Graceful error handling with clear error messages
- **Event System** - Event-driven architecture for payment status updates
- **Webhook Support** - Built-in webhook handling for payment events

## Usage

### Basic Payment Flow

1. **Create Payment Intent**
   ```typescript
   const response = await paymentGatewayService.createPaymentIntent(
     bookingId,
     amount,
     currency,
     description
   );
   ```

2. **Confirm Payment**
   ```typescript
   const confirmation = await paymentGatewayService.confirmPaymentIntent(
     paymentIntentId,
     paymentMethodId
   );
   ```

3. **Process Refund**
   ```typescript
   const refund = await paymentGatewayService.processRefund(
     paymentIntentId,
     amount,
     reason
   );
   ```

### API Endpoints

#### Create Payment Intent
```
POST /api/payments/intent/:bookingId
Body: { paymentType: 'DEPOSIT' | 'BALANCE' | 'FULL', currency?: string }
```

#### Process Online Deposit
```
POST /api/payments/online/deposit/:bookingId
Body: { paymentIntentId: string, paymentMethodId?: string }
```

#### Process Online Balance
```
POST /api/payments/online/balance/:bookingId
Body: { paymentIntentId: string, paymentMethodId?: string }
```

#### Process Full Payment
```
POST /api/payments/online/full/:bookingId
Body: { paymentIntentId: string, paymentMethodId?: string }
```

#### Process Refund
```
POST /api/payments/refund/:paymentId
Body: { amount?: number, reason?: string }
```

#### Enhanced Payment Summary
```
GET /api/payments/enhanced-summary/:bookingId
```

#### Gateway Information
```
GET /api/payments/gateway/info
```

#### Webhook Handler
```
POST /api/payments/webhook
Headers: { stripe-signature: string }
```

## Mock Gateway Testing

The mock gateway provides realistic payment simulation:

### Test Payment Methods

- `pm_card_visa` - Successful payment
- `pm_card_declined` - Declined payment
- `pm_card_requires_action` - Requires additional authentication
- `pm_card_invalid` - Invalid payment method

### Test Scenarios

```typescript
// Successful payment
const intent = await mockGateway.createPaymentIntent({
  amount: 5000,
  currency: 'USD',
  paymentMethodTypes: ['card']
});

const confirmation = await mockGateway.confirmPaymentIntent(
  intent.paymentIntentId,
  'pm_card_visa'
);

// Declined payment
const declined = await mockGateway.confirmPaymentIntent(
  intent.paymentIntentId,
  'pm_card_declined'
);
```

## Configuration

### Environment Variables

```bash
# Payment Gateway Configuration
PAYMENT_GATEWAY_TYPE=mock          # Gateway type: mock, stripe, paypal, square
DEFAULT_CURRENCY=USD               # Default currency

# Stripe Configuration (when using Stripe)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_WEBHOOK_ENDPOINT=/webhooks/stripe

# PayPal Configuration (future)
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_SECRET=...

# Square Configuration (future)
SQUARE_APPLICATION_ID=...
SQUARE_ACCESS_TOKEN=...
SQUARE_LOCATION_ID=...
```

### Gateway Switching

```typescript
// Switch to different gateway
await paymentGatewayService.switchGateway('stripe');

// Get current gateway info
const info = paymentGatewayService.getGatewayInfo();
```

## Error Handling

The system provides comprehensive error handling:

### Error Types

- `validation_error` - Invalid input parameters
- `card_error` - Card-related errors (declined, expired, etc.)
- `api_error` - Gateway API errors
- `authentication_error` - Authentication failures
- `rate_limit_error` - Rate limiting errors

### Error Response Format

```typescript
interface PaymentGatewayError {
  code: string;
  message: string;
  type: 'validation_error' | 'card_error' | 'api_error' | 'authentication_error' | 'rate_limit_error';
  param?: string;
  declineCode?: string;
}
```

## Logging

All payment activities are logged with the following information:

- Payment intent creation/confirmation
- Refund processing
- Webhook events
- Error conditions
- Gateway switching

### Log Format

```typescript
Logger.info('Payment activity', {
  bookingId: string,
  action: string,
  gatewayType: string,
  paymentIntentId?: string,
  amount?: number,
  success: boolean,
  error?: string
});
```

## Future Enhancements

### Stripe Integration

To add Stripe integration:

1. Implement `StripePaymentGateway` class
2. Add Stripe SDK dependency
3. Configure Stripe credentials
4. Update factory to support Stripe

### Additional Features

- Recurring payments
- Multi-currency support
- Payment method storage
- Advanced fraud detection
- Payment analytics

## Testing

Run the payment gateway tests:

```bash
npm test -- paymentGateway.test.ts
```

The test suite covers:
- Payment intent creation
- Payment confirmation
- Refund processing
- Error scenarios
- Gateway factory functionality

## Security Considerations

- All payment data is handled securely
- Webhook signatures are validated
- Sensitive data is not logged
- PCI compliance considerations for future implementations
- Rate limiting on payment endpoints

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 7.1** - Payment interface for different gateways ✅
- **Requirement 7.2** - Mock payment processor for testing ✅
- **Requirement 7.3** - Payment logging for integration ✅
- **Requirement 7.5** - Graceful error handling ✅