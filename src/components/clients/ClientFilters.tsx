import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FilterSheet } from '@/components/shared/FilterSheet';
import { VerificationStatus } from '@/api/services/userService';

export interface ClientFilterValues {
  verificationStatus?: VerificationStatus;
  isBlocked?: boolean;
}

interface ClientFiltersProps {
  currentFilters: ClientFilterValues;
  onApplyFilters: (filters: ClientFilterValues) => void;
  onResetFilters: () => void;
}

const FilterContent: React.FC<{
  filters: ClientFilterValues;
  onChange: (field: keyof ClientFilterValues, value: any) => void;
}> = ({ filters, onChange }) => {
  return (
    <div className="space-y-6">
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="verification">
          <AccordionTrigger className="text-sm">Verification Status</AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={filters.verificationStatus || 'all'}
              onValueChange={(val) => onChange('verificationStatus', val === 'all' ? undefined : val)}
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="verify-all" />
                <Label htmlFor="verify-all" className="cursor-pointer font-normal">
                  All Statuses
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PENDING" id="verify-pending" />
                <Label htmlFor="verify-pending" className="cursor-pointer font-normal">
                  Pending
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="VERIFIED" id="verify-verified" />
                <Label htmlFor="verify-verified" className="cursor-pointer font-normal">
                  Verified
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="REJECTED" id="verify-rejected" />
                <Label htmlFor="verify-rejected" className="cursor-pointer font-normal">
                  Rejected
                </Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="blocked">
          <AccordionTrigger className="text-sm">Account Status</AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={
                filters.isBlocked === undefined ? 'all' : filters.isBlocked ? 'blocked' : 'active'
              }
              onValueChange={(val) =>
                onChange('isBlocked', val === 'all' ? undefined : val === 'blocked')
              }
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="block-all" />
                <Label htmlFor="block-all" className="cursor-pointer font-normal">
                  All Accounts
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="active" id="block-active" />
                <Label htmlFor="block-active" className="cursor-pointer font-normal">
                  Active
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="blocked" id="block-blocked" />
                <Label htmlFor="block-blocked" className="cursor-pointer font-normal">
                  Blocked
                </Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

const ClientFilters: React.FC<ClientFiltersProps> = ({ currentFilters, onApplyFilters, onResetFilters }) => {
  const [localFilters, setLocalFilters] = useState<ClientFilterValues>(currentFilters);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const handleInputChange = (field: keyof ClientFilterValues, value: any) => {
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
    const emptyFilters: ClientFilterValues = {};
    setLocalFilters(emptyFilters);
    onResetFilters();
    setIsOpen(false);
  };

  const activeFilterCount = Object.keys(currentFilters).filter(
    (k) => currentFilters[k as keyof ClientFilterValues] !== undefined,
  ).length;

  return (
    <FilterSheet
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      title="Filter Clients"
      description="Narrow down your client list."
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

export default ClientFilters;
