'use client';

import { FC, useState } from 'react';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays, isWithinInterval, parseISO, startOfDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface AvailabilitySelectorProps {
  bookingData: {
    pickupDate: string | null;
    dropoffDate: string | null;
    bookingType: 'SELF_DRIVE' | 'CHAUFFEUR';
  };
  onServiceChange: (type: 'SELF_DRIVE' | 'CHAUFFEUR') => void;
  onDateChange: (start: Date, end: Date | null) => void;
}

const AvailabilitySelector: FC<AvailabilitySelectorProps> = ({ bookingData, onServiceChange, onDateChange }) => {
  const t = useTranslations('vehicleDetails');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const now = startOfDay(new Date());
  const start = bookingData.pickupDate ? startOfDay(parseISO(bookingData.pickupDate)) : null;
  const end = bookingData.dropoffDate ? startOfDay(parseISO(bookingData.dropoffDate)) : null;
  const bubbleStart = now;
  const initialDates = Array.from({ length: 5 }, (_, i) => addDays(bubbleStart, i));
  const lastInitialDate = initialDates[initialDates.length - 1];

  const handleDateSelect = (date: Date) => {
    if (start && end && start.getTime() === end.getTime() && date > start) {
      onDateChange(start, date);
    } else {
      onDateChange(date, date);
    }
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      onDateChange(range.from, range.to || null);
      if (range.to) {
        setCalendarOpen(false);
      }
    }
  };

  const isExtendedRange = end && end > lastInitialDate;

  const visibleDates = isExtendedRange ? [...initialDates.slice(0, 3), end] : initialDates;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold text-gray-700">{t('checkAvailability')}</span>
        <div className="flex flex-wrap items-center gap-2">
          {visibleDates.map((date, idx) => {
            const d = startOfDay(date);
            const isRangeStart = start && d.getTime() === start.getTime();
            const isRangeEnd = end && d.getTime() === end.getTime();
            const isInRange = start && end && isWithinInterval(d, { start, end });

            const showEllipsisBefore = isExtendedRange && idx === 3;

            return (
              <div key={idx} className="flex items-center gap-2">
                {showEllipsisBefore && (
                  <div className="flex h-12 w-6 items-center justify-center font-bold text-gray-400">...</div>
                )}
                <Button
                  onClick={() => handleDateSelect(date)}
                  className={cn(
                    'flex h-12 w-12 flex-col gap-0.5 items-center justify-center rounded-xl border text-center transition-all duration-200',
                    isRangeStart || isRangeEnd
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
                selected={{ from: start || undefined, to: end || undefined }}
                onSelect={handleRangeSelect}
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
    </div>
  );
};

export default AvailabilitySelector;
