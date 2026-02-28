'use client';

import { FC, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FloatingInput } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DatePicker from '@/components/ui/date-picker';

import { RegisterModelPropType } from '@/common/propTypes';
import { useAuth } from '@/app/axios';
import { useTranslations } from 'next-intl';

const COUNTRY_CODES = [
  { code: '+1', country: 'US' },
  { code: '+44', country: 'UK' },
  { code: '+91', country: 'IN' },
  { code: '+61', country: 'AU' },
  { code: '+81', country: 'JP' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+86', country: 'CN' },
];

/* removed schema and constants outside */

const RegisterModel: FC<RegisterModelPropType> = ({ open, onOpenChange, onLoginClick }) => {
  const t = useTranslations('auth');
  const tVal = useTranslations('validation');

  const [show, setShow] = useState({
    password: false,
    confirmPassword: false,
  });

  const registerSchema = z
    .object({
      firstName: z
        .string()
        .trim()
        .min(2, tVal('minLength', { min: 2 })),
      lastName: z
        .string()
        .trim()
        .min(2, tVal('minLength', { min: 2 })),
      email: z.string().email(tVal('emailInvalid')),
      countryCode: z.string(),
      phone: z.string().min(7, tVal('phoneInvalid')).max(15, tVal('phoneInvalid')),
      dateOfBirth: z.date({ message: tVal('required') }),
      nationality: z.string().min(2, tVal('required')),
      password: z.string().min(8, tVal('passwordMin')),
      confirmPassword: z.string().min(8, tVal('passwordMin')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ['confirmPassword'],
      message: tVal('passwordMismatch'),
    });

  type RegisterFormValues = z.infer<typeof registerSchema>;

  const PASSWORD_FIELDS = [
    { name: 'password', label: t('password') },
    { name: 'confirmPassword', label: t('confirmPassword') },
  ] as const;

  const { register: registerUser, isLoading, error } = useAuth();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      countryCode: '+1',
      phone: '',
      dateOfBirth: undefined,
      nationality: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const response = await registerUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        phone: `${values.countryCode}${values.phone}`,
        dateOfBirth: `${values.dateOfBirth.getFullYear()}-${String(values.dateOfBirth.getMonth() + 1).padStart(2, '0')}-${String(values.dateOfBirth.getDate()).padStart(2, '0')}`,
        nationality: values.nationality,
      });

      if (response.success) {
        form.reset();
        onOpenChange(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoginClick = () => {
    form.reset();
    onOpenChange(false);
    onLoginClick();
  };

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) form.reset();
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">{t('signUp')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {error && <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">{error}</div>}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingInput label={t('firstName')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingInput label={t('lastName')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FloatingInput label={t('email')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-[110px_1fr] items-end gap-2">
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-[48px]!" size="default">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTRY_CODES.map((item) => (
                          <SelectItem key={item.code} value={item.code}>
                            {item.code} ({item.country})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingInput
                        label={t('phone')}
                        {...field}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} placeholder={t('dateOfBirth')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingInput label={t('nationality')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {PASSWORD_FIELDS.map(({ name, label }) => {
              const key = name as keyof typeof show;

              return (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <FloatingInput label={label} {...field} type={show[key] ? 'text' : 'password'} />
                          <button
                            type="button"
                            aria-label={`Toggle ${label}`}
                            className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
                            onClick={() => setShow((s) => ({ ...s, [key]: !s[key] }))}
                          >
                            {show[key] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            })}

            <DialogFooter className="flex-col gap-2">
              <Button type="button" variant="outline" onClick={handleLoginClick}>
                {t('alreadyHaveAccount')} {t('login')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('loading') : t('register')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterModel;
