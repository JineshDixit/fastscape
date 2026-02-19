import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FilterSheet } from '@/components/shared/FilterSheet';

export interface LocationFilterValues {
  isActive?: boolean;
}

interface LocationFiltersProps {
  currentFilters: LocationFilterValues;
  onApplyFilters: (filters: LocationFilterValues) => void;
  onResetFilters: () => void;
}

const FilterContent: React.FC<{
  filters: LocationFilterValues;
  onChange: (field: keyof LocationFilterValues, value: any) => void;
}> = ({ filters, onChange }) => {
  return (
    <div className="space-y-6">
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="status">
          <AccordionTrigger className="text-sm">Status</AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={
                filters.isActive === undefined ? 'all' : filters.isActive ? 'active' : 'inactive'
              }
              onValueChange={(val) =>
                onChange('isActive', val === 'all' ? undefined : val === 'active')
              }
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="status-all" />
                <Label htmlFor="status-all" className="cursor-pointer font-normal">
                  All Locations
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="active" id="status-active" />
                <Label htmlFor="status-active" className="cursor-pointer font-normal">
                  Active
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inactive" id="status-inactive" />
                <Label htmlFor="status-inactive" className="cursor-pointer font-normal">
                  Inactive
                </Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

const LocationFilters: React.FC<LocationFiltersProps> = ({
  currentFilters,
  onApplyFilters,
  onResetFilters,
}) => {
  const [localFilters, setLocalFilters] = useState<LocationFilterValues>(currentFilters);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const handleInputChange = (field: keyof LocationFilterValues, value: any) => {
    setLocalFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const emptyFilters: LocationFilterValues = {};
    setLocalFilters(emptyFilters);
    onResetFilters();
    setIsOpen(false);
  };

  const activeFilterCount = Object.keys(currentFilters).filter(
    (k) => currentFilters[k as keyof LocationFilterValues] !== undefined,
  ).length;

  return (
    <FilterSheet
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      title="Filter Locations"
      description="Narrow down your location list."
      activeFilterCount={activeFilterCount}
      sheetFooter={
        <div className="flex flex-col gap-2 w-full">
          <Button onClick={handleApply} className="w-full">
            Apply Filters
          </Button>
          <Button variant="outline" onClick={handleReset} className="w-full">
            Reset All
          </Button>
        </div>
      }
    >
      <FilterContent
        filters={localFilters}
        onChange={handleInputChange}
      />
    </FilterSheet>
  );
};

export default LocationFilters;
