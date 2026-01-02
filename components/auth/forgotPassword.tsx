'use client';

import { FC, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ForgotPasswordPropType } from '@/common/propTypes';
import { ForgotPasswordScreen } from '@/common/enums';

const emailSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Please enter a valid email address'),
});

const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

const ForgotPassword: FC<ForgotPasswordPropType> = ({ open, onOpenChange }) => {
  const [screen, setScreen] = useState<ForgotPasswordScreen>(ForgotPasswordScreen.EMAIL);
  const [show, setShow] = useState({ password: false, confirm: false });

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const resetForm = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  function closeDialog() {
    onOpenChange(false);
    setScreen(ForgotPasswordScreen.EMAIL);
    emailForm.reset();
    otpForm.reset();
    resetForm.reset();
  }

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">Forgot Password</DialogTitle>
        </DialogHeader>

        {screen === ForgotPasswordScreen.EMAIL && (
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(() => setScreen(ForgotPasswordScreen.OTP))} className="space-y-6">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">Send OTP</Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {screen === ForgotPasswordScreen.OTP && (
          <Form {...otpForm}>
            <form
              onSubmit={otpForm.handleSubmit(() => setScreen(ForgotPasswordScreen.RESET_PASSWORD))}
              className="space-y-6"
            >
              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email OTP</FormLabel>
                    <FormControl>
                      <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS} {...field}>
                        {[0, 1, 2, 3, 4, 5].map((key) => (
                          <InputOTPGroup key={`otp-${key}`}>
                            <InputOTPSlot key={key} index={key} />
                          </InputOTPGroup>
                        ))}
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">Confirm OTP</Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {screen === ForgotPasswordScreen.RESET_PASSWORD && (
          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(closeDialog)} className="space-y-6">
              {(['password', 'confirmPassword'] as const).map((key) => (
                <FormField
                  key={key}
                  control={resetForm.control}
                  name={key}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{key === 'password' ? 'Password' : 'Confirm Password'}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={show[key === 'password' ? 'password' : 'confirm'] ? 'text' : 'password'}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShow((s) => ({
                                ...s,
                                [key === 'password' ? 'password' : 'confirm']:
                                  !s[key === 'password' ? 'password' : 'confirm'],
                              }))
                            }
                            className="absolute top-1/2 right-3 -translate-y-1/2"
                          >
                            {show[key === 'password' ? 'password' : 'confirm'] ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <DialogFooter>
                <Button type="submit">Reset Password</Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPassword;
