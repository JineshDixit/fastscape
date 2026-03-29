import type { LegalContentLocale, LegalDocumentSummary } from '@/common/interfaces';

type FooterTranslator = (key: 'privacyPolicy' | 'refundPolicy' | 'terms') => string;

const SYSTEM_LEGAL_LABEL_KEYS: Partial<Record<string, 'privacyPolicy' | 'refundPolicy' | 'terms'>> = {
  'privacy-policy': 'privacyPolicy',
  'refund-cancellation-policy': 'refundPolicy',
  'terms-conditions': 'terms',
};

export const getLocalizedLegalDocumentLabel = (
  document: Pick<LegalDocumentSummary, 'slug' | 'title' | 'availableLocales'>,
  locale: LegalContentLocale,
  translateFooter: FooterTranslator,
): string => {
  const labelKey = SYSTEM_LEGAL_LABEL_KEYS[document.slug];

  if (!labelKey) {
    return document.title;
  }

  if (locale !== 'en' && !document.availableLocales?.includes(locale)) {
    return translateFooter(labelKey);
  }

  return document.title;
};
