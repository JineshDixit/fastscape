'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useBooking } from '@/app/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ChauffeurAssignmentSection from './ChauffeurAssignmentSection';
import { BalancePaymentModal } from './BalancePaymentModal';
import {
  AlertCircle,
  CalendarIcon,
  MapPinIcon,
  CarIcon,
  UserIcon,
  CreditCardIcon,
  ClockIcon,
  PhoneIcon,
  StarIcon,
  FileText,
  Shield,
} from 'lucide-react';

interface BookingDetailsProps {
  bookingId: string;
  onClose?: () => void;
  onPaymentRequired?: (bookingId: string) => void;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800';
    case 'PICKED_UP':
      return 'bg-green-100 text-green-800';
    case 'DROPPED_OFF':
      return 'bg-purple-100 text-purple-800';
    case 'COMPLETED':
      return 'bg-gray-100 text-gray-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    case 'UNPAID':
      return 'bg-red-100 text-red-800';
    case 'PARTIALLY_PAID':
      return 'bg-yellow-100 text-yellow-800';
    case 'PAID':
      return 'bg-green-100 text-green-800';
    case 'REFUNDED':
      return 'bg-blue-100 text-blue-800';
    case 'OVERDUE':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
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

const formatCurrency = (amount: string | number | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '') {
    return '$0.00';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    console.warn('Invalid amount for formatting:', amount);
    return '$0.00';
  }

  return `$${numAmount.toFixed(2)}`;
};

export default function BookingDetails({ bookingId, onClose, onPaymentRequired }: BookingDetailsProps) {
  const t = useTranslations('booking');
  const tCommon = useTranslations('common');
  const { currentBooking, fetchBookingById, paymentSummary, fetchPaymentSummary, cancelBooking, isLoading, error } =
    useBooking();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    fetchBookingById(bookingId);
    fetchPaymentSummary(bookingId);
  }, [bookingId, fetchBookingById, fetchPaymentSummary]);

  const handleCancelBooking = async () => {
    if (window.confirm(t('cancelConfirmation'))) {
      setActionLoading('cancel');
      try {
        const response = await cancelBooking(bookingId, {
          cancellationReason: 'Cancelled by user',
        });

        if (response?.success) {
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

  const handlePaymentSuccess = () => {
    // Refresh booking and payment data
    fetchBookingById(bookingId);
    fetchPaymentSummary(bookingId);
    setIsPaymentModalOpen(false);
  };

  const handleCompletePayment = () => {
    // If parent provided a callback, use it (for navigation to checkout)
    if (onPaymentRequired) {
      onPaymentRequired(bookingId);
    } else {
      // Otherwise, open the payment modal
      setIsPaymentModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-muted/40 w-full animate-pulse overflow-hidden">
        <div className="bg-muted h-48" />
        <CardContent className="space-y-4 p-6">
          <div className="bg-muted h-8 w-1/3 rounded" />
          <div className="bg-muted h-4 w-1/2 rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted h-20 rounded" />
            <div className="bg-muted h-20 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !currentBooking) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 w-full">
        <CardContent className="flex flex-col items-center p-10 text-center">
          <AlertCircle className="text-destructive mb-4 h-10 w-10" />
          <h3 className="text-destructive text-lg font-bold">{t('failedToLoadBooking')}</h3>
          <p className="text-destructive/70 mb-6 max-w-xs">{error || t('bookingDataNotAvailable')}</p>
          <Button variant="outline" onClick={() => fetchBookingById(bookingId)} className="rounded-full">
            {t('refreshData')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const booking = currentBooking;
  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.bookingStatus);
  const needsPayment = booking.paymentStatus === 'UNPAID' || booking.paymentStatus === 'PARTIALLY_PAID';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 w-full space-y-6 duration-500">
      {/* Hero Section */}
      <Card className="overflow-hidden p-0 shadow-sm">
        <div className="relative h-56.5 md:h-32.5 w-full overflow-hidden">
          {/* Transparent Overlay with Badges */}
          <div className="pointer-events-none absolute inset-0 bg-primary" />
          <div className="absolute right-6 bottom-6 left-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="space-y-1">
              <div className="mb-2 flex gap-2">
                <Badge
                  className={`${getStatusColor(booking.bookingStatus)} rounded-full border-none px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase`}
                >
                  {t(`status.${booking.bookingStatus}`)}
                </Badge>
                <Badge
                  className={`${getStatusColor(booking.paymentStatus)} rounded-full border-none px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase`}
                >
                  {t(`status.${booking.paymentStatus}`)}
                </Badge>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                {booking.vehicle?.make} {booking.vehicle?.model}
              </h1>
              <p className="font-mono text-xs tracking-widest text-white/80 uppercase">
                REFERENCE: {booking.id.toUpperCase()}
              </p>
            </div>
            {onClose && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="rounded-full border-white/30 bg-white/20 text-white backdrop-blur-md hover:bg-white/30"
              >
                {t('closeView')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Timeline Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border-muted/40 hover:border-primary/20 transition-colors">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="bg-primary/10 rounded-xl p-3">
                  <CalendarIcon className="text-primary h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                    {t('pickupSchedule')}
                  </p>
                  <p className="text-foreground/80 text-sm leading-tight font-bold">
                    {formatDate(booking.startDatetime)}
                  </p>
                  <p className="text-muted-foreground flex items-center gap-1.5 pt-1 text-xs">
                    <MapPinIcon className="h-3 w-3" />
                    {booking.pickupLocation}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-muted/40 hover:border-primary/20 transition-colors">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="bg-primary/10 rounded-xl p-3">
                  <CalendarIcon className="text-primary h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                    {t('dropoffSchedule')}
                  </p>
                  <p className="text-foreground/80 text-sm leading-tight font-bold">
                    {formatDate(booking.endDatetime)}
                  </p>
                  <p className="text-muted-foreground flex items-center gap-1.5 pt-1 text-xs">
                    <MapPinIcon className="h-3 w-3" />
                    {booking.dropoffLocation}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vehicle Highlights */}
          <Card className="border-muted/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-bold tracking-widest uppercase">
                <CarIcon className="h-4 w-4" />
                {t('technicalSpecifications')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6 py-2 sm:grid-cols-4">
                <div className="space-y-1">
                  <span className="text-muted-foreground text-[10px] font-semibold uppercase">{t('bodyType')}</span>
                  <p className="text-sm font-bold">{booking.vehicle?.bodyType || 'SUV'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-[10px] font-semibold uppercase">{t('transmission')}</span>
                  <p className="text-sm font-bold">{booking.vehicle?.transmission || 'Auto'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-[10px] font-semibold uppercase">{t('fuelSystem')}</span>
                  <p className="text-sm font-bold">{booking.vehicle?.fuelType || 'Petrol'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-[10px] font-semibold uppercase">{t('engine')}</span>
                  <p className="text-sm font-bold">{booking.vehicle?.engine || '2.0L'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chauffeur / Assignment Section */}
          <ChauffeurAssignmentSection
            booking={booking}
            onBookingUpdate={() => {
              fetchBookingById(bookingId);
              fetchPaymentSummary(bookingId);
            }}
          />

          {/* Detailed Chauffeur Card */}
          {booking.bookingType === 'CHAUFFEUR' && booking.chauffeur && (
            <Card className="border-primary/20 bg-primary/5 group overflow-hidden shadow-none">
              <div className="flex flex-col items-center gap-6 p-6 sm:flex-row">
                <div className="relative">
                  <div className="border-primary flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 bg-white p-1">
                    <UserIcon className="text-primary/40 h-12 w-12" />
                  </div>
                  <div className="absolute -right-1 -bottom-1 rounded-full border-4 border-white bg-green-500 p-1.5">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  </div>
                </div>
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h4 className="text-lg font-black tracking-tight">{booking.chauffeur.fullName}</h4>
                      <p className="text-primary text-xs font-bold tracking-widest uppercase">
                        {t('professionalChauffeur')}
                      </p>
                    </div>
                    <div className="border-primary/10 flex items-center justify-center gap-1 rounded-full border bg-white p-1 px-3 shadow-sm sm:justify-start">
                      <StarIcon className="h-3 w-3 fill-current text-yellow-500" />
                      <span className="text-xs font-black">{booking.chauffeur.rating}</span>
                      <span className="text-muted-foreground ml-1 text-[10px] uppercase">{t('overall')}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-4 pt-2 sm:justify-start">
                    <div className="flex items-center gap-2 rounded-lg bg-white/50 px-3 py-1.5 text-xs font-medium">
                      <PhoneIcon className="text-primary h-3.5 w-3.5" />
                      {booking.chauffeur.phone}
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-white/50 px-3 py-1.5 text-xs font-medium">
                      <ClockIcon className="text-primary h-3.5 w-3.5" />
                      {booking.chauffeur.experienceLevel || 'Expert'}
                    </div>
                  </div>
                </div>
              </div>
              {booking.chauffeurInstructions && (
                <div className="px-6 pt-2 pb-6">
                  <div className="rounded-xl border border-white/60 bg-white/40 p-4">
                    <p className="text-muted-foreground mb-1 flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                      <FileText className="h-3 w-3" />
                      {t('tripInstructions')}
                    </p>
                    <p className="text-foreground/70 text-xs leading-relaxed italic">
                      "{booking.chauffeurInstructions}"
                    </p>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Column - Payment & Actions */}
        <div className="space-y-6">
          {/* Payment Receipt Card */}
          {paymentSummary && (
            <Card className="border-muted/40 overflow-hidden">
              <div className="bg-muted/10 border-muted border-b border-dashed p-5 pb-2">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-muted-foreground text-[10px] font-black tracking-tighter uppercase">
                    {t('financeSummary')}
                  </p>
                  <CreditCardIcon className="text-muted-foreground h-4 w-4" />
                </div>
                <h3 className="text-foreground text-2xl font-black tracking-tight">{t('receiptDetail')}</h3>
              </div>
              <CardContent className="space-y-4 p-6">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('basisRentalItem')}</span>
                    <span className="font-bold">{formatCurrency(paymentSummary.financial.baseAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('mandatoryDeposit')}</span>
                    <span className="font-bold">{formatCurrency(paymentSummary.financial.depositAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('serviceTax')}</span>
                    <span className="font-bold">{formatCurrency(paymentSummary.financial.taxAmount)}</span>
                  </div>

                  <div className="border-muted/40 border-t pt-4">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-foreground text-xs font-black uppercase">{t('totalValuation')}</span>
                      <span className="text-primary text-lg font-black">
                        {formatCurrency(paymentSummary.financial.totalAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-green-600 uppercase">{t('settledAmount')}</span>
                      <span className="text-sm font-black text-green-600">
                        {formatCurrency(paymentSummary.totalPaid)}
                      </span>
                    </div>
                  </div>

                  {parseFloat(paymentSummary.remainingBalance) > 0 && (
                    <div className="mt-4 flex flex-col items-center gap-1 rounded-xl border border-orange-100 bg-orange-50 p-4">
                      <span className="text-[9px] font-black tracking-widest text-orange-800 uppercase">
                        {t('pendingSettlement')}
                      </span>
                      <span className="text-2xl font-black text-orange-600">
                        {formatCurrency(paymentSummary.remainingBalance)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4">
                  {needsPayment && (
                    <Button
                      className="shadow-primary/20 w-full transition-transform hover:scale-[1.02]"
                      onClick={handleCompletePayment}
                    >
                      {t('completeAllPayments')}
                    </Button>
                  )}

                  {canCancel && (
                    <Button
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/5 hover:text-destructive w-full"
                      onClick={handleCancelBooking}
                      disabled={actionLoading === 'cancel'}
                    >
                      {actionLoading === 'cancel' ? t('processingCancellation') : t('withdrawBookingRequest')}
                    </Button>
                  )}
                </div>
              </CardContent>

              {/* Receipt Footer */}
              <div className="bg-muted/10 border-muted/20 border-t px-6 py-4">
                <div className="text-muted-foreground flex items-center gap-3 font-mono text-[10px]">
                  <Shield className="h-3 w-3" />
                  <span>
                    {t('secureTransaction')} {booking.paymentMethod.toUpperCase()}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Status Feedback Section */}
          <Card className="border-muted/40 bg-muted/10 shadow-none">
            <CardContent className="p-6">
              <h4 className="text-muted-foreground mb-4 text-[10px] font-black tracking-widest uppercase">
                {t('journeyLogistics')}
              </h4>
              <div className="space-y-4">
                {booking.bookingStatus === 'PENDING' && (
                  <div className="animate-in fade-in flex items-start gap-4 duration-700">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <ClockIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-foreground mb-1 text-xs font-black tracking-tight uppercase">
                        {t('vettingInProgress')}
                      </p>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">{t('vettingDescription')}</p>
                    </div>
                  </div>
                )}

                {booking.bookingStatus === 'PICKED_UP' && (
                  <div className="animate-in fade-in flex items-start gap-4 duration-700">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                      <span className="text-sm">Car in use</span>
                    </div>
                    <div>
                      <p className="text-foreground mb-1 text-xs font-black tracking-tight uppercase">
                        {t('operationActive')}
                      </p>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">{t('operationDescription')}</p>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <div className="text-muted-foreground flex items-center justify-between py-1 text-[10px]">
                    <span>{t('transactionClass')}</span>
                    <span className="text-foreground font-bold">{booking.bookingType}</span>
                  </div>
                  <div className="text-muted-foreground flex items-center justify-between py-1 text-[10px]">
                    <span>{t('auditDate')}</span>
                    <span className="text-foreground font-bold">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-muted-foreground flex items-center justify-between py-1 text-[10px]">
                    <span>{t('lastIntegrityCheck')}</span>
                    <span className="text-foreground font-bold">
                      {new Date(booking.updatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Balance Payment Modal */}
      {paymentSummary && (
        <BalancePaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          bookingId={bookingId}
          paymentSummary={paymentSummary}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

