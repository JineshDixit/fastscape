'use client';

import { FC, useEffect, useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DatePickerPropType } from '@/common/propTypes';

function formatDate(date?: Date) {
  if (!date) return '';

  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function isValidDate(date?: Date) {
  return !!date && !isNaN(date.getTime());
}

const DatePicker: FC<DatePickerPropType> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  id = 'date-picker',
}) => {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date | undefined>(value);
  const [inputValue, setInputValue] = useState(formatDate(value));

  useEffect(() => {
    setInputValue(formatDate(value));
    setMonth(value);
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <Label htmlFor={id} className="px-1">
          {label}
        </Label>
      )}

      <div className="relative">
        <Input
          id={id}
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
          onChange={(e) => {
            const typedDate = new Date(e.target.value);
            setInputValue(e.target.value);

            if (isValidDate(typedDate)) {
              onChange?.(typedDate);
              setMonth(typedDate);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              className="absolute right-2 top-1/2 size-6 -translate-y-1/2"
            >
              <CalendarIcon className="size-4" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-auto p-0"
            align="end"
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={value}
              month={month}
              captionLayout="dropdown"
              onMonthChange={setMonth}
              onSelect={(selected) => {
                onChange?.(selected!);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default DatePicker;
