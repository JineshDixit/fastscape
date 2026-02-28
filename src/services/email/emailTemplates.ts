import {
  EmailTemplate,
  WelcomeEmailContext,
  PasswordResetEmailContext,
  BookingConfirmationEmailContext,
  BookingCancelledEmailContext,
  BookingReminderEmailContext,
  PaymentConfirmationEmailContext,
  VerificationEmailContext,
  ChauffeurAssignmentEmailContext,
} from '../../common/types/emailTypes';

/**
 * Email template generator
 * Returns HTML content for different email types
 */

const getEmailHeader = () => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #007bff;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #007bff;
    }
    .content {
      padding: 20px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #007bff;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .otp-code {
      font-size: 32px;
      font-weight: bold;
      color: #007bff;
      text-align: center;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 5px;
      letter-spacing: 5px;
      margin: 20px 0;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #007bff;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      color: #666;
      font-size: 12px;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
    }
    .success {
      background-color: #d4edda;
      border-left: 4px solid #28a745;
      padding: 15px;
      margin: 20px 0;
    }
    .danger {
      background-color: #f8d7da;
      border-left: 4px solid #dc3545;
      padding: 15px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">Fastscape</div>
      <p style="color: #666; margin: 5px 0;">Premium Car Rental Service</p>
    </div>
    <div class="content">
`;

const getEmailFooter = () => `
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Fastscape. All rights reserved.</p>
      <p>This is an automated email. Please do not reply to this message.</p>
      <p>If you have any questions, contact us at support@fastscape.com</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Welcome email template
 */
const welcomeTemplate = (context: WelcomeEmailContext): string => {
  return `
    ${getEmailHeader()}
    <h2>Welcome to Fastscape, ${context.firstName}! 🎉</h2>
    <p>Thank you for joining Fastscape, your premium car rental service.</p>
    <p>We're excited to have you on board! With Fastscape, you can:</p>
    <ul>
      <li>Browse our extensive fleet of premium vehicles</li>
      <li>Book cars instantly with flexible rental periods</li>
      <li>Enjoy seamless payment and booking management</li>
      <li>Access 24/7 customer support</li>
    </ul>
    <div class="info-box">
      <strong>Your Account Details:</strong><br>
      Email: ${context.email}<br>
      Name: ${context.firstName} ${context.lastName}
    </div>
    <p>Ready to hit the road? Start browsing our vehicles now!</p>
    <center>
      <a href="${process.env.FRONTEND_URL}/vehicles" class="button">Browse Vehicles</a>
    </center>
    <p>If you have any questions, our support team is here to help.</p>
    ${getEmailFooter()}
  `;
};

/**
 * Password reset email template
 */
const passwordResetTemplate = (context: PasswordResetEmailContext): string => {
  return `
    ${getEmailHeader()}
    <h2>Password Reset Request</h2>
    <p>Hi ${context.firstName},</p>
    <p>We received a request to reset your password. Use the OTP code below to reset your password:</p>
    <div class="otp-code">${context.otp}</div>
    <div class="warning">
      <strong>Security Notice:</strong><br>
      This OTP will expire in ${context.expiryMinutes} minutes.<br>
      Never share this code with anyone.<br>
      If you didn't request this, please ignore this email.
    </div>
    <p>For security reasons, this code can only be used once.</p>
    ${getEmailFooter()}
  `;
};

/**
 * Booking confirmation email template
 */
const bookingConfirmationTemplate = (context: BookingConfirmationEmailContext): string => {
  return `
    ${getEmailHeader()}
    <h2>Booking Confirmed! 🎉</h2>
    <p>Hi ${context.firstName},</p>
    <p>Great news! Your booking has been confirmed.</p>
    <div class="success">
      <strong>✓ Booking Confirmed</strong><br>
      Booking ID: <strong>${context.bookingId}</strong>
    </div>
    <div class="info-box">
      <h3 style="margin-top: 0;">Booking Details</h3>
      <strong>Vehicle:</strong> ${context.vehicleName}<br>
      <strong>Booking Type:</strong> ${context.bookingType}<br>
      <strong>Pickup:</strong> ${context.startDate}<br>
      <strong>Dropoff:</strong> ${context.endDate}<br>
      <strong>Pickup Location:</strong> ${context.pickupLocation}<br>
      <strong>Dropoff Location:</strong> ${context.dropoffLocation}<br>
      <strong>Total Amount:</strong> ${context.currency} ${context.totalAmount}
    </div>
    <center>
      <a href="${process.env.FRONTEND_URL}/bookings/${context.bookingId}" class="button">View Booking Details</a>
    </center>
    <div class="warning">
      <strong>Important Reminders:</strong><br>
      • Please arrive 15 minutes before your pickup time<br>
      • Bring a valid driver's license and ID<br>
      • Ensure you have the required documents
    </div>
    ${getEmailFooter()}
  `;
};

/**
 * Booking cancelled email template
 */
const bookingCancelledTemplate = (context: BookingCancelledEmailContext): string => {
  const refundInfo = context.refundAmount
    ? `<p>A refund of ${context.currency} ${context.refundAmount} will be processed to your original payment method within 5-7 business days.</p>`
    : '';

  return `
    ${getEmailHeader()}
    <h2>Booking Cancelled</h2>
    <p>Hi ${context.firstName},</p>
    <p>Your booking has been cancelled as requested.</p>
    <div class="info-box">
      <strong>Booking ID:</strong> ${context.bookingId}<br>
      <strong>Vehicle:</strong> ${context.vehicleName}<br>
      <strong>Cancellation Date:</strong> ${context.cancellationDate}
    </div>
    ${refundInfo}
    <p>We're sorry to see you go. If you change your mind, you can always make a new booking.</p>
    <center>
      <a href="${process.env.FRONTEND_URL}/vehicles" class="button">Browse Vehicles</a>
    </center>
    ${getEmailFooter()}
  `;
};

/**
 * Booking reminder email template
 */
const bookingReminderTemplate = (context: BookingReminderEmailContext): string => {
  return `
    ${getEmailHeader()}
    <h2>Booking Reminder</h2>
    <p>Hi ${context.firstName},</p>
    <p>This is a friendly reminder about your upcoming booking!</p>
    <div class="info-box">
      <strong>Booking ID:</strong> ${context.bookingId}<br>
      <strong>Vehicle:</strong> ${context.vehicleName}<br>
      <strong>Pickup Time:</strong> ${context.startDate}<br>
      <strong>Pickup Location:</strong> ${context.pickupLocation}<br>
      <strong>Time Until Pickup:</strong> ${context.hoursUntilPickup} hours
    </div>
    <div class="warning">
      <strong>Checklist:</strong><br>
      ☐ Valid driver's license<br>
      ☐ Government-issued ID<br>
      ☐ Payment method<br>
      ☐ Booking confirmation
    </div>
    <center>
      <a href="${process.env.FRONTEND_URL}/bookings/${context.bookingId}" class="button">View Booking</a>
    </center>
    ${getEmailFooter()}
  `;
};

/**
 * Payment confirmation email template
 */
const paymentConfirmationTemplate = (context: PaymentConfirmationEmailContext): string => {
  return `
    ${getEmailHeader()}
    <h2>Payment Received ✓</h2>
    <p>Hi ${context.firstName},</p>
    <p>We've successfully received your payment.</p>
    <div class="success">
      <strong>Payment Confirmed</strong>
    </div>
    <div class="info-box">
      <h3 style="margin-top: 0;">Payment Details</h3>
      <strong>Booking ID:</strong> ${context.bookingId}<br>
      <strong>Payment Type:</strong> ${context.paymentType}<br>
      <strong>Amount:</strong> ${context.currency} ${context.amount}<br>
      <strong>Payment Method:</strong> ${context.paymentMethod}<br>
      <strong>Date:</strong> ${context.paymentDate}
    </div>
    <p>A detailed receipt has been sent to your email.</p>
    <center>
      <a href="${process.env.FRONTEND_URL}/bookings/${context.bookingId}" class="button">View Booking</a>
    </center>
    ${getEmailFooter()}
  `;
};

/**
 * Verification approved email template
 */
const verificationApprovedTemplate = (context: VerificationEmailContext): string => {
  return `
    ${getEmailHeader()}
    <h2>Account Verified!</h2>
    <p>Hi ${context.firstName},</p>
    <div class="success">
      <strong>✓ Your account has been verified!</strong>
    </div>
    <p>Congratulations! Your identity documents have been reviewed and approved.</p>
    <p>You now have full access to all Fastscape features and can start booking vehicles immediately.</p>
    ${context.nextSteps ? `<div class="info-box"><strong>Next Steps:</strong><br>${context.nextSteps}</div>` : ''}
    <center>
      <a href="${process.env.FRONTEND_URL}/vehicles" class="button">Start Booking</a>
    </center>
    ${getEmailFooter()}
  `;
};

/**
 * Verification rejected email template
 */
const verificationRejectedTemplate = (context: VerificationEmailContext): string => {
  return `
    ${getEmailHeader()}
    <h2>Verification Update</h2>
    <p>Hi ${context.firstName},</p>
    <div class="danger">
      <strong>Verification Status: Requires Attention</strong>
    </div>
    <p>We were unable to verify your account with the documents provided.</p>
    ${context.reason ? `<div class="info-box"><strong>Reason:</strong><br>${context.reason}</div>` : ''}
    <p>Please review the requirements and resubmit your documents:</p>
    <ul>
      <li>Clear, high-quality images</li>
      <li>All information must be visible</li>
      <li>Documents must be valid and not expired</li>
    </ul>
    <center>
      <a href="${process.env.FRONTEND_URL}/profile/verification" class="button">Resubmit Documents</a>
    </center>
    <p>If you have questions, please contact our support team.</p>
    ${getEmailFooter()}
  `;
};

/**
 * Chauffeur assignment email template
 */
const chauffeurAssignedTemplate = (context: ChauffeurAssignmentEmailContext): string => {
  const ratingStars = context.chauffeurRating ? '⭐'.repeat(Math.round(context.chauffeurRating)) : '';

  return `
    ${getEmailHeader()}
    <h2>Chauffeur Assigned! 🚗</h2>
    <p>Hi ${context.firstName},</p>
    <p>Great news! A professional chauffeur has been assigned to your booking.</p>
    <div class="success">
      <strong>✓ Chauffeur Confirmed</strong><br>
      Booking ID: <strong>${context.bookingId}</strong>
    </div>
    <div class="info-box">
      <h3 style="margin-top: 0;">Your Chauffeur</h3>
      <strong>Name:</strong> ${context.chauffeurName}<br>
      <strong>Phone:</strong> ${context.chauffeurPhone}<br>
      ${context.chauffeurRating ? `<strong>Rating:</strong> ${context.chauffeurRating}/5 ${ratingStars}<br>` : ''}
      ${context.chauffeurExperience ? `<strong>Experience:</strong> ${context.chauffeurExperience}<br>` : ''}
      ${context.chauffeurLanguages ? `<strong>Languages:</strong> ${context.chauffeurLanguages}<br>` : ''}
    </div>
    <div class="info-box">
      <h3 style="margin-top: 0;">Trip Details</h3>
      <strong>Vehicle:</strong> ${context.vehicleName}<br>
      <strong>Pickup Time:</strong> ${context.startDate}<br>
      <strong>Pickup Location:</strong> ${context.pickupLocation}
    </div>
    <div class="warning">
      <strong>Important:</strong><br>
      • Your chauffeur will contact you before pickup<br>
      • Please be ready 10 minutes before scheduled time<br>
      • Keep your phone accessible for communication
    </div>
    <center>
      <a href="${process.env.FRONTEND_URL}/bookings/${context.bookingId}" class="button">View Booking Details</a>
    </center>
    ${getEmailFooter()}
  `;
};

/**
 * Get email template by type
 */
export const getEmailTemplate = (template: EmailTemplate, context: any): string => {
  switch (template) {
    case EmailTemplate.WELCOME:
      return welcomeTemplate(context as WelcomeEmailContext);
    case EmailTemplate.PASSWORD_RESET:
      return passwordResetTemplate(context as PasswordResetEmailContext);
    case EmailTemplate.BOOKING_CONFIRMATION:
      return bookingConfirmationTemplate(context as BookingConfirmationEmailContext);
    case EmailTemplate.BOOKING_CANCELLED:
      return bookingCancelledTemplate(context as BookingCancelledEmailContext);
    case EmailTemplate.BOOKING_REMINDER:
      return bookingReminderTemplate(context as BookingReminderEmailContext);
    case EmailTemplate.PAYMENT_CONFIRMATION:
      return paymentConfirmationTemplate(context as PaymentConfirmationEmailContext);
    case EmailTemplate.VERIFICATION_APPROVED:
      return verificationApprovedTemplate(context as VerificationEmailContext);
    case EmailTemplate.VERIFICATION_REJECTED:
      return verificationRejectedTemplate(context as VerificationEmailContext);
    case EmailTemplate.CHAUFFEUR_ASSIGNED:
      return chauffeurAssignedTemplate(context as ChauffeurAssignmentEmailContext);
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
};

/**
 * Get email subject by template type
 */
export const getEmailSubject = (template: EmailTemplate, context?: any): string => {
  switch (template) {
    case EmailTemplate.WELCOME:
      return 'Welcome to Fastscape! 🚗';
    case EmailTemplate.PASSWORD_RESET:
      return 'Password Reset Request - Fastscape';
    case EmailTemplate.BOOKING_CONFIRMATION:
      return `Booking Confirmed - ${context?.bookingId || 'Fastscape'}`;
    case EmailTemplate.BOOKING_CANCELLED:
      return `Booking Cancelled - ${context?.bookingId || 'Fastscape'}`;
    case EmailTemplate.BOOKING_REMINDER:
      return 'Upcoming Booking Reminder - Fastscape';
    case EmailTemplate.PAYMENT_CONFIRMATION:
      return 'Payment Received - Fastscape';
    case EmailTemplate.VERIFICATION_APPROVED:
      return 'Account Verified - Fastscape';
    case EmailTemplate.VERIFICATION_REJECTED:
      return 'Verification Update - Fastscape';
    case EmailTemplate.CHAUFFEUR_ASSIGNED:
      return `Chauffeur Assigned - ${context?.bookingId || 'Fastscape'}`;
    default:
      return 'Fastscape Notification';
  }
};
