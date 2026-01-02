import Image from 'next/image';
import Link from 'next/link';

const FOOTER_LINKS = [
  { label: 'About Us', href: '/' },
  { label: 'Privacy Policy', href: '/' },
  { label: 'Available Cars', href: '/' },
  { label: 'Refund Policy', href: '/' },
  { label: 'Contact Us', href: '/' },
  { label: 'Terms & Conditions', href: '/' },
];

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="global-container">
        <div className="flex flex-col gap-8 py-6 md:flex-row md:items-center md:justify-between md:py-8">
          
          <div className="space-y-4">
            <Link href="/" aria-label="Home">
              <Image
                src="/logo/fastscape-white-logo.png"
                alt="Fastscape Logo"
                width={238}
                height={59}
                className="h-8 w-auto sm:h-10 md:h-12"
                priority
              />
            </Link>

            <p className="text-sm opacity-90">
              © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm md:grid-cols-2"
          >
            {FOOTER_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="hover:underline underline-offset-4 transition-opacity hover:opacity-80"
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
