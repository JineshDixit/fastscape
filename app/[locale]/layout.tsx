import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, localeDirections } from '@/i18n';
import { AuthProvider } from '@/app/context/AuthContext';
import LayoutClient from '@/components/layout/layoutClient';
import '@/app/globals.css';

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
  // Ensure that the incoming `locale` is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  // Get text direction for the locale
  const direction = localeDirections[locale as keyof typeof localeDirections] || 'ltr';

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body suppressHydrationWarning className={direction === 'rtl' ? 'rtl' : 'ltr'}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <LayoutClient>{children}</LayoutClient>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
