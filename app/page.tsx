'use client';

import { CarSearchForm } from '@/components/car-components/carSearchForm';
import { AvatarImage } from '@/components/ui/avatar';
import { Avatar } from '@radix-ui/react-avatar';
import Image from 'next/image';
import { useVehicle } from './axios/hooks/useVehicle';
import { useEffect, useMemo } from 'react';
import VehicleCard from '@/components/car-components/vehicleCard';
import { Separator } from '@/components/ui/separator';

const Home = () => {
  const { bodyTypeSummary, fetchBodyTypeSummary, vehicles, fetchVehicles } = useVehicle();

  useEffect(() => {
    fetchBodyTypeSummary();
    fetchVehicles({ bodyType: 'Supercar', limit: 4 });
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
          <section className="mt-15">
            <h3 className="text-center text-lg font-semibold">Explore Fleet Categories</h3>
            <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  img: '/images/home-super-car.png',
                  count: fleetCategoryData.supercar,
                },
                {
                  label: 'SUV',
                  img: '/images/home-suv.png',
                  count: fleetCategoryData.suv,
                },
              ].map((item) => (
                <div key={item.label} className="relative flex w-full flex-col items-center">
                  <div className="relative z-10 -mb-8">
                    <Image
                      src={item.img}
                      alt={item.label}
                      width={240}
                      height={240}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="bg-foreground/10 flex w-full flex-col gap-2 rounded-2xl px-6 pt-10 pb-5">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span className="text-muted-foreground text-sm">{item.count} Options</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="mt-15">
            <h3 className="text-center text-lg font-semibold">For the Luxury</h3>
            <div className="mt-5 grid grid-cols-1 justify-items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {vehicles.map((item) => (
                <VehicleCard key={item.id} vehicle={item} />
              ))}
            </div>
          </section>
          <section className="mt-15">
            <h3 className="text-center text-lg font-semibold">Brands We Work with</h3>
            <div className="mt-5 flex items-center justify-center gap-5 opacity-55 select-none">
              {[
                { label: 'BMW', img: '/brands/bmw-brand.png' },
                { label: 'Jaguar', img: '/brands/jaguar-brand.png' },
                { label: 'honda', img: '/brands/honda-brand.png' },
                { label: 'Toyota', img: '/brands/toyota-brand.png' },
                { label: 'Volkswagen', img: '/brands/volkswagen-brand.png' },
                { label: 'Hyundai', img: '/brands/hyundai-brand.png' },
              ].map((brand, index) => (
                <Image
                  key={`${brand.label}-${index}`}
                  src={brand.img}
                  alt={brand.label}
                  width={90}
                  height={90}
                  className="aspect-7/4 object-contain bg-blend-color-burn"
                />
              ))}
            </div>
          </section>
          <section className="mt-15 w-full rounded-3xl bg-gray-300 py-14">
            <h3 className="mb-14 text-center text-lg font-semibold">Getting a ride is easy. Really easy.</h3>

            <div className="relative mx-auto max-w-3xl px-12">
              <Separator className="relative mx-auto max-w-2/3 -mb-6 bg-gray-500" />

              <div className="relative z-10 flex justify-between">
                {[
                  {
                    step: '01',
                    title: 'Choose your ride',
                    desc: 'Select a car that fits your trip and budget.',
                  },
                  {
                    step: '02',
                    title: 'Confirm instantly',
                    desc: 'See final pricing upfront—no surprises.',
                  },
                  {
                    step: '03',
                    title: 'Sit back & relax',
                    desc: 'Verified drivers get you there on time.',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex max-w-[200px] flex-col items-center text-center">
                    <div className="relative mb-5 flex h-12 w-12 items-center justify-center">
                      <div className="absolute h-12 w-12 rotate-45 rounded-lg bg-sky-500" />
                      <span className="relative text-sm font-semibold text-white">{item.step}</span>
                    </div>

                    <h4 className="text-sm font-semibold">{item.title}</h4>
                    <p className="mt-1 text-xs text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Home;
