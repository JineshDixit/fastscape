"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendChauffeurAssignedEmail = exports.sendVerificationRejectedEmail = exports.sendVerificationApprovedEmail = exports.sendPaymentConfirmationEmail = exports.sendBookingReminderEmail = exports.sendBookingCancelledEmail = exports.sendBookingConfirmationEmail = exports.sendPasswordResetEmail = exports.sendWelcomeEmail = exports.emailService = void 0;
const emailConfig_1 = require("../../config/email/emailConfig");
const emailTypes_1 = require("../../common/types/emailTypes");
const emailTemplates_1 = require("./emailTemplates");
const logger_1 = __importDefault(require("../../utils/logger"));
const security_utils_1 = require("../../utils/security.utils");
/**
 * Email Service Class
 * Handles all email operations with security and error handling
 */
class EmailService {
    constructor() {
        this.transporter = null;
        this.isConfigured = false;
        this.initializationPromise = null;
        // Initialize transporter asynchronously
        this.initializationPromise = this.initialize();
    }
    /**
     * Initialize email transporter
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.transporter = yield (0, emailConfig_1.createEmailTransporter)();
                this.isConfigured = true;
                logger_1.default.info('Email service initialized successfully');
            }
            catch (error) {
                logger_1.default.error('Failed to initialize email service', { error });
                this.isConfigured = false;
            }
        });
    }
    /**
     * Ensure email service is initialized before use
     */
    ensureInitialized() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.initializationPromise) {
                yield this.initializationPromise;
                this.initializationPromise = null;
            }
        });
    }
    /**
     * Check if email service is available
     */
    isAvailable() {
        return this.isConfigured && this.transporter !== null;
    }
    /**
     * Validate email address
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    /**
     * Sanitize and validate recipient emails
     */
    sanitizeRecipients(recipients) {
        const emails = Array.isArray(recipients) ? recipients : [recipients];
        return emails
            .map((email) => (0, security_utils_1.sanitizeEmail)(email.trim()))
            .filter((email) => {
            if (!this.validateEmail(email)) {
                logger_1.default.warn('Invalid email address filtered out', { email });
                return false;
            }
            return true;
        });
    }
    /**
     * Send email using template
     */
    sendTemplateEmail(template, to, context, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureInitialized();
            if (!this.isAvailable()) {
                logger_1.default.warn('Email service not available, skipping email send');
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
                const subject = (0, emailTemplates_1.getEmailSubject)(template, context);
                const html = (0, emailTemplates_1.getEmailTemplate)(template, context);
                // Prepare email options
                const mailOptions = {
                    from: {
                        name: 'Fastscape',
                        address: process.env.EMAIL_USER,
                    },
                    to: sanitizedTo,
                    subject,
                    html,
                };
                // Add optional fields
                if (options === null || options === void 0 ? void 0 : options.cc) {
                    mailOptions.cc = this.sanitizeRecipients(options.cc);
                }
                if (options === null || options === void 0 ? void 0 : options.bcc) {
                    mailOptions.bcc = this.sanitizeRecipients(options.bcc);
                }
                if (options === null || options === void 0 ? void 0 : options.attachments) {
                    mailOptions.attachments = options.attachments;
                }
                // Send email
                const info = yield this.transporter.sendMail(mailOptions);
                logger_1.default.info('Email sent successfully', {
                    template,
                    to: sanitizedTo,
                    messageId: info.messageId,
                });
                return {
                    success: true,
                    messageId: info.messageId,
                };
            }
            catch (error) {
                logger_1.default.error('Failed to send email', {
                    template,
                    error: error.message,
                });
                return {
                    success: false,
                    error: error.message,
                };
            }
        });
    }
    /**
     * Send custom email (without template)
     */
    sendCustomEmail(options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureInitialized();
            if (!this.isAvailable()) {
                logger_1.default.warn('Email service not available, skipping email send');
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
                const mailOptions = {
                    from: {
                        name: 'Fastscape',
                        address: process.env.EMAIL_USER,
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
                const info = yield this.transporter.sendMail(mailOptions);
                logger_1.default.info('Custom email sent successfully', {
                    to: sanitizedTo,
                    subject: options.subject,
                    messageId: info.messageId,
                });
                return {
                    success: true,
                    messageId: info.messageId,
                };
            }
            catch (error) {
                logger_1.default.error('Failed to send custom email', {
                    error: error.message,
                });
                return {
                    success: false,
                    error: error.message,
                };
            }
        });
    }
    /**
     * Send bulk emails (with rate limiting)
     */
    sendBulkEmails(emails_1) {
        return __awaiter(this, arguments, void 0, function* (emails, delayMs = 100) {
            yield this.ensureInitialized();
            if (!this.isAvailable()) {
                logger_1.default.warn('Email service not available, skipping bulk email send');
                return emails.map(() => ({
                    success: false,
                    error: 'Email service not configured',
                }));
            }
            const results = [];
            for (const email of emails) {
                const result = yield this.sendTemplateEmail(email.template, email.to, email.context);
                results.push(result);
                // Add delay to avoid rate limiting
                if (delayMs > 0) {
                    yield new Promise((resolve) => setTimeout(resolve, delayMs));
                }
            }
            logger_1.default.info('Bulk emails sent', {
                total: emails.length,
                successful: results.filter((r) => r.success).length,
                failed: results.filter((r) => !r.success).length,
            });
            return results;
        });
    }
    /**
     * Test email configuration
     */
    testConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureInitialized();
            if (!this.transporter) {
                return false;
            }
            try {
                yield this.transporter.verify();
                logger_1.default.info('Email connection test successful');
                return true;
            }
            catch (error) {
                logger_1.default.error('Email connection test failed', { error });
                return false;
            }
        });
    }
}
// Export singleton instance
exports.emailService = new EmailService();
// Export helper functions for common email operations
const sendWelcomeEmail = (to, firstName, lastName, email) => __awaiter(void 0, void 0, void 0, function* () {
    return exports.emailService.sendTemplateEmail(emailTypes_1.EmailTemplate.WELCOME, to, {
        firstName,
        lastName,
        email,
    });
});
exports.sendWelcomeEmail = sendWelcomeEmail;
const sendPasswordResetEmail = (to_1, firstName_1, otp_1, ...args_1) => __awaiter(void 0, [to_1, firstName_1, otp_1, ...args_1], void 0, function* (to, firstName, otp, expiryMinutes = 10) {
    return exports.emailService.sendTemplateEmail(emailTypes_1.EmailTemplate.PASSWORD_RESET, to, {
        firstName,
        otp,
        expiryMinutes,
    });
});
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendBookingConfirmationEmail = (to, context) => __awaiter(void 0, void 0, void 0, function* () {
    return exports.emailService.sendTemplateEmail(emailTypes_1.EmailTemplate.BOOKING_CONFIRMATION, to, context);
});
exports.sendBookingConfirmationEmail = sendBookingConfirmationEmail;
const sendBookingCancelledEmail = (to, context) => __awaiter(void 0, void 0, void 0, function* () {
    return exports.emailService.sendTemplateEmail(emailTypes_1.EmailTemplate.BOOKING_CANCELLED, to, context);
});
exports.sendBookingCancelledEmail = sendBookingCancelledEmail;
const sendBookingReminderEmail = (to, context) => __awaiter(void 0, void 0, void 0, function* () {
    return exports.emailService.sendTemplateEmail(emailTypes_1.EmailTemplate.BOOKING_REMINDER, to, context);
});
exports.sendBookingReminderEmail = sendBookingReminderEmail;
const sendPaymentConfirmationEmail = (to, context) => __awaiter(void 0, void 0, void 0, function* () {
    return exports.emailService.sendTemplateEmail(emailTypes_1.EmailTemplate.PAYMENT_CONFIRMATION, to, context);
});
exports.sendPaymentConfirmationEmail = sendPaymentConfirmationEmail;
const sendVerificationApprovedEmail = (to, firstName, nextSteps) => __awaiter(void 0, void 0, void 0, function* () {
    return exports.emailService.sendTemplateEmail(emailTypes_1.EmailTemplate.VERIFICATION_APPROVED, to, {
        firstName,
        status: 'APPROVED',
        nextSteps,
    });
});
exports.sendVerificationApprovedEmail = sendVerificationApprovedEmail;
const sendVerificationRejectedEmail = (to, firstName, reason) => __awaiter(void 0, void 0, void 0, function* () {
    return exports.emailService.sendTemplateEmail(emailTypes_1.EmailTemplate.VERIFICATION_REJECTED, to, {
        firstName,
        status: 'REJECTED',
        reason,
    });
});
exports.sendVerificationRejectedEmail = sendVerificationRejectedEmail;
const sendChauffeurAssignedEmail = (to, context) => __awaiter(void 0, void 0, void 0, function* () {
    return exports.emailService.sendTemplateEmail(emailTypes_1.EmailTemplate.CHAUFFEUR_ASSIGNED, to, context);
});
exports.sendChauffeurAssignedEmail = sendChauffeurAssignedEmail;
//# sourceMappingURL=email.service.js.map