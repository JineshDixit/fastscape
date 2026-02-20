/**
 * Payment Configuration
 * Centralized configuration for payment-related settings
 */

export const paymentConfig = {
  // Platform fees
  platformChargeRate: parseFloat(process.env.PLATFORM_CHARGE_RATE || '5.0'), // 5% default

  // Gateway fees (Stripe example)
  gatewayFeePercent: parseFloat(process.env.GATEWAY_FEE_PERCENT || '2.9'), // 2.9% default
  gatewayFeeFixed: parseFloat(process.env.GATEWAY_FEE_FIXED || '0.30'), // $0.30 default

  // Booking settings
  bookingExpirationMinutes: parseInt(process.env.BOOKING_EXPIRATION_MINUTES || '10', 10),

  // Tax settings
  taxRate: parseFloat(process.env.TAX_RATE || '0.10'), // 10% default

  // Chauffeur assignment settings
  minChauffeurRating: parseFloat(process.env.MIN_CHAUFFEUR_RATING || '4.0'),
  requireVerifiedChauffeurs: process.env.REQUIRE_VERIFIED_CHAUFFEURS !== 'false',
  maxChauffeurHourlyRate: parseFloat(process.env.MAX_CHAUFFEUR_HOURLY_RATE || '2000'),

  // Payment precision
  decimalPrecision: 2,
  comparisonDelta: 0.01, // For float comparisons
};

/**
 * Validate payment configuration on startup
 */
export const validatePaymentConfig = (): void => {
  const errors: string[] = [];

  if (paymentConfig.platformChargeRate < 0 || paymentConfig.platformChargeRate > 100) {
    errors.push('PLATFORM_CHARGE_RATE must be between 0 and 100');
  }

  if (paymentConfig.gatewayFeePercent < 0 || paymentConfig.gatewayFeePercent > 100) {
    errors.push('GATEWAY_FEE_PERCENT must be between 0 and 100');
  }

  if (paymentConfig.bookingExpirationMinutes < 1) {
    errors.push('BOOKING_EXPIRATION_MINUTES must be at least 1');
  }

  if (paymentConfig.minChauffeurRating < 0 || paymentConfig.minChauffeurRating > 5) {
    errors.push('MIN_CHAUFFEUR_RATING must be between 0 and 5');
  }

  if (errors.length > 0) {
    throw new Error(`Payment configuration errors:\n${errors.join('\n')}`);
  }
};
