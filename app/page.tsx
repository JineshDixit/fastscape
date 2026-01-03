'use client';

import { CarSearchForm } from '@/components/car-components/carSearchForm';
import { AvatarImage } from '@/components/ui/avatar';
import { Avatar } from '@radix-ui/react-avatar';
import Image from 'next/image';
import { useVehicle } from './axios/hooks/useVehicle';
import { useEffect, useMemo } from 'react';
import VehicleCard from '@/components/car-components/vehicleCard';

const Home = () => {
  const { bodyTypeSummary, fetchBodyTypeSummary, vehicles, fetchVehicles } = useVehicle();

  useEffect(() => {
    fetchBodyTypeSummary();
    fetchVehicles({ bodyType: 'Supercar' });
  }, []);

  const fleetCategoryData = useMemo(() => {
    const map: Record<string, number> = {};

    bodyTypeSummary.forEach(({ bodyType, count }) => {
      map[bodyType.toLowerCase()] = count;
    });

    return {
      hatchback: map['hatchback'] ?? 0,
      sedan: map['sedan'] ?? 0,
      supercar: map['supercar'] ?? 0,
      suv: map['suv'] ?? 0,
    };
  }, [bodyTypeSummary]);

  return (
    <main className="global-container mb-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="sticky top-20 hidden h-fit flex-col gap-4 pt-12 lg:flex">
          <span className="text-md leading-6 font-bold">Want to Rent A Car Easily, Without Any Hassles?</span>
          <CarSearchForm />
        </aside>
        <div className="space-y-6">
          <div className="bg-primary relative flex h-[calc(100vh-22.3rem)] w-full items-center justify-end-safe overflow-hidden rounded-xl">
            <Image
              src="/images/hero-car-clip.png"
              alt="Hero Car Image"
              width={850}
              height={850}
              className="object-cover"
            />
            <div className="text-background absolute top-15 left-12 max-w-[290px]">
              <h1 className="text-3xl font-bold">Fast rides. Smooth journeys. Zero hassle.</h1>
            </div>
            <div className="text-background absolute bottom-15 left-12 flex items-center gap-2">
              <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
                <Avatar>
                  <AvatarImage className="size-12" src="/images/first-avatar.png" alt="First Avatar" />
                </Avatar>
                <Avatar>
                  <AvatarImage className="size-12" src="/images/second-avatar.png" alt="Second Avatar" />
                </Avatar>
                <Avatar>
                  <AvatarImage className="size-12" src="/images/third-avatar.png" alt="Third Avatar" />
                </Avatar>
              </div>
              <span className="font-semibold">Over 1000+ Vehicles</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Image
                src="/images/hero-chauffeurs.png"
                alt="Hero Car Image"
                width={500}
                height={500}
                className="object-cover"
              />
            </div>
            <div></div>
          </div>
          <section className="mt-10">
            <h3 className="text-center text-lg font-semibold">Explore Fleet Categories</h3>
            <div className="mt-20 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: 'Hatchback',
                  img: '/images/home-hatchback.png',
                  count: fleetCategoryData.hatchback,
                },
                {
                  label: 'Sedan',
                  img: '/images/home-sedan.png',
                  count: fleetCategoryData.sedan,
                },
                {
                  label: 'Super Car',
                  img: '/images/home-supercar.png',
                  count: fleetCategoryData.supercar,
                },
                {
                  label: 'SUV',
                  img: '/images/home-suv.png',
                  count: fleetCategoryData.suv,
                },
              ].map((item) => (
                <div key={item.label} className="relative flex flex-col items-center">
                  <Image
                    src={item.img}
                    alt={item.label}
                    width={240}
                    height={240}
                    className="absolute -top-17 left-1/2 z-10 -translate-x-1/2"
                  />

                  <div className="bg-foreground/10 flex w-full max-w-[280px] flex-col items-center rounded-2xl pt-10 pb-5">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span className="text-muted-foreground text-sm">{item.count} Options</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="mt-10">
            <h3 className="text-center text-lg font-semibold">For the Luxury</h3>
            <div className="mt-5 grid grid-cols-1 justify-items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

export default Home;
