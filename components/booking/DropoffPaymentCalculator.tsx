'use client';

import { useState, useEffect } from 'react';
import { useBooking } from '@/app/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    CalculatorIcon,
    ClockIcon,
    UserIcon,
    AlertTriangleIcon,
    CheckCircleIcon,
    InfoIcon
} from 'lucide-react';
import type { PaymentBreakdown, Booking } from '@/common/interfaces';

interface DropoffPaymentCalculatorProps {
    bookingId: string;
    actualDropoffTime?: string;
    delayHours?: number;
    chauffeurCharges?: number;
    onPaymentCalculated?: (amount: number, breakdown: DropoffPaymentBreakdown) => void;
    onProceedToPayment?: (amount: number, breakdown: DropoffPaymentBreakdown) => void;
    className?: string;
}

interface DropoffPaymentBreakdown {
    baseBalance: number;
    delayCharges: number;
    chauffeurCharges: number;
    additionalFees: number;
    totalAmount: number;
    currency: string;
    delayHours: number;
    delayRate: number;
}

export default function DropoffPaymentCalculator({
    bookingId,
    actualDropoffTime,
    delayHours = 0,
    chauffeurCharges = 0,
    onPaymentCalculated,
    onProceedToPayment,
    className = ''
}: DropoffPaymentCalculatorProps) {
    const {
        currentBooking,
        paymentBreakdown,
        calculatePaymentBreakdown,
        fetchBookingById,
        isLoading,
        error
    } = useBooking();

    const [calculatedBreakdown, setCalculatedBreakdown] = useState<DropoffPaymentBreakdown | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    useEffect(() => {
        if (bookingId) {
            fetchBookingById(bookingId);
            calculatePaymentBreakdown(bookingId, delayHours);
        }
    }, [bookingId, delayHours, fetchBookingById, calculatePaymentBreakdown]);

    useEffect(() => {
        if (paymentBreakdown && currentBooking) {
            calculateDropoffPayment();
        }
    }, [paymentBreakdown, currentBooking, delayHours, chauffeurCharges]);

    const calculateDropoffPayment = () => {
        if (!paymentBreakdown || !currentBooking) return;

        setIsCalculating(true);

        try {
            const baseBalance = parseFloat(paymentBreakdown.balanceAmount || '0');
            const delayChargesAmount = parseFloat(paymentBreakdown.delayCharges || '0');
            const delayRate = parseFloat(currentBooking.vehicle?.delayChargePerHour || '0');

            const breakdown: DropoffPaymentBreakdown = {
                baseBalance,
                delayCharges: delayChargesAmount,
                chauffeurCharges,
                additionalFees: 0, // Can be extended for other fees
                totalAmount: baseBalance + delayChargesAmount + chauffeurCharges,
                currency: paymentBreakdown.currency || 'USD',
                delayHours,
                delayRate
            };

            setCalculatedBreakdown(breakdown);
            onPaymentCalculated?.(breakdown.totalAmount, breakdown);
        } catch (error) {
            console.error('Error calculating dropoff payment:', error);
        } finally {
            setIsCalculating(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `$${amount.toFixed(2)}`;
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getDelayStatus = () => {
        if (delayHours <= 0) return { status: 'on-time', color: 'text-green-600', icon: CheckCircleIcon };
        if (delayHours <= 2) return { status: 'minor-delay', color: 'text-yellow-600', icon: InfoIcon };
        return { status: 'major-delay', color: 'text-red-600', icon: AlertTriangleIcon };
    };

    const handleProceedToPayment = () => {
        if (calculatedBreakdown && onProceedToPayment) {
            onProceedToPayment(calculatedBreakdown.totalAmount, calculatedBreakdown);
        }
    };

    if (isLoading || isCalculating) {
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

    if (error || !currentBooking || !paymentBreakdown) {
        return (
            <Card className={`w-full max-w-2xl mx-auto ${className}`}>
                <CardContent className="p-6 text-center">
                    <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 mb-4">
                        {error || 'Unable to calculate dropoff payment'}
                    </p>
                    <Button onClick={() => fetchBookingById(bookingId)}>
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const delayInfo = getDelayStatus();
    const DelayIcon = delayInfo.icon;

    return (
        <Card className={`w-full max-w-2xl mx-auto ${className}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CalculatorIcon className="h-6 w-6" />
                    Dropoff Payment Calculator
                </CardTitle>
                <p className="text-gray-600">
                    Final payment calculation for booking #{currentBooking.id.slice(-8)}
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Booking Timeline */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h3 className="font-medium text-gray-900">Booking Timeline</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Scheduled Dropoff</span>
                            <p className="font-medium">{formatDateTime(currentBooking.endDatetime)}</p>
                        </div>
                        {actualDropoffTime && (
                            <div>
                                <span className="text-gray-600">Actual Dropoff</span>
                                <p className="font-medium">{formatDateTime(actualDropoffTime)}</p>
                            </div>
                        )}
                    </div>

                    {/* Delay Status */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                        <DelayIcon className={`h-4 w-4 ${delayInfo.color}`} />
                        <span className={`text-sm font-medium ${delayInfo.color}`}>
                            {delayHours <= 0 ? 'On Time' :
                                delayHours <= 2 ? `${delayHours} hour delay (minor)` :
                                    `${delayHours} hour delay (major)`}
                        </span>
                        {delayHours > 0 && (
                            <Badge variant="outline" className={delayInfo.color}>
                                +{delayHours}h
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Payment Breakdown */}
                {calculatedBreakdown && (
                    <div className="space-y-4">
                        <h3 className="font-medium text-gray-900">Payment Breakdown</h3>

                        {/* Base Balance */}
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-blue-900">Remaining Balance</p>
                                    <p className="text-sm text-blue-700">Original booking balance due</p>
                                </div>
                                <span className="text-xl font-bold text-blue-600">
                                    {formatCurrency(calculatedBreakdown.baseBalance)}
                                </span>
                            </div>
                        </div>

                        {/* Additional Charges */}
                        <div className="space-y-3">
                            <h4 className="font-medium text-gray-700">Additional Charges</h4>

                            {/* Delay Charges */}
                            {calculatedBreakdown.delayCharges > 0 && (
                                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="h-4 w-4 text-yellow-600" />
                                        <div>
                                            <p className="font-medium text-yellow-900">Late Return Fee</p>
                                            <p className="text-sm text-yellow-700">
                                                {delayHours} hours × {formatCurrency(calculatedBreakdown.delayRate)}/hour
                                            </p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-yellow-600">
                                        {formatCurrency(calculatedBreakdown.delayCharges)}
                                    </span>
                                </div>
                            )}

                            {/* Chauffeur Charges */}
                            {calculatedBreakdown.chauffeurCharges > 0 && (
                                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="h-4 w-4 text-purple-600" />
                                        <div>
                                            <p className="font-medium text-purple-900">Chauffeur Service</p>
                                            <p className="text-sm text-purple-700">Additional chauffeur fees</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-purple-600">
                                        {formatCurrency(calculatedBreakdown.chauffeurCharges)}
                                    </span>
                                </div>
                            )}

                            {/* No Additional Charges */}
                            {calculatedBreakdown.delayCharges === 0 && calculatedBreakdown.chauffeurCharges === 0 && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700">
                                    <CheckCircleIcon className="h-4 w-4" />
                                    <span className="text-sm">No additional charges - vehicle returned on time!</span>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Total Amount */}
                        <div className="bg-gray-900 text-white rounded-lg p-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-lg font-medium">Total Amount Due</p>
                                    <p className="text-sm text-gray-300">Final payment at dropoff</p>
                                </div>
                                <span className="text-3xl font-bold">
                                    {formatCurrency(calculatedBreakdown.totalAmount)}
                                </span>
                            </div>
                        </div>

                        {/* Payment Summary Details */}
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Base Balance</span>
                                <span>{formatCurrency(calculatedBreakdown.baseBalance)}</span>
                            </div>
                            {calculatedBreakdown.delayCharges > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Late Return Fee</span>
                                    <span>{formatCurrency(calculatedBreakdown.delayCharges)}</span>
                                </div>
                            )}
                            {calculatedBreakdown.chauffeurCharges > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Chauffeur Charges</span>
                                    <span>{formatCurrency(calculatedBreakdown.chauffeurCharges)}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between font-bold">
                                <span>Total Due</span>
                                <span>{formatCurrency(calculatedBreakdown.totalAmount)}</span>
                            </div>
                        </div>

                        {/* Payment Notes */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <InfoIcon className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                                <div className="text-sm text-blue-700">
                                    <p className="font-medium mb-1">Payment Information</p>
                                    <ul className="space-y-1 text-xs">
                                        <li>• Payment can be made by cash or card at dropoff location</li>
                                        <li>• Receipt will be provided immediately after payment</li>
                                        <li>• Any security deposit will be released after vehicle inspection</li>
                                        {calculatedBreakdown.totalAmount === 0 && (
                                            <li>• No payment required - your booking is fully paid!</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        {calculatedBreakdown.totalAmount > 0 && onProceedToPayment && (
                            <Button
                                onClick={handleProceedToPayment}
                                className="w-full"
                                size="lg"
                            >
                                Proceed to Payment ({formatCurrency(calculatedBreakdown.totalAmount)})
                            </Button>
                        )}

                        {calculatedBreakdown.totalAmount === 0 && (
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                <p className="font-medium text-green-900">No Payment Required</p>
                                <p className="text-sm text-green-700">Your booking is fully paid!</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}