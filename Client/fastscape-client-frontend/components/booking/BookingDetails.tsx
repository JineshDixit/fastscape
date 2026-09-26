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
  CreditCardIcon,
  ClockIcon,
  PhoneIcon,
  StarIcon
} from 'lucide-react';

interface BookingDetailsProps {
  bookingId: string;
  onClose?: () => void;
  onPaymentRequired?: (bookingId: string) => void;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800';
    case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
    case 'PICKED_UP': return 'bg-green-100 text-green-800';
    case 'DROPPED_OFF': return 'bg-purple-100 text-purple-800';
    case 'COMPLETED': return 'bg-gray-100 text-gray-800';
    case 'CANCELLED': return 'bg-red-100 text-red-800';
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
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCurrency = (amount: string): string => {
  return `$${parseFloat(amount).toFixed(2)}`;
};

export default function BookingDetails({ bookingId, onClose, onPaymentRequired }: BookingDetailsProps) {
  const { 
    currentBooking, 
    fetchBookingById, 
    paymentSummary,
    fetchPaymentSummary,
    cancelBooking,
    isLoading, 
    error 
  } = useBooking();

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchBookingById(bookingId);
    fetchPaymentSummary(bookingId);
  }, [bookingId, fetchBookingById, fetchPaymentSummary]);

  const handleCancelBooking = async () => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      setActionLoading('cancel');
      try {
        const response = await cancelBooking(bookingId, {
          cancellationReason: 'Cancelled by user'
        });
        
        if (response?.success) {
          // Refresh booking data after cancellation
          fetchBookingById(bookingId);
          fetchPaymentSummary(bookingId);
        }
      } catch (error) {
        console.error('Cancel booking failed:', error);
      } finally {
        setActionLoading(null);
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !currentBooking) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error loading booking details: {error}</p>
          <Button onClick={() => fetchBookingById(bookingId)} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const booking = currentBooking;
  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.bookingStatus);
  const needsPayment = booking.paymentStatus === 'UNPAID' || booking.paymentStatus === 'PARTIALLY_PAID';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CarIcon className="h-6 w-6 text-blue-600" />
                </div>
                {booking.vehicle?.make} {booking.vehicle?.model}
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Booking #{booking.id.slice(-8)} • Created {formatDate(booking.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(booking.bookingStatus)}>
                {booking.bookingStatus}
              </Badge>
              <Badge className={getStatusColor(booking.paymentStatus)}>
                {booking.paymentStatus.replace('_', ' ')}
              </Badge>
              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CarIcon className="h-5 w-5" />
                Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Make & Model</span>
                  <p className="font-medium">{booking.vehicle?.make} {booking.vehicle?.model}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Body Type</span>
                  <p className="font-medium">{booking.vehicle?.bodyType}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Transmission</span>
                  <p className="font-medium">{booking.vehicle?.transmission}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Fuel Type</span>
                  <p className="font-medium">{booking.vehicle?.fuelType}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Booking Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Pickup Date & Time</span>
                    <p className="font-medium">{formatDate(booking.startDatetime)}</p>
                  </div>
                  {booking.actualPickupDatetime && (
                    <div>
                      <span className="text-sm text-gray-600">Actual Pickup</span>
                      <p className="font-medium text-green-600">{formatDate(booking.actualPickupDatetime)}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">Dropoff Date & Time</span>
                    <p className="font-medium">{formatDate(booking.endDatetime)}</p>
                  </div>
                  {booking.actualDropoffDatetime && (
                    <div>
                      <span className="text-sm text-gray-600">Actual Dropoff</span>
                      <p className="font-medium text-green-600">{formatDate(booking.actualDropoffDatetime)}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPinIcon className="h-5 w-5" />
                Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-gray-600">Pickup Location</span>
                <p className="font-medium">{booking.pickupLocation}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Dropoff Location</span>
                <p className="font-medium">{booking.dropoffLocation}</p>
              </div>
            </CardContent>
          </Card>

          {/* Chauffeur Information */}
          {booking.bookingType === 'CHAUFFEUR' && booking.chauffeur && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Your Assigned Chauffeur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-100 rounded-full">
                    <UserIcon className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{booking.chauffeur.fullName}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm">{booking.chauffeur.rating} rating</span>
                      <span className="text-sm text-gray-600">• {booking.chauffeur.totalTrips} trips</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <PhoneIcon className="h-4 w-4" />
                        {booking.chauffeur.phone}
                      </div>
                    </div>
                  </div>
                </div>
                {booking.chauffeurInstructions && (
                  <div>
                    <span className="text-sm text-gray-600">Special Instructions</span>
                    <p className="font-medium">{booking.chauffeurInstructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Chauffeur Assignment Status */}
          {booking.bookingType === 'CHAUFFEUR' && !booking.chauffeur && booking.bookingStatus === 'PENDING' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Chauffeur Assignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <ClockIcon className="h-4 w-4" />
                  <span>We're finding the best chauffeur for your trip. You'll be notified once assigned.</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {booking.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{booking.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          {paymentSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Base Amount</span>
                    <span className="font-medium">{formatCurrency(paymentSummary.financial.baseAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Deposit</span>
                    <span className="font-medium">{formatCurrency(paymentSummary.financial.depositAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tax Amount</span>
                    <span className="font-medium">{formatCurrency(paymentSummary.financial.taxAmount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">Total Amount</span>
                    <span className="font-bold">{formatCurrency(paymentSummary.financial.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Paid</span>
                    <span className="font-medium text-green-600">{formatCurrency(paymentSummary.totalPaid)}</span>
                  </div>
                  {parseFloat(paymentSummary.remainingBalance) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Remaining Balance</span>
                      <span className="font-medium text-orange-600">{formatCurrency(paymentSummary.remainingBalance)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {needsPayment && (
                <Button 
                  className="w-full" 
                  onClick={() => onPaymentRequired?.(booking.id)}
                >
                  Complete Payment
                </Button>
              )}
              
              {canCancel && (
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  onClick={handleCancelBooking}
                  disabled={actionLoading === 'cancel'}
                >
                  {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Booking'}
                </Button>
              )}

              {booking.bookingStatus === 'PENDING' && (
                <div className="text-sm text-gray-600 text-center p-3 bg-blue-50 rounded-lg">
                  <ClockIcon className="h-4 w-4 inline mr-2" />
                  Your booking is being processed. You'll receive updates via email and SMS.
                </div>
              )}

              {booking.bookingStatus === 'CONFIRMED' && (
                <div className="text-sm text-green-600 text-center p-3 bg-green-50 rounded-lg">
                  ✓ Your booking is confirmed! Check your email for pickup details.
                </div>
              )}

              {booking.bookingStatus === 'PICKED_UP' && (
                <div className="text-sm text-blue-600 text-center p-3 bg-blue-50 rounded-lg">
                  🚗 Your rental is currently active. Enjoy your trip!
                </div>
              )}

              {booking.bookingStatus === 'DROPPED_OFF' && (
                <div className="text-sm text-purple-600 text-center p-3 bg-purple-50 rounded-lg">
                  📋 Vehicle returned. Processing completion...
                </div>
              )}

              {booking.bookingStatus === 'COMPLETED' && (
                <div className="text-sm text-gray-600 text-center p-3 bg-gray-50 rounded-lg">
                  ✅ Booking completed. Thank you for choosing Fastscape!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking Info */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking Type</span>
                <span className="font-medium">
                  {booking.bookingType === 'CHAUFFEUR' ? 'With Chauffeur' : 'Self Drive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium">{booking.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span className="font-medium">{new Date(booking.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium">{new Date(booking.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}