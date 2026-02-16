/**
 * Verification Configuration
 * Controls document verification behavior and booking restrictions
 */

export const verificationConfig = {
  // Document verification settings
  autoVerifyDocuments: process.env.AUTO_VERIFY_DOCUMENTS === 'true', // Default: false (manual verification)
  requireVerificationForBooking: process.env.REQUIRE_VERIFICATION_FOR_BOOKING !== 'false', // Default: true
  
  // Grace period settings
  allowUnverifiedBooking: process.env.ALLOW_UNVERIFIED_BOOKING === 'true', // Default: false
  verificationGracePeriodHours: parseInt(process.env.VERIFICATION_GRACE_PERIOD_HOURS || '48', 10), // 48 hours default
  
  // Email verification
  requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false', // Default: true
  emailVerificationTokenExpiry: parseInt(process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY || '24', 10), // 24 hours
  
  // Document requirements
  requiredDocuments: [
    'driverLicenseFront',
    'driverLicenseBack',
    'passportPhoto',
    'selfieWithLicense',
  ] as const,
  
  optionalDocuments: [
    'internationalDrivingPermit',
  ] as const,
  
  // Booking restrictions for unverified users
  unverifiedUserRestrictions: {
    maxBookingValue: parseFloat(process.env.MAX_UNVERIFIED_BOOKING_VALUE || '500'), // $500 default
    requireDepositPayment: true, // Must pay deposit upfront
    cannotBookPremiumVehicles: true, // No luxury/supercar bookings
  },
};

/**
 * Validate verification configuration on startup
 */
export const validateVerificationConfig = (): void => {
  const errors: string[] = [];
  
  if (verificationConfig.verificationGracePeriodHours < 1) {
    errors.push('VERIFICATION_GRACE_PERIOD_HOURS must be at least 1');
  }
  
  if (verificationConfig.emailVerificationTokenExpiry < 1) {
    errors.push('EMAIL_VERIFICATION_TOKEN_EXPIRY must be at least 1');
  }
  
  if (verificationConfig.unverifiedUserRestrictions.maxBookingValue < 0) {
    errors.push('MAX_UNVERIFIED_BOOKING_VALUE must be non-negative');
  }
  
  if (errors.length > 0) {
    throw new Error(`Verification configuration errors:\n${errors.join('\n')}`);
  }
};

/**
 * Check if user can proceed with booking based on verification status
 */
export const canUserBook = (verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'): {
  allowed: boolean;
  reason?: string;
  restrictions?: typeof verificationConfig.unverifiedUserRestrictions;
} => {
  if (verificationStatus === 'REJECTED') {
    return {
      allowed: false,
      reason: 'Your documents have been rejected. Please upload valid documents.',
    };
  }
  
  if (verificationStatus === 'VERIFIED') {
    return { allowed: true };
  }
  
  // PENDING status
  if (verificationConfig.allowUnverifiedBooking) {
    return {
      allowed: true,
      restrictions: verificationConfig.unverifiedUserRestrictions,
    };
  }
  
  if (!verificationConfig.requireVerificationForBooking) {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    reason: `Your documents are pending verification. You'll be able to book once verified (usually within ${verificationConfig.verificationGracePeriodHours} hours).`,
  };
};
