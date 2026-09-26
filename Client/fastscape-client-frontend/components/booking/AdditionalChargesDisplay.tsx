'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
    ClockIcon,
    UserIcon,
    AlertTriangleIcon,
    InfoIcon,
    DollarSignIcon,
    CheckCircleIcon,
    XCircleIcon,
    CalendarIcon
} from 'lucide-react';

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

interface AdditionalChargesDisplayProps {
    bookingId: string;
    charges: AdditionalCharge[];
    delayHours?: number;
    chauffeurHours?: number;
    onChargeToggle?: (chargeId: string, isApplied: boolean) => void;
    onChargeUpdate?: (chargeId: string, amount: number) => void;
    showControls?: boolean;
    className?: string;
}

const chargeTypeConfig = {
    chauffeur: {
        icon: UserIcon,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        label: 'Chauffeur Service'
    },
    late_dropoff: {
        icon: ClockIcon,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Late Return Fee'
    },
    damage: {
        icon: AlertTriangleIcon,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        label: 'Damage Fee'
    },
    fuel: {
        icon: DollarSignIcon,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: 'Fuel Charge'
    },
    cleaning: {
        icon: DollarSignIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'Cleaning Fee'
    },
    other: {
        icon: DollarSignIcon,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        label: 'Other Charge'
    }
};

export default function AdditionalChargesDisplay({
    bookingId,
    charges,
    delayHours = 0,
    chauffeurHours = 0,
    onChargeToggle,
    onChargeUpdate,
    showControls = false,
    className = ''
}: AdditionalChargesDisplayProps) {
    const [localCharges, setLocalCharges] = useState<AdditionalCharge[]>(charges);

    useEffect(() => {
        setLocalCharges(charges);
    }, [charges]);

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return `$${amount.toFixed(2)}`;
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTotalCharges = () => {
        return localCharges
            .filter(charge => charge.isApplied)
            .reduce((total, charge) => total + charge.amount, 0);
    };

    const getAppliedCharges = () => {
        return localCharges.filter(charge => charge.isApplied);
    };

    const getPendingCharges = () => {
        return localCharges.filter(charge => !charge.isApplied);
    };

    const handleToggleCharge = (chargeId: string, isApplied: boolean) => {
        setLocalCharges(prev =>
            prev.map(charge =>
                charge.id === chargeId ? { ...charge, isApplied } : charge
            )
        );
        onChargeToggle?.(chargeId, isApplied);
    };

    const renderChargeItem = (charge: AdditionalCharge, showToggle: boolean = false) => {
        const config = chargeTypeConfig[charge.type];
        const Icon = config.icon;

        return (
            <div
                key={charge.id}
                className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor} transition-all`}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg bg-white ${config.color}`}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900">{config.label}</h4>
                                <Badge
                                    variant={charge.isApplied ? "default" : "secondary"}
                                    className={charge.isApplied ? "bg-green-100 text-green-800" : ""}
                                >
                                    {charge.isApplied ? 'Applied' : 'Pending'}
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{charge.description}</p>

                            {/* Charge Details */}
                            {charge.details && (
                                <p className="text-xs text-gray-500 mb-2">{charge.details}</p>
                            )}

                            {/* Rate and Quantity Info */}
                            {charge.rate && charge.quantity && (
                                <div className="text-xs text-gray-500 mb-2">
                                    {charge.quantity} {charge.unit || 'units'} × {formatCurrency(charge.rate)} = {formatCurrency(charge.amount)}
                                </div>
                            )}

                            {/* Applied Date */}
                            {charge.isApplied && charge.appliedAt && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <CalendarIcon className="h-3 w-3" />
                                    Applied on {formatDateTime(charge.appliedAt)}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${config.color}`}>
                            {formatCurrency(charge.amount, charge.currency)}
                        </span>

                        {showToggle && showControls && (
                            <Button
                                size="sm"
                                variant={charge.isApplied ? "destructive" : "default"}
                                onClick={() => handleToggleCharge(charge.id, !charge.isApplied)}
                            >
                                {charge.isApplied ? (
                                    <>
                                        <XCircleIcon className="h-3 w-3 mr-1" />
                                        Remove
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                                        Apply
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const appliedCharges = getAppliedCharges();
    const pendingCharges = getPendingCharges();
    const totalCharges = getTotalCharges();

    return (
        <Card className={`w-full ${className}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSignIcon className="h-5 w-5" />
                    Additional Charges
                </CardTitle>
                <p className="text-gray-600">
                    {appliedCharges.length > 0
                        ? `${appliedCharges.length} charge${appliedCharges.length !== 1 ? 's' : ''} applied`
                        : 'No additional charges'
                    }
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Summary */}
                {totalCharges > 0 && (
                    <div className="bg-gray-900 text-white rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-lg font-medium">Total Additional Charges</p>
                                <p className="text-sm text-gray-300">
                                    {appliedCharges.length} charge{appliedCharges.length !== 1 ? 's' : ''} applied
                                </p>
                            </div>
                            <span className="text-2xl font-bold">
                                {formatCurrency(totalCharges)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Applied Charges */}
                {appliedCharges.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                            Applied Charges ({appliedCharges.length})
                        </h3>
                        <div className="space-y-3">
                            {appliedCharges.map(charge => renderChargeItem(charge, true))}
                        </div>
                    </div>
                )}

                {/* Pending Charges */}
                {pendingCharges.length > 0 && showControls && (
                    <div className="space-y-3">
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                            <InfoIcon className="h-4 w-4 text-yellow-600" />
                            Pending Charges ({pendingCharges.length})
                        </h3>
                        <div className="space-y-3">
                            {pendingCharges.map(charge => renderChargeItem(charge, true))}
                        </div>
                    </div>
                )}

                {/* No Charges */}
                {localCharges.length === 0 && (
                    <div className="text-center py-8">
                        <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="font-medium text-gray-900 mb-2">No Additional Charges</h3>
                        <p className="text-gray-600">
                            Great! No additional charges have been applied to this booking.
                        </p>
                    </div>
                )}

                {/* Breakdown Summary */}
                {appliedCharges.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <h4 className="font-medium text-gray-900">Charge Breakdown</h4>
                        {appliedCharges.map(charge => (
                            <div key={charge.id} className="flex justify-between text-sm">
                                <span className="text-gray-600">{chargeTypeConfig[charge.type].label}</span>
                                <span>{formatCurrency(charge.amount, charge.currency)}</span>
                            </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between font-bold">
                            <span>Total Additional Charges</span>
                            <span>{formatCurrency(totalCharges)}</span>
                        </div>
                    </div>
                )}

                {/* Information Notes */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                        <InfoIcon className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-blue-700">
                            <p className="font-medium mb-1">Additional Charges Information</p>
                            <ul className="space-y-1 text-xs">
                                <li>• Late return fees are calculated based on hourly rates</li>
                                <li>• Chauffeur charges include service time and gratuity</li>
                                <li>• Damage fees are assessed after vehicle inspection</li>
                                <li>• All charges are added to your final payment at dropoff</li>
                                {showControls && (
                                    <li>• Use the controls above to apply or remove charges as needed</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}