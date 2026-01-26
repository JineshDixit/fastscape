import { FC, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays, isWithinInterval, parseISO, startOfDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useLocation } from '@/app/axios/hooks/useLocation';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox';
import { FloatingInput } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface AvailabilitySelectorProps {
  bookingData: {
    pickupDate: string | null;
    dropoffDate: string | null;
    pickupLocation: string | null;
    dropoffLocation: string | null;
    bookingType: 'SELF_DRIVE' | 'CHAUFFEUR';
  };
  onServiceChange: (type: 'SELF_DRIVE' | 'CHAUFFEUR') => void;
  onDateChange: (start: Date, end: Date | null) => void;
  onLocationChange: (data: { pickupLocation?: string; dropoffLocation?: string }) => void;
}

const AvailabilitySelector: FC<AvailabilitySelectorProps> = ({
  bookingData,
  onServiceChange,
  onDateChange,
  onLocationChange,
}) => {
  const t = useTranslations('vehicleDetails');
  const tCar = useTranslations('carSearch');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { locations } = useLocation();

  const [fromQuery, setFromQuery] = useState(bookingData.pickupLocation || '');
  const [toQuery, setToQuery] = useState(bookingData.dropoffLocation || '');
  const [sameAddress, setSameAddress] = useState(
    bookingData.pickupLocation === bookingData.dropoffLocation && bookingData.pickupLocation !== null,
  );

  // Sync internal state with bookingData (props)
  useEffect(() => {
    setFromQuery(bookingData.pickupLocation || '');
    setToQuery(bookingData.dropoffLocation || '');
  }, [bookingData.pickupLocation, bookingData.dropoffLocation]);

  // Robust Fix for persistent scroll-lock bugs
  useEffect(() => {
    const fixScroll = () => {
      if (typeof document !== 'undefined' && document.body) {
        const isLocked =
          document.body.style.overflow === 'hidden' ||
          document.body.hasAttribute('data-scroll-locked') ||
          document.documentElement.style.overflow === 'hidden';

        if (isLocked) {
          document.body.style.setProperty('overflow', 'auto', 'important');
          document.documentElement.style.setProperty('overflow', 'auto', 'important');
          document.body.style.setProperty('pointer-events', 'auto', 'important');
          document.body.removeAttribute('data-scroll-locked');
          document.body.classList.remove('no-scroll'); // Extra check for common classes
        }
      }
    };

    fixScroll();
    const timer = setTimeout(fixScroll, 300); // Wait a bit longer for transition completions
    return () => {
      clearTimeout(timer);
      fixScroll();
    };
  }, [bookingData, sameAddress]);

  const filteredFromLocations =
    fromQuery === '' ? locations : locations.filter((loc) => loc.name.toLowerCase().includes(fromQuery.toLowerCase()));

  const filteredToLocations =
    toQuery === '' ? locations : locations.filter((loc) => loc.name.toLowerCase().includes(toQuery.toLowerCase()));

  const handleFromChange = (val: string) => {
    onLocationChange({ pickupLocation: val });
    if (sameAddress) {
      onLocationChange({ dropoffLocation: val });
    }
  };

  const handleToChange = (val: string) => {
    onLocationChange({ dropoffLocation: val });
  };

  const handleSameAddressChange = (checked: boolean | 'indeterminate') => {
    const isChecked = checked === true;
    if (isChecked && bookingData.pickupLocation) {
      onLocationChange({ dropoffLocation: bookingData.pickupLocation });
    }
    setSameAddress(isChecked);
  };

  const now = startOfDay(new Date());
  const start = bookingData.pickupDate ? startOfDay(parseISO(bookingData.pickupDate)) : null;
  const end = bookingData.dropoffDate ? startOfDay(parseISO(bookingData.dropoffDate)) : null;
  const bubbleStart = now;
  const initialDates = Array.from({ length: 5 }, (_, i) => addDays(bubbleStart, i));
  const lastInitialDate = initialDates[initialDates.length - 1];

  const handleDateSelect = (date: Date) => {
    const dateTime = startOfDay(date).getTime();

    // If no dates selected, or if we already have a range selected, start fresh
    if (!start || (start && end && start.getTime() !== end.getTime())) {
      // First click: set as single-day rental
      onDateChange(date, date);
    } else if (start && end && start.getTime() === end.getTime()) {
      // We have a single day selected, now selecting second date for range
      if (dateTime === start.getTime()) {
        // Clicked same date again - keep as single day
        return;
      } else if (dateTime > start.getTime()) {
        // Selected date after start - create range
        onDateChange(start, date);
      } else {
        // Selected date before start - reset with new start date
        onDateChange(date, date);
      }
    }
  };

  const isExtendedRange = end && end > lastInitialDate;

  const visibleDates = isExtendedRange ? [...initialDates.slice(0, 3), end] : initialDates;

  const isSelfDrive = bookingData.bookingType === 'SELF_DRIVE';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold text-gray-700">{t('checkAvailability')}</span>
        <div className="flex flex-wrap items-center gap-2">
          {visibleDates.map((date, idx) => {
            const d = startOfDay(date);
            const isPickup = start && d.getTime() === start.getTime();
            const isDropoff = end && d.getTime() === end.getTime();
            const isSelected = isPickup || isDropoff;
            const isInRange = start && end && start.getTime() !== end.getTime() && isWithinInterval(d, { start, end });

            const showEllipsisBefore = isExtendedRange && idx === 3;

            return (
              <div key={idx} className="flex items-center gap-2">
                {showEllipsisBefore && (
                  <div className="flex h-12 w-6 items-center justify-center font-bold text-gray-400">...</div>
                )}
                <Button
                  onClick={() => handleDateSelect(date)}
                  className={cn(
                    'flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-xl border text-center transition-all duration-200',
                    isSelected
                      ? 'border-primary bg-primary hover:bg-primary hover:border-primary text-white hover:text-white'
                      : isInRange
                        ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/30'
                        : `hover:border-primary/40 hover:bg-primary/10 hover:text-primary border-transparent bg-[#F3F4F6] text-gray-600`,
                  )}
                >
                  <span className="text-[10px] font-bold uppercase">{format(date, 'dd')}</span>
                  <span className="text-[10px] font-bold uppercase">
                    {date.toLocaleDateString(undefined, { month: 'short' })}
                  </span>
                </Button>
              </div>
            );
          })}

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button className="hover:border-primary hover:bg-primary/5 hover:text-primary flex h-12 w-12 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white text-gray-400 transition-all duration-200 hover:shadow-sm">
                <CalendarIcon className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto border-none p-0 shadow-xl" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={start || now}
                selected={start && end ? { from: start, to: end } : undefined}
                onSelect={(range) => {
                  if (range?.from) {
                    if (range.to) {
                      onDateChange(range.from, range.to);
                      setCalendarOpen(false);
                    } else {
                      // Only 'from' is selected, set as same-day rental
                      onDateChange(range.from, range.from);
                    }
                  }
                }}
                numberOfMonths={1}
                disabled={{ before: now }}
                classNames={{
                  today: 'bg-transparent text-foreground font-bold border border-primary/20',
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold text-gray-700">{t('availableFor')}</span>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => onServiceChange('SELF_DRIVE')}
            className={cn(
              'h-10 rounded-lg border px-6 text-sm font-semibold transition-all duration-200',
              bookingData.bookingType === 'SELF_DRIVE'
                ? 'border-black bg-black text-white hover:border-black hover:bg-black hover:text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-black hover:bg-black/5 hover:text-black hover:shadow-sm',
            )}
          >
            {t('selfDrive')}
          </Button>
          <Button
            onClick={() => onServiceChange('CHAUFFEUR')}
            className={cn(
              'h-10 rounded-lg border px-6 text-sm font-semibold transition-all duration-200',
              bookingData.bookingType === 'CHAUFFEUR'
                ? 'border-black bg-black text-white hover:border-black hover:bg-black hover:text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-black hover:bg-black/5 hover:text-black hover:shadow-sm',
            )}
          >
            {t('chauffeur')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative">
          {isSelfDrive ? (
            <Combobox
              open={undefined} // Let it be uncontrolled or controlled?
              modal={false}
              value={
                locations.find((l) => l.name === bookingData.pickupLocation)
                  ? { id: bookingData.pickupLocation!, label: bookingData.pickupLocation! }
                  : null
              }
              onValueChange={(val) => handleFromChange(val?.label || '')}
            >
              <ComboboxInput
                placeholder={tCar('from')}
                className="bg-background h-14 w-full"
                value={fromQuery}
                onChange={(e) => setFromQuery(e.target.value)}
                onBlur={() => {
                  if (bookingData.pickupLocation) setFromQuery(bookingData.pickupLocation);
                }}
              />
              <ComboboxContent>
                <ComboboxList>
                  {filteredFromLocations.length > 0 ? (
                    filteredFromLocations.map((location) => (
                      <ComboboxItem key={location.id} value={{ id: location.name, label: location.name }}>
                        {location.name}
                      </ComboboxItem>
                    ))
                  ) : (
                    <ComboboxEmpty>No locations found</ComboboxEmpty>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          ) : (
            <FloatingInput
              label={tCar('from')}
              className="h-14 w-full"
              value={bookingData.pickupLocation || ''}
              onChange={(e) => handleFromChange(e.target.value)}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <Checkbox id="same-address-detail" checked={sameAddress} onCheckedChange={handleSameAddressChange} />
          <label htmlFor="same-address-detail" className="cursor-pointer text-xs font-normal sm:text-sm">
            {tCar('sameAsPickup')}
          </label>
        </div>

        <div className="relative">
          {/* 
            Optimized Fix: When sameAddress is true, we render a simple FloatingInput instead of the Combobox.
            This avoids potential scroll-lock bugs in the UI library when a component is portaled and then disabled.
          */}
          {isSelfDrive && !sameAddress ? (
            <Combobox
              modal={false}
              value={
                locations.find((l) => l.name === bookingData.dropoffLocation)
                  ? { id: bookingData.dropoffLocation!, label: bookingData.dropoffLocation! }
                  : null
              }
              onValueChange={(val) => handleToChange(val?.label || '')}
            >
              <ComboboxInput
                placeholder={tCar('to')}
                className="bg-background h-14 w-full"
                value={toQuery}
                onChange={(e) => setToQuery(e.target.value)}
                onBlur={() => {
                  if (bookingData.dropoffLocation) setToQuery(bookingData.dropoffLocation);
                }}
              />
              <ComboboxContent>
                <ComboboxList>
                  {filteredToLocations.length > 0 ? (
                    filteredToLocations.map((location) => (
                      <ComboboxItem key={location.id} value={{ id: location.name, label: location.name }}>
                        {location.name}
                      </ComboboxItem>
                    ))
                  ) : (
                    <ComboboxEmpty>No locations found</ComboboxEmpty>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          ) : (
            <FloatingInput
              label={tCar('to')}
              className={cn('h-14 w-full', sameAddress && 'cursor-not-allowed opacity-50')}
              value={bookingData.dropoffLocation || ''}
              onChange={(e) => handleToChange(e.target.value)}
              disabled={sameAddress}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailabilitySelector;
