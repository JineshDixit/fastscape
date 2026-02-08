'use client';

import React, { useEffect, useState } from 'react';
import { useBooking } from '@/app/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { Booking, BookingStatus } from '@/common/interfaces';
import BookingDetails from '../booking/BookingDetails';

export const BookingHistorySection: React.FC = () => {
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

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-primary/10 text-primary';
      case 'CANCELLED':
        return 'bg-destructive/10 text-destructive';
      case 'DROPPED_OFF':
        return 'bg-secondary/10 text-secondary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: BookingStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  const renderBookingCard = (booking: Booking) => (
    <Card key={booking.id} className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Vehicle Image */}
          <div className="relative h-40 w-full bg-muted sm:h-auto sm:w-40">
            {booking.vehicle?.media?.[0]?.leftSideImage ? (
              <img
                src={`${process.env.NEXT_PUBLIC_IMAGE_URL || 'http://localhost:3001'}/${booking.vehicle.media[0].leftSideImage.replace(/\\/g, '/')}`}
                alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Car className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Booking Details */}
          <div className="flex flex-1 flex-col p-4">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-semibold">
                  {booking.vehicle?.make} {booking.vehicle?.model}
                </h3>
                <p className="text-xs text-gray-600">#{booking.id.slice(-8)}</p>
              </div>
              <Badge className={`${getStatusColor(booking.bookingStatus)} flex items-center gap-1`}>
                {getStatusIcon(booking.bookingStatus)}
                {booking.bookingStatus}
              </Badge>
            </div>

            <div className="mb-3 grid gap-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {formatDate(booking.startDatetime)} - {formatDate(booking.endDatetime)}
                </span>
                <span className="text-xs">({formatDateRange(booking.startDatetime, booking.endDatetime)})</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{booking.pickupLocation}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                {booking.bookingType === 'CHAUFFEUR' ? (
                  <User className="h-3.5 w-3.5" />
                ) : (
                  <Car className="h-3.5 w-3.5" />
                )}
                <span>{booking.bookingType === 'CHAUFFEUR' ? 'With Chauffeur' : 'Self Drive'}</span>
              </div>
            </div>

            <Separator className="my-2" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <CreditCard className="h-3.5 w-3.5" />
                <span>{booking.paymentStatus.replace('_', ' ')}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBooking(booking)}
                className="h-8 rounded-full text-xs"
              >
                View Details
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (selectedBooking) {
    return (
      <div>
        <Button variant="outline" onClick={() => setSelectedBooking(null)} className="mb-4 rounded-full">
          ← Back to History
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
            Filter History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="DROPPED_OFF">Dropped Off</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium">Year</label>
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
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="mb-4 h-5 w-1/3 rounded bg-gray-200" />
                <div className="mb-2 h-4 w-1/2 rounded bg-gray-200" />
                <div className="h-4 w-3/4 rounded bg-gray-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load booking history: {error}</AlertDescription>
        </Alert>
      ) : bookingHistory.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-gray-100 p-6">
              <Calendar className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No Booking History</h3>
            <p className="text-center text-gray-600">
              {statusFilter !== 'all' || yearFilter !== currentYear.toString()
                ? 'No bookings found with the selected filters.'
                : "You haven't completed any bookings yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {bookingHistory.length} booking{bookingHistory.length !== 1 ? 's' : ''}
            </p>
          </div>
          {bookingHistory.map(renderBookingCard)}
        </div>
      )}
    </div>
  );
};
