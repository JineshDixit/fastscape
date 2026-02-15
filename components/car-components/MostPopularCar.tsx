'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Vehicle } from '@/common/interfaces';
import { useRouter } from '@/localization/navigation';
import { useTranslations } from 'next-intl';
import { Users2, GripVertical, Zap, Gauge } from 'lucide-react';
import { AspectRatio } from '../ui/aspect-ratio';

interface MostPopularCarProps {
  vehicle: Vehicle & { bookingCount: number };
  className?: string;
}

const MostPopularCar: React.FC<MostPopularCarProps> = ({ vehicle, className }) => {
  const router = useRouter();
  const t = useTranslations('home');
  const tCarList = useTranslations('carList');
  const tEnum = useTranslations('vehicleDetails.enums');

  const formatBookingCount = (count: number) => {
    if (count >= 1000000) {
      return `Over ${(count / 1000000).toFixed(1)}M+ People Booked`;
    } else if (count >= 100000) {
      return `Over ${(count / 100000).toFixed(1)}L+ People Booked`;
    } else if (count >= 1000) {
      return `Over ${(count / 1000).toFixed(1)}K+ People Booked`;
    }
    return `${count}+ People Booked`;
  };

  const fetchImage = (imagePath: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_IMAGE_URL || 'http://localhost:3001';
    return `${baseUrl}/${imagePath.replace(/\\/g, '/')}`;
  };

  const getDisplayImage = () => {
    const primaryMedia = vehicle.media?.find((m) => m.isPrimary) || vehicle.media?.[0];
    return primaryMedia?.leftSideImage ? fetchImage(primaryMedia.leftSideImage) : '/placeholder-car.png';
  };

  return (
    <div className={`w-current relative flex h-full flex-col items-center ${className || ''} w-full`}>

      <div className="absolute top-0 left-10 z-20">
        <Badge className="rounded-full border-none bg-[#EFBF5F] px-6 py-2 text-sm font-medium text-gray-800 hover:bg-[#dfaf4f]">
          Hot Choice
        </Badge>
      </div>

      <div className="relative z-10 -mb-8 w-full max-w-[280px] transition-transform duration-300 hover:scale-105">
        <AspectRatio ratio={16 / 9} className='overflow-hidden rounded-lg'>
          <img
            src={getDisplayImage()}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="h-full w-full object-contain"
          />
        </AspectRatio>
      </div>

      <div className="border-border bg-muted flex w-full flex-col items-center gap-6 rounded-3xl border p-10 text-start">
        <div className="flex w-full flex-col gap-4">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">
              {vehicle.make} {vehicle.model} {vehicle.year} {vehicle.trim}
            </h3>

            <div className="flex flex-wrap items-center justify-start gap-x-6 gap-y-3 text-sm font-medium text-gray-500">
              <div className="flex items-center gap-2">
                <Users2 className="h-4 w-4" />
                <span>{vehicle.passengerCapacity}</span>
              </div>
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4" />
                <span>{tEnum(vehicle.transmission.toLowerCase() as any)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>{tEnum(vehicle.drivetrain.toLowerCase() as any)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                <span>{vehicle.fuelConsumption} Kmpl</span>
              </div>
            </div>

            <p className="text-[15px] leading-relaxed text-gray-500">
              {formatBookingCount(vehicle.bookingCount)} the {vehicle.make} {vehicle.model} {vehicle.year} over the Past
              5 Years.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <Button
              variant="default"
              className="rounded-xl bg-black py-5 font-semibold text-white hover:bg-gray-800"
              onClick={() => router.push(`/vehicles/${vehicle.id}`)}
            >
              View Car Details
            </Button>
            <Button
              className="rounded-xl border-none bg-primary py-5 font-semibold text-primary-foreground hover:bg-primary/80"
              onClick={() => router.push(`/vehicles/${vehicle.id}?action=book`)}
            >
              Book the Car
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MostPopularCar;
