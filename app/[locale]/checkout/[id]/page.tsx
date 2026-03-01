'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from '@/localization/navigation';
import { useVehicle, useBooking, useDocument } from '@/app/axios/hooks';
import { useBookingFlow } from '@/app/axios/hooks/useBookingFlow';
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
  const { shouldSkipDocumentStep } = useDocument();
  const {
    createBooking,
    calculatePaymentBreakdown,
    initiatePaymentIntent,
    processDepositPayment,
    currentBooking,
    paymentBreakdown,
    isLoading: bookingLoading,
  } = useBooking();

  const {
    currentStep,
    profile,
    isInitialized,
    isLoading: flowLoading,
    error: flowError,
    initializeFlow,
    proceedToNextStep,
    goToStepWithCleanup,
    clearError,
  } = useBookingFlow();

  const [availabilityStatus, setAvailabilityStatus] = useState<boolean | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingCreated, setBookingCreated] = useState(false);

  const STEPS: { id: CheckoutStep; label: string }[] = [
    { id: 'IDENTITY', label: t('steps.identity') },
    { id: 'DOCUMENTS', label: t('steps.documents') },
    { id: 'PAYMENT', label: t('steps.payment') },
    { id: 'SUMMARY', label: t('steps.summary') },
  ];

  // Debug logging
  useEffect(() => {
    console.log('[Checkout] Component state:', {
      currentStep,
      currentBooking: currentBooking?.id,
      paymentBreakdown,
      isLoading: flowLoading || bookingLoading,
      bookingCreated,
    });
  }, [currentStep, currentBooking, paymentBreakdown, flowLoading, bookingLoading, bookingCreated]);

  useEffect(() => {
    if (id) {
      fetchVehicleById(id);
    }
  }, [id, fetchVehicleById]);

  // Initialize the booking flow when user is available and not already initialized
  useEffect(() => {
    if (user && !isInitialized) {
      initializeFlow();
    }
  }, [user, isInitialized, initializeFlow]);

  // Sync flow error with local error
  useEffect(() => {
    if (flowError) {
      setError(flowError);
    }
  }, [flowError]);

  // Check vehicle availability when checkout page loads (only if no booking exists)
  useEffect(() => {
    const checkInitialAvailability = async () => {
      // Skip availability check if booking already exists or is created
      if (currentBooking || bookingCreated) {
        console.log('[Checkout] Skipping availability check - booking session active');
        return;
      }

      if (id && bookingData.pickupDate && bookingData.dropoffDate) {
        setIsCheckingAvailability(true);
        try {
          const response = await vehicleService.checkAvailability(id, bookingData.pickupDate, bookingData.dropoffDate);

          if (response.success) {
            setAvailabilityStatus(response.data?.isAvailable ?? false);
            // Only show availability error if we ARE NOT in the middle of creating/retrieving a booking
            if (!response.data?.isAvailable && !currentBooking && !bookingCreated) {
              setError(t('errorAvailability'));
            }
          }
        } catch (err) {
          console.error('Availability check failed:', err);
          // Don't block the UI with a generic error if we might have a session on backend
        } finally {
          setIsCheckingAvailability(false);
        }
      }
    };

    checkInitialAvailability();
  }, [id, bookingData.pickupDate, bookingData.dropoffDate, bookingCreated, currentBooking]);

  // Clear session storage when checkout is completed or user leaves
  useEffect(() => {
    const clearCheckoutSession = () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('documentsUploaded');
        sessionStorage.removeItem('documentPreviews');
      }
    };

    // Clear on successful completion
    if (currentStep === 'SUMMARY') {
      clearCheckoutSession();
    }

    // Clear on page unload (user navigates away)
    const handleBeforeUnload = () => {
      if (currentStep !== 'SUMMARY') {
        clearCheckoutSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentStep]);

  // Clear booking ONLY when explicitly resetting (e.g. going back to identity after failure)
  useEffect(() => {
    // If we are at IDENTITY step but we HAVE a booking, we might have just started
    // We should only clear if the user is truly "starting over"
    if (currentStep === 'IDENTITY' && bookingCreated && !currentBooking) {
      // This case might happen if we just started. Let's not clear it.
      return;
    }

    // Preserve booking state unless explicitly navigating back to Identity from Documents/Payment
    // AND wanting to reset (rare).
    // Actually, let's just remove this restrictive auto-clear.
  }, [currentStep, bookingCreated]);

  const createBookingIfNeeded = async () => {
    // Don't create booking if already exists in state
    if (currentBooking) {
      console.log('[Checkout] Booking already exists in state, skipping creation:', currentBooking.id);
      return currentBooking;
    }

    if (!bookingData.pickupDate || !bookingData.dropoffDate) {
      throw new Error('Booking dates are missing');
    }

    // Check availability first
    setIsCheckingAvailability(true);
    try {
      const availabilityResponse = await vehicleService.checkAvailability(
        id,
        bookingData.pickupDate,
        bookingData.dropoffDate,
      );

      if (!availabilityResponse.success || !availabilityResponse.data?.isAvailable) {
        // Double check if the "unavailability" is actually due to user's OWN pending booking
        // handled by backend idempotency, but we check here too for better UX
        console.warn('[Checkout] Vehicle reported unavailable, but proceeding to attempt create/lookup (idempotency)');
      }
    } catch (err) {
      console.error('[Checkout] Availability check failed, but proceeding with booking attempt:', err);
    } finally {
      setIsCheckingAvailability(false);
    }

    // Create booking (Backend is now idempotent and will return existing pending if it exists)
    const finalBookingData = {
      vehicleId: id,
      startDatetime: bookingData.pickupDate,
      endDatetime: bookingData.dropoffDate,
      pickupLocation: bookingData.pickupLocation || 'Dubai Hub',
      dropoffLocation: bookingData.dropoffLocation || 'Dubai Hub',
      bookingType: bookingData.bookingType,
      paymentMethod: 'ONLINE',
    };

    console.log('[Checkout] Attempting to create/retrieve booking with data:', finalBookingData);
    const response = await createBooking(finalBookingData as any);
    console.log('[Checkout] Booking creation/retrieval response:', response);

    if (response && response.success && response.data) {
      console.log('[Checkout] Booking established successfully, ID:', response.data.id);
      setBookingCreated(true);
      return response.data;
    } else {
      // If we get a 409 conflict, it means someone else booked it (unlikely in this flow due to expiration/locking)
      // or our backend idempotency logic didn't hit.
      throw new Error(response?.message || 'Failed to initialize booking session.');
    }
  };

  const handleIdentityNext = async () => {
    try {
      clearAllErrors();

      // Check if documents will be skipped
      const skipDocs = await shouldSkipDocumentStep(bookingData.bookingType);

      if (skipDocs) {
        // If documents are skipped, create booking here before proceeding to payment
        console.log('[Checkout] Documents will be skipped, creating booking now');

        const booking = await createBookingIfNeeded();

        if (booking) {
          // Calculate payment breakdown
          console.log('[Checkout] Calculating payment breakdown...');
          const breakdownResponse = await calculatePaymentBreakdown(booking.id);
          console.log('[Checkout] Payment breakdown response:', breakdownResponse);

          if (breakdownResponse && breakdownResponse.success) {
            await proceedToNextStep();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            setError(breakdownResponse?.message || 'Failed to calculate payment breakdown.');
          }
        }
      } else {
        // Documents step is needed, just proceed normally
        await proceedToNextStep();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error('[Checkout] Error in handleIdentityNext:', err);
      setError(err.message || t('errorIdentity'));
    }
  };

  const handleDocumentsNext = async () => {
    try {
      clearAllErrors();

      // If booking already exists, just proceed to payment with existing breakdown
      if (currentBooking) {
        console.log('[Checkout] Booking exists, proceeding to payment with existing booking:', currentBooking.id);

        // Ensure we have payment breakdown
        if (!paymentBreakdown) {
          console.log('[Checkout] Fetching payment breakdown for existing booking...');
          const breakdownResponse = await calculatePaymentBreakdown(currentBooking.id);
          if (!breakdownResponse?.success) {
            setError(breakdownResponse?.message || 'Failed to calculate payment breakdown.');
            return;
          }
        }

        await proceedToNextStep();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Refresh profile to get latest verification status
      console.log('[Checkout] Refreshing profile before proceeding...');
      await initializeFlow(); // This will fetch fresh profile data

      // Create booking if not already created
      const booking = await createBookingIfNeeded();

      if (booking) {
        // Calculate payment breakdown
        console.log('[Checkout] Calculating payment breakdown...');
        const breakdownResponse = await calculatePaymentBreakdown(booking.id);
        console.log('[Checkout] Payment breakdown response:', breakdownResponse);

        if (breakdownResponse && breakdownResponse.success) {
          await proceedToNextStep();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setError(breakdownResponse?.message || 'Failed to calculate payment breakdown.');
        }
      }
    } catch (err: any) {
      console.error('[Checkout] Error in handleDocumentsNext:', err);
      setError(err.message || t('errorFinalSync'));
      setIsCheckingAvailability(false);
    }
  };

  // Fetch breakdown when moving to payment step OR when payment step is loaded with existing booking
  useEffect(() => {
    const fetchBreakdown = async () => {
      if (currentStep === 'PAYMENT' && currentBooking?.id) {
        console.log('[Checkout] Payment step loaded, fetching breakdown for booking:', currentBooking.id);
        const result = await calculatePaymentBreakdown(currentBooking.id);
        if (!result?.success) {
          console.error('[Checkout] Failed to fetch payment breakdown:', result?.message);
          setError(result?.message || 'Failed to load payment information');
        }
      }
    };

    fetchBreakdown();
  }, [currentStep, currentBooking?.id]);

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
          goToStepWithCleanup('SUMMARY');
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
          goToStepWithCleanup('SUMMARY');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setError(response?.message || t('errorPaymentManual'));
        }
      }
    } catch (err: any) {
      setError(err.message || t('errorFinalSync'));
    }
  };

  const clearAllErrors = () => {
    setError(null);
    clearError();
  };

  // Vehicle and basic flow data must be loaded
  if (vehicleLoading || (flowLoading && !isInitialized)) {
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
    const baseUrl = process.env.NEXT_PUBLIC_IMAGE_URL || 'http://3.111.162.90:5000';
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

            {(error || flowError) && (
              <Alert variant="destructive" className="rounded-xl border-2">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="ml-2 text-[11px] font-bold tracking-tight uppercase">
                  {error || flowError}
                </AlertDescription>
              </Alert>
            )}

            {isCheckingAvailability && (
              <Alert className="rounded-xl border-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <AlertDescription className="ml-2 text-[11px] font-bold tracking-tight uppercase">
                  {t('verifyingAvailability')}
                </AlertDescription>
              </Alert>
            )}

            <Card className="overflow-hidden rounded-xl border-none ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
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
                      {STEPS.find((s) => s.id === currentStep)?.label}
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-gray-400">
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
                    isLoading={flowLoading || bookingLoading}
                  />
                )}

                {currentStep === 'DOCUMENTS' && (
                  <DocumentStep
                    profile={profile}
                    onNext={handleDocumentsNext}
                    onBack={() => goToStepWithCleanup('IDENTITY')}
                    isLoading={flowLoading || bookingLoading}
                    onProfileRefresh={initializeFlow}
                  />
                )}

                {currentStep === 'PAYMENT' && (
                  <PaymentMethodForm
                    breakdown={paymentBreakdown}
                    onNext={handlePaymentNext}
                    onBack={() => goToStepWithCleanup('DOCUMENTS')}
                    isLoading={bookingLoading}
                  />
                )}

                {currentStep === 'SUMMARY' && (
                  <div className="flex flex-col items-center justify-center space-y-8 py-16 text-center">
                    <div className="relative">
                      <div className="bg-primary/20 rounded-full p-8 text-white">
                        <BadgeCheck className="h-20 w-20 stroke-[2.5]" />
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
                        onClick={() => router.push('/profile?tab=active')}
                        className="h-12 flex-1 rounded-xl text-xs font-black tracking-widest uppercase"
                      >
                        {t('manageAssets')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/vehicles')}
                        className="h-12 flex-1 rounded-xl border-2 text-xs font-black tracking-widest uppercase"
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
            <div className="sticky top-28 space-y-6">
              <Card className="overflow-hidden rounded-xl border-none ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
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
