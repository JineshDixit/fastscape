import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { FilterSheet } from '@/components/shared/FilterSheet';
import { type BookingStatus, type PaymentStatus, type BookingType } from '@/api/services/bookingService';

export interface BookingFilterValues {
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  bookingType?: BookingType;
  startDate?: string;
  endDate?: string;
}

interface BookingFiltersProps {
  currentFilters: BookingFilterValues;
  onApplyFilters: (filters: BookingFilterValues) => void;
  onResetFilters: () => void;
}

const FilterContent: React.FC<{
  filters: BookingFilterValues;
  onChange: (field: keyof BookingFilterValues, value: any) => void;
}> = ({ filters, onChange }) => {
  return (
    <div className="space-y-6">
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="status">
          <AccordionTrigger className="text-sm">Booking Status</AccordionTrigger>
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
                <RadioGroupItem value="PENDING" id="status-pending" />
                <Label htmlFor="status-pending" className="cursor-pointer font-normal">
                  Pending
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CONFIRMED" id="status-confirmed" />
                <Label htmlFor="status-confirmed" className="cursor-pointer font-normal">
                  Confirmed
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PICKED_UP" id="status-picked" />
                <Label htmlFor="status-picked" className="cursor-pointer font-normal">
                  Picked Up
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="DROPPED_OFF" id="status-dropped" />
                <Label htmlFor="status-dropped" className="cursor-pointer font-normal">
                  Dropped Off
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="COMPLETED" id="status-completed" />
                <Label htmlFor="status-completed" className="cursor-pointer font-normal">
                  Completed
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CANCELLED" id="status-cancelled" />
                <Label htmlFor="status-cancelled" className="cursor-pointer font-normal">
                  Cancelled
                </Label>
              </div>
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

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
                <RadioGroupItem value="PENDING" id="payment-pending" />
                <Label htmlFor="payment-pending" className="cursor-pointer font-normal">
                  Pending
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PAID" id="payment-paid" />
                <Label htmlFor="payment-paid" className="cursor-pointer font-normal">
                  Paid
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="FAILED" id="payment-failed" />
                <Label htmlFor="payment-failed" className="cursor-pointer font-normal">
                  Failed
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

        <AccordionItem value="type">
          <AccordionTrigger className="text-sm">Booking Type</AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={filters.bookingType || 'all'}
              onValueChange={(val) => onChange('bookingType', val === 'all' ? undefined : val)}
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="type-all" />
                <Label htmlFor="type-all" className="cursor-pointer font-normal">
                  All Types
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="SELF_DRIVE" id="type-self" />
                <Label htmlFor="type-self" className="cursor-pointer font-normal">
                  Self Drive
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="WITH_CHAUFFEUR" id="type-chauffeur" />
                <Label htmlFor="type-chauffeur" className="cursor-pointer font-normal">
                  With Chauffeur
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

const BookingFilters: React.FC<BookingFiltersProps> = ({ currentFilters, onApplyFilters, onResetFilters }) => {
  const [localFilters, setLocalFilters] = useState<BookingFilterValues>(currentFilters);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const handleInputChange = (field: keyof BookingFilterValues, value: any) => {
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
    const emptyFilters: BookingFilterValues = {};
    setLocalFilters(emptyFilters);
    onResetFilters();
    setIsOpen(false);
  };

  const activeFilterCount = Object.keys(currentFilters).filter(
    (k) => currentFilters[k as keyof BookingFilterValues],
  ).length;

  return (
    <FilterSheet
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      title="Filter Bookings"
      description="Narrow down your booking list."
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

export default BookingFilters;
