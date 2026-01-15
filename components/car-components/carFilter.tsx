import { useVehicle } from '@/app/axios';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

const CarFilter = () => {
  const t = useTranslations('carFilter');
  const { filterMetadata, fetchFilterMetadata, isLoading, error, clearError } = useVehicle();

  useEffect(() => {
    fetchFilterMetadata();
  }, [fetchFilterMetadata]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  if (isLoading) {
    return (
      <div className="p-3 md:p-4">
        <div className="animate-pulse">
          <div className="mb-2 h-3 w-3/4 rounded bg-gray-200 md:h-4"></div>
          <div className="mb-2 h-3 w-1/2 rounded bg-gray-200 md:h-4"></div>
          <div className="h-3 w-2/3 rounded bg-gray-200 md:h-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-3 md:p-4">
        <p className="text-xs text-red-700 md:text-sm">
          {t('error')}: {error}
        </p>
        <button
          onClick={() => {
            clearError();
            fetchFilterMetadata();
          }}
          className="mt-2 rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700 md:text-sm"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  if (!filterMetadata) {
    return <div className="p-4 text-gray-500">{t('noData')}</div>;
  }

  return (
    <div className="">
      {/* Body Types Filter */}
      {filterMetadata.bodyTypes && filterMetadata.bodyTypes.length > 0 && (
        <div className="mb-4 md:mb-6">
          <h4 className="mb-2 text-sm font-medium md:text-base">{t('byBodyTypes')}</h4>
          <div className="space-y-1.5 md:space-y-2">
            {filterMetadata.bodyTypes.map((bodyType) => (
              <div key={bodyType.bodyType} className="flex items-center justify-between">
                <label className="flex items-center text-xs sm:text-sm">
                  <input type="checkbox" className="mr-2" />
                  {bodyType.bodyType}
                </label>
                <span className="text-xs text-gray-500 sm:text-sm">[{bodyType.count}]</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {filterMetadata.brands && filterMetadata.brands.length > 0 && (
        <div className="mb-4 md:mb-6">
          <h4 className="mb-2 text-sm font-medium md:text-base">{t('byBrands')}</h4>
          <div className="space-y-1.5 md:space-y-2">
            {filterMetadata.brands.map((brand) => (
              <div key={brand.make} className="flex items-center justify-between">
                <label className="flex items-center text-xs sm:text-sm">
                  <input type="checkbox" className="mr-2" />
                  {brand.make}
                </label>
                <span className="text-xs text-gray-500 sm:text-sm">[{brand.count}]</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CarFilter;
