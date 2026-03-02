import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const Footer = () => {
  const t = useTranslations('footer');

  const FOOTER_LINKS = [
    { label: t('aboutUs'), href: '/' },
    { label: t('privacyPolicy'), href: '/' },
    { label: t('refundPolicy'), href: '/' },
    { label: t('contactUs'), href: '/' },
    { label: t('terms'), href: '/' },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="global-container">
        <div className="flex flex-col gap-4 py-3 sm:gap-6 md:flex-row md:items-center md:justify-between md:gap-8 md:py-4 lg:py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Link href="/" aria-label="Home">
              <Image
                src="/logo/fastscape-white-logo.png"
                alt="Fastscape Logo"
                width={238}
                height={59}
                className="h-6 w-auto sm:h-8 md:h-10 lg:h-12"
                priority
              />
            </Link>

            <p className="text-xs opacity-90 sm:text-sm">
              (c) {new Date().getFullYear()} {t('rights')}.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-3 text-xs sm:gap-4 sm:text-sm md:gap-6"
          >
            {FOOTER_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="underline-offset-4 transition-opacity hover:underline hover:opacity-80"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

