import { ContactUsRequest } from '../../common/types/contactTypes';
import { createError } from '../middleware/errorHandler';
import { emailService } from '../email/email.service';
import { sanitizeEmail } from '../../utils/security.utils';
import Logger from '../../utils/logger';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getContactRecipientEmail = (): string => {
  const recipient =
    process.env.CONTACT_US_EMAIL?.trim() || process.env.SUPPORT_EMAIL?.trim() || process.env.EMAIL_USER?.trim();

  if (!recipient) {
    throw createError('Contact email recipient is not configured', 500, 'CONTACT_EMAIL_CONFIG_MISSING');
  }

  return recipient;
};

class ContactService {
  /**
   * Submit a contact-us request and notify support team via configured email service.
   */
  async submitContactUs(payload: ContactUsRequest): Promise<{ messageId?: string }> {
    const name = payload.name.trim();
    const email = sanitizeEmail(payload.email);
    const phone = payload.phone?.trim() || 'Not provided';
    const message = payload.message.trim();
    const recipientEmail = getContactRecipientEmail();
    const receivedAt = new Date().toISOString();

    const subject = `New Contact Request from ${name}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin-bottom: 12px;">New Contact Us Request</h2>
        <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p style="margin: 0 0 8px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p style="margin: 0 0 8px;"><strong>Phone:</strong> ${escapeHtml(phone)}</p>
        <p style="margin: 0 0 8px;"><strong>Received At (UTC):</strong> ${escapeHtml(receivedAt)}</p>
        <p style="margin: 12px 0 6px;"><strong>Message:</strong></p>
        <div style="padding: 12px; border: 1px solid #E5E7EB; border-radius: 8px; white-space: pre-wrap;">
          ${escapeHtml(message)}
        </div>
      </div>
    `;

    const text = [
      'New Contact Us Request',
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Received At (UTC): ${receivedAt}`,
      '',
      'Message:',
      message,
    ].join('\n');

    const result = await emailService.sendCustomEmail({
      to: recipientEmail,
      subject,
      html,
      text,
      replyTo: email,
    });

    if (!result.success) {
      Logger.error('Failed to deliver contact request email', {
        senderEmail: email,
        recipientEmail,
        error: result.error,
      });
      throw createError('Failed to submit contact request. Please try again later.', 500, 'CONTACT_EMAIL_FAILED');
    }

    Logger.info('Contact request email sent successfully', {
      senderEmail: email,
      recipientEmail,
      messageId: result.messageId,
    });

    return { messageId: result.messageId };
  }
}

export const contactService = new ContactService();

