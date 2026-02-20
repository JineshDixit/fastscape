import { useVehicle } from '@/app/axios';
import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Minus, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { BodyType, VehicleFilters } from '@/common/interfaces';

const CarFilter = () => {
  const t = useTranslations('carFilter');
  const {
    filterMetadata,
    fetchFilterMetadata,
    fetchVehicles,
    searchAvailableVehicles,
    filters,
    isLoading,
    error,
    clearError,
    bookingData,
  } = useVehicle();
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if we have search criteria (dates and location)
  const hasSearchCriteria = !!(bookingData.pickupDate && bookingData.dropoffDate && bookingData.pickupLocation);

  useEffect(() => {
    const searchParams = hasSearchCriteria
      ? {
          pickupLocation: bookingData.pickupLocation!,
          pickupDate: bookingData.pickupDate!,
          dropoffDate: bookingData.dropoffDate!,
          bookingType: bookingData.bookingType,
        }
      : undefined;

    fetchFilterMetadata(searchParams);
  }, [
    fetchFilterMetadata,
    hasSearchCriteria,
    bookingData.pickupLocation,
    bookingData.pickupDate,
    bookingData.dropoffDate,
    bookingData.bookingType,
  ]);

  useEffect(() => {
    if (filterMetadata && !isInitialized) {
      setIsInitialized(true);
    }
  }, [filterMetadata, isInitialized]);

  const selectedMakes = useMemo(() => {
    if (!filters.make) return [];
    return Array.isArray(filters.make) ? filters.make : [filters.make];
  }, [filters.make]);

  const selectedBodyTypes = useMemo(() => {
    if (!filters.bodyType) return [];
    return Array.isArray(filters.bodyType) ? filters.bodyType : [filters.bodyType];
  }, [filters.bodyType]);

  const selectedModelsArr = useMemo(() => {
    if (!filters.model) return [];
    return Array.isArray(filters.model) ? filters.model : [filters.model];
  }, [filters.model]);

  const selectedModelsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    if (!filterMetadata) return map;

    const allAvailableModels = new Set<string>();
    filterMetadata.brands.forEach((brand) => brand.models?.forEach((m) => allAvailableModels.add(m)));
    filterMetadata.bodyTypes.forEach((bt) => bt.models?.forEach((m) => allAvailableModels.add(m)));

    // If selectedModelsArr is empty, it means "all are selected" for the UI
    const activeModels = selectedModelsArr.length === 0 ? Array.from(allAvailableModels) : selectedModelsArr;

    filterMetadata.brands.forEach((brand) => {
      map[brand.make] = (brand.models || []).filter((m) => activeModels.includes(m));
    });

    filterMetadata.bodyTypes.forEach((bt) => {
      map[bt.bodyType] = (bt.models || []).filter((m) => activeModels.includes(m));
    });

    return map;
  }, [filterMetadata, selectedModelsArr]);

  const handleModelToggle = (model: string) => {
    if (!filterMetadata) return;

    // Get all available models as the baseline
    const allAvailableModels: string[] = [];
    const modelToBrand = new Map<string, string>();
    const modelToBT = new Map<string, string>();

    filterMetadata.brands.forEach((b) => {
      b.models?.forEach((m) => {
        if (!allAvailableModels.includes(m)) allAvailableModels.push(m);
        modelToBrand.set(m, b.make);
      });
    });
    filterMetadata.bodyTypes.forEach((bt) => {
      bt.models?.forEach((m) => {
        if (!allAvailableModels.includes(m)) allAvailableModels.push(m);
        modelToBT.set(m, bt.bodyType);
      });
    });

    let nextModels: string[];

    if (selectedModelsArr.length === 0) {
      // If none explicitly selected, we were showing all.
      // Now we uncheck one, so nextModels is "all - this one"
      nextModels = allAvailableModels.filter((m) => m !== model);
    } else {
      const isSelected = selectedModelsArr.includes(model);
      nextModels = isSelected ? selectedModelsArr.filter((m) => m !== model) : [...selectedModelsArr, model];
    }

    // If nextModels contains everything available, we can reset to empty (optional optimization)
    if (nextModels.length === allAvailableModels.length) {
      nextModels = [];
    }

    // Recalculate active makes and body types based on nextModels
    let nextMakes: string[] = [];
    let nextBodyTypes: BodyType[] = [];

    if (nextModels.length === 0) {
      // "All selected" - no specific filters applied to API
      nextMakes = [];
      nextBodyTypes = [];
    } else {
      const activeMakesSet = new Set<string>();
      const activeBTSet = new Set<BodyType>();

      nextModels.forEach((m) => {
        const brand = modelToBrand.get(m);
        const bt = modelToBT.get(m);
        if (brand) activeMakesSet.add(brand);
        if (bt) activeBTSet.add(bt as BodyType);
      });

      nextMakes = Array.from(activeMakesSet);
      nextBodyTypes = Array.from(activeBTSet);
    }

    const params: Partial<VehicleFilters> = {
      make: nextMakes,
      bodyType: nextBodyTypes,
      model: nextModels,
      page: 1,
    };

    if (hasSearchCriteria) {
      searchAvailableVehicles({
        ...params,
        pickupLocation: bookingData.pickupLocation!,
        pickupDate: bookingData.pickupDate!,
        dropoffDate: bookingData.dropoffDate!,
        bookingType: bookingData.bookingType,
      });
    } else {
      fetchVehicles(params);
    }
  };

  const renderFilterSection = (title: string, items: { label: string; count: number; models: string[] }[]) => {
    return (
      <div className="mb-8">
        <h4 className="mb-4 text-base font-bold md:text-lg">{title}</h4>
        <Accordion type="multiple" className="w-full space-y-3">
          {items.map((item) => {
            const models = item.models || [];
            const activeModelsForCategory = selectedModelsMap[item.label] || [];

            return (
              <AccordionItem key={item.label} value={item.label} className="border-none">
                <AccordionTrigger className="cursor-pointer p-0 hover:no-underline [&[data-state=open]_.minus]:scale-100 [&[data-state=open]_.plus]:scale-0">
                  <div className="group flex w-full items-center justify-between">
                    <div className="flex flex-1 items-center gap-3">
                      <div className="bg-primary text-primary-foreground relative flex h-5 w-5 cursor-pointer items-center justify-center rounded">
                        <Plus className="plus absolute h-3.5 w-3.5 transition-transform duration-200" />
                        <Minus className="minus absolute h-3.5 w-3.5 scale-0 transition-transform duration-200" />
                      </div>

                      <span className="text-sm select-none">{item.label}</span>
                    </div>

                    <span className="text-muted-foreground text-sm">[{item.count}]</span>
                  </div>
                </AccordionTrigger>

                {models.length > 0 && (
                  <AccordionContent>
                    <div className="flex flex-col gap-3 pt-3 pl-8">
                      {models.map((model) => (
                        <div key={model} className="flex items-center gap-3">
                          <Checkbox
                            id={`${item.label}-${model}`}
                            checked={activeModelsForCategory.includes(model)}
                            onCheckedChange={() => handleModelToggle(model)}
                            className="border-input data-[state=checked]:border-primary data-[state=checked]:bg-primary h-4 w-4 rounded"
                          />
                          <label htmlFor={`${item.label}-${model}`} className="cursor-pointer text-sm select-none">
                            {model}
                          </label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                )}
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    );
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  if (isLoading && !isInitialized) {
    return (
      <div className="p-3 md:p-4">
        <div className="animate-pulse">
          <div className="bg-muted mb-2 h-3 w-3/4 rounded md:h-4"></div>
          <div className="bg-muted mb-2 h-3 w-1/2 rounded md:h-4"></div>
          <div className="bg-muted h-3 w-2/3 rounded md:h-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-destructive/20 bg-destructive/10 rounded border p-3 md:p-4">
        <p className="text-destructive text-xs md:text-sm">
          {t('error')}: {error}
        </p>
        <button
          onClick={() => {
            clearError();
            fetchFilterMetadata();
          }}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 mt-2 rounded px-3 py-1 text-xs md:text-sm"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  if (!filterMetadata) {
    return <div className="text-muted-foreground p-4">{t('noData')}</div>;
  }

  return (
    <div className="bg-card w-full">
      {filterMetadata.bodyTypes &&
        filterMetadata.bodyTypes.length > 0 &&
        renderFilterSection(
          t('byBodyTypes'),
          filterMetadata.bodyTypes.map((b) => ({ label: b.bodyType, count: b.count, models: b.models })),
        )}

      {filterMetadata.brands &&
        filterMetadata.brands.length > 0 &&
        renderFilterSection(
          t('byBrands'),
          filterMetadata.brands.map((b) => ({ label: b.make, count: b.count, models: b.models })),
        )}
    </div>
  );
};

export default CarFilter;
