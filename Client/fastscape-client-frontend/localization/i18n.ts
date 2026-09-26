import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, Locale } from './config';

export { locales, defaultLocale };
export type { Locale };

export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ar: 'rtl',
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../locale/${locale}.json`)).default,
  };
});
