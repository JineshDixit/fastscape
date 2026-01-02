'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import DatePicker from '@/components/ui/date-picker';
import { ChipToggle } from '@/components/ui/chip-toggle';
import z from 'zod';

const today = new Date();
today.setHours(0, 0, 0, 0);

const carSearchSchema = z
  .object({
    tripType: z.enum(['domestic', 'international']).default('domestic'),
    from: z.string().min(3, 'Pickup address must be at least 3 characters long'),
    to: z.string().min(3, 'Drop address must be at least 3 characters long'),
    pickupDate: z.date().min(today, 'Pickup date must be today or later'),
    dropDate: z.date(),
    needDriver: z.boolean().optional(),
  })
  .refine((data) => data.dropDate >= data.pickupDate, {
    message: 'Drop date must be same as or after pickup date',
    path: ['dropDate'],
  });

export function CarSearchForm() {
  const form = useForm({
    resolver: zodResolver(carSearchSchema),
    defaultValues: {
      tripType: 'domestic',
      needDriver: false,
    },
  });

  const onSubmit = (data: z.infer<typeof carSearchSchema>) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="tripType"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ChipToggle
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { label: 'Domestic', value: 'domestic' },
                    { label: 'International', value: 'international' },
                  ]}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="from"
          render={({ field }) => (
            <FormItem>
              <FormLabel>From</FormLabel>
              <FormControl>
                <Input placeholder="Enter Pickup Address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="to"
          render={({ field }) => (
            <FormItem>
              <FormLabel>To</FormLabel>
              <FormControl>
                <Input placeholder="Enter Drop Address" {...field} />
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
              <FormLabel>Pickup Date</FormLabel>
              <FormControl>
                <DatePicker value={field.value} onChange={field.onChange} />
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
              <FormLabel>Drop Off Date</FormLabel>
              <FormControl>
                <DatePicker value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="needDriver"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="text-sm font-normal">We Need a Driver</FormLabel>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full rounded-full">
          Search the Rides
        </Button>
      </form>
    </Form>
  );
}
