'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { isAxiosError } from 'axios';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { FloatingInput } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { contactService } from '@/app/axios/services/contact';

const ContactUsPage = () => {
  const t = useTranslations('contactUsPage');
  const tVal = useTranslations('validation');

  const contactSchema = z.object({
    name: z.string().trim().min(2, tVal('minLength', { min: 2 })),
    email: z.string().trim().min(1, tVal('required')).email(tVal('emailInvalid')),
    phone: z.string().trim().optional(),
    message: z.string().trim().min(10, tVal('minLength', { min: 10 })),
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  const handleSubmit = async (values: z.infer<typeof contactSchema>) => {
    setSubmitError(null);
    setIsSubmitted(false);
    setIsSubmitting(true);

    try {
      const response = await contactService.submitContactUs({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone?.trim() || undefined,
        message: values.message.trim(),
      });

      if (response.success) {
        setIsSubmitted(true);
        form.reset();
        return;
      }

      setSubmitError(response.message || t('submitError'));
    } catch (error) {
      if (isAxiosError(error)) {
        const message = (error.response?.data as { message?: string } | undefined)?.message;
        setSubmitError(message || t('submitError'));
      } else if (error instanceof Error) {
        setSubmitError(error.message || t('submitError'));
      } else {
        setSubmitError(t('submitError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen py-8 md:py-14">
      <div className="global-container space-y-8 md:space-y-12">
        <section className="space-y-4 text-center">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 border px-3 py-1 text-xs">
            <MessageSquare className="h-3.5 w-3.5" />
            {t('badge')}
          </Badge>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-5xl">{t('title')}</h1>
          <p className="mx-auto max-w-2xl text-sm text-gray-500 md:text-base">{t('subtitle')}</p>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.35fr]">
          <Card className="h-fit rounded-2xl border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-bold">{t('connectTitle')}</CardTitle>
              <CardDescription>{t('connectSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-gray-100 p-4">
                <Mail className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t('emailLabel')}</p>
                  <p className="text-sm text-gray-600">{t('emailValue')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-gray-100 p-4">
                <Phone className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t('phoneLabel')}</p>
                  <p className="text-sm text-gray-600">{t('phoneValue')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-gray-100 p-4">
                <MapPin className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t('addressLabel')}</p>
                  <p className="text-sm text-gray-600">{t('addressValue')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-gray-100 p-4">
                <Clock className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t('hoursLabel')}</p>
                  <p className="text-sm text-gray-600">{t('hoursValue')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-gray-200">
            <CardHeader>
              <CardTitle className="text-xl font-bold">{t('formTitle')}</CardTitle>
              <CardDescription>{t('formSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isSubmitted && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {t('successMessage')}
                </div>
              )}
              {submitError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {submitError}
                </div>
              )}

              <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FloatingInput label={t('name')} {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <FloatingInput label={t('email')} type="email" {...field} required />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <FloatingInput label={t('phone')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">{t('message')}</p>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t('messagePlaceholder')}
                            className="min-h-36 resize-y"
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" className="h-11 w-full rounded-lg md:w-auto md:px-8" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {isSubmitting ? t('submitting') : t('submit')}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
};

export default ContactUsPage;
