'use client';

import { useState, useEffect } from 'react';
import { useBooking } from '@/app/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCardIcon, BanknoteIcon, BuildingIcon } from 'lucide-react';
import type { PaymentMethod } from '@/common/interfaces';

interface PaymentFormProps {
  bookingId: string;
  paymentType: 'deposit' | 'balance';
  onPaymentSuccess?: () => void;
  onCancel?: () => void;
}

export default function PaymentForm({ 
  bookingId, 
  paymentType, 
  onPaymentSuccess, 
  onCancel 
}: PaymentFormProps) {
  const { 
    paymentBreakdown,
    calculatePaymentBreakdown,
    processDepositPayment,
    processBalancePayment,
    isProcessingPayment,
    error,
    clearError
  } = useBooking();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ONLINE');

  useEffect(() => {
    calculatePaymentBreakdown(bookingId);
  }, [bookingId, calculatePaymentBreakdown]);

  const handlePayment = async () => {
    clearError();

    const paymentData = {
      paymentMethod,
      // In a real app, you'd integrate with Stripe or other payment processor
      stripePaymentIntentId: paymentMethod === 'ONLINE' ? `pi_${Date.now()}` : undefined,
    };

    let response;
    if (paymentType === 'deposit') {
      response = await processDepositPayment(bookingId, paymentData);
    } else {
      response = await processBalancePayment(bookingId, paymentData);
    }

    if (response?.success) {
      onPaymentSuccess?.();
    }
  };

  const getPaymentAmount = () => {
    if (!paymentBreakdown) return '0.00';
    
    if (paymentType === 'deposit') {
      return paymentBreakdown.depositAmount || '0.00';
    } else {
      return paymentBreakdown.balanceAmount || '0.00';
    }
  };

  const formatCurrency = (amount: string | undefined) => {
    if (!amount) return '$0.00';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  if (!paymentBreakdown) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCardIcon className="h-5 w-5" />
          {paymentType === 'deposit' ? 'Pay Deposit' : 'Pay Balance'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Breakdown */}
        <div className="space-y-3">
          <h3 className="font-medium">Payment Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Amount</span>
              <span>{formatCurrency(paymentBreakdown.baseAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Deposit Amount</span>
              <span>{formatCurrency(paymentBreakdown.depositAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Balance Amount</span>
              <span>{formatCurrency(paymentBreakdown.balanceAmount)}</span>
            </div>
            {parseFloat(paymentBreakdown.delayCharges!) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Delay Charges</span>
                <span className="text-red-600">{formatCurrency(paymentBreakdown.delayCharges)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total Amount</span>
              <span>{formatCurrency(paymentBreakdown.totalAmount)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Amount to Pay */}
        <div className="text-center">
          <p className="text-sm text-gray-600">Amount to pay now</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(getPaymentAmount())}
          </p>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <Label>Payment Method</Label>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="ONLINE" id="online" />
              <Label htmlFor="online" className="flex items-center gap-2 flex-1 cursor-pointer">
                <CreditCardIcon className="h-4 w-4" />
                <div>
                  <p className="font-medium">Online Payment</p>
                  <p className="text-sm text-gray-600">Pay securely with credit/debit card</p>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="PICKUP" id="pickup" />
              <Label htmlFor="pickup" className="flex items-center gap-2 flex-1 cursor-pointer">
                <BanknoteIcon className="h-4 w-4" />
                <div>
                  <p className="font-medium">Pay at Pickup</p>
                  <p className="text-sm text-gray-600">Pay in cash when collecting vehicle</p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="DROPOFF" id="dropoff" />
              <Label htmlFor="dropoff" className="flex items-center gap-2 flex-1 cursor-pointer">
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
          <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p>• Your payment is secured with 256-bit SSL encryption</p>
            <p>• You'll receive a confirmation email after successful payment</p>
            <p>• Refunds are processed within 5-7 business days</p>
          </div>
        )}

        {paymentMethod === 'PICKUP' && (
          <div className="text-xs text-gray-600 bg-yellow-50 p-3 rounded-lg">
            <p>• Please bring exact amount in cash</p>
            <p>• Payment must be completed before vehicle handover</p>
            <p>• Receipt will be provided at the time of payment</p>
          </div>
        )}

        {paymentMethod === 'DROPOFF' && (
          <div className="text-xs text-gray-600 bg-green-50 p-3 rounded-lg">
            <p>• Payment due when returning the vehicle</p>
            <p>• Cash or card payment accepted at dropoff</p>
            <p>• Final amount may include any additional charges</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isProcessingPayment}
            className="flex-1"
          >
            {isProcessingPayment ? 'Processing...' : `Pay ${formatCurrency(getPaymentAmount())}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}