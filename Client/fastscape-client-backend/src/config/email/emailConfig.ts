import nodemailer from 'nodemailer';
import Logger from '../../utils/logger';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * Email configuration for nodemailer
 * Supports Gmail and other SMTP providers
 */
const getEmailConfig = (): EmailConfig => {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_APP_PASSWORD;

  if (!emailUser || !emailPassword) {
    Logger.warn('Email credentials not configured. Email functionality will be disabled.');
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
export const createEmailTransporter = async () => {
  try {
    const config = getEmailConfig();
    const transporter = nodemailer.createTransport(config);

    // Verify connection configuration
    await transporter.verify();
    Logger.info('Email transporter configured successfully');

    return transporter;
  } catch (error) {
    Logger.error('Failed to configure email transporter', { error });
    throw error;
  }
};

export default getEmailConfig;
