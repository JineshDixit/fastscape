'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useBooking } from '@/app/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Car, AlertCircle } from 'lucide-react';
import type { Booking } from '@/common/interfaces';
import { BookingCard } from '../booking/BookingCard';
import { BookingDetails } from '@/components/booking';
import { useRouter } from '@/localization/navigation';

export const ActiveBookingsSection: React.FC = () => {
  const t = useTranslations('activeBookings');
  const router = useRouter();
  const { upcomingBookings, activeBookings, fetchUpcomingBookings, fetchActiveBookings, isLoading, error } =
    useBooking();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchUpcomingBookings();
    fetchActiveBookings();
  }, [fetchUpcomingBookings, fetchActiveBookings]);

  if (selectedBooking) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedBooking(null)} className="rounded-full font-semibold">
          {'<-'} {t('backToActiveBookings')}
        </Button>
        <BookingDetails bookingId={selectedBooking.id} onClose={() => setSelectedBooking(null)} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="bg-muted mb-4 h-6 w-1/3 rounded" />
              <div className="bg-muted mb-2 h-4 w-1/2 rounded" />
              <div className="bg-muted h-4 w-3/4 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('failedToLoad')}: {error}
        </AlertDescription>
      </Alert>
    );
  }

  const allActiveBookings = [...activeBookings, ...upcomingBookings];

  if (allActiveBookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="bg-muted mb-4 rounded-full p-6">
            <Car className="text-muted-foreground h-12 w-12" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">{t('noActiveBookings')}</h3>
          <p className="text-muted-foreground mb-6 text-center">{t('noActiveBookingsDesc')}</p>
          <Button className="rounded-full" onClick={() => router.push('/vehicles')}>
            {t('browseVehicles')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-10 duration-500">
      {/* Currently Active */}
      {activeBookings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="bg-primary h-2 w-2 animate-pulse rounded-full" />
            <h2 className="text-lg font-bold tracking-tight">{t('currentlyActive')}</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {activeBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} onViewDetails={setSelectedBooking} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcomingBookings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="bg-muted-foreground/30 h-2 w-2 rounded-full" />
            <h2 className="text-lg font-bold tracking-tight">{t('upcomingBookings')}</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {upcomingBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} onViewDetails={setSelectedBooking} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

