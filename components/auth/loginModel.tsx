'use client';

import { FC, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/app/axios/hooks/useAuth';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { LoginModelPropType } from '@/common/propTypes';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Please enter a valid email address'),

  password: z.string().min(1, 'Password is required').min(8, 'Password must be at least 8 characters long'),
});

const LoginModel: FC<LoginModelPropType> = ({ open, onOpenChange, onRegisterClick, onForgotPasswordClick }) => {
  const [showPassword, setShowPassword] = useState(false);

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
    await login(values);
    if (!error) {
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
          <DialogTitle className="text-center">User Log In</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input {...field} type={showPassword ? 'text' : 'password'} />
                      <button
                        type="button"
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
              Forgot password?
            </Button>

            <DialogFooter className="flex-col gap-2">
              <Button type="submit">Login</Button>

              <Button
                type="button"
                variant="outline"
                className="hover:text-foreground hover:bg-transparent"
                onClick={handleRegister}
              >
                New User? Sign Up
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModel;
