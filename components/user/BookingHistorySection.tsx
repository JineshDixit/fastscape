'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useBooking } from '@/app/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Car,
  Calendar,
  MapPin,
  User,
  CreditCard,
  ChevronRight,
  AlertCircle,
  Filter,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { BookingCard } from '../booking/BookingCard';
import { BookingDetails } from '@/components/booking';
import type { Booking } from '@/common/interfaces';

export const BookingHistorySection: React.FC = () => {
  const t = useTranslations('bookingHistory');
  const tBooking = useTranslations('booking');
  const { bookingHistory, fetchBookingHistory, isLoading, error } = useBooking();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());

  useEffect(() => {
    const params: any = {
      year: parseInt(yearFilter),
    };
    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }
    fetchBookingHistory(params);
  }, [fetchBookingHistory, statusFilter, yearFilter]);

  if (selectedBooking) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => setSelectedBooking(null)}
          className="hover:bg-primary/5 text-primary rounded-full font-semibold"
        >
          ← {t('backToHistory')}
        </Button>
        <BookingDetails bookingId={selectedBooking.id} onClose={() => setSelectedBooking(null)} />
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            {t('filterHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">{t('status')}</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allStatuses')}</SelectItem>
                  <SelectItem value="COMPLETED">{tBooking('status.completed')}</SelectItem>
                  <SelectItem value="CANCELLED">{tBooking('status.cancelled')}</SelectItem>
                  <SelectItem value="DROPPED_OFF">{tBooking('status.droppedOff')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">{t('year')}</label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking History List */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-muted/40 h-48 animate-pulse">
              <CardContent className="flex h-full items-center justify-center">
                <div className="w-full space-y-3 px-6">
                  <div className="bg-muted h-4 w-1/3 rounded" />
                  <div className="bg-muted h-3 w-1/2 rounded" />
                  <div className="bg-muted h-3 w-3/4 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive" className="border-destructive/20 bg-destructive/5 text-destructive rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="font-medium">{t('failedToLoad')}: {error}</AlertDescription>
        </Alert>
      ) : bookingHistory.length === 0 ? (
        <Card className="bg-muted/5 border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="bg-muted mb-4 rounded-full p-6">
              <Calendar className="text-muted-foreground/40 h-10 w-10" />
            </div>
            <h3 className="mb-2 text-lg font-bold">{t('noHistoryFound')}</h3>
            <p className="text-muted-foreground max-w-xs text-center text-sm">
              {statusFilter !== 'all' || yearFilter !== new Date().getFullYear().toString()
                ? t('noHistoryFiltered')
                : t('noHistoryDesc')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              {bookingHistory.length} {bookingHistory.length !== 1 ? t('recordsFoundPlural') : t('recordsFound')} {t('found')}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {bookingHistory.map((booking) => (
              <BookingCard key={booking.id} booking={booking} onViewDetails={setSelectedBooking} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
