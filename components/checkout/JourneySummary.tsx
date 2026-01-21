'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Car, Compass, ShieldCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTranslations } from 'next-intl';
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
}

const JourneySummary: React.FC<JourneySummaryProps> = ({ vehicle, bookingData, onNext }) => {
  const t = useTranslations('vehicleDetails');
  const baseUrl = process.env.NEXT_PUBLIC_IMAGE_URL || 'http://localhost:3001';

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return format(parseISO(dateStr), 'EEE, MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const getFullUrl = (path: string) => {
    if (!path) return '';
    return `${baseUrl}/${path.replace(/\\/g, '/')}`;
  };

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.618fr_1fr]">
        <div className="group relative overflow-hidden rounded-4xl bg-gray-50 dark:bg-gray-800/50">
          <div className="aspect-video overflow-hidden">
            <img
              src={getFullUrl(vehicle.media?.[0]?.leftSideImage || '/placeholder-car.png')}
              alt={vehicle.model}
              className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
          </div>

          <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-transparent to-transparent opacity-60" />

          <div className="absolute right-8 bottom-8 left-8 flex items-end justify-between">
            <div className="space-y-1">
              <span className="text-[9px] font-black tracking-[0.3em] text-white uppercase">Selected Machine</span>
              <h3 className="text-2xl font-black text-white md:text-3xl">
                {vehicle.make} <span className="text-primary italic">{vehicle.model}</span>
              </h3>
            </div>

            <div className="hidden flex-col items-end gap-1 sm:flex">
              <div className="flex gap-2">
                <span className="flex items-center rounded-full bg-white/5 px-4 py-1.5 text-[10px] font-bold tracking-widest text-white uppercase ring-1 ring-white/20 backdrop-blur-md">
                  {vehicle.transmission}
                </span>
                <span className="bg-primary flex items-center shadow-primary/20 rounded-full px-4 py-1.5 text-[10px] font-bold tracking-widest text-white uppercase shadow-lg">
                  {bookingData.bookingType === 'CHAUFFEUR' ? 'Premium Chauffeur' : 'Pure Performance'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center space-y-6 px-4 lg:px-0">
          <div className="relative space-y-6">
            <div className="from-primary via-primary/50 absolute top-8 bottom-8 left-[23px] w-[2px] bg-linear-to-b to-transparent opacity-20" />

            <div className="group relative flex items-center gap-4">
              <div className="group-hover:ring-primary/20 z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-md ring-1 shadow-gray-200/50 ring-gray-50 transition-all duration-300 group-hover:scale-110 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800">
                <Compass className="text-primary h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-black tracking-widest text-gray-400 uppercase">Departure</p>
                <p className="text-lg font-bold text-gray-950 dark:text-white">{formatDate(bookingData.pickupDate)}</p>
                <p className="text-xs font-medium text-gray-400">
                  {bookingData.pickupLocation || 'Dubai International'}
                </p>
              </div>
            </div>

            <div className="ml-4 flex items-center gap-4 py-2">
              <div className="border-primary/20 h-4 w-4 rounded-full border-2 bg-white dark:bg-gray-900" />
              <div className="from-primary/20 h-px flex-1 bg-linear-to-r to-transparent" />
              <span className="text-primary/60 text-[9px] font-black tracking-[0.2em] uppercase italic">
                Elite Rental
              </span>
            </div>

            <div className="group relative flex items-center gap-4">
              <div className="group-hover:ring-primary/20 z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-md ring-1 shadow-gray-200/50 ring-gray-50 transition-all duration-300 group-hover:scale-110 dark:bg-gray-900 dark:shadow-none dark:ring-gray-800">
                <Car className="text-primary h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-black tracking-widest text-gray-400 uppercase">Return</p>
                <p className="text-lg font-bold text-gray-950 dark:text-white">{formatDate(bookingData.dropoffDate)}</p>
                <p className="text-xs font-medium text-gray-400">Same as Pickup Location</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-5 md:flex-row dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-500">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black tracking-tight text-gray-950 uppercase dark:text-white">
              Price Protection Enabled
            </p>
            <p className="text-[10px] font-medium text-gray-400 italic">No hidden fees at pickup, guaranteed.</p>
          </div>
        </div>

        <Button
          onClick={onNext}
          className="group bg-primary hover:shadow-primary/30 animate-in fade-in slide-in-from-right-10 relative px-5 py-5 overflow-hidden rounded-md text-xs font-black tracking-widest uppercase transition-all duration-500 hover:scale-[1.02] hover:shadow-xl md:w-auto"
        >
          <span className="relative z-10 flex items-center gap-3">
            Configure Profile
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transition-all duration-500 group-hover:h-full group-hover:bg-white/5" />
        </Button>
      </div>
    </div>
  );
};

export default JourneySummary;
