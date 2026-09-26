import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./localization/i18n.ts');

const imageOrigins = Array.from(
  new Set([process.env.NEXT_PUBLIC_IMAGE_URL, 'http://3.111.162.90:5000'].filter(Boolean) as string[]),
);

const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = imageOrigins.map((origin) => {
  const url = new URL(origin);
  const normalizedPathname = url.pathname && url.pathname !== '/' ? `${url.pathname.replace(/\/$/, '')}/**` : '/**';

  return {
    protocol: url.protocol.replace(':', '') as 'http' | 'https',
    hostname: url.hostname,
    port: url.port,
    pathname: normalizedPathname,
  };
});

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
    remotePatterns,
    // Local dev only: vehicle images live on the admin backend at
    // localhost, which Next's image optimizer blocks by default (SSRF guard).
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
  },
};

export default withNextIntl(nextConfig);
