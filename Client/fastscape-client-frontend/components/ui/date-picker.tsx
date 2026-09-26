'use client';

import { FC, useEffect, useState } from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FloatingInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DatePickerPropType } from '@/common/propTypes';

function formatDate(date?: Date) {
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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

      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative">
          <PopoverTrigger asChild>
            <div className="cursor-pointer">
              <FloatingInput
                id={id}
                value={inputValue}
                label={placeholder}
                disabled={disabled}
                readOnly
                className="cursor-pointer pr-16"
                onClick={() => !disabled && setOpen(true)}
              />
            </div>
          </PopoverTrigger>

          {value && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onChange?.(undefined as any);
                setInputValue('');
              }}
              className="absolute top-1/2 right-8 size-6 -translate-y-1/2 hover:bg-transparent"
            >
              <X className="text-muted-foreground hover:text-foreground size-4" />
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            disabled={disabled}
            className="pointer-events-none absolute top-1/2 right-2 size-6 -translate-y-1/2"
          >
            <CalendarIcon className="size-4" />
          </Button>
        </div>

        <PopoverContent className="w-auto p-0" align="end" sideOffset={10}>
          <Calendar
            mode="single"
            selected={value}
            month={month}
            captionLayout="dropdown"
            onMonthChange={setMonth}
            onSelect={(selected) => {
              if (selected) {
                onChange?.(selected);
                setOpen(false);
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DatePicker;
