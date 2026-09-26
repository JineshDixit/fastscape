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
exports.createEmailTransporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Email configuration for nodemailer
 * Supports Gmail and other SMTP providers
 */
const getEmailConfig = () => {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_APP_PASSWORD;
    if (!emailUser || !emailPassword) {
        logger_1.default.warn('Email credentials not configured. Email functionality will be disabled.');
        throw new Error('Email credentials not configured');
    }
    // Determine SMTP settings based on email provider
    const isGmail = emailUser.includes('@gmail.com');
    return {
        host: isGmail ? 'smtp.gmail.com' : process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '465'),
        secure: process.env.EMAIL_SECURE === 'true' || true, // true for 465, false for other ports
        auth: {
            user: emailUser,
            pass: emailPassword,
        },
    };
};
/**
 * Create and verify nodemailer transporter
 */
const createEmailTransporter = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = getEmailConfig();
        const transporter = nodemailer_1.default.createTransport(config);
        // Verify connection configuration
        yield transporter.verify();
        logger_1.default.info('Email transporter configured successfully');
        return transporter;
    }
    catch (error) {
        logger_1.default.error('Failed to configure email transporter', { error });
        throw error;
    }
});
exports.createEmailTransporter = createEmailTransporter;
exports.default = getEmailConfig;
//# sourceMappingURL=emailConfig.js.map