'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Car, Compass, ShieldCheck, AlertCircle, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { Vehicle } from '@/common/interfaces';

interface JourneySummaryProps {
  vehicle: Vehicle;
  bookingData: {
    pickupDate: string | null;
    dropoffDate: string | null;
    pickupLocation: string | null;
    bookingType: 'SELF_DRIVE' | 'CHAUFFEUR';
  };
  onNext: () => void;
  onBackToVehicles?: () => void;
  availabilityStatus?: boolean | null;
  isCheckingAvailability?: boolean;
}

const JourneySummary: React.FC<JourneySummaryProps> = ({
  vehicle,
  bookingData,
  onNext,
  onBackToVehicles,
  availabilityStatus,
  isCheckingAvailability,
}) => {
  const t = useTranslations('vehicleDetails');
  const tSummary = useTranslations('summaryStep');
  const tCheckout = useTranslations('checkout');

  return (
    <div className="animate-in fade-in space-y-8 py-4 duration-500">
      <div className="space-y-6">
        <div className="bg-primary/5 border-primary/20 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center">
          <div className="bg-primary/10 text-primary mb-6 flex h-16 w-16 items-center justify-center rounded-2xl">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-black tracking-tight text-gray-950 uppercase italic dark:text-white">
            {tSummary('readinessConfirmed')}
          </h3>
          <p className="mt-2 max-w-sm text-sm font-medium text-gray-500">
            {tSummary.rich('primedDesc', {
              make: vehicle.make,
              model: vehicle.model,
              span: (chunks) => <span className="font-bold text-gray-950 dark:text-white">{chunks}</span>,
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-gray-50 p-6 dark:bg-gray-800/50">
            <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
              {tSummary('stepObjectives')}
            </p>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center gap-3 text-xs font-bold text-gray-600 dark:text-gray-300">
                <Check className="text-primary h-4 w-4" /> {tSummary('identityVerification')}
              </li>
              <li className="flex items-center gap-3 text-xs font-bold text-gray-600 dark:text-gray-300">
                <Check className="text-primary h-4 w-4" /> {tSummary('licenseSync')}
              </li>
              <li className="flex items-center gap-3 text-xs font-bold text-gray-600 dark:text-gray-300">
                <Check className="text-primary h-4 w-4" /> {tSummary('financialAuth')}
              </li>
            </ul>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border-2 border-gray-100 p-6 dark:border-gray-800">
            <div>
              <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                {tSummary('protectionLevel')}
              </p>
              <p className="mt-1 text-sm font-black text-gray-900 dark:text-white">{tSummary('protectionValue')}</p>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-[10px] font-black text-green-600 uppercase">
              <ShieldCheck className="h-4 w-4" /> {tSummary('secureGaranted')}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 md:flex-row dark:border-gray-800">
        <Button
          onClick={onBackToVehicles}
          variant="outline"
          className="h-12 w-full rounded-xl border-2 px-8 text-xs font-black tracking-widest uppercase md:w-auto"
        >
          {tSummary('abort')}
        </Button>

        <Button
          onClick={onNext}
          disabled={availabilityStatus === false || isCheckingAvailability}
          className={cn(
            'group relative overflow-hidden rounded-xl px-10 py-6 text-xs font-black tracking-widest uppercase transition-all duration-500 hover:scale-[1.05] hover:shadow-2xl md:w-auto',
            availabilityStatus === false
              ? 'cursor-not-allowed bg-red-500 hover:bg-red-600'
              : isCheckingAvailability
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-primary shadow-primary/20 shadow-xl',
          )}
        >
          <span className="relative z-10 flex items-center gap-3">
            {isCheckingAvailability ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {tCheckout('verifyingAvailability')}
              </>
            ) : availabilityStatus === false ? (
              <>
                <AlertCircle className="h-4 w-4" />
                {t('unavailable')}
              </>
            ) : (
              <>
                {tSummary('initializeHandshake')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </span>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transition-all duration-500 group-hover:h-full group-hover:bg-white/5" />
        </Button>
      </div>
    </div>
  );
};

export default JourneySummary;
