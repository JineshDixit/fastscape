'use client';

import { useState } from 'react';
import PaymentForm from './PaymentForm';
import PaymentOptionsForm from './PaymentOptionsForm';
import type { PaymentBreakdown } from '@/common/interfaces';
import { toast } from 'sonner';

/**
 * Example component demonstrating the enhanced PaymentForm usage
 * This shows the three main use cases:
 * 1. Deposit vs Full payment selection
 * 2. Direct payment processing
 * 3. Dropoff payment with additional charges
 */
export default function PaymentFormExample() {
  const [currentStep, setCurrentStep] = useState<'options' | 'payment'>('options');
  const [selectedOption, setSelectedOption] = useState<'deposit' | 'full'>('deposit');
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown | null>(null);

  // Example booking ID
  const bookingId = 'booking-123';

  // Example additional charges for dropoff payment
  const exampleAdditionalCharges = [
    {
      id: 'late-1',
      type: 'late_dropoff' as const,
      description: 'Late return fee for 2 hours delay',
      amount: 40.0,
      currency: 'USD',
      isApplied: true,
      appliedAt: new Date().toISOString(),
      rate: 20,
      quantity: 2,
      unit: 'hours',
    },
    {
      id: 'chauffeur-1',
      type: 'chauffeur' as const,
      description: 'Additional chauffeur service time',
      amount: 75.0,
      currency: 'USD',
      isApplied: true,
      appliedAt: new Date().toISOString(),
      details: 'Extended service beyond scheduled time',
    },
  ];

  const handlePaymentOptionSelected = (option: 'deposit' | 'full', breakdown: PaymentBreakdown) => {
    setSelectedOption(option);
    setPaymentBreakdown(breakdown);
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment Processed Successfully');
    setCurrentStep('options');
  };

  const handleBackToOptions = () => {
    setCurrentStep('options');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="text-center">
        <h1 className="mb-4 text-3xl font-bold">Enhanced Payment Form Examples</h1>
        <p className="text-gray-600">
          Demonstrating the enhanced PaymentForm with deposit vs full payment options, validation, and dropoff payment
          with additional charges.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Example 1: Payment Options Flow */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">1. Payment Options Flow</h2>
          <p className="text-sm text-gray-600">
            Shows the complete flow from payment option selection to payment processing.
          </p>

          {currentStep === 'options' ? (
            <PaymentOptionsForm bookingId={bookingId} onPaymentOptionSelected={handlePaymentOptionSelected} />
          ) : (
            <PaymentForm
              bookingId={bookingId}
              paymentType="full"
              paymentOption={selectedOption}
              breakdown={paymentBreakdown || undefined}
              onPaymentSuccess={handlePaymentSuccess}
              onBackToOptions={handleBackToOptions}
            />
          )}
        </div>

        {/* Example 2: Direct Deposit Payment */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">2. Direct Deposit Payment</h2>
          <p className="text-sm text-gray-600">Direct deposit payment without options selection.</p>

          <PaymentForm
            bookingId={bookingId}
            paymentType="deposit"
            onPaymentSuccess={() => toast.success('Deposit payment successful!')}
            onCancel={() => toast.info('Payment cancelled')}
          />
        </div>
      </div>

      {/* Example 3: Dropoff Payment with Additional Charges */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">3. Dropoff Payment with Additional Charges</h2>
        <p className="text-sm text-gray-600">Dropoff payment including late return fees and chauffeur charges.</p>

        <PaymentForm
          bookingId={bookingId}
          paymentType="balance"
          delayHours={2}
          chauffeurCharges={75}
          additionalCharges={exampleAdditionalCharges}
          onPaymentSuccess={() => toast.success('Dropoff payment successful!')}
          onCancel={() => toast.info('Payment cancelled')}
        />
      </div>

      {/* Usage Examples */}
      <div className="rounded-lg bg-gray-50 p-6">
        <h3 className="mb-4 text-lg font-semibold">Usage Examples</h3>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium">1. Basic Deposit Payment:</h4>
            <pre className="mt-1 overflow-x-auto rounded bg-white p-2">
              {`<PaymentForm
  bookingId="booking-123"
  paymentType="deposit"
  onPaymentSuccess={handleSuccess}
/>`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium">2. Full Payment with Options:</h4>
            <pre className="mt-1 overflow-x-auto rounded bg-white p-2">
              {`<PaymentForm
  bookingId="booking-123"
  paymentType="full"
  paymentOption="full"
  breakdown={paymentBreakdown}
  onPaymentSuccess={handleSuccess}
  onBackToOptions={handleBack}
/>`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium">3. Dropoff Payment with Additional Charges:</h4>
            <pre className="mt-1 overflow-x-auto rounded bg-white p-2">
              {`<PaymentForm
  bookingId="booking-123"
  paymentType="balance"
  delayHours={2}
  chauffeurCharges={75}
  additionalCharges={additionalCharges}
  onPaymentSuccess={handleSuccess}
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
