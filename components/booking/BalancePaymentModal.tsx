'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useBooking } from '@/app/axios/hooks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  Wallet,
  Banknote,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaymentSummary } from '@/common/interfaces';

interface BalancePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  paymentSummary: PaymentSummary;
  onSuccess?: () => void;
}

export const BalancePaymentModal: React.FC<BalancePaymentModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  paymentSummary,
  onSuccess,
}) => {
  const t = useTranslations('paymentStep');
  const tCommon = useTranslations('common');
  const {
    processBalancePayment,
    initiatePaymentIntent,
    isProcessingPayment,
    error: paymentError,
    clearError,
  } = useBooking();

  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'PICKUP' | 'DROPOFF'>('ONLINE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate remaining balance
  const remainingBalance = parseFloat(paymentSummary.remainingBalance || '0');

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setError(null);
      clearError();
    }
  }, [isOpen, clearError]);

  const handlePayment = async () => {
    if (remainingBalance <= 0) {
      setError('No balance remaining to pay');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      if (paymentMethod === 'ONLINE') {
        // Step 1: Create payment intent
        console.log('[BalancePayment] Creating payment intent for balance...');
        const intentResponse = await initiatePaymentIntent(bookingId, 'BALANCE');

        if (!intentResponse?.success || !intentResponse.data) {
          throw new Error(intentResponse?.message || 'Failed to create payment intent');
        }

        console.log('[BalancePayment] Payment intent created:', intentResponse.data.id);

        // Step 2: Process the payment
        const paymentResponse = await processBalancePayment(bookingId, {
          paymentMethod: 'ONLINE',
          stripePaymentIntentId: intentResponse.data.id,
        });

        if (!paymentResponse?.success) {
          throw new Error(paymentResponse?.message || 'Payment processing failed');
        }

        console.log('[BalancePayment] Balance payment processed successfully');
        setSuccess(true);

        // Call success callback after a brief delay
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        // Manual payment (PICKUP or DROPOFF)
        const paymentResponse = await processBalancePayment(bookingId, {
          paymentMethod: paymentMethod,
        });

        if (!paymentResponse?.success) {
          throw new Error(paymentResponse?.message || 'Payment processing failed');
        }

        console.log('[BalancePayment] Manual payment recorded successfully');
        setSuccess(true);

        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      console.error('[BalancePayment] Payment failed:', err);
      setError(err.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${numAmount.toFixed(2)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">
            Complete Balance Payment
          </DialogTitle>
          <DialogDescription>
            Complete the remaining balance for your booking to finalize the payment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Payment Summary */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-6 dark:border-gray-800 dark:bg-gray-900/50">
            <h3 className="mb-4 text-sm font-black tracking-widest text-gray-400 uppercase">
              Payment Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-bold">{formatCurrency(paymentSummary.financial.totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600">Amount Paid</span>
                <span className="font-bold text-green-600">{formatCurrency(paymentSummary.totalPaid)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black uppercase">Remaining Balance</span>
                  <span className="text-2xl font-black text-orange-600">
                    {formatCurrency(remainingBalance)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-black tracking-widest text-gray-900 uppercase dark:text-white">
              Select Payment Method
            </h3>

            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as any)}
              className="grid grid-cols-1 gap-4"
            >
              {[
                {
                  id: 'ONLINE',
                  label: 'Online Payment',
                  desc: 'Pay securely with Stripe / Apple Pay',
                  icon: Wallet,
                },
                {
                  id: 'PICKUP',
                  label: 'Pay at Pickup',
                  desc: 'Pay with Credit/Debit at pickup counter',
                  icon: CreditCard,
                },
                {
                  id: 'DROPOFF',
                  label: 'Pay at Dropoff',
                  desc: 'Pay when returning the vehicle',
                  icon: Banknote,
                },
              ].map((item) => {
                const isActive = paymentMethod === item.id;
                const Icon = item.icon;

                return (
                  <Label
                    key={item.id}
                    htmlFor={item.id.toLowerCase()}
                    className={cn(
                      'relative flex cursor-pointer items-center justify-between overflow-hidden rounded-xl border-2 p-4 transition-all duration-300',
                      isActive
                        ? 'border-primary bg-primary/5 ring-primary/5 ring-2'
                        : 'hover:border-primary/20 border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900',
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-500',
                          isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 dark:bg-gray-800',
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-gray-950 dark:text-white">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                    </div>

                    {isActive && (
                      <div className="bg-primary flex h-5 w-5 items-center justify-center rounded-full">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    )}

                    <RadioGroupItem value={item.id} id={item.id.toLowerCase()} className="sr-only" />
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
            <Lock className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-xs font-bold text-blue-900 dark:text-blue-100">
                Secure Payment
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                All transactions are encrypted and secure
              </p>
            </div>
          </div>

          {/* Error Display */}
          {(error || paymentError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || paymentError}</AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {success && (
            <Alert className="border-green-500/20 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                Payment processed successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isProcessing || success}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing || success || remainingBalance <= 0}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Payment Complete
                </>
              ) : (
                <>
                  Pay {formatCurrency(remainingBalance)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
