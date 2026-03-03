'use client';

import { useTranslations } from 'next-intl';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import DatePicker from '@/components/ui/date-picker';
import { ChipToggle } from '@/components/ui/chip-toggle';
import { GooglePlacesInput } from '@/components/ui/google-places-input';
import z from 'zod';
import { useVehicle } from '@/app/axios';
import { useRouter } from '@/localization/navigation';
import { useEffect, useState, useRef } from 'react';
import { useLocation } from '@/app/axios/hooks/useLocation';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox';

interface CarSearchFormProps {
  onSearchComplete?: () => void;
}

export function CarSearchForm({ onSearchComplete }: CarSearchFormProps = {}) {
  const t = useTranslations('carSearch');
  const tVal = useTranslations('validation');
  const { searchAvailableVehicles, setBookingData } = useVehicle();
  const router = useRouter();

  const carSearchSchema = z
    .object({
      tripType: z.enum(['domestic']),
      from: z.string().min(3, tVal('pickupAddressMin')),
      sameAddress: z.boolean().optional(),
      to: z.string().min(3, tVal('dropAddressMin')),
      pickupDate: z.date().refine(
        (date) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date >= today;
        },
        { message: tVal('pickupDateFuture') },
      ),
      dropDate: z.date(),
      selfDrive: z.boolean().optional(),
    })
    .refine((data) => data.dropDate >= data.pickupDate, {
      message: tVal('dropDateAfterPickup'),
      path: ['dropDate'],
    });

  const form = useForm<z.infer<typeof carSearchSchema>>({
    resolver: zodResolver(carSearchSchema),
    defaultValues: {
      tripType: 'domestic' as const,
      from: '',
      sameAddress: false,
      to: '',
      pickupDate: undefined,
      dropDate: undefined,
      selfDrive: true, // Default to self drive (true)
    },
  });

  const { locations } = useLocation();
  const sameAddress = form.watch('sameAddress');
  const fromAddress = form.watch('from');
  const selfDrive = form.watch('selfDrive');

  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync 'to' address when 'sameAddress' is checked
  useEffect(() => {
    if (sameAddress) {
      form.setValue('to', fromAddress);
    }
  }, [sameAddress, fromAddress, form]);

  const filteredFromLocations =
    fromQuery === '' ? locations : locations.filter((loc) => loc.name.toLowerCase().includes(fromQuery.toLowerCase()));

  const filteredToLocations =
    toQuery === '' ? locations : locations.filter((loc) => loc.name.toLowerCase().includes(toQuery.toLowerCase()));

  const onSubmit = (data: z.infer<typeof carSearchSchema>) => {
    // Use local date format to avoid timezone issues
    const formatDateForAPI = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const bookingData = {
      pickupLocation: data.from,
      dropoffLocation: data.to,
      pickupDate: formatDateForAPI(data.pickupDate),
      dropoffDate: formatDateForAPI(data.dropDate),
      bookingType: (data.selfDrive ? 'SELF_DRIVE' : 'CHAUFFEUR') as 'SELF_DRIVE' | 'CHAUFFEUR',
    };

    setBookingData(bookingData);
    searchAvailableVehicles({
      pickupLocation: bookingData.pickupLocation,
      pickupDate: bookingData.pickupDate,
      dropoffDate: bookingData.dropoffDate,
      bookingType: bookingData.bookingType,
    });
    onSearchComplete?.();
    router.push('/vehicles');
    form.reset();
    setFromQuery('');
    setToQuery('');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 md:space-y-5">
        <div ref={containerRef} className="relative space-y-3 sm:space-y-4 md:space-y-5">
          <FormField
            control={form.control}
            name="tripType"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ChipToggle
                    value={field.value}
                    onChange={field.onChange}
                    options={[{ label: t('tripType'), value: 'domestic' }]}
                    className="bg-foreground rounded-md"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="selfDrive"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 sm:gap-3">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(value)} />
                </FormControl>
                <FormLabel className="text-xs font-normal sm:text-sm">{t('selfDrive')}</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="from"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  {selfDrive ? (
                    <Combobox
                      modal={false}
                      value={
                        locations.find((l) => l.name === field.value) ? { id: field.value, label: field.value } : null
                      }
                      onValueChange={(val) => {
                        if (val) {
                          field.onChange(val.label);
                          setFromQuery(val.label);
                          if (sameAddress) {
                            form.setValue('to', val.label);
                          }
                        } else {
                          field.onChange('');
                          setFromQuery('');
                        }
                      }}
                    >
                      <ComboboxInput
                        placeholder={t('from')}
                        className="bg-background h-14 w-full"
                        value={fromQuery}
                        onChange={(e) => setFromQuery(e.target.value)}
                      />
                      <ComboboxContent container={containerRef}>
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
                    <GooglePlacesInput
                      label={t('from')}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        if (sameAddress) {
                          form.setValue('to', value);
                        }
                      }}
                      restrictToDubai={true}
                      disabled={field.disabled}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sameAddress"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(value)} />
                </FormControl>
                <FormLabel className="text-xs font-normal sm:text-sm">{t('sameAsPickup')}</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="to"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  {!selfDrive && !sameAddress ? (
                    <GooglePlacesInput
                      label={t('to')}
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                      restrictToDubai={true}
                      disabled={field.disabled}
                    />
                  ) : selfDrive && !sameAddress ? (
                    <Combobox
                      modal={false}
                      value={
                        locations.find((l) => l.name === field.value) ? { id: field.value, label: field.value } : null
                      }
                      onValueChange={(val) => {
                        if (val) {
                          field.onChange(val.label);
                          setToQuery(val.label);
                        } else {
                          field.onChange('');
                          setToQuery('');
                        }
                      }}
                    >
                      <ComboboxInput
                        placeholder={t('to')}
                        className="bg-background h-14 w-full"
                        value={toQuery}
                        onChange={(e) => setToQuery(e.target.value)}
                      />
                      <ComboboxContent container={containerRef}>
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
                      label={t('to')}
                      {...field}
                      disabled={sameAddress}
                      className={sameAddress ? 'cursor-not-allowed opacity-50' : ''}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pickupDate"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DatePicker placeholder={t('pickupDate')} value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dropDate"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DatePicker placeholder={t('dropDate')} value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full rounded-full text-sm sm:text-base">
            {t('searchCars')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
