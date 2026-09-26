'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CheckoutStep = 'IDENTITY' | 'DOCUMENTS' | 'PAYMENT' | 'SUMMARY';

interface CheckoutSteppersProps {
  currentStep: CheckoutStep;
  steps: { id: CheckoutStep; label: string }[];
}

const CheckoutSteppers: React.FC<CheckoutSteppersProps> = ({ currentStep, steps }) => {
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full overflow-x-auto py-4">
      <div className="relative mx-auto flex min-w-[520px] justify-between px-2 sm:min-w-0 sm:px-10">
        {/* Progress Bar Background */}
        <div className="absolute top-4 left-0 h-0.5 w-full -translate-y-1/2 bg-gray-100 dark:bg-gray-800" />

        {/* Progress Bar Active with Gradient */}
        <div
          className="from-primary to-secondary absolute top-4 left-0 h-0.5 -translate-y-1/2 bg-linear-to-r shadow-[0_0_8px_rgba(6,176,252,0.2)] transition-all duration-700 ease-in-out"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isActive = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              {/* Step Circle */}
              <div
                className={cn(
                  'relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500',
                  isCompleted
                    ? 'border-primary bg-primary text-white'
                    : isActive
                      ? 'border-primary text-primary ring-primary/10 group scale-110 bg-white ring-6 dark:bg-gray-900'
                      : 'border-gray-200 bg-white text-gray-300 dark:border-gray-800 dark:bg-gray-950',
                )}
              >
                {/* Active Pulsing Ring */}
                {isActive && (
                  <span className="ring-primary absolute inset-0 block animate-ping rounded-full opacity-20 ring-2" />
                )}

                {isCompleted ? (
                  <div className="animate-in fade-in zoom-in duration-300">
                    <Check className="h-5 w-5 stroke-3" />
                  </div>
                ) : (
                  <span
                    className={cn(
                      'text-xs font-black transition-colors duration-300',
                      isActive ? 'text-primary' : 'text-gray-300',
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Label */}
              <div className="mt-3 hidden flex-col items-center sm:flex">
                <span
                  className={cn(
                    'text-[9px] font-black tracking-[0.2em] uppercase transition-all duration-500',
                    isActive
                      ? 'text-primary scale-110'
                      : isCompleted
                        ? 'text-gray-600 dark:text-gray-400'
                        : 'text-gray-300',
                  )}
                >
                  {step.label}
                </span>

                {isActive && <span className="bg-primary mt-1.5 h-1 w-1 animate-bounce rounded-full" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CheckoutSteppers;
