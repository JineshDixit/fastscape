import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { FilterSheet } from '@/components/shared/FilterSheet';
import { type PaymentStatus } from '@/api/services/bookingService';

export interface FinanceFilterValues {
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
}

interface FinanceFiltersProps {
  currentFilters: FinanceFilterValues;
  onApplyFilters: (filters: FinanceFilterValues) => void;
  onResetFilters: () => void;
}

const FilterContent: React.FC<{
  filters: FinanceFilterValues;
  onChange: (field: keyof FinanceFilterValues, value: any) => void;
}> = ({ filters, onChange }) => {
  return (
    <div className="space-y-6">
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="payment">
          <AccordionTrigger className="text-sm">Payment Status</AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={filters.paymentStatus || 'all'}
              onValueChange={(val) => onChange('paymentStatus', val === 'all' ? undefined : val)}
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="payment-all" />
                <Label htmlFor="payment-all" className="cursor-pointer font-normal">
                  All Payment Statuses
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PAID" id="payment-paid" />
                <Label htmlFor="payment-paid" className="cursor-pointer font-normal">
                  Completed
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="UNPAID" id="payment-unpaid" />
                <Label htmlFor="payment-unpaid" className="cursor-pointer font-normal">
                  Awaiting Payment
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PARTIALLY_PAID" id="payment-partial" />
                <Label htmlFor="payment-partial" className="cursor-pointer font-normal">
                  Partially Paid
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="OVERDUE" id="payment-overdue" />
                <Label htmlFor="payment-overdue" className="cursor-pointer font-normal">
                  Overdue
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="REFUNDED" id="payment-refunded" />
                <Label htmlFor="payment-refunded" className="cursor-pointer font-normal">
                  Refunded
                </Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="dates">
          <AccordionTrigger className="text-sm">Date Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-xs">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => onChange('startDate', e.target.value || undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-xs">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => onChange('endDate', e.target.value || undefined)}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

const FinanceFilters: React.FC<FinanceFiltersProps> = ({ currentFilters, onApplyFilters, onResetFilters }) => {
  const [localFilters, setLocalFilters] = useState<FinanceFilterValues>(currentFilters);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const handleInputChange = (field: keyof FinanceFilterValues, value: any) => {
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
    const emptyFilters: FinanceFilterValues = {};
    setLocalFilters(emptyFilters);
    onResetFilters();
    setIsOpen(false);
  };

  const activeFilterCount = Object.keys(currentFilters).filter(
    (k) => currentFilters[k as keyof FinanceFilterValues],
  ).length;

  return (
    <FilterSheet
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      title="Filter Financials"
      description="Narrow down your financial records."
      activeFilterCount={activeFilterCount}
      sheetFooter={
        <div className="flex w-full flex-col gap-2">
          <Button onClick={handleApply} className="w-full">
            Apply Filters
          </Button>
          <Button variant="outline" onClick={handleReset} className="w-full">
            Reset All
          </Button>
        </div>
      }
    >
      <FilterContent filters={localFilters} onChange={handleInputChange} />
    </FilterSheet>
  );
};

export default FinanceFilters;
