'use client';

import { useState, useEffect } from 'react';
import { useBooking } from '@/app/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  CreditCardIcon,
  BanknoteIcon,
  BuildingIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  ClockIcon,
  UserIcon,
} from 'lucide-react';
import type { PaymentMethod, PaymentBreakdown } from '@/common/interfaces';
import AdditionalChargesDisplay from './AdditionalChargesDisplay';

interface PaymentFormProps {
  bookingId: string;
  paymentType: 'deposit' | 'balance' | 'full';
  paymentOption?: 'deposit' | 'full'; // Selected payment option from PaymentOptionsForm
  breakdown?: PaymentBreakdown; // Payment breakdown from PaymentOptionsForm
  delayHours?: number; // For dropoff payments with late fees
  chauffeurCharges?: number; // For dropoff payments with chauffeur fees
  additionalCharges?: AdditionalCharge[]; // For dropoff payments
  onPaymentSuccess?: () => void;
  onCancel?: () => void;
  onBackToOptions?: () => void; // Navigate back to payment options
}

interface AdditionalCharge {
  id: string;
  type: 'chauffeur' | 'late_dropoff' | 'damage' | 'fuel' | 'cleaning' | 'other';
  description: string;
  amount: number;
  currency: string;
  isApplied: boolean;
  appliedAt?: string;
  details?: string;
  rate?: number;
  quantity?: number;
  unit?: string;
}

export default function PaymentForm({
  bookingId,
  paymentType,
  paymentOption,
  breakdown: providedBreakdown,
  delayHours = 0,
  chauffeurCharges = 0,
  additionalCharges = [],
  onPaymentSuccess,
  onCancel,
  onBackToOptions,
}: PaymentFormProps) {
  const {
    paymentBreakdown,
    calculatePaymentBreakdown,
    processDepositPayment,
    processBalancePayment,
    isProcessingPayment,
    error,
    clearError,
  } = useBooking();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ONLINE');
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<'deposit' | 'full'>(paymentOption || 'deposit');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Use provided breakdown or fetch from API
  const currentBreakdown = providedBreakdown || paymentBreakdown;

  useEffect(() => {
    // Only fetch breakdown if not provided and not a dropoff payment
    if (!providedBreakdown && paymentType !== 'balance') {
      calculatePaymentBreakdown(bookingId, delayHours);
    }
  }, [bookingId, providedBreakdown, paymentType, delayHours, calculatePaymentBreakdown]);

  useEffect(() => {
    if (paymentOption) {
      setSelectedPaymentOption(paymentOption);
    }
  }, [paymentOption]);

  const validatePayment = (): boolean => {
    const errors: string[] = [];

    // Validate payment method for online payments
    if (paymentMethod === 'ONLINE' && !currentBreakdown) {
      errors.push('Payment breakdown not available');
    }

    // Validate minimum amounts
    const paymentAmount = getPaymentAmount();
    const numericAmount = parseFloat(paymentAmount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      errors.push('Payment amount must be greater than zero');
    }

    // Validate dropoff payments have proper additional charges calculation
    if (paymentType === 'balance' && (delayHours > 0 || chauffeurCharges > 0)) {
      if (additionalCharges.length === 0 && (delayHours > 0 || chauffeurCharges > 0)) {
        errors.push('Additional charges not calculated for dropoff payment');
      }
    }

    // Validate payment method selection
    if (!paymentMethod) {
      errors.push('Please select a payment method');
    }

    // Validate online payment requirements
    if (paymentMethod === 'ONLINE') {
      if (!currentBreakdown && paymentType !== 'balance') {
        errors.push('Payment calculation required for online payment');
      }

      // In a real implementation, you'd validate Stripe setup here
      if (numericAmount > 999999) {
        errors.push('Payment amount exceeds maximum allowed limit');
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handlePayment = async () => {
    clearError();

    if (!validatePayment()) {
      return;
    }

    try {
      const paymentData = {
        paymentMethod,
        // In a real app, you'd integrate with Stripe or other payment processor
        stripePaymentIntentId: paymentMethod === 'ONLINE' ? `pi_${Date.now()}` : undefined,
        paymentType: paymentType === 'full' ? (selectedPaymentOption.toUpperCase() as 'DEPOSIT' | 'FULL') : undefined,
      };

      let response;

      // Determine which payment method to use based on type and option
      if (paymentType === 'deposit' || (paymentType === 'full' && selectedPaymentOption === 'deposit')) {
        response = await processDepositPayment(bookingId, paymentData);
      } else if (paymentType === 'balance') {
        response = await processBalancePayment(bookingId, paymentData);
      } else if (paymentType === 'full' && selectedPaymentOption === 'full') {
        // Handle full payment option
        response = await processDepositPayment(bookingId, {
          ...paymentData,
          paymentType: 'FULL' as const,
        });
      } else {
        throw new Error('Invalid payment configuration');
      }

      if (response?.success) {
        onPaymentSuccess?.();
      } else {
        throw new Error(response?.message || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      // Error is already set by the hook, no need to set it again
    }
  };

  const getPaymentAmount = (): string => {
    if (!currentBreakdown) return '0.00';

    // For dropoff payments, calculate total including additional charges
    if (paymentType === 'balance') {
      const baseBalance = parseFloat(currentBreakdown.balanceAmount || '0');
      const delayChargesAmount = parseFloat(currentBreakdown.delayCharges || '0');
      const totalAdditionalCharges = additionalCharges
        .filter((charge) => charge.isApplied)
        .reduce((sum, charge) => sum + charge.amount, 0);

      return (baseBalance + delayChargesAmount + chauffeurCharges + totalAdditionalCharges).toFixed(2);
    }

    // For deposit/full payment selection
    if (paymentType === 'full') {
      if (selectedPaymentOption === 'deposit') {
        return currentBreakdown.depositAmount || '0.00';
      } else {
        // Apply 5% discount for full payment
        const totalAmount = parseFloat(currentBreakdown.totalAmount);
        const discountedAmount = totalAmount * 0.95; // 5% discount
        return discountedAmount.toFixed(2);
      }
    }

    // Default cases
    if (paymentType === 'deposit') {
      return currentBreakdown.depositAmount || '0.00';
    } else {
      return currentBreakdown.balanceAmount || '0.00';
    }
  };

  const getFullPaymentDiscount = (): number => {
    if (!currentBreakdown || selectedPaymentOption !== 'full') return 0;
    const totalAmount = parseFloat(currentBreakdown.totalAmount);
    return totalAmount * 0.05; // 5% discount
  };

  const formatCurrency = (amount: string | number | undefined): string => {
    if (!amount) return '$0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${numAmount.toFixed(2)}`;
  };

  const getPaymentTitle = (): string => {
    if (paymentType === 'balance') return 'Complete Payment at Dropoff';
    if (paymentType === 'full' && selectedPaymentOption === 'full') return 'Pay Full Amount';
    if (paymentType === 'full' && selectedPaymentOption === 'deposit') return 'Pay Deposit';
    if (paymentType === 'deposit') return 'Pay Deposit';
    return 'Complete Payment';
  };

  const shouldShowPaymentOptions = (): boolean => {
    return paymentType === 'full' && !paymentOption;
  };

  const shouldShowAdditionalCharges = (): boolean => {
    return paymentType === 'balance' && (delayHours > 0 || chauffeurCharges > 0 || additionalCharges.length > 0);
  };

  if (!currentBreakdown && paymentType !== 'balance') {
    return (
      <Card className="mx-auto w-full max-w-2xl">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-8 rounded bg-gray-200"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCardIcon className="h-6 w-6" />
          {getPaymentTitle()}
        </CardTitle>
        <p className="text-gray-600">
          {paymentType === 'balance'
            ? 'Complete your final payment at vehicle dropoff'
            : 'Secure your booking with payment'}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Option Selection (for full payment type without pre-selected option) */}
        {shouldShowPaymentOptions() && currentBreakdown && (
          <div className="space-y-4">
            <Label className="text-base font-medium">Choose Payment Option</Label>
            <RadioGroup
              value={selectedPaymentOption}
              onValueChange={(value) => setSelectedPaymentOption(value as 'deposit' | 'full')}
              className="space-y-3"
            >
              <div
                className={`rounded-lg border-2 p-4 transition-colors ${
                  selectedPaymentOption === 'deposit'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="deposit" id="deposit-option" />
                  <Label htmlFor="deposit-option" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Pay Deposit ({currentBreakdown.depositPercentage}%)</p>
                        <p className="text-sm text-gray-600">Pay remaining balance at dropoff</p>
                      </div>
                      <span className="text-xl font-bold text-blue-600">
                        {formatCurrency(currentBreakdown.depositAmount)}
                      </span>
                    </div>
                  </Label>
                </div>
              </div>

              <div
                className={`rounded-lg border-2 p-4 transition-colors ${
                  selectedPaymentOption === 'full'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="full" id="full-option" />
                  <Label htmlFor="full-option" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">Pay Full Amount</p>
                          <p className="text-sm text-gray-600">Complete payment now</p>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Save {formatCurrency(getFullPaymentDiscount())}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="block text-lg text-gray-400 line-through">
                          {formatCurrency(currentBreakdown.totalAmount)}
                        </span>
                        <span className="text-xl font-bold text-green-600">
                          {formatCurrency(parseFloat(currentBreakdown.totalAmount) - getFullPaymentDiscount())}
                        </span>
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
            <Separator />
          </div>
        )}

        {/* Payment Breakdown */}
        {currentBreakdown && (
          <div className="space-y-3">
            <h3 className="font-medium">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Amount</span>
                <span>{formatCurrency(currentBreakdown.baseAmount)}</span>
              </div>

              {paymentType !== 'balance' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax Amount</span>
                    <span>{formatCurrency(currentBreakdown.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Booking Amount</span>
                    <span>{formatCurrency(currentBreakdown.totalAmount)}</span>
                  </div>
                </>
              )}

              {paymentType === 'balance' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining Balance</span>
                    <span>{formatCurrency(currentBreakdown.balanceAmount)}</span>
                  </div>
                  {parseFloat(currentBreakdown.delayCharges || '0') > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1 text-gray-600">
                        <ClockIcon className="h-3 w-3" />
                        Late Return Fee ({delayHours}h)
                      </span>
                      <span className="text-red-600">{formatCurrency(currentBreakdown.delayCharges)}</span>
                    </div>
                  )}
                  {chauffeurCharges > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1 text-gray-600">
                        <UserIcon className="h-3 w-3" />
                        Chauffeur Service
                      </span>
                      <span className="text-purple-600">{formatCurrency(chauffeurCharges)}</span>
                    </div>
                  )}
                </>
              )}

              {selectedPaymentOption === 'full' && getFullPaymentDiscount() > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Full Payment Discount (5%)</span>
                  <span>-{formatCurrency(getFullPaymentDiscount())}</span>
                </div>
              )}

              <Separator />
              <div className="flex justify-between text-lg font-medium">
                <span>Amount to Pay Now</span>
                <span
                  className={
                    paymentType === 'balance'
                      ? 'text-red-600'
                      : selectedPaymentOption === 'full'
                        ? 'text-green-600'
                        : 'text-blue-600'
                  }
                >
                  {formatCurrency(getPaymentAmount())}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Additional Charges Display for Dropoff Payments */}
        {shouldShowAdditionalCharges() && (
          <div className="space-y-4">
            <Separator />
            <AdditionalChargesDisplay
              bookingId={bookingId}
              charges={additionalCharges}
              delayHours={delayHours}
              chauffeurHours={0}
              showControls={false}
              className="border-0 bg-gray-50 shadow-none"
            />
          </div>
        )}

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <Label>Payment Method</Label>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 rounded-lg border p-3">
              <RadioGroupItem value="ONLINE" id="online" />
              <Label htmlFor="online" className="flex flex-1 cursor-pointer items-center gap-2">
                <CreditCardIcon className="h-4 w-4" />
                <div>
                  <p className="font-medium">Online Payment</p>
                  <p className="text-sm text-gray-600">Pay securely with credit/debit card</p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border p-3">
              <RadioGroupItem value="PICKUP" id="pickup" />
              <Label htmlFor="pickup" className="flex flex-1 cursor-pointer items-center gap-2">
                <BanknoteIcon className="h-4 w-4" />
                <div>
                  <p className="font-medium">Pay at Pickup</p>
                  <p className="text-sm text-gray-600">Pay in cash when collecting vehicle</p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 rounded-lg border p-3">
              <RadioGroupItem value="DROPOFF" id="dropoff" />
              <Label htmlFor="dropoff" className="flex flex-1 cursor-pointer items-center gap-2">
                <BuildingIcon className="h-4 w-4" />
                <div>
                  <p className="font-medium">Pay at Dropoff</p>
                  <p className="text-sm text-gray-600">Pay when returning vehicle</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Payment Notes */}
        {paymentMethod === 'ONLINE' && (
          <div className="rounded-lg bg-blue-50 p-3 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <InfoIcon className="mt-0.5 h-3 w-3 shrink-0" />
              <div>
                <p>- Your payment is secured with 256-bit SSL encryption</p>
                <p>- You&apos;ll receive a confirmation email after successful payment</p>
                <p>- Refunds are processed within 5-7 business days</p>
                {selectedPaymentOption === 'full' && <p>- Full payment includes 5% discount on total booking amount</p>}
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'PICKUP' && (
          <div className="rounded-lg bg-yellow-50 p-3 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <InfoIcon className="mt-0.5 h-3 w-3 shrink-0" />
              <div>
                <p>- Please bring exact amount in cash</p>
                <p>- Payment must be completed before vehicle handover</p>
                <p>- Receipt will be provided at the time of payment</p>
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'DROPOFF' && (
          <div className="rounded-lg bg-green-50 p-3 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <InfoIcon className="mt-0.5 h-3 w-3 shrink-0" />
              <div>
                <p>- Payment due when returning the vehicle</p>
                <p>- Cash or card payment accepted at dropoff</p>
                <p>- Final amount may include any additional charges</p>
                {paymentType === 'balance' && <p>- Late return and chauffeur fees will be added to final payment</p>}
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div>
                <p className="mb-1 text-sm font-medium text-red-600">Payment Validation Errors:</p>
                <ul className="space-y-1 text-sm text-red-600">
                  {validationErrors.map((error, index) => (
                    <li key={index}>- {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* API Error Display */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {onBackToOptions && paymentType === 'full' && (
            <Button type="button" variant="outline" onClick={onBackToOptions} className="flex-1">
              Back to Options
            </Button>
          )}

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className={onBackToOptions ? 'flex-1' : 'flex-1'}
            >
              Cancel
            </Button>
          )}

          <Button
            onClick={handlePayment}
            disabled={isProcessingPayment || validationErrors.length > 0}
            className="flex-1"
          >
            {isProcessingPayment ? 'Processing...' : `Pay ${formatCurrency(getPaymentAmount())}`}
          </Button>
        </div>

        {/* Payment Success Indicator */}
        {parseFloat(getPaymentAmount()) === 0 && paymentType === 'balance' && (
          <div className="rounded-lg bg-green-50 p-4 text-center">
            <CheckCircleIcon className="mx-auto mb-2 h-8 w-8 text-green-600" />
            <p className="font-medium text-green-900">No Payment Required</p>
            <p className="text-sm text-green-700">Your booking is fully paid!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

