'use client';

import { useTranslations } from 'next-intl';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useEffect } from 'react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import DatePicker from '@/components/ui/date-picker';
import { ChipToggle } from '@/components/ui/chip-toggle';
import z from 'zod';
import { useVehicle } from '@/app/axios';
import { useRouter } from '@/localization/navigation';

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

  const sameAddress = form.watch('sameAddress');
  const fromAddress = form.watch('from');

  useEffect(() => {
    if (sameAddress) {
      form.setValue('to', fromAddress);
    }
  }, [sameAddress, fromAddress, form]);

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const onSubmit = (data: any) => {
    const bookingData = {
      pickupLocation: data.from,
      pickupDate: data.pickupDate.toISOString(),
      dropoffDate: data.dropDate.toISOString(),
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
                <FloatingInput label={t('from')} {...field} />
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
                <FloatingInput
                  label={t('to')}
                  {...field}
                  disabled={sameAddress}
                  className={sameAddress ? 'cursor-not-allowed opacity-50' : ''}
                />
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
