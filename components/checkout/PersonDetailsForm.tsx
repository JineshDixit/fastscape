'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { FloatingInput as Input } from '@/components/ui/input';
import DatePicker from '@/components/ui/date-picker';
import { User, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import type { UserProfile } from '@/common/interfaces';
import { cn } from '@/lib/utils';

const personSchema = z.object({
  fullName: z.string().min(3, 'Name must be at least 3 characters'),
  phone: z.string().min(7, 'Invalid phone number'),
  email: z.string().email('Invalid email address'),
  nationality: z.string().min(2, 'Required'),
  dateOfBirth: z.date({ message: 'Required' }),
  city: z.string().min(2, 'Required'),
  state: z.string().optional(),
  country: z.string().min(2, 'Required'),
  zipCode: z.string().optional(),
});

type PersonFormValues = z.infer<typeof personSchema>;

interface PersonDetailsFormProps {
  initialData: Partial<UserProfile> | null;
  onNext: (data: PersonFormValues) => void;
  isLoading?: boolean;
}

const PersonDetailsForm: React.FC<PersonDetailsFormProps> = ({ initialData, onNext, isLoading }) => {
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      nationality: initialData?.nationality || '',
      dateOfBirth: initialData?.dateOfBirth ? new Date(initialData.dateOfBirth) : (undefined as any),
      city: initialData?.city || '',
      state: initialData?.state || '',
      country: initialData?.country || '',
      zipCode: initialData?.zipCode || '',
    },
  });

  const onSubmit = (data: PersonFormValues) => {
    // Format date to YYYY-MM-DD for API compatibility
    const submissionData = {
      ...data,
      dateOfBirth: format(data.dateOfBirth, 'yyyy-MM-dd'),
    };
    onNext(submissionData as any);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="animate-in fade-in space-y-6 duration-500">
      {/* Identity Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <User className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-black tracking-[0.2em] text-gray-900 uppercase dark:text-white">
            Personal Identity
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
          <div className="group space-y-2">
            <Input id="fullName" {...register('fullName')} label={tAuth('fullName')} />
            {errors.fullName && (
              <p className="text-destructive animate-in slide-in-from-left-2 ml-1 text-[10px] font-bold tracking-tighter uppercase italic">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Input id="phone" {...register('phone')} label={tAuth('phone')} />
            {errors.phone && (
              <p className="text-destructive animate-in slide-in-from-left-2 ml-1 text-[10px] font-bold tracking-tighter uppercase italic">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Input
              id="email"
              {...register('email')}
              label={tAuth('email')}
              type="email"
              disabled
              className="bg-gray-50/50 opacity-60"
            />
          </div>

          <div className="space-y-3">
            <Input id="nationality" {...register('nationality')} label={tAuth('nationality')} />
            {errors.nationality && (
              <p className="text-destructive animate-in slide-in-from-left-2 ml-1 text-[10px] font-bold tracking-tighter uppercase italic">
                {errors.nationality.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Controller
              control={control}
              name="dateOfBirth"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={tAuth('dateOfBirth')}
                  id="dateOfBirth"
                />
              )}
            />
            {errors.dateOfBirth && (
              <p className="text-destructive animate-in slide-in-from-left-2 ml-1 text-[10px] font-bold tracking-tighter uppercase italic">
                {errors.dateOfBirth.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <MapPin className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-black tracking-[0.2em] text-gray-900 uppercase dark:text-white">
            Home Residency
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2">
          <div className="space-y-3">
            <Input id="country" {...register('country')} label="Country" />
            {errors.country && (
              <p className="text-destructive animate-in slide-in-from-left-2 ml-1 text-[10px] font-bold tracking-tighter uppercase italic">
                {errors.country.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Input id="city" {...register('city')} label="City" />
            {errors.city && (
              <p className="text-destructive animate-in slide-in-from-left-2 ml-1 text-[10px] font-bold tracking-tighter uppercase italic">
                {errors.city.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Input id="state" {...register('state')} label="State / Province" />
          </div>

          <div className="space-y-3">
            <Input id="zipCode" {...register('zipCode')} label="Zip / Postal Code" />
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-5 md:flex-row dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-tight text-gray-950 uppercase dark:text-white">
              Profile Precision
            </p>
            <p className="text-[9px] font-medium text-gray-400 italic">Verification accuracy accelerates processing.</p>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="group bg-primary hover:shadow-primary/30 animate-in fade-in slide-in-from-right-10 relative px-5 py-5 overflow-hidden rounded-md text-xs font-black tracking-widest uppercase transition-all duration-500 hover:scale-[1.02] hover:shadow-xl md:w-auto"
        >
          <span className="relative z-10 flex items-center gap-3">
            {isLoading ? tCommon('loading') : 'Verify Profile'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transition-all duration-500 group-hover:h-full group-hover:bg-white/5" />
        </Button>
      </div>
    </form>
  );
};

export default PersonDetailsForm;
