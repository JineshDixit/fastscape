import { createError } from '../services/middleware/errorHandler';

/**
 * Validate required fields
 */
export const validateRequiredFields = (data: Record<string, any>, requiredFields: string[]): void => {
  const missingFields = requiredFields.filter(
    (field) => data[field] === undefined || data[field] === null || data[field] === '',
  );

  if (missingFields.length > 0) {
    throw createError(`Missing required fields: ${missingFields.join(', ')}`, 400);
  }
};

/**
 * Validate UUID format
 */
export const validateUUID = (id: string, fieldName: string = 'ID'): void => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!id || !uuidRegex.test(id)) {
    throw createError(`Invalid ${fieldName} format`, 400);
  }
};

/**
 * Validate date range
 */
export const validateDateRange = (
  startDate: Date | string,
  endDate: Date | string,
  allowPastDates: boolean = false,
  allowSameDay: boolean = false,
): { start: Date; end: Date } => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw createError('Invalid date format', 400);
  }

  const isInvalidRange = allowSameDay ? start > end : start >= end;
  if (isInvalidRange) {
    throw createError('End date must be after start date', 400);
  }

  if (!allowPastDates && start < new Date(now.setHours(0, 0, 0, 0))) {
    throw createError('Start date cannot be in the past', 400);
  }

  return { start, end };
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    throw createError('Invalid email format', 400);
  }
};

/**
 * Validate phone number format
 */
export const validatePhone = (phone: string): void => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;

  if (!phone || !phoneRegex.test(phone)) {
    throw createError('Invalid phone number format', 400);
  }
};

/**
 * Validate numeric range
 */
export const validateNumericRange = (value: number, min: number, max: number, fieldName: string): void => {
  if (isNaN(value) || value < min || value > max) {
    throw createError(`${fieldName} must be between ${min} and ${max}`, 400);
  }
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  return input?.trim().replace(/[<>]/g, '') || '';
};

/**
 * Validate array length
 */
export const validateArrayLength = (array: any[], minLength: number, maxLength: number, fieldName: string): void => {
  if (!Array.isArray(array) || array.length < minLength || array.length > maxLength) {
    throw createError(`${fieldName} must contain between ${minLength} and ${maxLength} items`, 400);
  }
};

/**
 * Normalize booking dates to UTC full-day blocks (start of day to start of next day)
 */
export const normalizeBookingDates = (startDate: string | Date, endDate: string | Date): { start: Date; end: Date } => {
  // Validate - allow same day as it will be normalized to 1 full day
  const { start: startRaw, end: endRaw } = validateDateRange(startDate, endDate, false, true);

  // Normalize to UTC full days
  const start = new Date(
    Date.UTC(startRaw.getUTCFullYear(), startRaw.getUTCMonth(), startRaw.getUTCDate(), 0, 0, 0, 0),
  );
  const end = new Date(Date.UTC(endRaw.getUTCFullYear(), endRaw.getUTCMonth(), endRaw.getUTCDate() + 1, 0, 0, 0, 0));

  return { start, end };
};
