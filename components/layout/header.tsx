'use client';

import { FC, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookmarkCheck, GalleryVerticalEnd, PanelRightOpen, UserRound, LogOut } from 'lucide-react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

import { HeaderPropType } from '@/common/propTypes';
import { useAuth } from '@/app/axios/hooks/useAuth';

const NAV_ITEMS = [
  {
    label: 'Active Bookings',
    href: '/',
    icon: BookmarkCheck,
  },
  {
    label: 'Booking History',
    href: '/',
    icon: GalleryVerticalEnd,
  },
  {
    label: 'Profile',
    href: '/',
    icon: UserRound,
  },
];

const Header: FC<HeaderPropType> = ({ onLoginClick }) => {
  const { isAuthenticated, user, logout } = useAuth();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <header className="bg-background sticky top-0 z-50">
      <div className="global-container">
        <div className="flex items-center justify-between py-3 md:py-4">
          {/* Logo */}
          <Link href="/" aria-label="Home">
            <Image
              src="/logo/fastscape-logo.png"
              alt="Fastscape Logo"
              width={238}
              height={59}
              className="h-8 w-auto sm:h-10 md:h-12"
              priority
            />
          </Link>

          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <PanelRightOpen className="size-5 md:size-6" />
                </Button>
              </SheetTrigger>

              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{`Welcome${isAuthenticated ? `, ${user?.fullName}` : ''}`}</SheetTitle>
                </SheetHeader>

                <nav className="mt-4 flex flex-1 flex-col gap-1 px-4">
                  {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
                    <SheetClose asChild key={label}>
                      <Button variant="ghost" className="justify-start" asChild>
                        <Link href={href} className="flex items-center gap-2">
                          <Icon className="size-4" />
                          {label}
                        </Link>
                      </Button>
                    </SheetClose>
                  ))}
                </nav>

                <SheetFooter className="mt-6">
                  {isAuthenticated ? (
                    <Button className="w-full" onClick={logout}>
                      Log Out
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={onLoginClick}>
                      Log In
                    </Button>
                  )}
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
