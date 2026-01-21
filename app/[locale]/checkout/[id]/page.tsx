'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from '@/localization/navigation';
import { useVehicle, useUser, useBooking } from '@/app/axios/hooks';
import CheckoutSteppers, { CheckoutStep } from '@/components/checkout/CheckoutSteppers';
import JourneySummary from '@/components/checkout/JourneySummary';
import PersonDetailsForm from '@/components/checkout/PersonDetailsForm';
import DocumentUploadForm from '@/components/checkout/DocumentUploadForm';
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
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { differenceInDays, parseISO } from 'date-fns';

const STEPS: { id: CheckoutStep; label: string }[] = [
  { id: 'JOURNEY', label: 'Journey' },
  { id: 'PERSON', label: 'Person' },
  { id: 'DOCUMENT', label: 'Document' },
  { id: 'PAYMENT', label: 'Payment' },
  { id: 'SUMMARY', label: 'Summary' },
];

const CheckoutPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations('vehicleDetails');

  const { vehicle, fetchVehicleById, bookingData, isLoading: vehicleLoading } = useVehicle();
  const { profile, fetchProfile, updateProfile, isLoading: profileLoading } = useUser();
  const { createBooking, calculatePaymentBreakdown, paymentBreakdown, isLoading: bookingLoading } = useBooking();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('JOURNEY');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchVehicleById(id);
      fetchProfile();
    }
  }, [id, fetchVehicleById, fetchProfile]);

  const handlePersonNext = async (data: any) => {
    try {
      await updateProfile(data);
      setCurrentStep('DOCUMENT');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError('Failed to update profile details');
    }
  };

  const handleDocumentNext = async (files: Record<string, File>) => {
    try {
      if (Object.keys(files).length > 0) {
        await updateProfile(files as any);
      }

      const tempBooking = {
        vehicleId: id,
        startDatetime: bookingData.pickupDate!,
        endDatetime: bookingData.dropoffDate!,
        pickupLocation: bookingData.pickupLocation || 'Dubai',
        dropoffLocation: bookingData.pickupLocation || 'Dubai',
        bookingType: bookingData.bookingType,
      };

      const response = await createBooking(tempBooking as any);
      if (response && response.success && response.data) {
        await calculatePaymentBreakdown(response.data.id);
        setCurrentStep('PAYMENT');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError('Failed to create booking. Please check your dates.');
      }
    } catch (err) {
      setError('Failed to upload documents');
    }
  };

  const handlePaymentNext = async () => {
    setCurrentStep('SUMMARY');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            Initializing Protocol
          </p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="global-container py-20 text-center">
        <h2 className="text-3xl font-black text-gray-900">Vehicle Not Found</h2>
        <p className="mt-2 text-gray-500">The requested machine is unavailable or does not exist.</p>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="mt-8 h-14 rounded-2xl border-2 px-10 text-xs font-black tracking-widest uppercase"
        >
          Return to Hub
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

  // const showSummarySidebar = currentStep !== 'SUMMARY';

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
            <span className="hidden sm:inline">Abort Checkout</span>
          </button>

          <div className="flex items-center gap-6">
            <div className="hidden items-center gap-2.5 rounded-full border border-green-500/10 bg-green-500/5 px-4 py-2 lg:flex">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span className="text-[9px] font-black tracking-widest text-green-600 uppercase">
                Enterprise Security
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
                Elevate your <span className="text-primary italic">Drive.</span>
              </h1>
              <p className="max-w-xl text-base font-medium text-gray-400">
                Configure your elite rental experience with precision.
              </p>
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

            <Card className="overflow-hidden rounded-4xl border-none ring-1 ring-gray-100 transition-all duration-700 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800">
              <CardHeader className="border-b border-gray-50/50 px-8 pt-8 pb-4 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/20 h-1.5 w-10 rounded-full" />
                      <span className="text-primary text-[9px] font-black tracking-[0.4em] uppercase">
                        Step {STEPS.findIndex((s) => s.id === currentStep) + 1}
                      </span>
                    </div>
                    <CardTitle className="text-2xl font-black tracking-tight text-gray-950 dark:text-white">
                      {STEPS.find((s) => s.id === currentStep)?.label} Intel
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-gray-400 italic">
                      {currentStep === 'JOURNEY' && 'Audit your temporal and spatial migration details.'}
                      {currentStep === 'PERSON' && 'Authenticate your identity for our digital records.'}
                      {currentStep === 'DOCUMENT' && 'Authorize your operational permissions.'}
                      {currentStep === 'PAYMENT' && 'Finalize the financial synchronization.'}
                      {currentStep === 'SUMMARY' && 'Your propulsion unit is synchronized and ready.'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-2">
                {currentStep === 'JOURNEY' && (
                  <JourneySummary
                    vehicle={vehicle}
                    bookingData={bookingData}
                    onNext={() => {
                      const isPersonComplete = profile?.fullName && profile?.phone && profile?.city;
                      setCurrentStep(isPersonComplete ? 'DOCUMENT' : 'PERSON');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                )}

                {currentStep === 'PERSON' && (
                  <PersonDetailsForm initialData={profile} onNext={handlePersonNext} isLoading={profileLoading} />
                )}

                {currentStep === 'DOCUMENT' && (
                  <DocumentUploadForm
                    initialData={profile}
                    onNext={handleDocumentNext}
                    onBack={() => setCurrentStep('PERSON')}
                    isLoading={profileLoading || bookingLoading}
                  />
                )}

                {currentStep === 'PAYMENT' && (
                  <PaymentMethodForm
                    breakdown={paymentBreakdown}
                    onNext={handlePaymentNext}
                    onBack={() => setCurrentStep('DOCUMENT')}
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
                        Mission Success.
                      </h2>
                      <p className="mx-auto max-w-sm text-lg leading-relaxed font-medium text-gray-400">
                        Your elite machine is reserved. A confirmation packet has been dispatched to your inbox.
                      </p>
                    </div>

                    <div className="flex w-full max-w-md flex-col gap-4 pt-4 sm:flex-row">
                      <Button
                        onClick={() => router.push('/bookings')}
                        className="shadow-primary/30 h-12 flex-1 rounded-xl text-xs font-black tracking-widest uppercase shadow-xl transition-all hover:scale-105 active:scale-95"
                      >
                        Manage Assets
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/vehicles')}
                        className="h-12 flex-1 rounded-xl border-2 text-xs font-black tracking-widest uppercase transition-all hover:bg-gray-50 active:scale-95"
                      >
                        Explore More
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* {showSummarySidebar && ( */}
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
                          Selected Asset
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
                        <User className="h-8 w-8 rounded-lg" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="truncate text-sm font-black tracking-tighter text-gray-950 uppercase dark:text-white">
                          {profile?.fullName || 'Guest Pilot'}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <Mail className="text-primary h-3 w-3 opacity-50" />
                          <p className="truncate text-[10px] font-bold tracking-tight text-gray-400">
                            {profile?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between rounded-2xl bg-gray-50/50 px-6 py-4 dark:bg-gray-800/50">
                        <div className="flex items-center gap-3">
                          <Calendar className="text-primary h-4 w-4" />
                          <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                            Duration
                          </span>
                        </div>
                        <span className="text-xs font-black text-gray-950 dark:text-white">
                          {days} {days === 1 ? 'Cycle' : 'Cycles'}
                        </span>
                      </div>

                      <div className="group flex cursor-help items-center justify-between px-2">
                        <div className="space-y-1">
                          <span className="group-hover:text-primary text-[10px] font-black tracking-[0.2em] text-gray-300 uppercase transition-colors">
                            Projected Total
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
                        Pricing includes full comprehensive insurance and maintenance coverage for the entire cycle.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          {/* )} */}
        </div>
      </div>
    </main>
  );
};

export default CheckoutPage;
