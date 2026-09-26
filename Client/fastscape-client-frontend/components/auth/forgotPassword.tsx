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
import { FloatingInput } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ForgotPasswordPropType } from '@/common/propTypes';
import { ForgotPasswordScreen } from '@/common/enums';
import { useAuth } from '@/app/axios';

import { useTranslations } from 'next-intl';

/* Remove external schemas */

const ForgotPassword: FC<ForgotPasswordPropType> = ({ open, onOpenChange }) => {
  const t = useTranslations('auth');
  const tVal = useTranslations('validation');

  const emailSchema = z.object({
    email: z.string().trim().min(1, tVal('required')).email(tVal('emailInvalid')),
  });

  const otpSchema = z.object({
    otp: z.string().regex(/^\d{6}$/, tVal('minLength', { min: 6 })),
  });

  const resetSchema = z
    .object({
      password: z.string().min(8, tVal('passwordMin')),
      confirmPassword: z.string().min(8, tVal('passwordMin')),
    })
    .refine((d) => d.password === d.confirmPassword, {
      path: ['confirmPassword'],
      message: tVal('passwordMismatch'),
    });

  const { forgotPassword, verifyOtp, resetPassword, isLoading, error } = useAuth();
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
    setShow({ password: false, confirm: false });
  }

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">{t('forgotPassword')}</DialogTitle>
        </DialogHeader>

        {screen === ForgotPasswordScreen.EMAIL && (
          <Form {...emailForm}>
            <form
              onSubmit={emailForm.handleSubmit(async (data) => {
                await forgotPassword(data.email);
                if (!error) setScreen(ForgotPasswordScreen.OTP);
              })}
              className="space-y-6"
            >
              {error && <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">{error}</div>}
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FloatingInput {...field} label={t('enterEmail')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t('loading') : t('sendOTP')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {screen === ForgotPasswordScreen.OTP && (
          <Form {...otpForm}>
            <form
              onSubmit={otpForm.handleSubmit(async (data) => {
                const email = emailForm.getValues().email;
                await verifyOtp(email, data.otp);
                if (!error) setScreen(ForgotPasswordScreen.RESET_PASSWORD);
              })}
              className="space-y-6"
            >
              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('enterOTP')}</FormLabel>
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t('loading') : t('verifyOTP')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {screen === ForgotPasswordScreen.RESET_PASSWORD && (
          <Form {...resetForm}>
            <form
              onSubmit={resetForm.handleSubmit(async (data) => {
                const email = emailForm.getValues().email;
                const otp = otpForm.getValues().otp;
                await resetPassword({ email, otp, newPassword: data.password });
                if (!error) closeDialog();
              })}
              className="space-y-6"
            >
              {(['password', 'confirmPassword'] as const).map((key) => (
                <FormField
                  key={key}
                  control={resetForm.control}
                  name={key}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <FloatingInput
                            {...field}
                            type={show[key === 'password' ? 'password' : 'confirm'] ? 'text' : 'password'}
                            label={key === 'password' ? t('password') : t('confirmPassword')}
                          />
                          <button
                            type="button"
                            aria-label={
                              show[key === 'password' ? 'password' : 'confirm'] ? 'Hide password' : 'Show password'
                            }
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? t('loading') : t('resetPassword')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPassword;
