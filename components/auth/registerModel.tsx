'use client';

import { FC, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DatePicker from '@/components/ui/date-picker';

import { RegisterModelPropType } from '@/common/propTypes';
import { useAuth } from '@/app/axios/hooks/useAuth';

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

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Full name must be at least 3 characters'),
    email: z.string().email('Please enter a valid email address'),
    countryCode: z.string(),
    phone: z.string().min(7).max(15),
    dateOfBirth: z.date(),
    nationality: z.string().min(2, 'Nationality is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const PASSWORD_FIELDS = [
  { name: 'password', label: 'Password' },
  { name: 'confirmPassword', label: 'Confirm Password' },
] as const;

const RegisterModel: FC<RegisterModelPropType> = ({ open, onOpenChange, onLoginClick }) => {
  const [show, setShow] = useState({
    password: false,
    confirmPassword: false,
  });

  const { register: registerUser, isLoading } = useAuth();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
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
        fullName: values.fullName,
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
          <DialogTitle className="text-center">Create Account</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="John Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="john@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-[110px_1fr] gap-2">
              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="1234567890"
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
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <DatePicker value={field.value} onChange={field.onChange} placeholder="1990-01-01" />
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
                    <FormLabel>Nationality</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Indian" />
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
                      <FormLabel>{label}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input {...field} type={show[key] ? 'text' : 'password'} />
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Registering…' : 'Register'}
              </Button>

              <Button type="button" variant="outline" onClick={handleLoginClick}>
                Already have an account? Login
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterModel;
