import { format, formatDistance, formatRelative, type Locale } from 'date-fns';
import { enUS, es, fr, de, ar } from 'date-fns/locale';

const locales: Record<string, Locale> = {
  en: enUS,
  es: es,
  fr: fr,
  de: de,
  ar: ar,
};

/**
 * Get date-fns locale based on i18n language
 */
export const getDateLocale = (language: string): Locale => {
  return locales[language] || locales.en;
};

/**
 * Format date with i18n support
 */
export const formatDate = (date: Date | string, formatStr: string = 'PP', language: string = 'en'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: getDateLocale(language) });
};

/**
 * Format date and time with i18n support
 */
export const formatDateTime = (date: Date | string, formatStr: string = 'PPp', language: string = 'en'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: getDateLocale(language) });
};

/**
 * Format time with i18n support
 */
export const formatTime = (date: Date | string, formatStr: string = 'p', language: string = 'en'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: getDateLocale(language) });
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string, baseDate: Date = new Date(), language: string = 'en'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistance(dateObj, baseDate, { addSuffix: true, locale: getDateLocale(language) });
};

/**
 * Format relative date (e.g., "yesterday at 3:00 PM")
 */
export const formatRelativeDate = (date: Date | string, baseDate: Date = new Date(), language: string = 'en'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatRelative(dateObj, baseDate, { locale: getDateLocale(language) });
};

/**
 * Format currency with i18n support
 */
export const formatCurrency = (amount: number, currency: string = 'USD', language: string = 'en'): string => {
  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format number with i18n support
 */
export const formatNumber = (value: number, language: string = 'en', options?: Intl.NumberFormatOptions): string => {
  return new Intl.NumberFormat(language, options).format(value);
};
