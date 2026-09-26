import createMiddleware from 'next-intl/middleware';
import { routing } from './localization/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(ar|en)/:path*'],
};
