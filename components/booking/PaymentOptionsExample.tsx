'use client';

import { useState } from 'react';
import { PaymentOptionsForm, DropoffPaymentCalculator, AdditionalChargesDisplay } from './index';
import type { PaymentBreakdown } from '@/common/interfaces';

// Example usage of the new payment components
export default function PaymentOptionsExample() {
  const [currentStep, setCurrentStep] = useState<'options' | 'dropoff' | 'charges'>('options');
  const [selectedOption, setSelectedOption] = useState<'deposit' | 'full' | null>(null);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown | null>(null);

  // Example booking ID - in real usage this would come from props or routing
  const exampleBookingId = 'booking-123';

  // Example additional charges data
  const exampleCharges = [
    {
      id: 'charge-1',
      type: 'late_dropoff' as const,
      description: 'Vehicle returned 3 hours late',
      amount: 45.0,
      currency: 'USD',
      isApplied: true,
      appliedAt: new Date().toISOString(),
      rate: 15,
      quantity: 3,
      unit: 'hours',
    },
    {
      id: 'charge-2',
      type: 'chauffeur' as const,
      description: 'Additional chauffeur service hours',
      amount: 120.0,
      currency: 'USD',
      isApplied: true,
      appliedAt: new Date().toISOString(),
      details: 'Extended service beyond original booking',
      rate: 40,
      quantity: 3,
      unit: 'hours',
    },
    {
      id: 'charge-3',
      type: 'cleaning' as const,
      description: 'Interior cleaning fee',
      amount: 25.0,
      currency: 'USD',
      isApplied: false,
      details: 'Vehicle returned with excessive dirt/stains',
    },
  ];

  const handlePaymentOptionSelected = (option: 'deposit' | 'full', breakdown: PaymentBreakdown) => {
    setSelectedOption(option);
    setPaymentBreakdown(breakdown);
    console.log('Payment option selected:', option, breakdown);
  };

  const handleDropoffPaymentCalculated = (amount: number, breakdown: any) => {
    console.log('Dropoff payment calculated:', amount, breakdown);
  };

  const handleProceedToPayment = (amount: number, breakdown: any) => {
    console.log('Proceeding to payment:', amount, breakdown);
    // In real usage, this would navigate to payment processing
  };

  const handleChargeToggle = (chargeId: string, isApplied: boolean) => {
    console.log('Charge toggled:', chargeId, isApplied);
    // In real usage, this would update the charges via API
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <h1 className="mb-4 text-3xl font-bold text-gray-900">Payment Components Demo</h1>
          <div className="mb-6 flex gap-4">
            <button
              onClick={() => setCurrentStep('options')}
              className={`rounded-lg px-4 py-2 ${
                currentStep === 'options' ? 'bg-blue-600 text-white' : 'border bg-white text-gray-600'
              }`}
            >
              Payment Options
            </button>
            <button
              onClick={() => setCurrentStep('dropoff')}
              className={`rounded-lg px-4 py-2 ${
                currentStep === 'dropoff' ? 'bg-blue-600 text-white' : 'border bg-white text-gray-600'
              }`}
            >
              Dropoff Calculator
            </button>
            <button
              onClick={() => setCurrentStep('charges')}
              className={`rounded-lg px-4 py-2 ${
                currentStep === 'charges' ? 'bg-blue-600 text-white' : 'border bg-white text-gray-600'
              }`}
            >
              Additional Charges
            </button>
          </div>
        </div>

        {currentStep === 'options' && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Payment Options Form</h2>
            <p className="mb-6 text-gray-600">
              This component allows users to choose between deposit or full payment options. It shows pricing breakdown
              and applies discounts for full payment.
            </p>
            <PaymentOptionsForm
              bookingId={exampleBookingId}
              onPaymentOptionSelected={handlePaymentOptionSelected}
              onCancel={() => console.log('Payment cancelled')}
            />
          </div>
        )}

        {currentStep === 'dropoff' && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Dropoff Payment Calculator</h2>
            <p className="mb-6 text-gray-600">
              This component calculates the final payment due at vehicle dropoff, including any delay charges and
              additional fees.
            </p>
            <DropoffPaymentCalculator
              bookingId={exampleBookingId}
              actualDropoffTime={new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()} // 3 hours late
              delayHours={3}
              chauffeurCharges={120}
              onPaymentCalculated={handleDropoffPaymentCalculated}
              onProceedToPayment={handleProceedToPayment}
            />
          </div>
        )}

        {currentStep === 'charges' && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Additional Charges Display</h2>
            <p className="mb-6 text-gray-600">
              This component displays and manages additional charges like late fees, chauffeur charges, and other
              penalties that may apply to a booking.
            </p>
            <AdditionalChargesDisplay
              bookingId={exampleBookingId}
              charges={exampleCharges}
              delayHours={3}
              chauffeurHours={3}
              onChargeToggle={handleChargeToggle}
              showControls={true}
            />
          </div>
        )}

        {/* Component Information */}
        <div className="mt-12 rounded-lg border bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold">Component Features</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <h4 className="mb-2 font-medium text-blue-600">PaymentOptionsForm</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Deposit vs full payment selection</li>
                <li>• Automatic discount calculation</li>
                <li>• Payment breakdown display</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-medium text-green-600">DropoffPaymentCalculator</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Real-time payment calculation</li>
                <li>• Delay charge computation</li>
                <li>• Timeline comparison</li>
                <li>• Payment breakdown</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-medium text-purple-600">AdditionalChargesDisplay</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Multiple charge types</li>
                <li>• Interactive charge management</li>
                <li>• Visual charge categorization</li>
                <li>• Total calculation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
