'use client';

import { useEffect, useState } from 'react';
import { useBooking } from '@/app/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarIcon, 
  MapPinIcon, 
  CarIcon, 
  UserIcon,
  ClockIcon,
  CreditCardIcon,
  MoreHorizontalIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Booking, BookingStatus, PaymentStatus } from '@/common/interfaces';

interface BookingListProps {
  onBookingSelect?: (booking: Booking) => void;
  onBookingUpdate?: (bookingId: string) => void;
  onBookingCancel?: (bookingId: string) => void;
}

const getStatusColor = (status: BookingStatus): string => {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800';
    case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
    case 'PICKED_UP': return 'bg-green-100 text-green-800';
    case 'DROPPED_OFF': return 'bg-purple-100 text-purple-800';
    case 'COMPLETED': return 'bg-gray-100 text-gray-800';
    case 'CANCELLED': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPaymentStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case 'UNPAID': return 'bg-red-100 text-red-800';
    case 'PARTIALLY_PAID': return 'bg-yellow-100 text-yellow-800';
    case 'PAID': return 'bg-green-100 text-green-800';
    case 'REFUNDED': return 'bg-blue-100 text-blue-800';
    case 'OVERDUE': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function BookingList({ onBookingSelect, onBookingUpdate, onBookingCancel }: BookingListProps) {
  const { 
    bookings, 
    fetchUserBookings, 
    cancelBooking,
    isLoading, 
    error 
  } = useBooking();

  const [selectedTab, setSelectedTab] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all');

  useEffect(() => {
    fetchUserBookings();
  }, [fetchUserBookings]);

  const handleCancelBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      const response = await cancelBooking(bookingId, {
        cancellationReason: 'Cancelled by user'
      });
      
      if (response?.success) {
        fetchUserBookings(); // Refresh the list
        onBookingCancel?.(bookingId);
      }
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const now = new Date();
    const startDate = new Date(booking.startDatetime);
    const endDate = new Date(booking.endDatetime);

    switch (selectedTab) {
      case 'upcoming':
        return startDate > now && !['CANCELLED', 'COMPLETED'].includes(booking.bookingStatus);
      case 'active':
        return booking.bookingStatus === 'PICKED_UP' || (startDate <= now && endDate >= now && booking.bookingStatus === 'CONFIRMED');
      case 'completed':
        return ['COMPLETED', 'CANCELLED', 'DROPPED_OFF'].includes(booking.bookingStatus);
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error loading bookings: {error}</p>
          <Button onClick={() => fetchUserBookings()} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'all', label: 'All Bookings' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key as any)}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              selectedTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <CarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">
              {selectedTab === 'all' 
                ? "You haven't made any bookings yet." 
                : `No ${selectedTab} bookings found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CarIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {booking.vehicle?.make} {booking.vehicle?.model}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Booking #{booking.id.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(booking.bookingStatus)}>
                      {booking.bookingStatus}
                    </Badge>
                    <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                      {booking.paymentStatus.replace('_', ' ')}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onBookingSelect?.(booking)}>
                          View Details
                        </DropdownMenuItem>
                        {booking.bookingStatus === 'PENDING' && (
                          <>
                            <DropdownMenuItem onClick={() => onBookingUpdate?.(booking.id)}>
                              Edit Booking
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleCancelBooking(booking.id)}
                              className="text-red-600"
                            >
                              Cancel Booking
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dates */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Pickup:</span>
                      <span className="font-medium">{formatDate(booking.startDatetime)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Dropoff:</span>
                      <span className="font-medium">{formatDate(booking.endDatetime)}</span>
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPinIcon className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <span className="text-gray-600">From:</span>
                        <p className="font-medium">{booking.pickupLocation}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPinIcon className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <span className="text-gray-600">To:</span>
                        <p className="font-medium">{booking.dropoffLocation}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      {booking.bookingType === 'CHAUFFEUR' ? (
                        <UserIcon className="h-4 w-4 text-gray-500" />
                      ) : (
                        <CarIcon className="h-4 w-4 text-gray-500" />
                      )}
                      <span>{booking.bookingType === 'CHAUFFEUR' ? 'With Chauffeur' : 'Self Drive'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CreditCardIcon className="h-4 w-4 text-gray-500" />
                      <span>{booking.paymentMethod}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4 text-gray-500" />
                      <span>Created {new Date(booking.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onBookingSelect?.(booking)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}