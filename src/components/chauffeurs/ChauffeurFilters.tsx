import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FilterSheet } from '@/components/shared/FilterSheet';

export interface ChauffeurFilterValues {
  status?: string;
  isVerified?: boolean;
  experienceLevel?: string;
  minRating?: number;
}

interface ChauffeurFiltersProps {
  currentFilters: ChauffeurFilterValues;
  onApplyFilters: (filters: ChauffeurFilterValues) => void;
  onResetFilters: () => void;
}

const FilterContent: React.FC<{
  filters: ChauffeurFilterValues;
  onChange: (field: keyof ChauffeurFilterValues, value: any) => void;
}> = ({ filters, onChange }) => {
  return (
    <div className="space-y-6">
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="status">
          <AccordionTrigger className="text-sm">Status</AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={filters.status || 'all'}
              onValueChange={(val) => onChange('status', val === 'all' ? undefined : val)}
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="status-all" />
                <Label htmlFor="status-all" className="cursor-pointer font-normal">
                  All Statuses
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="AVAILABLE" id="status-available" />
                <Label htmlFor="status-available" className="cursor-pointer font-normal">
                  Available
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="BUSY" id="status-busy" />
                <Label htmlFor="status-busy" className="cursor-pointer font-normal">
                  Busy
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="OFF_DUTY" id="status-off" />
                <Label htmlFor="status-off" className="cursor-pointer font-normal">
                  Off Duty
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ON_BREAK" id="status-break" />
                <Label htmlFor="status-break" className="cursor-pointer font-normal">
                  On Break
                </Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="verification">
          <AccordionTrigger className="text-sm">Verification Status</AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={
                filters.isVerified === undefined ? 'all' : filters.isVerified ? 'verified' : 'unverified'
              }
              onValueChange={(val) =>
                onChange('isVerified', val === 'all' ? undefined : val === 'verified')
              }
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="verify-all" />
                <Label htmlFor="verify-all" className="cursor-pointer font-normal">
                  All
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="verified" id="verify-yes" />
                <Label htmlFor="verify-yes" className="cursor-pointer font-normal">
                  Verified
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unverified" id="verify-no" />
                <Label htmlFor="verify-no" className="cursor-pointer font-normal">
                  Unverified
                </Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="experience">
          <AccordionTrigger className="text-sm">Experience Level</AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={filters.experienceLevel || 'all'}
              onValueChange={(val) => onChange('experienceLevel', val === 'all' ? undefined : val)}
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="exp-all" />
                <Label htmlFor="exp-all" className="cursor-pointer font-normal">
                  All Levels
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="BEGINNER" id="exp-beginner" />
                <Label htmlFor="exp-beginner" className="cursor-pointer font-normal">
                  Beginner (0-2 years)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="INTERMEDIATE" id="exp-intermediate" />
                <Label htmlFor="exp-intermediate" className="cursor-pointer font-normal">
                  Intermediate (3-5 years)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="EXPERIENCED" id="exp-experienced" />
                <Label htmlFor="exp-experienced" className="cursor-pointer font-normal">
                  Experienced (6-10 years)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="EXPERT" id="exp-expert" />
                <Label htmlFor="exp-expert" className="cursor-pointer font-normal">
                  Expert (10+ years)
                </Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="rating">
          <AccordionTrigger className="text-sm">Minimum Rating</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="minRating" className="text-xs">
                  Minimum Rating (1-5)
                </Label>
                <Input
                  id="minRating"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  placeholder="Any rating"
                  value={filters.minRating || ''}
                  onChange={(e) =>
                    onChange('minRating', e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

const ChauffeurFilters: React.FC<ChauffeurFiltersProps> = ({
  currentFilters,
  onApplyFilters,
  onResetFilters,
}) => {
  const [localFilters, setLocalFilters] = useState<ChauffeurFilterValues>(currentFilters);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const handleInputChange = (field: keyof ChauffeurFilterValues, value: any) => {
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
    const emptyFilters: ChauffeurFilterValues = {};
    setLocalFilters(emptyFilters);
    onResetFilters();
    setIsOpen(false);
  };

  const activeFilterCount = Object.keys(currentFilters).filter(
    (k) => currentFilters[k as keyof ChauffeurFilterValues] !== undefined,
  ).length;

  return (
    <FilterSheet
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      title="Filter Chauffeurs"
      description="Narrow down your chauffeur list."
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

export default ChauffeurFilters;
