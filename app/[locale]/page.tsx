'use client';

import { CarSearchForm } from '@/components/car-components/carSearchForm';
import { MobileSearchSheet } from '@/components/car-components/MobileSearchSheet';
import Image from 'next/image';
import { useVehicle } from '@/app/axios';
import { useEffect, useMemo } from 'react';
import VehicleCard from '@/components/car-components/vehicleCard';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/localization/navigation';

const Home = () => {
  const t = useTranslations('home');
  const tFilter = useTranslations('carFilter');
  const { bodyTypeSummary, fetchBodyTypeSummary, vehicles, fetchVehicles } = useVehicle();
  const router = useRouter();

  useEffect(() => {
    fetchBodyTypeSummary();
    fetchVehicles({ bodyType: 'Supercar', limit: 4 });
  }, [fetchBodyTypeSummary, fetchVehicles]);

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
    <main className="relative global-container mb-8">
      {/* Mobile Search FAB */}
      <MobileSearchSheet />
      
      <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr]">
        <aside className="sticky top-28 hidden h-fit flex-col gap-3 rounded-2xl border-2 border-border bg-card px-4 py-6 md:gap-4 md:px-6 md:py-8 lg:flex xl:rounded-3xl">
          <span className="text-lg font-bold leading-6 md:text-xl">{t('rentCar')}</span>
          <CarSearchForm />
        </aside>
        <div className="space-y-6">
          <Image
            src="/images/hero-car-clip-img.png"
            alt="Hero Car Image"
            width={850}
            height={850}
            className="w-full object-cover"
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Image
                src="/images/hero-chauffeurs.png"
                alt="Professional Chauffeur Service"
                width={500}
                height={500}
                className="object-cover"
              />
            </div>
            <div></div>
          </div>
          <section className="mt-15">
            <h3 className="text-center text-lg font-semibold">{t('exploreFleet')}</h3>
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

                  <div className="flex w-full flex-col items-center gap-2 rounded-2xl border border-border bg-muted px-6 pb-5 pt-10">
                    <span className="text-sm font-semibold">
                      {tFilter(item.label.toLowerCase().replace(' ', '') as any)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {item.count} {tFilter('options')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="mt-15">
            <h3 className="text-center text-lg font-semibold">{t('luxury')}</h3>
            <div className="mt-5 grid grid-cols-1 justify-items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {vehicles.map((item) => (
                <VehicleCard key={item.id} vehicle={item} onClick={() => router.push(`/vehicles/${item.id}`)} />
              ))}
            </div>
          </section>
          <section className="mt-15 px-4">
            <h3 className="text-center text-lg font-semibold">{t('brands')}</h3>
            <div className="mt-5 grid grid-cols-2 gap-4 opacity-55 select-none sm:grid-cols-3 md:flex md:items-center md:justify-center md:gap-5">
              {[
                { label: 'BMW', img: '/brands/bmw-brand.png' },
                { label: 'Jaguar', img: '/brands/jaguar-brand.png' },
                { label: 'honda', img: '/brands/honda-brand.png' },
                { label: 'Toyota', img: '/brands/toyota-brand.png' },
                { label: 'Volkswagen', img: '/brands/volkswagen-brand.png' },
                { label: 'Hyundai', img: '/brands/hyundai-brand.png' },
              ].map((brand, index) => (
                <div key={`${brand.label}-${index}`} className="flex items-center justify-center">
                  <Image
                    src={brand.img}
                    alt={brand.label}
                    width={90}
                    height={90}
                    className="aspect-7/4 object-contain bg-blend-color-burn w-full max-w-[90px]"
                  />
                </div>
              ))}
            </div>
          </section>
          <section className="mt-15 w-full rounded-3xl border border-border bg-muted py-14">
            <h3 className="mb-14 text-center text-lg font-semibold">{t('easyRide.title')}</h3>

            <div className="relative mx-auto max-w-3xl px-12">
              <Separator className="relative mx-auto -mb-6 max-w-2/3 bg-border" />

              <div className="relative z-10 flex justify-between">
                {[
                  {
                    step: '01',
                    title: t('easyRide.step1'),
                    desc: t('easyRide.step1Desc'),
                  },
                  {
                    step: '02',
                    title: t('easyRide.step2'),
                    desc: t('easyRide.step2Desc'),
                  },
                  {
                    step: '03',
                    title: t('easyRide.step3'),
                    desc: t('easyRide.step3Desc'),
                  },
                ].map((item) => (
                  <div key={item.step} className="flex max-w-[200px] flex-col items-center text-center">
                    <div className="relative mb-5 flex h-12 w-12 items-center justify-center">
                      <div className="absolute h-12 w-12 rotate-45 rounded-lg bg-primary" />
                      <span className="relative text-sm font-semibold text-primary-foreground">{item.step}</span>
                    </div>

                    <h4 className="text-sm font-semibold">{item.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="mt-15">
            <h3 className="text-center text-lg font-semibold">{t('whyChoose.title')}</h3>
            <div className="mt-5 flex items-center justify-between gap-5">
              {[
                {
                  title: t('whyChoose.driverTitle'),
                  desc: t('whyChoose.driverDesc'),
                },
                {
                  title: t('whyChoose.deliveryTitle'),
                  desc: t('whyChoose.deliveryDesc'),
                },
                {
                  title: t('whyChoose.supportTitle'),
                  desc: t('whyChoose.supportDesc'),
                },
              ].map((items, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="text-primary font-semibold">{items.title}</h4>
                  <p className="text-foreground">{items.desc}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="mt-17">
            <div className="grid grid-cols-[auto_1fr] gap-20">
              <Image src="/images/hero-driver.png" alt="hero-driver" width={350} height={350} />
              <div className="my-auto space-y-3 text-start">
                <h4 className="text-primary">{t('partnerships.subtitle')}</h4>
                <h2 className="text-3xl font-bold">{t('partnerships.title')}</h2>
                <p className="text-foreground">{t('partnerships.desc')}</p>
                <div className="flex items-center gap-8">
                  <div>
                    <h2 className="text-primary text-3xl font-bold">1500+</h2>
                    <span>{t('partnerships.statsVehicles')}</span>
                  </div>
                  <div>
                    <h2 className="text-primary text-3xl font-bold">9+</h2>
                    <span>{t('partnerships.statsStates')}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Home;
