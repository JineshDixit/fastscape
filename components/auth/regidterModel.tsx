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

import { RegisterModelPropType } from '@/common/propTypes';

export const registerSchema = z
  .object({
    userName: z.string().trim().min(1, 'Username is required').min(3, 'Username must be at least 3 characters'),
    email: z.string().trim().min(1, 'Email is required').email('Please enter a valid email address'),
    password: z.string().trim().min(1, 'Password is required').min(8, 'Password must be at least 8 characters'),
    confirmPassword: z
      .string()
      .trim()
      .min(1, 'Please confirm your password')
      .min(8, 'Password must be at least 8 characters'),
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

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    console.log(values);
    form.reset();
    onOpenChange(false);
  };

  const handleLoginClick = () => {
    form.reset();
    onOpenChange(false);
    onLoginClick();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">User Register</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {PASSWORD_FIELDS.map(({ name, label }) => {
              const showKey = name as keyof typeof show;

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
                          <Input {...field} type={show[showKey] ? 'text' : 'password'} />
                          <button
                            type="button"
                            onClick={() =>
                              setShow((s) => ({
                                ...s,
                                [showKey]: !s[showKey],
                              }))
                            }
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                          >
                            {show[showKey] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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
              <Button type="submit">Register</Button>
              <Button
                type="button"
                variant="outline"
                className="hover:text-foreground hover:bg-transparent"
                onClick={handleLoginClick}
              >
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
