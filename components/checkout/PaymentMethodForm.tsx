'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Wallet, Banknote, ArrowRight, Zap, Info, Lock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaymentBreakdown } from '@/common/interfaces';

interface PaymentMethodFormProps {
  breakdown: PaymentBreakdown | null;
  onNext: (method: 'ONLINE' | 'CARD' | 'CASH', payFull: boolean) => void;
  onBack: () => void;
  isLoading?: boolean;
  vehicle?: any; // Add vehicle prop for fallback calculation
  bookingData?: any; // Add booking data for fallback calculation
}

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({
  breakdown,
  onNext,
  onBack,
  isLoading,
  vehicle,
  bookingData
}) => {
  const [method, setMethod] = useState<'ONLINE' | 'CARD' | 'CASH'>('ONLINE');
  const [payFull, setPayFull] = useState(false);

  // Create fallback breakdown if none provided
  const getBreakdown = (): PaymentBreakdown => {
    if (breakdown) return breakdown;

    // Calculate fallback breakdown from vehicle and booking data
    const days = bookingData?.pickupDate && bookingData?.dropoffDate
      ? Math.ceil((new Date(bookingData.dropoffDate).getTime() - new Date(bookingData.pickupDate).getTime()) / (1000 * 60 * 60 * 24))
      : 1;

    const dailyRate = vehicle ? parseFloat(vehicle.pricePerDay) : 1200;
    const baseAmount = dailyRate * days;
    const taxAmount = Math.round(baseAmount * 0.05); // 5% tax
    const totalAmount = baseAmount + taxAmount;
    const depositAmount = Math.round(totalAmount * 0.3); // 30% deposit

    return {
      baseAmount,
      taxAmount,
      totalAmount,
      depositAmount,
      currency: vehicle?.currency || 'AED',
      breakdown: {
        dailyRate,
        days,
        subtotal: baseAmount,
        tax: taxAmount,
        total: totalAmount
      }
    };
  };

  const currentBreakdown = getBreakdown();

  if (!currentBreakdown && !vehicle) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="border-primary h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-xs font-black tracking-widest text-gray-400 uppercase">Loading Financial Data</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.618fr_1fr]">
        {/* Left: Payment Architecture */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-black tracking-[0.2em] text-gray-900 uppercase dark:text-white">
              <Zap className="text-primary h-4 w-4" />
              Transaction Protocol
            </h3>

            <RadioGroup value={method} onValueChange={(v) => setMethod(v as any)} className="grid grid-cols-1 gap-5">
              {[
                {
                  id: 'ONLINE',
                  label: 'Digital Payment',
                  desc: 'Secure encryption via Stripe / Apple Pay',
                  icon: Wallet,
                },
                {
                  id: 'CARD',
                  label: 'Physical Terminal',
                  desc: 'Pay with Credit/Debit at pickup counter',
                  icon: CreditCard,
                },
                { id: 'CASH', label: 'Currency', desc: 'Settle via physical cash on arrival', icon: Banknote },
              ].map((item) => {
                const isActive = method === item.id;
                const Icon = item.icon;

                return (
                  <Label
                    key={item.id}
                    htmlFor={item.id.toLowerCase()}
                    className={cn(
                      'relative flex cursor-pointer items-center justify-between overflow-hidden rounded-2xl border-2 p-4 transition-all duration-500',
                      isActive
                        ? 'border-primary bg-primary/5 shadow-primary/10 ring-primary/5 shadow-2xl ring-4'
                        : 'hover:border-primary/30 border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900',
                    )}
                  >
                    <div className="flex items-center gap-6">
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-500',
                          isActive
                            ? 'bg-primary shadow-primary/30 text-white shadow-xl'
                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800',
                        )}
                      >
                        <Icon className="h-7 w-7 stroke-[2.5]" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-black tracking-tight text-gray-950 uppercase dark:text-white">
                          {item.label}
                        </p>
                        <p className="text-[10px] font-medium text-gray-400 italic opacity-80">{item.desc}</p>
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
                Encrypted Settlement
              </p>
              <p className="text-[10px] leading-relaxed font-medium text-gray-400">
                We utilize AES-256 bank-level encryption. Your financial footprint is never permanently stored on our
                cloud architecture.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Price Breakdown Cinematic */}
        <div className="space-y-6">
          <div className="transform overflow-hidden rounded-4xl bg-white shadow-md ring-1 shadow-gray-200/50 ring-gray-100 transition-all hover:scale-[1.01] dark:bg-gray-900 dark:shadow-none dark:ring-gray-800">
            <div className="bg-primary/5 border-primary/10 border-b px-6 pt-8 pb-5">
              <h3 className="text-primary text-[9px] font-black tracking-[0.3em] uppercase italic">
                Investment Summary
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-primary text-base font-black">{currentBreakdown.currency}</span>
                <span className="text-4xl font-black tracking-tighter text-gray-950 dark:text-white">
                  {currentBreakdown.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold tracking-tight text-gray-500 uppercase">
                  <span className="flex items-center gap-2">
                    Base Performance
                    <Info className="h-3.5 w-3.5 cursor-help opacity-40" />
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {currentBreakdown.currency} {currentBreakdown.baseAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold tracking-tight text-gray-500 uppercase">
                  <span>Fees & Regulations</span>
                  <span className="text-gray-900 dark:text-white">
                    {currentBreakdown.currency} {currentBreakdown.taxAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="h-px bg-linear-to-r from-transparent via-gray-100 to-transparent dark:via-gray-800" />

              <div className="space-y-4 pt-2">
                <button
                  type="button"
                  onClick={() => setPayFull(false)}
                  className={cn(
                    'group/btn flex w-full flex-col items-center justify-center rounded-xl border-2 p-4 transition-all duration-500',
                    !payFull
                      ? 'border-primary bg-primary/5 ring-primary/5 scale-105 ring-4'
                      : 'border-gray-50 bg-gray-50/30 opacity-60 grayscale hover:opacity-100 hover:grayscale-0',
                  )}
                >
                  <span className="text-[9px] font-black tracking-[0.2em] text-gray-400 uppercase">
                    Secure Deposit Only
                  </span>
                  <span className="mt-1 text-xl font-black text-gray-950 dark:text-white">
                    {currentBreakdown.currency} {currentBreakdown.depositAmount.toLocaleString()}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayFull(true)}
                  className={cn(
                    'group/btn flex w-full flex-col items-center justify-center rounded-xl border-2 p-4 transition-all duration-500',
                    payFull
                      ? 'border-primary bg-primary/5 ring-primary/5 scale-105 ring-4'
                      : 'border-gray-50 bg-gray-50/30 opacity-60 grayscale hover:opacity-100 hover:grayscale-0',
                  )}
                >
                  <span className="text-[9px] font-black tracking-[0.2em] text-gray-400 uppercase">
                    Full Journey Access
                  </span>
                  <span className="mt-1 text-xl font-black text-gray-950 dark:text-white">
                    {currentBreakdown.currency} {currentBreakdown.totalAmount.toLocaleString()}
                  </span>
                </button>
              </div>

              <p className="mt-6 text-center text-[9px] font-bold text-gray-400 italic">
                * Remaining balance will be settled at the performance counter.
              </p>
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
          Modify
        </Button>

        <Button
          onClick={() => onNext(method, payFull)}
          disabled={isLoading}
          className="group bg-primary hover:shadow-primary/30 animate-in fade-in slide-in-from-right-10 relative px-5 py-5 overflow-hidden rounded-md text-xs font-black tracking-widest uppercase transition-all duration-500 hover:scale-[1.02] hover:shadow-xl md:w-auto"
        >
          <span className="relative z-10 flex items-center gap-3">
            {isLoading ? 'Synchronizing...' : 'Complete Booking'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transition-all duration-500 group-hover:h-full group-hover:bg-white/5" />
        </Button>
      </div>
    </div>
  );
};

export default PaymentMethodForm;
