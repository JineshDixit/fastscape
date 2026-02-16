import nodemailer, { Transporter } from 'nodemailer';
import { createEmailTransporter } from '../../config/email/emailConfig';
import { EmailOptions, EmailSendResult, EmailTemplate } from '../../common/types/emailTypes';
import { getEmailTemplate, getEmailSubject } from './emailTemplates';
import Logger from '../../utils/logger';
import { sanitizeEmail } from '../../utils/security.utils';

/**
 * Email Service Class
 * Handles all email operations with security and error handling
 */
class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    // Initialize transporter asynchronously
    this.initializationPromise = this.initialize();
  }

  /**
   * Initialize email transporter
   */
  private async initialize(): Promise<void> {
    try {
      this.transporter = await createEmailTransporter();
      this.isConfigured = true;
      Logger.info('Email service initialized successfully');
    } catch (error) {
      Logger.error('Failed to initialize email service', { error });
      this.isConfigured = false;
    }
  }

  /**
   * Ensure email service is initialized before use
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
      this.initializationPromise = null;
    }
  }

  /**
   * Check if email service is available
   */
  public isAvailable(): boolean {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Validate email address
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Sanitize and validate recipient emails
   */
  private sanitizeRecipients(recipients: string | string[]): string[] {
    const emails = Array.isArray(recipients) ? recipients : [recipients];
    
    return emails
      .map((email) => sanitizeEmail(email.trim()))
      .filter((email) => {
        if (!this.validateEmail(email)) {
          Logger.warn('Invalid email address filtered out', { email });
          return false;
        }
        return true;
      });
  }

  /**
   * Send email using template
   */
  public async sendTemplateEmail(
    template: EmailTemplate,
    to: string | string[],
    context: Record<string, any>,
    options?: {
      cc?: string | string[];
      bcc?: string | string[];
      attachments?: any[];
    }
  ): Promise<EmailSendResult> {
    await this.ensureInitialized();

    if (!this.isAvailable()) {
      Logger.warn('Email service not available, skipping email send');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    try {
      // Sanitize recipients
      const sanitizedTo = this.sanitizeRecipients(to);
      if (sanitizedTo.length === 0) {
        throw new Error('No valid recipient email addresses');
      }

      // Generate email content
      const subject = getEmailSubject(template, context);
      const html = getEmailTemplate(template, context);

      // Prepare email options
      const mailOptions: any = {
        from: {
          name: 'Fastscape',
          address: process.env.EMAIL_USER!,
        },
        to: sanitizedTo,
        subject,
        html,
      };

      // Add optional fields
      if (options?.cc) {
        mailOptions.cc = this.sanitizeRecipients(options.cc);
      }
      if (options?.bcc) {
        mailOptions.bcc = this.sanitizeRecipients(options.bcc);
      }
      if (options?.attachments) {
        mailOptions.attachments = options.attachments;
      }

      // Send email
      const info = await this.transporter!.sendMail(mailOptions);

      Logger.info('Email sent successfully', {
        template,
        to: sanitizedTo,
        messageId: info.messageId,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      Logger.error('Failed to send email', {
        template,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send custom email (without template)
   */
  public async sendCustomEmail(options: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: any[];
  }): Promise<EmailSendResult> {
    await this.ensureInitialized();

    if (!this.isAvailable()) {
      Logger.warn('Email service not available, skipping email send');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    try {
      // Sanitize recipients
      const sanitizedTo = this.sanitizeRecipients(options.to);
      if (sanitizedTo.length === 0) {
        throw new Error('No valid recipient email addresses');
      }

      // Prepare email options
      const mailOptions: any = {
        from: {
          name: 'Fastscape',
          address: process.env.EMAIL_USER!,
        },
        to: sanitizedTo,
        subject: options.subject,
      };

      // Add content
      if (options.html) {
        mailOptions.html = options.html;
      }
      if (options.text) {
        mailOptions.text = options.text;
      }

      // Add optional fields
      if (options.cc) {
        mailOptions.cc = this.sanitizeRecipients(options.cc);
      }
      if (options.bcc) {
        mailOptions.bcc = this.sanitizeRecipients(options.bcc);
      }
      if (options.attachments) {
        mailOptions.attachments = options.attachments;
      }

      // Send email
      const info = await this.transporter!.sendMail(mailOptions);

      Logger.info('Custom email sent successfully', {
        to: sanitizedTo,
        subject: options.subject,
        messageId: info.messageId,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      Logger.error('Failed to send custom email', {
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send bulk emails (with rate limiting)
   */
  public async sendBulkEmails(
    emails: Array<{
      to: string;
      template: EmailTemplate;
      context: Record<string, any>;
    }>,
    delayMs: number = 100
  ): Promise<EmailSendResult[]> {
    await this.ensureInitialized();

    if (!this.isAvailable()) {
      Logger.warn('Email service not available, skipping bulk email send');
      return emails.map(() => ({
        success: false,
        error: 'Email service not configured',
      }));
    }

    const results: EmailSendResult[] = [];

    for (const email of emails) {
      const result = await this.sendTemplateEmail(email.template, email.to, email.context);
      results.push(result);

      // Add delay to avoid rate limiting
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    Logger.info('Bulk emails sent', {
      total: emails.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    });

    return results;
  }

  /**
   * Test email configuration
   */
  public async testConnection(): Promise<boolean> {
    await this.ensureInitialized();

    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      Logger.info('Email connection test successful');
      return true;
    } catch (error) {
      Logger.error('Email connection test failed', { error });
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export helper functions for common email operations
export const sendWelcomeEmail = async (to: string, firstName: string, lastName: string, email: string) => {
  return emailService.sendTemplateEmail(EmailTemplate.WELCOME, to, {
    firstName,
    lastName,
    email,
  });
};

export const sendPasswordResetEmail = async (to: string, firstName: string, otp: string, expiryMinutes: number = 10) => {
  return emailService.sendTemplateEmail(EmailTemplate.PASSWORD_RESET, to, {
    firstName,
    otp,
    expiryMinutes,
  });
};

export const sendBookingConfirmationEmail = async (
  to: string,
  context: {
    firstName: string;
    bookingId: string;
    vehicleName: string;
    startDate: string;
    endDate: string;
    pickupLocation: string;
    dropoffLocation: string;
    totalAmount: string;
    currency: string;
    bookingType: string;
  }
) => {
  return emailService.sendTemplateEmail(EmailTemplate.BOOKING_CONFIRMATION, to, context);
};

export const sendBookingCancelledEmail = async (
  to: string,
  context: {
    firstName: string;
    bookingId: string;
    vehicleName: string;
    cancellationDate: string;
    refundAmount?: string;
    currency?: string;
  }
) => {
  return emailService.sendTemplateEmail(EmailTemplate.BOOKING_CANCELLED, to, context);
};

export const sendBookingReminderEmail = async (
  to: string,
  context: {
    firstName: string;
    bookingId: string;
    vehicleName: string;
    startDate: string;
    pickupLocation: string;
    hoursUntilPickup: number;
  }
) => {
  return emailService.sendTemplateEmail(EmailTemplate.BOOKING_REMINDER, to, context);
};

export const sendPaymentConfirmationEmail = async (
  to: string,
  context: {
    firstName: string;
    bookingId: string;
    paymentType: string;
    amount: string;
    currency: string;
    paymentDate: string;
    paymentMethod: string;
  }
) => {
  return emailService.sendTemplateEmail(EmailTemplate.PAYMENT_CONFIRMATION, to, context);
};

export const sendVerificationApprovedEmail = async (
  to: string,
  firstName: string,
  nextSteps?: string
) => {
  return emailService.sendTemplateEmail(EmailTemplate.VERIFICATION_APPROVED, to, {
    firstName,
    status: 'APPROVED',
    nextSteps,
  });
};

export const sendVerificationRejectedEmail = async (
  to: string,
  firstName: string,
  reason?: string
) => {
  return emailService.sendTemplateEmail(EmailTemplate.VERIFICATION_REJECTED, to, {
    firstName,
    status: 'REJECTED',
    reason,
  });
};

export const sendChauffeurAssignedEmail = async (
  to: string,
  context: {
    firstName: string;
    bookingId: string;
    vehicleName: string;
    chauffeurName: string;
    chauffeurPhone: string;
    chauffeurRating?: number;
    chauffeurExperience?: string;
    chauffeurLanguages?: string;
    startDate: string;
    pickupLocation: string;
  }
) => {
  return emailService.sendTemplateEmail(EmailTemplate.CHAUFFEUR_ASSIGNED, to, context);
};
