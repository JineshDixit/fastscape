'use client';

import { useVehicle } from '@/app/axios';
import { useEffect, use, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { vehicleService } from '@/app/axios/services/vehicle';
import VehicleImageGallery from '@/components/car-components/VehicleImageGallery';
import VehicleSpecsTable from '@/components/car-components/VehicleSpecsTable';
import AvailabilitySelector from '@/components/car-components/AvailabilitySelector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, parseISO } from 'date-fns';
import { useRouter } from '@/localization/navigation';
import { toast } from 'sonner';

const VehicleDetailsPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params);
  const router = useRouter();
  const { vehicle, fetchVehicleById, isLoading, error, bookingData, setBookingData } = useVehicle();
  const t = useTranslations('vehicleDetails');
  const tCommon = useTranslations('common');
  const [isChecking, setIsChecking] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<boolean | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Ensure client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  const checkVehicleAvailability = useCallback(
    async (start: string, end: string) => {
      if (!id) return;
      setIsChecking(true);
      try {
        const response = await vehicleService.checkAvailability(id, start, end);
        if (response.success) {
          setAvailabilityStatus(response.data?.isAvailable ?? false);
        }
      } catch (err) {
        console.error('Availability check failed', err);
      } finally {
        setIsChecking(false);
      }
    },
    [id],
  );

  useEffect(() => {
    if (id) {
      fetchVehicleById(id);
    }
  }, [fetchVehicleById, id]);

  useEffect(() => {
    if (bookingData.pickupDate && bookingData.dropoffDate && id && availabilityStatus === null) {
      checkVehicleAvailability(bookingData.pickupDate, bookingData.dropoffDate);
    }
  }, [bookingData.pickupDate, bookingData.dropoffDate, id, checkVehicleAvailability, availabilityStatus]);

  const handleServiceChange = (type: 'SELF_DRIVE' | 'CHAUFFEUR') => {
    setBookingData({ bookingType: type });
  };

  const handleDateChange = async (start: Date, end: Date | null) => {
    setAvailabilityStatus(null);

    // Use local date format to avoid timezone issues
    const formatDateForAPI = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const pickupDate = formatDateForAPI(start);
    const dropoffDate = end ? formatDateForAPI(end) : null;

    setBookingData({ pickupDate, dropoffDate });
    if (pickupDate && dropoffDate) {
      checkVehicleAvailability(pickupDate, dropoffDate);
    }
  };

  const handleLocationChange = (data: { pickupLocation?: string; dropoffLocation?: string }) => {
    setBookingData(data);
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">{t('vehicleNotFound')}</h2>
        <p className="text-gray-600">{t('notFoundDescription')}</p>
        <Button onClick={() => window.history.back()}>{tCommon('cancel')}</Button>
      </div>
    );
  }

  const days =
    bookingData.pickupDate && bookingData.dropoffDate
      ? differenceInDays(parseISO(bookingData.dropoffDate), parseISO(bookingData.pickupDate)) + 1
      : 0;

  const totalPrice = days * parseFloat(vehicle.pricePerDay);

  // Format price consistently for SSR/CSR
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US').format(price);
  };

  const isFormValid = !!(
    bookingData.pickupDate &&
    bookingData.dropoffDate &&
    bookingData.pickupLocation?.trim() &&
    bookingData.dropoffLocation?.trim() &&
    availabilityStatus === true
  );
  const canProceedToCheckout = isFormValid && !isChecking;

  return (
    <main className="global-container py-8 md:py-16">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24">
        <div className="flex flex-col gap-10">
          <VehicleImageGallery media={vehicle.media} model={vehicle.model} />

          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('specifications')}</h2>
            <VehicleSpecsTable vehicle={vehicle} />
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-3xl font-extrabold text-gray-900 md:text-4xl">
                {vehicle.make} {vehicle.model}
              </h1>
              <Badge
                variant={
                  !isClient
                    ? vehicle.isAvailable
                      ? 'success'
                      : 'destructive'
                    : isChecking
                      ? 'secondary'
                      : availabilityStatus === true
                        ? 'success'
                        : availabilityStatus === false
                          ? 'destructive'
                          : vehicle.isAvailable
                            ? 'success'
                            : 'destructive'
                }
                className="px-4 py-1.5 text-sm font-semibold capitalize"
              >
                {!isClient
                  ? vehicle.isAvailable
                    ? t('available')
                    : t('unavailable')
                  : isChecking
                    ? t('checking')
                    : availabilityStatus === true
                      ? t('available')
                      : availabilityStatus === false
                        ? t('unavailable')
                        : vehicle.isAvailable
                          ? t('available')
                          : t('unavailable')}
              </Badge>
            </div>
            <p className="text-lg font-medium text-gray-500">
              {vehicle.bodyType} - {vehicle.city}
            </p>
          </div>

          <div className="flex items-baseline gap-2 border-b border-gray-100 pb-5">
            <span className="text-primary text-2xl font-black">
              {vehicle.currency || '$'}
              {vehicle.pricePerDay}
            </span>
            <span className="text-lg font-bold text-gray-400">/ {t('day')}</span>
          </div>

          <AvailabilitySelector
            bookingData={bookingData}
            onServiceChange={handleServiceChange}
            onDateChange={handleDateChange}
            onLocationChange={handleLocationChange}
          />

          <div className="mt-2 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex justify-between text-base font-semibold text-gray-600">
              <span>{t('totalDays')}</span>
              <span>
                {days} {days === 1 ? t('day') : t('days')}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-50 text-xl font-bold text-gray-900">
              <span>{t('totalPrice')}</span>
              <div className="flex flex-col items-end">
                <span>
                  {vehicle.currency || '$'}
                  {isClient ? formatPrice(totalPrice) : totalPrice.toString()}
                </span>
                <span className="text-[10px] font-normal text-gray-400">
                  {t('deposit')}: {vehicle.depositPercentage || '0'}%
                </span>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-gray-400">{t('priceDisclaimer')}</p>
          </div>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
            <Button
              className="text-md w-full rounded-md py-5 transition-all md:w-40"
              disabled={!canProceedToCheckout}
              onClick={() => {
                if (canProceedToCheckout) {
                  router.push(`/checkout/${vehicle.id}`);
                } else if (!bookingData.pickupDate || !bookingData.dropoffDate) {
                  toast.error(t('pleaseSelectPickupAndDropoffDates'));
                } else if (!bookingData.pickupLocation?.trim() || !bookingData.dropoffLocation?.trim()) {
                  toast.error(t('pleaseSelectPickupAndDropoffLocations'));
                } else if (availabilityStatus === false) {
                  toast.error(t('vehicleNotAvailable'));
                }
              }}
            >
              {isChecking
                ? t('checking')
                : !bookingData.pickupDate || !bookingData.dropoffDate
                  ? 'Select Dates'
                  : !bookingData.pickupLocation?.trim() || !bookingData.dropoffLocation?.trim()
                    ? 'Select Locations'
                    : availabilityStatus === false
                      ? 'Not Available'
                      : t('makePayment')}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default VehicleDetailsPage;

