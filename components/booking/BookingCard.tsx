'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useBooking } from '@/app/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Car, Calendar, MapPin, User, Clock, CreditCard, ChevronRight, RefreshCw } from 'lucide-react';
import type { Booking } from '@/common/interfaces';

interface BookingCardProps {
  booking: Booking;
  onViewDetails: (booking: Booking) => void;
  onUpdate?: (updatedBooking: Booking) => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({ booking: initialBooking, onViewDetails, onUpdate }) => {
  const t = useTranslations('bookingCard');
  const tBooking = useTranslations('booking');
  const { fetchBookingById } = useBooking();
  const [booking, setBooking] = useState<Booking>(initialBooking);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    try {
      const response = await fetchBookingById(booking.id, true);
      if (response?.success && response.data) {
        setBooking(response.data);
        onUpdate?.(response.data);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PICKED_UP':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'UNPAID':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'PARTIALLY_PAID':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'PAID':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="border-muted/60 overflow-hidden p-0 transition-all hover:shadow-lg">
      <CardContent className="p-0">
        <div className="flex h-full flex-col">
          {/* Top Bar - Localized Refresh and Badges */}
          <div className="bg-muted/30 border-muted/40 flex items-center justify-between border-b px-4 py-2">
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className={`${getStatusColor(booking.bookingStatus)} border-none text-[10px] font-semibold tracking-wider uppercase`}
              >
                {tBooking(`status.${booking.bookingStatus.toLowerCase()}`)}
              </Badge>
              <Badge
                variant="outline"
                className={`${getPaymentStatusColor(booking.paymentStatus)} border-none text-[10px] font-semibold tracking-wider uppercase`}
              >
                {tBooking(`status.${booking.paymentStatus.toLowerCase().replace('_', '')}`)}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full transition-transform active:scale-90"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="flex flex-1 flex-col sm:flex-row">
            {/* Vehicle Image */}
            <div className="bg-muted/20 relative h-40 w-full shrink-0 overflow-hidden sm:h-auto sm:w-44">
              {booking.vehicle?.media?.[0]?.leftSideImage ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_IMAGE_URL || 'http://localhost:3001'}/${booking.vehicle.media[0].leftSideImage.replace(/\\/g, '/')}`}
                  alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Car className="text-muted-foreground/40 h-10 w-10" />
                </div>
              )}
            </div>

            {/* Booking Details */}
            <div className="flex flex-1 flex-col p-4 sm:p-5">
              <div className="mb-3">
                <h3 className="text-foreground line-clamp-1 text-base font-bold">
                  {booking.vehicle?.make} {booking.vehicle?.model}
                </h3>
                <p className="text-muted-foreground font-mono text-[10px] tracking-tighter uppercase">
                  {t('reference')}: {booking.id.slice(-8)}
                </p>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-4">
                <div className="flex items-start gap-2.5">
                  <div className="bg-primary/10 mt-0.5 rounded p-1">
                    <Calendar className="text-primary h-3 w-3" />
                  </div>
                  <div className="text-[11px]">
                    <p className="text-muted-foreground text-[9px] font-medium uppercase">{t('pickup')}</p>
                    <p className="text-foreground/80 font-semibold">{formatDate(booking.startDatetime)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="bg-primary/10 mt-0.5 rounded p-1">
                    <Calendar className="text-primary h-3 w-3" />
                  </div>
                  <div className="text-[11px]">
                    <p className="text-muted-foreground text-[9px] font-medium uppercase">{t('dropoff')}</p>
                    <p className="text-foreground/80 font-semibold">{formatDate(booking.endDatetime)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="bg-muted mt-0.5 rounded p-1">
                    <MapPin className="text-muted-foreground h-3 w-3" />
                  </div>
                  <div className="min-w-0 text-[11px]">
                    <p className="text-muted-foreground text-[9px] font-medium uppercase">{t('from')}</p>
                    <p className="text-foreground/80 truncate font-semibold" title={booking.pickupLocation}>
                      {booking.pickupLocation}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="bg-muted mt-0.5 rounded p-1">
                    <MapPin className="text-muted-foreground h-3 w-3" />
                  </div>
                  <div className="min-w-0 text-[11px]">
                    <p className="text-muted-foreground text-[9px] font-medium uppercase">{t('to')}</p>
                    <p className="text-foreground/80 truncate font-semibold" title={booking.dropoffLocation}>
                      {booking.dropoffLocation}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-muted/40 mt-auto flex items-center justify-between border-t pt-3">
                <div className="text-muted-foreground flex gap-3 text-[10px] font-medium">
                  <div className="flex items-center gap-1.5">
                    {booking.bookingType === 'CHAUFFEUR' ? (
                      <User className="h-3.5 w-3.5" />
                    ) : (
                      <Car className="h-3.5 w-3.5" />
                    )}
                    <span>{booking.bookingType === 'CHAUFFEUR' ? t('chauffeur') : t('selfDrive')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>{booking.paymentMethod}</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(booking)}
                  className="group text-primary hover:text-primary hover:bg-primary/5 h-8 rounded-full px-3 transition-all"
                >
                  <span className="text-xs font-semibold">{t('details')}</span>
                  <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
