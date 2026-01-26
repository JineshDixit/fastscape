'use client';

import CarFilter from '@/components/car-components/carFilter';
import { useVehicle } from '@/app/axios';
import VehicleCard from '@/components/car-components/vehicleCard';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/localization/navigation';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const VehiclePage = () => {
  const t = useTranslations('carList');
  const { vehicles, fetchVehicles, searchAvailableVehicles, isLoading, pagination, bookingData } = useVehicle();
  const router = useRouter();

  // Check if we have search criteria (dates and location)
  const hasSearchCriteria = !!(bookingData.pickupDate && bookingData.dropoffDate && bookingData.pickupLocation);

  useEffect(() => {
    if (!pagination && vehicles.length === 0 && !isLoading) {
      if (hasSearchCriteria) {
        // Use search for available vehicles if we have search criteria
        searchAvailableVehicles({
          pickupLocation: bookingData.pickupLocation!,
          pickupDate: bookingData.pickupDate!,
          dropoffDate: bookingData.dropoffDate!,
        });
      } else {
        // Use regular fetch for all available vehicles (filter out unavailable ones)
        fetchVehicles({ isAvailable: true });
      }
    }
  }, [fetchVehicles, searchAvailableVehicles, vehicles.length, isLoading, pagination, hasSearchCriteria, bookingData]);

  const handleVehicleClick = (vehicleId: string) => {
    router.push(`/vehicles/${vehicleId}`);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || (pagination && page > pagination.totalPages)) return;

    if (hasSearchCriteria) {
      // Use search pagination
      searchAvailableVehicles({
        pickupLocation: bookingData.pickupLocation!,
        pickupDate: bookingData.pickupDate!,
        dropoffDate: bookingData.dropoffDate!,
        page,
      });
    } else {
      // Use regular pagination for available vehicles
      fetchVehicles({ page, isAvailable: true });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to render page numbers
  const renderPaginationItems = () => {
    if (!pagination) return null;
    const { page, totalPages } = pagination;
    const items = [];

    // Always show first page
    items.push(
      <PaginationItem key={1}>
        <PaginationLink onClick={() => handlePageChange(1)} isActive={page === 1} className="cursor-pointer">
          1
        </PaginationLink>
      </PaginationItem>,
    );

    if (page > 3) {
      items.push(<PaginationEllipsis key="left-ellipsis" />);
    }

    // Show immediate neighbors
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
      items.push(
        <PaginationItem key={p}>
          <PaginationLink onClick={() => handlePageChange(p)} isActive={page === p} className="cursor-pointer">
            {p}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    if (page < totalPages - 2) {
      items.push(<PaginationEllipsis key="right-ellipsis" />);
    }

    // Always show last page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={page === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      );
    }

    return items;
  };

  return (
    <main className="global-container mb-8">
      <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr]">
        <aside className="border-2 border-gray-100  sticky top-24 hidden h-fit flex-col gap-3 rounded-2xl px-4 py-6 md:gap-4 md:px-6 md:py-8 lg:flex xl:rounded-3xl">
          <span className="text-base leading-6 font-bold md:text-lg">{t('title')}</span>
          <CarFilter />
        </aside>
        <div className="flex flex-col gap-10">
          <section>
            <div className="text-center">
              <h3 className="text-lg font-semibold">{t('exploreCars')}</h3>
            </div>
            <div className="mt-5 grid grid-cols-1 justify-items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
              {vehicles.length > 0 ? (
                vehicles.map((item) => (
                  <VehicleCard key={item.id} vehicle={item} onClick={() => handleVehicleClick(item.id)} />
                ))
              ) : !isLoading ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {hasSearchCriteria ? 'No vehicles available' : 'No vehicles found'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {hasSearchCriteria
                      ? 'No vehicles are available for your selected dates and location. Try different dates or location.'
                      : 'No vehicles are currently available. Please check back later.'
                    }
                  </p>
                  {hasSearchCriteria && (
                    <button
                      onClick={() => {
                        window.location.href = '/vehicles';
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View All Vehicles
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </section>

          {pagination && pagination.totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className={pagination.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>

                {renderPaginationItems()}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className={
                      pagination.page === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </main>
  );
};

export default VehiclePage;
