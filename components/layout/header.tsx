'use client';

import { FC, useEffect, useState } from 'react';
import Image from 'next/image';
import { Link } from '@/localization/navigation';
import { UserRound, Menu, X } from 'lucide-react';

import { HeaderPropType } from '@/common/propTypes';
import { useTranslations } from 'next-intl';
import { useAuth, useVehicle } from '@/app/axios';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const Header: FC<HeaderPropType> = ({ onLoginClick }) => {
  const t = useTranslations('navigation');
  const authData = useAuth();
  const { isAuthenticated, user, logout } = authData;
  const { setBookingData, setFilters } = useVehicle();

  const handleExploreClick = () => {
    // Clear search criteria and filters
    setBookingData({
      pickupDate: null,
      dropoffDate: null,
      pickupLocation: null,
      dropoffLocation: null,
    });
    setFilters({
      make: undefined,
      model: undefined,
      bodyType: undefined,
    });
  };

  const NAV_ITEMS = [
    {
      label: t('exploreCars'),
      href: '/vehicles',
      onClick: handleExploreClick,
      public: true,
    },
    {
      label: t('activeBookings'),
      href: '/profile?tab=active',
      public: false,
    },
    {
      label: t('bookingHistory'),
      href: '/profile?tab=history',
      public: false,
    },
  ];

  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
              className="h-9 w-auto md:h-12 lg:h-14"
              priority
            />
          </Link>

          <div className="flex items-center gap-4 md:gap-8 lg:gap-12">
            <nav className="hidden md:flex md:gap-6 lg:gap-8 xl:gap-12">
              {NAV_ITEMS.filter((item) => item.public || isAuthenticated).map(({ label, href, onClick }, index) => (
                <Link
                  className="hover:text-primary text-sm transition-colors lg:text-base"
                  href={href}
                  key={index}
                  onClick={onClick}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm" className="px-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-4">
                  {NAV_ITEMS.filter((item) => item.public || isAuthenticated).map(({ label, href, onClick }, index) => (
                    <Link
                      key={index}
                      href={href}
                      onClick={() => {
                        onClick?.();
                        setMobileMenuOpen(false);
                      }}
                      className="hover:text-primary rounded-md px-3 py-2 text-base transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 text-sm md:gap-3 md:text-base">
                  <UserRound className="size-4 md:size-5" />
                  <span className="hidden sm:inline">
                    {user?.firstName} {user?.lastName}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background z-50 min-w-[200px] rounded-lg border p-2 shadow-lg">
                  <Link href="/profile" className="block">
                    <div className="hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-md px-2 py-2 text-sm transition-colors">
                      {t('myAccount')}
                    </div>
                  </Link>
                  <DropdownMenuSeparator className="bg-border my-1 h-px" />
                  <div
                    onClick={logout}
                    className="hover:bg-destructive cursor-pointer rounded-md px-2 py-2 text-sm transition-colors hover:text-white"
                  >
                    {t('logout')}
                  </div>
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
