'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Wallet, Banknote, ArrowRight, Zap, Info, Lock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaymentBreakdown } from '@/common/interfaces';
import { useTranslations } from 'next-intl';

interface PaymentMethodFormProps {
  breakdown: PaymentBreakdown | null;
  onNext: (method: 'ONLINE' | 'PICKUP' | 'DROPOFF', payFull: boolean) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({ breakdown, onNext, onBack, isLoading }) => {
  const t = useTranslations('paymentStep');
  const [method, setMethod] = useState<'ONLINE' | 'PICKUP' | 'DROPOFF'>('ONLINE');
  const [payFull, setPayFull] = useState(false);

  if (!breakdown) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="border-primary h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-xs font-black tracking-widest text-gray-400 uppercase">{t('synchronizing')}</p>
      </div>
    );
  }

  const currentBreakdown = breakdown;

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.618fr_1fr]">
        {/* Left: Payment Architecture */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-black tracking-[0.2em] text-gray-900 uppercase dark:text-white">
              <Zap className="text-primary h-4 w-4" />
              {t('protocol')}
            </h3>

            <RadioGroup value={method} onValueChange={(v) => setMethod(v as any)} className="grid grid-cols-1 gap-5">
              {[
                {
                  id: 'ONLINE',
                  label: t('digitalPayment'),
                  desc: t('digitalDesc'),
                  icon: Wallet,
                },
                {
                  id: 'PICKUP',
                  label: t('physicalTerminal'),
                  desc: t('physicalDesc'),
                  icon: CreditCard,
                },
                { id: 'DROPOFF', label: t('currency'), desc: t('currencyDesc'), icon: Banknote },
              ].map((item) => {
                const isActive = method === item.id;
                const Icon = item.icon;

                return (
                  <Label
                    key={item.id}
                    htmlFor={item.id.toLowerCase()}
                    className={cn(
                      'relative flex cursor-pointer items-center justify-between overflow-hidden rounded-2xl border-2 p-4 transition-all duration-300',
                      isActive
                        ? 'border-primary bg-primary/5 ring-primary/5 ring-2'
                        : 'hover:border-primary/20 border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-500',
                          isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 dark:bg-gray-800',
                        )}
                      >
                        <Icon className="h-7 w-7 stroke-[2.5]" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-black tracking-tight text-gray-950 uppercase dark:text-white">
                          {item.label}
                        </p>
                        <p className="text-[10px] leading-relaxed font-medium text-gray-400 italic opacity-80">{item.desc}</p>
                      </div>
                    </div>

                    {isActive && (
                      <div className="bg-primary animate-in zoom-in flex h-6 w-6 items-center justify-center rounded-full duration-300">
                        <CheckCircle2 className="h-4 w-4 stroke-3 text-white" />
                      </div>
                    )}

                    <RadioGroupItem value={item.id} id={item.id.toLowerCase()} className="sr-only" />
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          <div className="flex flex-col items-center gap-5 rounded-2xl border border-gray-100 bg-gray-50/50 p-5 sm:flex-row dark:border-gray-800 dark:bg-gray-900/50">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-xs font-black tracking-tight text-gray-950 uppercase dark:text-white">
                {t('encryptedSettlement')}
              </p>
              <p className="text-[10px] leading-relaxed font-medium text-gray-400">{t('encryptionDesc')}</p>
            </div>
          </div>
        </div>

        {/* Right: Price Breakdown Cinematic */}
        <div className="space-y-6">
          <div className="transform overflow-hidden rounded-4xl bg-white shadow-md ring-1 shadow-gray-200/50 ring-gray-100 transition-all hover:scale-[1.01] dark:bg-gray-900 dark:shadow-none dark:ring-gray-800">
            <div className="bg-primary/5 border-primary/10 border-b px-6 pt-8 pb-5">
              <h3 className="text-primary text-[9px] font-black tracking-[0.3em] uppercase italic">
                {t('investmentSummary')}
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-primary text-base font-black">{currentBreakdown.currency}</span>
                <span className="text-4xl font-black tracking-tighter text-gray-950 dark:text-white">
                  {Number(currentBreakdown.totalAmount).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold tracking-tight text-gray-500 uppercase">
                  <span className="flex items-center gap-2">
                    {t('basePerformance')}
                    <Info className="h-3.5 w-3.5 cursor-help opacity-40" />
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {currentBreakdown.currency} {Number(currentBreakdown.baseAmount).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold tracking-tight text-gray-500 uppercase">
                  <span>{t('feesRegulations')}</span>
                  <span className="text-gray-900 dark:text-white">
                    {currentBreakdown.currency} {Number(currentBreakdown.taxAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="h-px bg-linear-to-r from-transparent via-gray-100 to-transparent dark:via-gray-800" />

              <div className="space-y-4 pt-2">
                <button
                  type="button"
                  onClick={() => setPayFull(false)}
                  className={cn(
                    'group/btn flex w-full flex-col items-center justify-center rounded-xl border-2 p-4 transition-all duration-300',
                    !payFull
                      ? 'border-primary bg-primary/5 ring-primary/5 ring-2'
                      : 'border-gray-50 bg-gray-50/10 opacity-60 grayscale hover:opacity-100 hover:grayscale-0',
                  )}
                >
                  <span className="text-[9px] font-black tracking-[0.2em] text-gray-400 uppercase">
                    {t('secureDepositOnly')}
                  </span>
                  <span className="mt-1 text-xl font-black text-gray-950 dark:text-white">
                    {currentBreakdown.currency} {Number(currentBreakdown.depositAmount).toLocaleString()}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayFull(true)}
                  className={cn(
                    'group/btn flex w-full flex-col items-center justify-center rounded-xl border-2 p-4 transition-all duration-300',
                    payFull
                      ? 'border-primary bg-primary/5 ring-primary/5 ring-2'
                      : 'border-gray-50 bg-gray-50/10 opacity-60 grayscale hover:opacity-100 hover:grayscale-0',
                  )}
                >
                  <span className="text-[9px] font-black tracking-[0.2em] text-gray-400 uppercase">
                    {t('fullJourneyAccess')}
                  </span>
                  <span className="mt-1 text-xl font-black text-gray-950 dark:text-white">
                    {currentBreakdown.currency} {Number(currentBreakdown.totalAmount).toLocaleString()}
                  </span>
                </button>
              </div>

              <p className="mt-6 text-center text-[9px] font-bold text-gray-400 italic">{t('balanceDisclaimer')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-5 md:flex-row dark:border-gray-800">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-12 w-full rounded-xl border-2 px-10 text-xs font-black tracking-widest uppercase transition-all hover:bg-gray-50 active:scale-95 md:w-auto"
        >
          {t('modify')}
        </Button>

        <Button
          onClick={() => onNext(method, payFull)}
          disabled={isLoading}
          className="group bg-primary hover:bg-primary/90 relative overflow-hidden rounded-xl px-10 py-6 text-xs font-black tracking-widest uppercase transition-all duration-300 md:w-auto"
        >
          <span className="relative z-10 flex items-center gap-3">
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t('synchronizing')}
              </>
            ) : (
              <>
                {t('authorizeMission')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </span>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transition-all duration-500 group-hover:h-full group-hover:bg-white/10" />
        </Button>
      </div>
    </div>
  );
};

export default PaymentMethodForm;
