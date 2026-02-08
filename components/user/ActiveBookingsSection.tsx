'use client';

import React, { useEffect, useState } from 'react';
import { useBooking } from '@/app/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Car,
  Calendar,
  MapPin,
  User,
  Clock,
  CreditCard,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import type { Booking } from '@/common/interfaces';
import BookingDetails from '../booking/BookingDetails';

export const ActiveBookingsSection: React.FC = () => {
  const { upcomingBookings, activeBookings, fetchUpcomingBookings, fetchActiveBookings, isLoading, error } =
    useBooking();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchUpcomingBookings();
    fetchActiveBookings();
  }, [fetchUpcomingBookings, fetchActiveBookings]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-secondary/10 text-secondary';
      case 'CONFIRMED':
        return 'bg-primary/10 text-primary';
      case 'PICKED_UP':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'UNPAID':
        return 'bg-destructive/10 text-destructive';
      case 'PARTIALLY_PAID':
        return 'bg-secondary/10 text-secondary';
      case 'PAID':
        return 'bg-primary/10 text-primary';
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

  const renderBookingCard = (booking: Booking) => (
    <Card key={booking.id} className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Vehicle Image */}
          <div className="relative h-48 w-full bg-muted sm:h-auto sm:w-48">
            {booking.vehicle?.media?.[0]?.leftSideImage ? (
              <img
                src={`${process.env.NEXT_PUBLIC_IMAGE_URL || 'http://localhost:3001'}/${booking.vehicle.media[0].leftSideImage.replace(/\\/g, '/')}`}
                alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Car className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="absolute right-2 top-2 flex gap-2">
              <Badge className={getStatusColor(booking.bookingStatus)}>{booking.bookingStatus}</Badge>
            </div>
          </div>

          {/* Booking Details */}
          <div className="flex flex-1 flex-col p-4 sm:p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {booking.vehicle?.make} {booking.vehicle?.model}
                </h3>
                <p className="text-sm text-muted-foreground">Booking #{booking.id.slice(-8)}</p>
              </div>
              <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                {booking.paymentStatus.replace('_', ' ')}
              </Badge>
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Pickup</p>
                  <p className="font-medium">{formatDate(booking.startDatetime)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Dropoff</p>
                  <p className="font-medium">{formatDate(booking.endDatetime)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">From</p>
                  <p className="font-medium">{booking.pickupLocation}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">To</p>
                  <p className="font-medium">{booking.dropoffLocation}</p>
                </div>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  {booking.bookingType === 'CHAUFFEUR' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Car className="h-4 w-4" />
                  )}
                  <span>{booking.bookingType === 'CHAUFFEUR' ? 'With Chauffeur' : 'Self Drive'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  <span>{booking.paymentMethod}</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedBooking(booking)}
                className="rounded-full"
              >
                View Details
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {/* Chauffeur Info */}
            {booking.bookingType === 'CHAUFFEUR' && booking.chauffeur && (
              <>
                <Separator className="my-3" />
                <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{booking.chauffeur.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      ⭐ {booking.chauffeur.rating} • {booking.chauffeur.phone}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Pending Chauffeur Assignment */}
            {booking.bookingType === 'CHAUFFEUR' && !booking.chauffeur && booking.bookingStatus === 'PENDING' && (
              <>
                <Separator className="my-3" />
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-sm text-primary">
                  <Clock className="h-4 w-4" />
                  <span>Finding the best chauffeur for your trip...</span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (selectedBooking) {
    return (
      <div>
        <Button variant="outline" onClick={() => setSelectedBooking(null)} className="mb-4 rounded-full">
          ← Back to Active Bookings
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
              <div className="mb-4 h-6 w-1/3 rounded bg-muted" />
              <div className="mb-2 h-4 w-1/2 rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
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
        <AlertDescription>Failed to load bookings: {error}</AlertDescription>
      </Alert>
    );
  }

  const allActiveBookings = [...activeBookings, ...upcomingBookings];

  if (allActiveBookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 rounded-full bg-muted p-6">
            <Car className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">No Active Bookings</h3>
          <p className="mb-6 text-center text-muted-foreground">
            You don't have any active or upcoming bookings at the moment.
          </p>
          <Button className="rounded-full">Browse Vehicles</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Currently Active */}
      {activeBookings.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Currently Active</h2>
          <div className="space-y-4">{activeBookings.map(renderBookingCard)}</div>
        </div>
      )}

      {/* Upcoming */}
      {upcomingBookings.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Upcoming Bookings</h2>
          <div className="space-y-4">{upcomingBookings.map(renderBookingCard)}</div>
        </div>
      )}
    </div>
  );
};
