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
    PiggyBankIcon,
    InfoIcon,
    CheckCircleIcon,
    AlertCircleIcon
} from 'lucide-react';
import type { PaymentBreakdown } from '@/common/interfaces';

interface PaymentOptionsFormProps {
    bookingId: string;
    onPaymentOptionSelected?: (option: 'deposit' | 'full', breakdown: PaymentBreakdown) => void;
    onCancel?: () => void;
    className?: string;
}

type PaymentOption = 'deposit' | 'full';

export default function PaymentOptionsForm({
    bookingId,
    onPaymentOptionSelected,
    onCancel,
    className = ''
}: PaymentOptionsFormProps) {
    const {
        paymentBreakdown,
        calculatePaymentBreakdown,
        isLoading,
        error
    } = useBooking();

    const [selectedOption, setSelectedOption] = useState<PaymentOption>('deposit');

    useEffect(() => {
        calculatePaymentBreakdown(bookingId);
    }, [bookingId, calculatePaymentBreakdown]);

    const handleContinue = () => {
        if (paymentBreakdown && onPaymentOptionSelected) {
            onPaymentOptionSelected(selectedOption, paymentBreakdown);
        }
    };

    const formatCurrency = (amount: string | number | null | undefined) => {
        if (!amount) return '$0.00';
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(numAmount)) return '$0.00';
        return `$${numAmount.toFixed(2)}`;
    };

    const getDepositPercentage = () => {
        if (!paymentBreakdown) return 0;
        return paymentBreakdown.depositPercentage || 30; // Default 30%
    };

    const getFullPaymentDiscount = () => {
        // Calculate potential discount for full payment (e.g., 5% discount)
        if (!paymentBreakdown) return 0;
        const totalAmount = parseFloat(paymentBreakdown.totalAmount);
        return totalAmount * 0.05; // 5% discount
    };

    const getDiscountedTotal = () => {
        if (!paymentBreakdown) return '$0.00';
        const totalAmount = parseFloat(paymentBreakdown.totalAmount);
        const discount = getFullPaymentDiscount();
        return formatCurrency((totalAmount - discount).toString());
    };

    if (isLoading) {
        return (
            <Card className={`w-full max-w-2xl mx-auto ${className}`}>
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || !paymentBreakdown) {
        return (
            <Card className={`w-full max-w-2xl mx-auto ${className}`}>
                <CardContent className="p-6 text-center">
                    <AlertCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">
                        {error || 'Unable to load payment options'}
                    </p>
                    <Button onClick={() => calculatePaymentBreakdown(bookingId)}>
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`w-full max-w-2xl mx-auto ${className}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCardIcon className="h-6 w-6" />
                    Choose Your Payment Option
                </CardTitle>
                <p className="text-gray-600">
                    Select how you'd like to pay for your booking
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Payment Breakdown Summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h3 className="font-medium text-gray-900">Booking Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Base Amount</span>
                            <span>{formatCurrency(paymentBreakdown.baseAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tax Amount</span>
                            <span>{formatCurrency(paymentBreakdown.taxAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Duration</span>
                            <span>{paymentBreakdown.daysCount} day{paymentBreakdown.daysCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                            <span>Total Amount</span>
                            <span>{formatCurrency(paymentBreakdown.totalAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Options */}
                <div className="space-y-4">
                    <Label className="text-base font-medium">Payment Options</Label>
                    <RadioGroup
                        value={selectedOption}
                        onValueChange={(value) => setSelectedOption(value as PaymentOption)}
                        className="space-y-4"
                    >
                        {/* Deposit Payment Option */}
                        <div className={`border-2 rounded-lg p-4 transition-colors ${selectedOption === 'deposit'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}>
                            <div className="flex items-start space-x-3">
                                <RadioGroupItem value="deposit" id="deposit" className="mt-1" />
                                <div className="flex-1">
                                    <Label htmlFor="deposit" className="flex items-center gap-2 cursor-pointer">
                                        <PiggyBankIcon className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <p className="font-medium text-lg">Pay Deposit Now</p>
                                            <p className="text-sm text-gray-600">
                                                Pay {getDepositPercentage()}% now, remaining balance at dropoff
                                            </p>
                                        </div>
                                    </Label>

                                    <div className="mt-3 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Pay Now</span>
                                            <span className="text-xl font-bold text-blue-600">
                                                {formatCurrency(paymentBreakdown.depositAmount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Pay at Dropoff</span>
                                            <span className="text-lg font-medium text-gray-700">
                                                {formatCurrency(paymentBreakdown.balanceAmount)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-start gap-2 text-xs text-gray-600 bg-blue-100 p-2 rounded">
                                        <InfoIcon className="h-3 w-3 mt-0.5 shrink-0" />
                                        <div>
                                            <p>• Secure your booking with a small deposit</p>
                                            <p>• Pay the remaining balance when you return the vehicle</p>
                                            <p>• Additional charges (if any) will be added to final payment</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Full Payment Option */}
                        <div className={`border-2 rounded-lg p-4 transition-colors ${selectedOption === 'full'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}>
                            <div className="flex items-start space-x-3">
                                <RadioGroupItem value="full" id="full" className="mt-1" />
                                <div className="flex-1">
                                    <Label htmlFor="full" className="flex items-center gap-2 cursor-pointer">
                                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-lg">Pay Full Amount</p>
                                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                Save ${getFullPaymentDiscount().toFixed(2)}
                                            </Badge>
                                        </div>
                                    </Label>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Pay the complete amount now and save on processing fees
                                    </p>

                                    <div className="mt-3 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Original Total</span>
                                            <span className="text-lg line-through text-gray-400">
                                                {formatCurrency(paymentBreakdown.totalAmount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Pay Now (with discount)</span>
                                            <span className="text-xl font-bold text-green-600">
                                                {getDiscountedTotal()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Pay at Dropoff</span>
                                            <span className="text-lg font-medium text-gray-400">
                                                $0.00
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-start gap-2 text-xs text-gray-600 bg-green-100 p-2 rounded">
                                        <InfoIcon className="h-3 w-3 mt-0.5 shrink-0" />
                                        <div>
                                            <p>• Complete your payment now and you're all set</p>
                                            <p>• No additional payments required at dropoff</p>
                                            <p>• Get a 5% discount on total booking amount</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RadioGroup>
                </div>

                {/* Payment Summary for Selected Option */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium mb-3">Payment Summary</h3>
                    <div className="space-y-2">
                        {selectedOption === 'deposit' ? (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Deposit ({getDepositPercentage()}%)</span>
                                    <span className="font-medium">{formatCurrency(paymentBreakdown.depositAmount)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Remaining balance (due at dropoff)</span>
                                    <span>{formatCurrency(paymentBreakdown.balanceAmount)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Amount to Pay Now</span>
                                    <span className="text-blue-600">{formatCurrency(paymentBreakdown.depositAmount)}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Full Amount</span>
                                    <span className="line-through text-gray-400">{formatCurrency(paymentBreakdown.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                    <span>Discount (5%)</span>
                                    <span>-${getFullPaymentDiscount().toFixed(2)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Amount to Pay Now</span>
                                    <span className="text-green-600">{getDiscountedTotal()}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            className="flex-1"
                        >
                            Back
                        </Button>
                    )}
                    <Button
                        onClick={handleContinue}
                        className="flex-1"
                        disabled={!paymentBreakdown}
                    >
                        Continue to Payment
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}