'use client';

import { FC, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/app/axios';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { FloatingInput } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { LoginModelPropType } from '@/common/propTypes';

import { useTranslations } from 'next-intl';

/* Delete schema definition outside component */

const LoginModel: FC<LoginModelPropType> = ({ open, onOpenChange, onRegisterClick, onForgotPasswordClick }) => {
  const t = useTranslations('auth');
  const tVal = useTranslations('validation');
  const [showPassword, setShowPassword] = useState(false);

  const loginSchema = z.object({
    email: z.string().trim().min(1, tVal('required')).email(tVal('emailInvalid')),
    password: z.string().min(1, tVal('required')).min(8, tVal('passwordMin')),
  });

  const { login, isLoading, error } = useAuth();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function closeDialog() {
    onOpenChange(false);
    form.reset();
    setShowPassword(false);
  }

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    const response = await login(values);
    if (response.success) {
      closeDialog();
    }
  }

  function handleRegister() {
    closeDialog();
    onRegisterClick();
  }

  function handleForgotPassword() {
    closeDialog();
    onForgotPasswordClick();
  }

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">{t('login')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {error && <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">{error}</div>}
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <FloatingInput label={t('password')} {...field} type={showPassword ? 'text' : 'password'} />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((s) => !s)}
                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="button" variant="link" className="justify-start p-0" onClick={handleForgotPassword}>
              {t('forgotPassword')}
            </Button>

            <DialogFooter className="flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                className="hover:text-foreground hover:bg-transparent"
                onClick={handleRegister}
              >
                {t('dontHaveAccount')} {t('signUp')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('loading') : t('login')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModel;
