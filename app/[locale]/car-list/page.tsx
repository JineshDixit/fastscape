'use client';

import CarFilter from '@/components/car-components/carFilter';
import Image from 'next/image';
import { useVehicle } from '@/app/axios';
import VehicleCard from '@/components/car-components/vehicleCard';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

const CarListPage = () => {
  const t = useTranslations('carList');
  const { vehicles, fetchVehicles } = useVehicle();

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return (
    <main className="global-container mb-8">
      <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr]">
        <aside className="shadow-booking-engine sticky top-24 hidden h-fit flex-col gap-3 rounded-2xl px-4 py-6 md:gap-4 md:px-6 md:py-8 lg:flex xl:rounded-3xl">
          <span className="text-base leading-6 font-bold md:text-lg">{t('title')}</span>
          <CarFilter />
        </aside>
        <div className="space-y-6">
          <Image
            src="/images/car-listing/list-car-img.png"
            alt="Header Banner"
            width={2000}
            height={2000}
            className="object-cover"
          />
          <section className="mt-15">
            <h3 className="text-center text-lg font-semibold">{t('explore')}</h3>
            <div className="mt-5 grid grid-cols-1 justify-items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((item) => (
                <VehicleCard key={item.id} vehicle={item} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default CarListPage;
