'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from '@/localization/navigation';
import { useVehicle, useUser, useBooking } from '@/app/axios/hooks';
import { vehicleService } from '@/app/axios/services/vehicle';
import CheckoutSteppers, { CheckoutStep } from '@/components/checkout/CheckoutSteppers';
import IdentityStep from '@/components/checkout/IdentityStep';
import DocumentStep from '@/components/checkout/DocumentStep';
import PaymentMethodForm from '@/components/checkout/PaymentMethodForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  AlertCircle,
  ChevronLeft,
  ShieldCheck,
  Mail,
  Info,
  Car,
  Calendar,
  BadgeCheck,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { differenceInDays, parseISO } from 'date-fns';
import { useAuth } from '@/app/axios';
import { useTranslations } from 'next-intl';

const CheckoutPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations('checkout');

  const { user } = useAuth();
  const { vehicle, fetchVehicleById, bookingData, isLoading: vehicleLoading } = useVehicle();
  const { profile, fetchProfile, isLoading: profileLoading } = useUser();
  const {
    createBooking,
    calculatePaymentBreakdown,
    initiatePaymentIntent,
    fetchUserBookings,
    processDepositPayment,
    currentBooking,
    paymentBreakdown,
    isLoading: bookingLoading,
  } = useBooking();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('IDENTITY');
  const [error, setError] = useState<string | null>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<boolean | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const STEPS: { id: CheckoutStep; label: string }[] = [
    { id: 'IDENTITY', label: t('steps.identity') },
    { id: 'DOCUMENTS', label: t('steps.documents') },
    { id: 'PAYMENT', label: t('steps.payment') },
    { id: 'SUMMARY', label: t('steps.summary') },
  ];

  useEffect(() => {
    if (id) {
      fetchVehicleById(id);
    }
  }, [id, fetchVehicleById]);

  // Sync profile when user changes or session initialized
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  // Handle automatic step skipping (Smart Flow)
  useEffect(() => {
    if (currentStep === 'IDENTITY' && profile && user) {
      const isVerified = profile.verificationStatus === 'VERIFIED';
      const hasBasicInfo = !!(profile.firstName && profile.lastName && profile.phone);

      if (isVerified) {
        console.log('Profile verified, skipping to payment.');
        handleDocumentsNext();
      } else if (hasBasicInfo) {
        console.log('Identity confirmed, proceeding to documents for verification.');
        setCurrentStep('DOCUMENTS');
      }
    }
  }, [currentStep, profile, user]);

  // Check vehicle availability when checkout page loads
  useEffect(() => {
    const checkInitialAvailability = async () => {
      if (id && bookingData.pickupDate && bookingData.dropoffDate) {
        setIsCheckingAvailability(true);
        try {
          const response = await vehicleService.checkAvailability(id, bookingData.pickupDate, bookingData.dropoffDate);

          if (response.success) {
            setAvailabilityStatus(response.data?.isAvailable ?? false);
            if (!response.data?.isAvailable) {
              setError(t('errorAvailability'));
            }
          }
        } catch (err) {
          console.error('Availability check failed:', err);
          setError(t('errorAvailabilityGeneric'));
        } finally {
          setIsCheckingAvailability(false);
        }
      }
    };

    checkInitialAvailability();
  }, [id, bookingData.pickupDate, bookingData.dropoffDate]);

  // Session Recovery: Check for existing PENDING booking for this vehicle
  useEffect(() => {
    const recoverSession = async () => {
      if (user && id) {
        const response = await fetchUserBookings({ status: 'PENDING' });
        if (response?.success && response.data?.bookings) {
          const existingBooking = response.data.bookings.find(
            (b) => b.vehicleId === id && b.bookingStatus === 'PENDING',
          );
          if (existingBooking) {
            console.log('Recovered existing PENDING booking:', existingBooking.id);
            // We found one, but we don't necessarily jump to PAYMENT yet
            // unless they've passed documents.
          }
        }
      }
    };
    recoverSession();
  }, [user, id, fetchUserBookings]);

  const handleIdentityNext = async (password: string) => {
    try {
      // Identity is confirmed (read-only anyway), transition to DOCUMENTS
      // Security check could be added here
      setCurrentStep('DOCUMENTS');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(t('errorIdentity'));
    }
  };

  // Fetch breakdown when moving to payment step
  useEffect(() => {
    if (currentStep === 'PAYMENT' && currentBooking?.id) {
      calculatePaymentBreakdown(currentBooking.id);
    }
  }, [currentStep, currentBooking?.id, calculatePaymentBreakdown]);

  const handleDocumentsNext = async () => {
    try {
      if (profile?.verificationStatus !== 'VERIFIED') {
        setError(t('errorCredentials'));
        return;
      }

      // First, check vehicle availability before proceeding
      if (bookingData.pickupDate && bookingData.dropoffDate) {
        setIsCheckingAvailability(true);
        const availabilityResponse = await vehicleService.checkAvailability(
          id,
          bookingData.pickupDate,
          bookingData.dropoffDate,
        );
        setIsCheckingAvailability(false);

        if (!availabilityResponse.success || !availabilityResponse.data?.isAvailable) {
          setError(t('errorAvailability'));
          return;
        }
      }

      // Create PENDING booking on backend
      const finalBookingData = {
        vehicleId: id,
        startDatetime: bookingData.pickupDate!,
        endDatetime: bookingData.dropoffDate!,
        pickupLocation: bookingData.pickupLocation || 'Dubai Hub',
        dropoffLocation: bookingData.dropoffLocation || 'Dubai Hub',
        bookingType: bookingData.bookingType,
        paymentMethod: 'ONLINE', // Default to ONLINE, can be changed in payment step
      };

      const response = await createBooking(finalBookingData as any);
      if (response && response.success && response.data) {
        // Success! createBooking already sets currentBooking in hook
        setCurrentStep('PAYMENT');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(response?.message || 'Failed to initialize booking session.');
      }
    } catch (err) {
      setError(t('errorFinalSync'));
      setIsCheckingAvailability(false);
    }
  };

  const handlePaymentNext = async (method: 'ONLINE' | 'CARD' | 'CASH', payFull: boolean) => {
    if (!currentBooking) {
      setError('No active booking session found.');
      return;
    }

    try {
      if (method === 'ONLINE') {
        const intentResponse = await initiatePaymentIntent(currentBooking.id, payFull ? 'FULL' : 'DEPOSIT');

        if (!intentResponse || !intentResponse.success) {
          setError(t('errorPaymentIntent'));
          return;
        }

        const response = await processDepositPayment(currentBooking.id, {
          paymentMethod: 'ONLINE',
          stripePaymentIntentId: intentResponse.data.id,
          paymentType: payFull ? 'FULL' : 'DEPOSIT',
        });

        if (response && response.success) {
          setCurrentStep('SUMMARY');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setError(response?.message || t('errorPaymentSync'));
        }
      } else {
        const response = await processDepositPayment(currentBooking.id, {
          paymentMethod: method as any,
          paymentType: payFull ? 'FULL' : 'DEPOSIT',
        });

        if (response && response.success) {
          setCurrentStep('SUMMARY');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setError(response?.message || t('errorPaymentManual'));
        }
      }
    } catch (err) {
      setError(t('errorFinalSync'));
    }
  };

  if (vehicleLoading || profileLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-gray-50/10 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Loader2 className="text-primary h-16 w-16 animate-spin opacity-20" />
            <Loader2 className="text-primary animation-duration-[3s] absolute inset-0 h-16 w-16 animate-spin" />
          </div>
          <p className="animate-pulse text-[10px] font-black tracking-[0.4em] text-gray-400 uppercase">
            {t('initializingProtocol')}
          </p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="global-container py-20 text-center">
        <h2 className="text-3xl font-black text-gray-900">{t('vehicleNotFound')}</h2>
        <p className="mt-2 text-gray-500">{t('vehicleNotFoundDesc')}</p>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="mt-8 h-14 rounded-2xl border-2 px-10 text-xs font-black tracking-widest uppercase"
        >
          {t('returnToHub')}
        </Button>
      </div>
    );
  }

  const days =
    bookingData.pickupDate && bookingData.dropoffDate
      ? differenceInDays(parseISO(bookingData.dropoffDate), parseISO(bookingData.pickupDate)) + 1
      : 0;

  const getFullUrl = (path: string) => {
    if (!path) return '';
    const baseUrl = process.env.NEXT_PUBLIC_IMAGE_URL || 'http://localhost:3001';
    return `${baseUrl}/${path.replace(/\\/g, '/')}`;
  };

  return (
    <main className="selection:bg-primary min-h-screen pb-20 selection:text-white dark:bg-gray-950">
      {/* Dynamic Header Sticky Bar */}
      <div className="sticky top-0 w-full border-b border-gray-100 bg-white/70 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/70">
        <div className="global-container flex h-16 items-center justify-between">
          <button
            onClick={() => router.back()}
            className="group hover:text-primary flex items-center gap-3 text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase transition-all active:scale-95"
          >
            <div className="group-hover:bg-primary/10 flex h-8 w-8 items-center justify-center rounded-xl bg-gray-50 transition-colors dark:bg-gray-900">
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            </div>
            <span className="hidden sm:inline">{t('abortCheckout')}</span>
          </button>

          <div className="flex items-center gap-6">
            <div className="hidden items-center gap-2.5 rounded-full border border-green-500/10 bg-green-500/5 px-4 py-2 lg:flex">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span className="text-[9px] font-black tracking-widest text-green-600 uppercase">
                {t('enterpriseSecurity')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="global-container pt-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.618fr_1fr]">
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter text-gray-950 md:text-4xl dark:text-white">
                {t('elevateYour')} <span className="text-primary italic">{t('drive')}</span>
              </h1>
              <p className="max-w-xl text-base font-medium text-gray-400">{t('subtitle')}</p>
            </div>

            <CheckoutSteppers currentStep={currentStep} steps={STEPS} />

            {error && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-4 rounded-xl border-2 duration-500">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="ml-2 text-[11px] font-bold tracking-tight uppercase">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {isCheckingAvailability && (
              <Alert className="animate-in slide-in-from-top-4 rounded-xl border-2 duration-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <AlertDescription className="ml-2 text-[11px] font-bold tracking-tight uppercase">
                  {t('verifyingAvailability')}
                </AlertDescription>
              </Alert>
            )}

            <Card className="overflow-hidden rounded-4xl border-none ring-1 ring-gray-100 transition-all duration-700 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800">
              <CardHeader className="border-b border-gray-50/50 px-8 pt-8 pb-4 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/20 h-1.5 w-10 rounded-full" />
                      <span className="text-primary text-[9px] font-black tracking-[0.4em] uppercase">
                        {t('step', { number: STEPS.findIndex((s) => s.id === currentStep) + 1 })}
                      </span>
                    </div>
                    <CardTitle className="text-2xl font-black tracking-tight text-gray-950 dark:text-white">
                      {STEPS.find((s) => s.id === currentStep)?.label} {t('intel')}
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-gray-400 italic">
                      {currentStep === 'IDENTITY' && t('identityDesc')}
                      {currentStep === 'DOCUMENTS' && t('documentsDesc')}
                      {currentStep === 'PAYMENT' && t('paymentDesc')}
                      {currentStep === 'SUMMARY' && t('summaryDesc')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-2">
                {currentStep === 'IDENTITY' && (
                  <IdentityStep
                    profile={profile}
                    onNext={handleIdentityNext}
                    isLoading={profileLoading || bookingLoading}
                  />
                )}

                {currentStep === 'DOCUMENTS' && (
                  <DocumentStep
                    profile={profile}
                    onNext={handleDocumentsNext}
                    onBack={() => setCurrentStep('IDENTITY')}
                    isLoading={profileLoading || bookingLoading}
                  />
                )}

                {currentStep === 'PAYMENT' && (
                  <PaymentMethodForm
                    breakdown={paymentBreakdown}
                    onNext={handlePaymentNext}
                    onBack={() => setCurrentStep('DOCUMENTS')}
                    isLoading={bookingLoading}
                  />
                )}

                {currentStep === 'SUMMARY' && (
                  <div className="animate-in fade-in zoom-in flex flex-col items-center justify-center space-y-8 py-16 text-center duration-1000">
                    <div className="group relative cursor-none">
                      <div className="bg-primary/30 group-hover:bg-primary/50 absolute inset-0 rounded-full blur-[80px] transition-all duration-700" />
                      <div className="from-primary ring-primary/10 relative rounded-full bg-linear-to-tr via-[#06b0fc] to-[#3ac1fd] p-8 text-white shadow-[0_20px_50px_rgba(6,176,252,0.4)] ring-12">
                        <BadgeCheck className="animate-in zoom-in spin-in-12 h-20 w-20 stroke-[2.5] delay-300 duration-1000" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-4xl font-black tracking-tighter text-gray-950 dark:text-white">
                        {t('successMessage')}
                      </h2>
                      <p className="mx-auto max-w-sm text-lg leading-relaxed font-medium text-gray-400">
                        {t('successDesc')}
                      </p>
                    </div>

                    <div className="flex w-full max-w-md flex-col gap-4 pt-4 sm:flex-row">
                      <Button
                        onClick={() => router.push('/bookings')}
                        className="shadow-primary/30 h-12 flex-1 rounded-xl text-xs font-black tracking-widest uppercase shadow-xl transition-all hover:scale-105 active:scale-95"
                      >
                        {t('manageAssets')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/vehicles')}
                        className="h-12 flex-1 rounded-xl border-2 text-xs font-black tracking-widest uppercase transition-all hover:bg-gray-50 active:scale-95"
                      >
                        {t('exploreMore')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="hidden lg:block">
            <div className="animate-in slide-in-from-right-10 sticky top-28 space-y-6 duration-700">
              <Card className="overflow-hidden rounded-4xl border-none ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
                <div className="group relative h-56 w-full overflow-hidden">
                  <img
                    src={getFullUrl(vehicle.media?.[0]?.frontImage || '/placeholder-car.png')}
                    className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-gray-950/80 via-transparent to-transparent" />
                  <div className="absolute right-8 bottom-6 left-8">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="bg-primary h-1 w-6 rounded-full" />
                      <span className="text-[9px] font-black tracking-[0.3em] text-white/70 uppercase">
                        {t('selectedAsset')}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black tracking-tight text-white">
                      {vehicle.make} <span className="text-primary italic">{vehicle.model}</span>
                    </h3>
                    <div className="mt-2 flex gap-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-tighter text-white/60 uppercase">
                        <Car className="h-3 w-3" /> {vehicle.bodyType}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-tighter text-white/60 uppercase">
                        <span className="h-1 w-1 rounded-full bg-white/20" /> {vehicle.year}
                      </div>
                    </div>
                  </div>
                </div>

                <CardContent className="space-y-6 p-8">
                  <div className="flex items-center gap-4 rounded-2xl bg-gray-50/50 p-4 dark:bg-gray-800/50">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-gray-900">
                      <User className="text-primary h-6 w-6" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="truncate text-xs font-black tracking-tighter text-gray-950 uppercase dark:text-white">
                        {profile?.firstName && profile?.lastName
                          ? `${profile.firstName} ${profile.lastName}`
                          : user?.firstName && user?.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : t('guestPilot')}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <Mail className="text-primary h-3 w-3 opacity-50" />
                        <p className="truncate text-[9px] font-bold tracking-tight text-gray-400">
                          {profile?.email || user?.email || t('awaitingAuth')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Journey Breakdown in Sidebar */}
                  <div className="space-y-4 border-y border-gray-50 py-6 dark:border-gray-800">
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg">
                        <Calendar className="text-primary h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black tracking-widest text-gray-400 uppercase">
                          {t('missionWindow')}
                        </p>
                        <p className="text-xs font-bold text-gray-950 dark:text-white">
                          {bookingData.pickupDate ? parseISO(bookingData.pickupDate).toLocaleDateString() : t('tbd')} —{' '}
                          {bookingData.dropoffDate ? parseISO(bookingData.dropoffDate).toLocaleDateString() : t('tbd')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg">
                        <Info className="text-primary h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black tracking-widest text-gray-400 uppercase">
                          {t('operationalMode')}
                        </p>
                        <p className="text-xs font-bold text-gray-950 dark:text-white">
                          {bookingData.bookingType === 'CHAUFFEUR' ? t('premiumChauffeur') : t('selfDrive')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg">
                        <ChevronLeft className="text-primary h-4 w-4 rotate-270" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black tracking-widest text-gray-400 uppercase">
                          {t('deploymentSector')}
                        </p>
                        <p className="text-xs font-bold text-gray-950 dark:text-white">
                          {bookingData.pickupLocation || 'Dubai Hub'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between rounded-2xl bg-gray-50/50 px-6 py-4 dark:bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <Calendar className="text-primary h-4 w-4" />
                        <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                          {t('duration')}
                        </span>
                      </div>
                      <span className="text-xs font-black text-gray-950 dark:text-white">
                        {days} {days === 1 ? t('cycle') : t('cycles')}
                      </span>
                    </div>

                    <div className="group flex cursor-help items-center justify-between px-2">
                      <div className="space-y-1">
                        <span className="group-hover:text-primary text-[10px] font-black tracking-[0.2em] text-gray-300 uppercase transition-colors">
                          {t('projectedTotal')}
                        </span>
                        <div className="mt-1 flex items-baseline gap-1.5">
                          <span className="text-primary text-3xl font-black">{vehicle.currency || '$'}</span>
                          <span className="text-5xl font-black tracking-tighter text-gray-950 dark:text-white">
                            {(days * parseFloat(vehicle.pricePerDay)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/5 border-primary/10 group relative flex gap-4 overflow-hidden rounded-3xl border p-6">
                    <div className="absolute top-0 right-0 scale-150 rotate-12 p-2 opacity-5 transition-transform group-hover:rotate-45">
                      <Info className="text-primary h-10 w-10" />
                    </div>
                    <Info className="text-primary z-10 h-5 w-5 shrink-0" />
                    <p className="z-10 text-[10px] leading-relaxed font-bold tracking-tight text-gray-500 uppercase">
                      {t('pricingDisclaimer')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CheckoutPage;
