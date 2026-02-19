import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVehicle } from '@/api/hooks/useVehicle';
import { locationService } from '@/api/services/locationService';
import type { VehicleFilters as FilterInterface } from '@/common/interface/vehicleInterface';
import type { Location } from '@/api/services/locationService';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { FilterSheet } from '@/components/shared/FilterSheet';

interface VehicleFiltersProps {
  currentFilters: FilterInterface;
  onApplyFilters: (filters: FilterInterface) => void;
  onResetFilters: () => void;
}

const FilterContent: React.FC<{
  filters: FilterInterface;
  enums: any;
  locations: Location[];
  onChange: (field: keyof FilterInterface, value: any) => void;
}> = ({ filters, enums, locations, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-foreground text-sm font-semibold tracking-wide">Basic Info</h3>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="make" className="text-xs">
              Make
            </Label>
            <Input
              id="make"
              placeholder="Any Make"
              value={filters.make || ''}
              onChange={(e) => onChange('make', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model" className="text-xs">
              Model
            </Label>
            <Input
              id="model"
              placeholder="Any Model"
              value={filters.model || ''}
              onChange={(e) => onChange('model', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year" className="text-xs">
              Year
            </Label>
            <Input
              id="year"
              type="number"
              placeholder="Any Year"
              value={filters.year || ''}
              onChange={(e) => onChange('year', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locationId" className="text-xs">
              Location
            </Label>
            <Select
              value={filters.locationId || 'all'}
              onValueChange={(val) => onChange('locationId', val === 'all' ? undefined : val)}
            >
              <SelectTrigger id="locationId">
                <SelectValue placeholder="Any Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name} - {location.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity" className="text-xs">
              Capacity
            </Label>
            <Input
              id="capacity"
              type="number"
              placeholder="Any Capacity"
              value={filters.passengerCapacity || ''}
              onChange={(e) => onChange('passengerCapacity', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
        </div>
      </div>

      <Separator />

      <Accordion type="multiple" className="w-full">
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm">Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="space-y-1">
                <Label htmlFor="minPrice" className="text-muted-foreground text-xs">
                  Min
                </Label>
                <div className="relative">
                  <span className="text-muted-foreground absolute top-1/2 left-2 -translate-y-1/2 text-xs">$</span>
                  <Input
                    id="minPrice"
                    type="number"
                    className="h-8 pl-5"
                    placeholder="0"
                    value={filters.minPrice || ''}
                    onChange={(e) => onChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="maxPrice" className="text-muted-foreground text-xs">
                  Max
                </Label>
                <div className="relative">
                  <span className="text-muted-foreground absolute top-1/2 left-2 -translate-y-1/2 text-xs">$</span>
                  <Input
                    id="maxPrice"
                    type="number"
                    className="h-8 pl-5"
                    placeholder="Any"
                    value={filters.maxPrice || ''}
                    onChange={(e) => onChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="status">
          <AccordionTrigger className="text-sm">Status</AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={filters.isAvailable === undefined ? 'all' : String(filters.isAvailable)}
              onValueChange={(val) => onChange('isAvailable', val === 'all' ? undefined : val === 'true')}
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="status-all" />
                <Label htmlFor="status-all" className="cursor-pointer font-normal">
                  All Statuses
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="status-available" />
                <Label htmlFor="status-available" className="cursor-pointer font-normal">
                  Available
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="status-unavailable" />
                <Label htmlFor="status-unavailable" className="cursor-pointer font-normal">
                  Unavailable
                </Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        {enums?.bodyTypes && (
          <AccordionItem value="body">
            <AccordionTrigger className="text-sm">Body Type</AccordionTrigger>
            <AccordionContent>
              <RadioGroup
                value={filters.bodyType || 'all'}
                onValueChange={(val) => onChange('bodyType', val === 'all' ? undefined : val)}
                className="space-y-2 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="body-all" />
                  <Label htmlFor="body-all" className="cursor-pointer font-normal">
                    All Body Types
                  </Label>
                </div>
                {enums.bodyTypes.map((type: string) => (
                  <div key={type} className="flex items-center space-x-2">
                    <RadioGroupItem value={type} id={`body-${type}`} />
                    <Label htmlFor={`body-${type}`} className="cursor-pointer font-normal">
                      {type}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>
        )}

        {enums?.fuelTypes && (
          <AccordionItem value="fuel">
            <AccordionTrigger className="text-sm">Fuel Type</AccordionTrigger>
            <AccordionContent>
              <RadioGroup
                value={filters.fuelType || 'all'}
                onValueChange={(val) => onChange('fuelType', val === 'all' ? undefined : val)}
                className="space-y-2 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="fuel-all" />
                  <Label htmlFor="fuel-all" className="cursor-pointer font-normal">
                    All Fuel Types
                  </Label>
                </div>
                {enums.fuelTypes.map((type: string) => (
                  <div key={type} className="flex items-center space-x-2">
                    <RadioGroupItem value={type} id={`fuel-${type}`} />
                    <Label htmlFor={`fuel-${type}`} className="cursor-pointer font-normal">
                      {type}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>
        )}

        {enums?.transmissionTypes && (
          <AccordionItem value="transmission">
            <AccordionTrigger className="text-sm">Transmission</AccordionTrigger>
            <AccordionContent>
              <RadioGroup
                value={filters.transmission || 'all'}
                onValueChange={(val) => onChange('transmission', val === 'all' ? undefined : val)}
                className="space-y-2 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="trans-all" />
                  <Label htmlFor="trans-all" className="cursor-pointer font-normal">
                    All Transmissions
                  </Label>
                </div>
                {enums.transmissionTypes.map((type: string) => (
                  <div key={type} className="flex items-center space-x-2">
                    <RadioGroupItem value={type} id={`trans-${type}`} />
                    <Label htmlFor={`trans-${type}`} className="cursor-pointer font-normal">
                      {type}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};

const VehicleFilters: React.FC<VehicleFiltersProps> = ({
  currentFilters,
  onApplyFilters,
  onResetFilters,
}) => {
  const { enums, fetchEnums } = useVehicle();
  const [localFilters, setLocalFilters] = useState<FilterInterface>(currentFilters);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchEnums();
    fetchLocations();
  }, [fetchEnums]);

  const fetchLocations = async () => {
    try {
      const response = await locationService.getAllLocations({ isActive: true, limit: 100 });
      setLocations(response.data || []);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const handleInputChange = (field: keyof FilterInterface, value: any) => {
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
    const emptyFilters: FilterInterface = {};
    setLocalFilters(emptyFilters);
    onResetFilters();
    setIsOpen(false);
  };

  const activeFilterCount = Object.keys(currentFilters).filter(
    (k) =>
      k !== 'page' &&
      k !== 'limit' &&
      k !== 'sortOrder' &&
      k !== 'sortBy' &&
      k !== 'search' &&
      currentFilters[k as keyof FilterInterface],
  ).length;

  return (
    <FilterSheet
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      title="Filter Vehicles"
      description="Narrow down your vehicle list."
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
        enums={enums}
        locations={locations}
        onChange={handleInputChange}
      />
    </FilterSheet>
  );
};

export default VehicleFilters;
