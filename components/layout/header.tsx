'use client';

import { FC, useEffect, useState } from 'react';
import Image from 'next/image';
import { Link } from '@/localization/navigation';
import { UserRound } from 'lucide-react';

import { HeaderPropType } from '@/common/propTypes';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/axios';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';

const Header: FC<HeaderPropType> = ({ onLoginClick }) => {
  const t = useTranslations('navigation');
  const authData = useAuth();
  const { isAuthenticated, user, logout } = authData;

  const NAV_ITEMS = [
    {
      label: t('activeBookings'),
      href: '/',
    },
    {
      label: t('bookingHistory'),
      href: '/',
    },
  ];

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <header className="bg-background shadow-navbar sticky top-0 z-50">
      <div className="global-container">
        <div className="flex items-center justify-between py-2 sm:py-3 md:py-4">
          <Link href="/" aria-label="Home">
            <Image
              src="/logo/fastscape-logo.png"
              alt="Fastscape Logo"
              width={270}
              height={68}
              className="h-7 w-auto sm:h-9 md:h-12 lg:h-14"
              priority
            />
          </Link>

          <div className="flex items-center gap-4 md:gap-8 lg:gap-12">
            <nav className="hidden md:flex md:gap-6 lg:gap-8 xl:gap-12">
              {NAV_ITEMS.map(({ label, href }, index) => (
                <Link className="hover:text-primary text-sm transition-colors lg:text-base" href={href} key={index}>
                  {label}
                </Link>
              ))}
            </nav>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 text-sm md:gap-3 md:text-base">
                  <UserRound className="size-4 md:size-5" />
                  <span className="hidden sm:inline">{user?.fullName}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background rounded-md p-4 shadow-lg">
                  <DropdownMenuLabel className="cursor-pointer">
                    <Button
                      variant={'link'}
                      onClick={logout}
                      className="text-foreground p-0 text-start hover:no-underline"
                    >
                      {t('myAccount')}
                    </Button>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="cursor-pointer">
                    <Button
                      variant={'link'}
                      onClick={logout}
                      className="text-foreground p-0 text-start hover:no-underline"
                    >
                      {t('logout')}
                    </Button>
                  </DropdownMenuLabel>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div>
                <Button className="w-full text-sm md:text-base" onClick={onLoginClick}>
                  <UserRound className="size-4 md:size-5" />
                  <span className="hidden sm:inline">{t('login')}</span>
                  <span className="sm:hidden">{t('login')}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
