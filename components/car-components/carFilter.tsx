import { useVehicle } from '@/app/axios';
import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Minus, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { BodyType } from '@/common/interfaces';

const CarFilter = () => {
  const t = useTranslations('carFilter');
  const { filterMetadata, fetchFilterMetadata, fetchVehicles, filters, isLoading, error, clearError } = useVehicle();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    fetchFilterMetadata();
  }, [fetchFilterMetadata]);

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

    filterMetadata.brands.forEach((brand) => {
      map[brand.make] = (brand.models || []).filter((m) => selectedModelsArr.includes(m));
    });

    filterMetadata.bodyTypes.forEach((bt) => {
      map[bt.bodyType] = (bt.models || []).filter((m) => selectedModelsArr.includes(m));
    });

    return map;
  }, [filterMetadata, selectedModelsArr]);

  const handleModelToggle = (model: string) => {
    const currentModels = [...selectedModelsArr];
    const currentMakes = [...selectedMakes];
    const currentBodyTypes = [...selectedBodyTypes];

    const isSelected = currentModels.includes(model);
    const nextModels = isSelected ? currentModels.filter((m) => m !== model) : [...currentModels, model];

    const brand = filterMetadata?.brands.find((b) => (b.models || []).includes(model));
    const bodyType = filterMetadata?.bodyTypes.find((bt) => (bt.models || []).includes(model));

    let nextMakes = [...currentMakes];
    let nextBodyTypes = [...currentBodyTypes];

    if (brand) {
      const brandModels = brand.models || [];
      const anyModelSelectedForBrand = nextModels.some((m) => brandModels.includes(m));
      if (anyModelSelectedForBrand && !nextMakes.includes(brand.make)) {
        nextMakes.push(brand.make);
      } else if (!anyModelSelectedForBrand && nextMakes.includes(brand.make)) {
        nextMakes = nextMakes.filter((m) => m !== brand.make);
      }
    }

    if (bodyType) {
      const btModels = bodyType.models || [];
      const anyModelSelectedForBT = nextModels.some((m) => btModels.includes(m));
      if (anyModelSelectedForBT && !nextBodyTypes.includes(bodyType.bodyType as any)) {
        nextBodyTypes.push(bodyType.bodyType as any);
      } else if (!anyModelSelectedForBT && nextBodyTypes.includes(bodyType.bodyType as any)) {
        nextBodyTypes = nextBodyTypes.filter((bt) => bt !== (bodyType.bodyType as any));
      }
    }

    fetchVehicles({
      make: nextMakes,
      bodyType: nextBodyTypes as BodyType[],
      model: nextModels,
      page: 1,
    });
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
                      <div className="relative flex h-5 w-5 cursor-pointer items-center justify-center rounded bg-primary text-primary-foreground">
                        <Plus className="plus absolute h-3.5 w-3.5 transition-transform duration-200" />
                        <Minus className="minus absolute h-3.5 w-3.5 scale-0 transition-transform duration-200" />
                      </div>

                      <span className="select-none text-sm">{item.label}</span>
                    </div>

                    <span className="text-sm text-muted-foreground">[{item.count}]</span>
                  </div>
                </AccordionTrigger>

                {models.length > 0 && (
                  <AccordionContent>
                    <div className="flex flex-col gap-3 pl-8 pt-3">
                      {models.map((model) => (
                        <div key={model} className="flex items-center gap-3">
                          <Checkbox
                            id={`${item.label}-${model}`}
                            checked={activeModelsForCategory.includes(model)}
                            onCheckedChange={() => handleModelToggle(model)}
                            className="h-4 w-4 rounded border-input data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                          />
                          <label
                            htmlFor={`${item.label}-${model}`}
                            className="select-none cursor-pointer text-sm"
                          >
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
          <div className="mb-2 h-3 w-3/4 rounded bg-muted md:h-4"></div>
          <div className="mb-2 h-3 w-1/2 rounded bg-muted md:h-4"></div>
          <div className="h-3 w-2/3 rounded bg-muted md:h-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-destructive/20 bg-destructive/10 p-3 md:p-4">
        <p className="text-xs text-destructive md:text-sm">
          {t('error')}: {error}
        </p>
        <button
          onClick={() => {
            clearError();
            fetchFilterMetadata();
          }}
          className="mt-2 rounded bg-destructive px-3 py-1 text-xs text-destructive-foreground hover:bg-destructive/90 md:text-sm"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  if (!filterMetadata) {
    return <div className="p-4 text-muted-foreground">{t('noData')}</div>;
  }

  return (
    <div className="w-full bg-card">
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
