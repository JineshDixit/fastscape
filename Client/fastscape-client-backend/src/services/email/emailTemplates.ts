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

const FALLBACK_TEXT = 'Not available';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const asString = (value: unknown): string => {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim();
};

const text = (value: unknown, fallback: string = FALLBACK_TEXT): string => {
  const normalized = asString(value);
  return escapeHtml(normalized || fallback);
};

const hasValue = (value: unknown): boolean => asString(value).length > 0;

const boolLabel = (value: boolean): string => (value ? 'Yes' : 'No');

const toFrontendUrl = (path: string): string => {
  const base = (process.env.FRONTEND_URL || '').trim().replace(/\/+$/, '');
  if (!base) {
    return '#';
  }
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const formatBookingType = (value: unknown): string => {
  const normalized = asString(value);
  if (!normalized) {
    return FALLBACK_TEXT;
  }
  return normalized
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const renderRows = (rows: Array<{ label: string; value: unknown }>): string => {
  return rows
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 0; width:42%; color:#6B7280; font-size:13px; font-weight:600;">${escapeHtml(row.label)}</td>
          <td style="padding:10px 0; color:#111827; font-size:13px; font-weight:600;">${text(row.value)}</td>
        </tr>
      `,
    )
    .join('');
};

const renderCard = (title: string, rows: Array<{ label: string; value: unknown }>): string => `
  <div style="margin:16px 0; border:1px solid #E5E7EB; border-radius:12px; background:#F9FAFB; padding:16px;">
    <p style="margin:0 0 12px; color:#111827; font-size:14px; font-weight:800;">${escapeHtml(title)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      ${renderRows(rows)}
    </table>
  </div>
`;

const renderNotice = (title: string, description: string, tone: 'info' | 'success' | 'warning' | 'danger' = 'info'): string => {
  const toneStyles = {
    info: { border: '#06B0FC', bg: '#EFF8FF', text: '#1F2937' },
    success: { border: '#10B981', bg: '#ECFDF5', text: '#065F46' },
    warning: { border: '#F59E0B', bg: '#FFFBEB', text: '#92400E' },
    danger: { border: '#EF4444', bg: '#FEF2F2', text: '#991B1B' },
  }[tone];

  return `
    <div style="margin:16px 0; border-left:4px solid ${toneStyles.border}; background:${toneStyles.bg}; border-radius:10px; padding:14px 16px;">
      <p style="margin:0 0 6px; color:${toneStyles.text}; font-size:13px; font-weight:800;">${escapeHtml(title)}</p>
      <p style="margin:0; color:${toneStyles.text}; font-size:13px; line-height:1.6;">${escapeHtml(description)}</p>
    </div>
  `;
};

const renderBulletList = (items: string[]): string => `
  <ul style="margin:10px 0 0 18px; padding:0; color:#374151; font-size:13px; line-height:1.8;">
    ${items.map((item) => `<li style="margin:0 0 4px;">${escapeHtml(item)}</li>`).join('')}
  </ul>
`;

const renderButton = (label: string, href: string): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px auto 8px;">
    <tr>
      <td align="center" style="border-radius:999px; background:#06B0FC;">
        <a href="${escapeHtml(href)}" style="display:inline-block; padding:12px 26px; color:#FFFFFF; font-size:13px; font-weight:800; text-decoration:none; border-radius:999px;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>
`;

const renderLayout = (content: {
  preheader: string;
  title: string;
  subtitle: string;
  body: string;
}): string => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>${escapeHtml(content.title)}</title>
    <style>
      body { margin:0; padding:0; background:#EEF2F7; }
      .wrapper { width:100%; table-layout:fixed; background:#EEF2F7; padding:24px 0; }
      .container { width:100%; max-width:640px; margin:0 auto; background:#FFFFFF; border-radius:16px; overflow:hidden; border:1px solid #E5E7EB; }
      .header { background:linear-gradient(135deg,#06B0FC 0%,#3AC1FD 100%); padding:24px; color:#FFFFFF; }
      .brand { font-size:26px; font-weight:900; letter-spacing:0.3px; margin:0; }
      .tagline { margin:6px 0 0; font-size:12px; font-weight:600; opacity:0.95; }
      .body { padding:24px; color:#111827; font-family:Arial,sans-serif; }
      .title { margin:0 0 8px; font-size:22px; font-weight:900; line-height:1.3; }
      .subtitle { margin:0 0 18px; font-size:14px; color:#4B5563; line-height:1.6; }
      .footer { border-top:1px solid #E5E7EB; padding:16px 24px 22px; color:#6B7280; font-size:12px; line-height:1.7; font-family:Arial,sans-serif; }
      .footer a { color:#06B0FC; text-decoration:none; }
      @media only screen and (max-width: 640px) {
        .wrapper { padding:12px 0; }
        .container { border-radius:0; border-left:none; border-right:none; }
        .header { padding:20px; }
        .body { padding:20px; }
        .footer { padding:14px 20px 18px; }
        .title { font-size:20px; }
      }
    </style>
  </head>
  <body>
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      ${escapeHtml(content.preheader)}
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="wrapper">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="container">
            <tr>
              <td class="header">
                <p class="brand">Fastscape</p>
                <p class="tagline">Premium rental operations, engineered for smooth journeys.</p>
              </td>
            </tr>
            <tr>
              <td class="body">
                <p class="title">${escapeHtml(content.title)}</p>
                <p class="subtitle">${escapeHtml(content.subtitle)}</p>
                ${content.body}
              </td>
            </tr>
            <tr>
              <td class="footer">
                <p style="margin:0;">This is an automated email from Fastscape.</p>
                <p style="margin:4px 0 0;">For help, contact <a href="mailto:support@fastscape.com">support@fastscape.com</a>.</p>
                <p style="margin:8px 0 0;">Copyright ${new Date().getFullYear()} Fastscape. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const welcomeTemplate = (context: WelcomeEmailContext): string => {
  const firstName = text(context.firstName, 'there');

  const body = `
    <p style="margin:0 0 14px; color:#374151; font-size:14px; line-height:1.7;">
      Welcome ${firstName}. Your account is now ready, and you can start booking your next ride in minutes.
    </p>
    ${renderCard('Account Summary', [
      { label: 'Name', value: `${asString(context.firstName)} ${asString(context.lastName)}`.trim() },
      { label: 'Email', value: context.email },
    ])}
    ${renderBulletList([
      'Browse premium vehicles by category and availability',
      'Reserve instantly with secure checkout',
      'Track booking and payment updates in your profile',
      'Get support whenever you need help',
    ])}
    ${renderButton('Explore Cars', toFrontendUrl('/vehicles'))}
  `;

  return renderLayout({
    preheader: 'Welcome to Fastscape. Your account is ready.',
    title: 'Welcome to Fastscape',
    subtitle: 'Your premium rental experience starts here.',
    body,
  });
};

const passwordResetTemplate = (context: PasswordResetEmailContext): string => {
  const body = `
    <p style="margin:0 0 14px; color:#374151; font-size:14px; line-height:1.7;">
      We received a request to reset your account password. Use the one-time code below.
    </p>
    <div style="margin:16px 0; border:1px solid #D1D5DB; border-radius:12px; background:#F8FAFC; padding:18px; text-align:center;">
      <p style="margin:0; color:#06B0FC; font-size:30px; letter-spacing:6px; font-weight:900;">${text(context.otp, '------')}</p>
    </div>
    ${renderNotice(
      'Security notice',
      `This code expires in ${text(context.expiryMinutes, '10')} minutes. Never share it with anyone.`,
      'warning',
    )}
    <p style="margin:0; color:#6B7280; font-size:13px;">
      If you did not request this action, you can safely ignore this email.
    </p>
  `;

  return renderLayout({
    preheader: 'Password reset code for your Fastscape account.',
    title: 'Password Reset Request',
    subtitle: `Hi ${text(context.firstName, 'there')}, here is your one-time verification code.`,
    body,
  });
};

const bookingConfirmationTemplate = (context: BookingConfirmationEmailContext): string => {
  const body = `
    ${renderNotice('Booking confirmed', `Booking ID: ${text(context.bookingId)}`, 'success')}
    ${renderCard('Trip Details', [
      { label: 'Vehicle', value: context.vehicleName },
      { label: 'Booking Type', value: formatBookingType(context.bookingType) },
      { label: 'Pickup', value: context.startDate },
      { label: 'Dropoff', value: context.endDate },
      { label: 'Pickup Location', value: context.pickupLocation },
      { label: 'Dropoff Location', value: context.dropoffLocation },
      { label: 'Total Amount', value: `${asString(context.currency) || 'USD'} ${asString(context.totalAmount) || '0.00'}` },
    ])}
    ${renderBulletList([
      'Arrive a few minutes early for smooth handover',
      'Carry valid driving documents',
      'Keep your booking details handy for support',
    ])}
    ${renderButton('View Booking', toFrontendUrl(`/bookings/${asString(context.bookingId)}`))}
  `;

  return renderLayout({
    preheader: `Your booking ${asString(context.bookingId) || ''} is confirmed.`,
    title: 'Your Booking Is Confirmed',
    subtitle: `Hi ${text(context.firstName, 'there')}, your reservation is secured.`,
    body,
  });
};

const bookingCancelledTemplate = (context: BookingCancelledEmailContext): string => {
  const hasRefund = hasValue(context.refundAmount);
  const refundBlock = hasRefund
    ? renderNotice(
        'Refund update',
        `A refund of ${text(context.currency, 'USD')} ${text(context.refundAmount)} is being processed to your original payment method.`,
        'info',
      )
    : '';

  const body = `
    ${renderNotice('Booking cancelled', `Booking ID: ${text(context.bookingId)}`, 'warning')}
    ${renderCard('Cancellation Details', [
      { label: 'Vehicle', value: context.vehicleName },
      { label: 'Cancelled At', value: context.cancellationDate },
      { label: 'Refund Eligible', value: boolLabel(hasRefund) },
    ])}
    ${refundBlock}
    ${renderButton('Book Another Vehicle', toFrontendUrl('/vehicles'))}
  `;

  return renderLayout({
    preheader: `Booking ${asString(context.bookingId) || ''} has been cancelled.`,
    title: 'Booking Cancellation Update',
    subtitle: `Hi ${text(context.firstName, 'there')}, your cancellation request has been completed.`,
    body,
  });
};

const bookingReminderTemplate = (context: BookingReminderEmailContext): string => {
  const body = `
    ${renderNotice(
      'Upcoming pickup',
      `Your booking starts in ${text(context.hoursUntilPickup, '0')} hours.`,
      'info',
    )}
    ${renderCard('Reminder Details', [
      { label: 'Booking ID', value: context.bookingId },
      { label: 'Vehicle', value: context.vehicleName },
      { label: 'Pickup Time', value: context.startDate },
      { label: 'Pickup Location', value: context.pickupLocation },
    ])}
    ${renderBulletList([
      'Carry your license and valid identification',
      'Ensure reachable contact number is active',
      'Reach pickup location before scheduled time',
    ])}
    ${renderButton('Open Booking', toFrontendUrl(`/bookings/${asString(context.bookingId)}`))}
  `;

  return renderLayout({
    preheader: `Reminder for booking ${asString(context.bookingId) || ''}.`,
    title: 'Booking Reminder',
    subtitle: `Hi ${text(context.firstName, 'there')}, your trip is coming up soon.`,
    body,
  });
};

const paymentConfirmationTemplate = (context: PaymentConfirmationEmailContext): string => {
  const body = `
    ${renderNotice('Payment received', `Reference booking: ${text(context.bookingId)}`, 'success')}
    ${renderCard('Payment Details', [
      { label: 'Payment Type', value: context.paymentType },
      { label: 'Amount', value: `${asString(context.currency) || 'USD'} ${asString(context.amount) || '0.00'}` },
      { label: 'Method', value: context.paymentMethod },
      { label: 'Date', value: context.paymentDate },
    ])}
    ${renderButton('View Booking', toFrontendUrl(`/bookings/${asString(context.bookingId)}`))}
  `;

  return renderLayout({
    preheader: 'Your Fastscape payment was processed successfully.',
    title: 'Payment Confirmation',
    subtitle: `Hi ${text(context.firstName, 'there')}, we have recorded your payment.`,
    body,
  });
};

const verificationApprovedTemplate = (context: VerificationEmailContext): string => {
  const nextStepsBlock = hasValue(context.nextSteps)
    ? renderCard('Next Steps', [{ label: 'Action', value: context.nextSteps }])
    : '';

  const body = `
    ${renderNotice('Verification approved', 'Your profile verification is complete and active.', 'success')}
    <p style="margin:0; color:#374151; font-size:14px; line-height:1.7;">
      You can now proceed with bookings and checkout without additional verification holds.
    </p>
    ${nextStepsBlock}
    ${renderButton('Explore Cars', toFrontendUrl('/vehicles'))}
  `;

  return renderLayout({
    preheader: 'Your Fastscape account verification has been approved.',
    title: 'Account Verified',
    subtitle: `Hi ${text(context.firstName, 'there')}, your account is now fully verified.`,
    body,
  });
};

const verificationRejectedTemplate = (context: VerificationEmailContext): string => {
  const reasonBlock = hasValue(context.reason)
    ? renderCard('Review Notes', [{ label: 'Reason', value: context.reason }])
    : '';

  const body = `
    ${renderNotice('Verification requires action', 'We could not complete verification with the submitted details.', 'danger')}
    ${reasonBlock}
    ${renderBulletList([
      'Upload clear and readable documents',
      'Ensure details are visible and valid',
      'Recheck document expiry before submitting',
    ])}
    ${renderButton('Update Profile Documents', toFrontendUrl('/profile'))}
  `;

  return renderLayout({
    preheader: 'Your Fastscape verification needs an update.',
    title: 'Verification Update',
    subtitle: `Hi ${text(context.firstName, 'there')}, please review and resubmit your details.`,
    body,
  });
};

const chauffeurAssignedTemplate = (context: ChauffeurAssignmentEmailContext): string => {
  const rating = hasValue(context.chauffeurRating) ? `${text(context.chauffeurRating)}/5` : FALLBACK_TEXT;
  const body = `
    ${renderNotice('Chauffeur assigned', `Booking ID: ${text(context.bookingId)}`, 'success')}
    ${renderCard('Chauffeur Details', [
      { label: 'Name', value: context.chauffeurName },
      { label: 'Phone', value: context.chauffeurPhone },
      { label: 'Rating', value: rating },
      { label: 'Experience', value: context.chauffeurExperience },
      { label: 'Languages', value: context.chauffeurLanguages },
    ])}
    ${renderCard('Trip Details', [
      { label: 'Vehicle', value: context.vehicleName },
      { label: 'Pickup Time', value: context.startDate },
      { label: 'Pickup Location', value: context.pickupLocation },
    ])}
    ${renderBulletList([
      'Chauffeur may contact you before pickup',
      'Please stay reachable on your registered number',
      'Be ready ahead of scheduled pickup time',
    ])}
    ${renderButton('View Booking', toFrontendUrl(`/bookings/${asString(context.bookingId)}`))}
  `;

  return renderLayout({
    preheader: `A chauffeur has been assigned for booking ${asString(context.bookingId) || ''}.`,
    title: 'Chauffeur Assignment Confirmed',
    subtitle: `Hi ${text(context.firstName, 'there')}, your chauffeur details are ready.`,
    body,
  });
};

/**
 * Get email template by type.
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
    case EmailTemplate.PAYMENT_RECEIPT:
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
 * Get email subject by template type.
 */
export const getEmailSubject = (template: EmailTemplate, context?: any): string => {
  const bookingId = asString(context?.bookingId) || 'Fastscape';

  switch (template) {
    case EmailTemplate.WELCOME:
      return 'Welcome to Fastscape';
    case EmailTemplate.PASSWORD_RESET:
      return 'Password Reset Request - Fastscape';
    case EmailTemplate.BOOKING_CONFIRMATION:
      return `Booking Confirmed - ${bookingId}`;
    case EmailTemplate.BOOKING_CANCELLED:
      return `Booking Cancelled - ${bookingId}`;
    case EmailTemplate.BOOKING_REMINDER:
      return `Booking Reminder - ${bookingId}`;
    case EmailTemplate.PAYMENT_CONFIRMATION:
      return `Payment Received - ${bookingId}`;
    case EmailTemplate.PAYMENT_RECEIPT:
      return `Payment Receipt - ${bookingId}`;
    case EmailTemplate.VERIFICATION_APPROVED:
      return 'Account Verified - Fastscape';
    case EmailTemplate.VERIFICATION_REJECTED:
      return 'Verification Update - Fastscape';
    case EmailTemplate.CHAUFFEUR_ASSIGNED:
      return `Chauffeur Assigned - ${bookingId}`;
    default:
      return 'Fastscape Notification';
  }
};
