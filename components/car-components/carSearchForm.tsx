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
import z from 'zod';
import { useVehicle } from '@/app/axios';
import { useRouter } from '@/localization/navigation';
import { useEffect, useState } from 'react';
import { useLocation } from '@/app/axios/hooks/useLocation';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox';

export function CarSearchForm() {
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
      needDriver: z.boolean().optional(),
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
      needDriver: false,
    },
  });

  const { locations } = useLocation();
  const sameAddress = form.watch('sameAddress');
  const fromAddress = form.watch('from');
  const needDriver = form.watch('needDriver');

  useEffect(() => {
    if (sameAddress) {
      form.setValue('to', fromAddress);
    }
  }, [sameAddress, fromAddress, form]);

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const onSubmit = (data: any) => {
    // Use local date format to avoid timezone issues
    const formatDateForAPI = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const bookingData = {
      pickupLocation: data.from,
      pickupDate: formatDateForAPI(data.pickupDate),
      dropoffDate: formatDateForAPI(data.dropDate),
      bookingType: (data.needDriver ? 'SELF_DRIVE' : 'CHAUFFEUR') as 'SELF_DRIVE' | 'CHAUFFEUR',
    };

    setBookingData(bookingData);
    searchAvailableVehicles({
      pickupLocation: bookingData.pickupLocation,
      pickupDate: bookingData.pickupDate,
      dropoffDate: bookingData.dropoffDate,
    });
    router.push('/vehicles');
    form.reset();
  };

  const [fromQuery, setFromQuery] = useState('');
  const [toQuery, setToQuery] = useState('');

  // Sync query with form value (initial load or external change)
  useEffect(() => {
    if (form.getValues('from')) setFromQuery(form.getValues('from'));
    if (form.getValues('to')) setToQuery(form.getValues('to'));
  }, [form.getValues('from'), form.getValues('to')]);

  const filteredFromLocations =
    fromQuery === '' ? locations : locations.filter((loc) => loc.name.toLowerCase().includes(fromQuery.toLowerCase()));

  const filteredToLocations =
    toQuery === '' ? locations : locations.filter((loc) => loc.name.toLowerCase().includes(toQuery.toLowerCase()));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 md:space-y-5">
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
          name="needDriver"
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
                {needDriver ? (
                  <Combobox
                    value={
                      locations.find((l) => l.name === field.value) ? { id: field.value, label: field.value } : null
                    }
                    onValueChange={(val) => {
                      if (val) {
                        field.onChange(val.label);
                        setFromQuery(''); // Reset query on selection or set to label? usually reset or set to label.
                        // Actually, if we want the input to show the selected value, we rely on the Combobox rendering the value.
                        if (form.getValues('sameAddress')) {
                          form.setValue('to', val.label);
                        }
                      } else {
                        field.onChange('');
                      }
                    }}
                  >
                    <ComboboxInput
                      placeholder={t('from')}
                      className="bg-background h-14 w-full"
                      value={fromQuery}
                      onChange={(e) => {
                        setFromQuery(e.target.value);
                        // Optional: Clear selection if user types something new?
                        // field.onChange(''); // Uncomment if strict selection is required immediately
                      }}
                      onBlur={() => {
                        // Restore value if nothing selected? Or keep query?
                        // If field.value exists, maybe reset query to it?
                        if (field.value) setFromQuery(field.value);
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
                  <FloatingInput label={t('from')} {...field} />
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
                {needDriver ? (
                  <Combobox
                    value={
                      locations.find((l) => l.name === field.value) ? { id: field.value, label: field.value } : null
                    }
                    onValueChange={(val) => {
                      if (val) {
                        field.onChange(val.label);
                        setToQuery('');
                      } else {
                        field.onChange('');
                      }
                    }}
                    disabled={sameAddress}
                  >
                    <ComboboxInput
                      placeholder={t('to')}
                      className={`bg-background h-14 w-full ${sameAddress ? 'cursor-not-allowed opacity-50' : ''}`}
                      disabled={sameAddress}
                      value={toQuery}
                      onChange={(e) => setToQuery(e.target.value)}
                      onBlur={() => {
                        if (field.value) setToQuery(field.value);
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
      </form>
    </Form>
  );
}
