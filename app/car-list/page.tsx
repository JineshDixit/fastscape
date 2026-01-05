'use client';

import CarFilter from '@/components/car-components/carFilter';
import Image from 'next/image';
import { useVehicle } from '../axios';
import VehicleCard from '@/components/car-components/vehicleCard';
import { useEffect } from 'react';

const CarListPage = () => {
  const { vehicles, fetchVehicles } = useVehicle();

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return (
    <main className="global-container mb-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[310px_1fr]">
        <aside className="sticky top-20 hidden h-fit flex-col gap-4 pt-12 lg:flex">
          <span className="text-md leading-6 font-bold">Explore the Fleet By Categories</span>
          <CarFilter />
        </aside>
        <div className="space-y-6">
          <Image
            src="/images/car-listing/header-banner.png"
            alt="Header Banner"
            width={2000}
            height={2000}
            className="object-cover"
          />
          <section className="mt-15">
            <h3 className="text-center text-lg font-semibold">Explore</h3>
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
