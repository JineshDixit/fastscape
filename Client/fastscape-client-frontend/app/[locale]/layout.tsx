import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, localeDirections } from '@/localization/i18n';
import { AuthProvider } from '@/app/context/AuthContext';
import { VehicleProvider } from '@/app/context/VehicleContext';
import LayoutClient from '@/components/layout/layoutClient';
import '@/app/globals.css';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: {
    default: 'Fastscape',
    template: '%s | Fastscape',
  },
  description: 'Fastscape car rental client application.',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  const direction = localeDirections[locale as keyof typeof localeDirections] || 'ltr';

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body suppressHydrationWarning className={direction === 'rtl' ? 'rtl' : 'ltr'}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <VehicleProvider>
              <LayoutClient>{children}</LayoutClient>
              <Toaster />
            </VehicleProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
