'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FloatingInput as Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAddress } from '@/app/axios/hooks';
import type { CreateAddressRequest } from '@/app/axios/services/address';


interface AddressFormProps {
    onSubmit: (address: CreateAddressRequest) => void;
    onCancel: () => void;
    initialData?: Partial<CreateAddressRequest>;
    isLoading?: boolean;
}

const AddressForm: React.FC<AddressFormProps> = ({
    onSubmit,
    onCancel,
    initialData,
    isLoading = false
}) => {
    const { createAddress, isLoading: addressLoading } = useAddress();
    const [formData, setFormData] = useState<CreateAddressRequest>({
        type: 'HOME',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        country: 'UAE',
        postalCode: '',
        isDefault: false,
        ...initialData
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.addressLine1.trim()) {
            newErrors.addressLine1 = 'Address line 1 is required';
        }
        if (!formData.city.trim()) {
            newErrors.city = 'City is required';
        }
        if (!formData.state.trim()) {
            newErrors.state = 'State/Emirate is required';
        }
        if (!formData.country.trim()) {
            newErrors.country = 'Country is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    const handleInputChange = (field: keyof CreateAddressRequest, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <Card className="overflow-hidden rounded-4xl border-none ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
            <CardContent className="p-8">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 text-primary rounded-lg p-2">
                                <MapPin className="h-4 w-4" />
                            </div>
                            <h3 className="text-sm font-black tracking-[0.2em] uppercase">New Deployment Sector</h3>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onCancel}
                            className="hover:bg-gray-100 h-8 w-8 rounded-lg p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Address Type */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                                Sector Classification
                            </Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value: 'HOME' | 'WORK' | 'OTHER') => handleInputChange('type', value)}
                            >
                                <SelectTrigger className="h-12 rounded-xl border-2 bg-gray-50/50 font-bold uppercase tracking-wide dark:bg-gray-800/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="HOME">Home Base</SelectItem>
                                    <SelectItem value="WORK">Command Center</SelectItem>
                                    <SelectItem value="OTHER">Alternative Sector</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Address Line 1 */}
                        <div className="space-y-2">
                            <Input
                                value={formData.addressLine1}
                                onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                                label='Address Primary Coordinates'
                                className={cn(
                                    "h-12 rounded-xl border-2 bg-gray-50/50 font-medium dark:bg-gray-800/50",
                                    errors.addressLine1 && "border-red-300 bg-red-50/50"
                                )}
                            />
                            {errors.addressLine1 && (
                                <p className="text-xs font-medium text-red-600">{errors.addressLine1}</p>
                            )}
                        </div>

                        {/* Address Line 2 */}
                        <div className="space-y-2">
                            <Input
                                value={formData.addressLine2}
                                onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                                label='Address Secondary Coordinates (Optional)'
                                className="h-12 rounded-xl border-2 bg-gray-50/50 font-medium dark:bg-gray-800/50"
                            />
                        </div>

                        {/* City and State */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Input
                                    label="City"
                                    value={formData.city}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                    className={cn(
                                        "h-12 rounded-xl border-2 bg-gray-50/50 font-medium dark:bg-gray-800/50",
                                        errors.city && "border-red-300 bg-red-50/50"
                                    )}
                                />
                                {errors.city && (
                                    <p className="text-xs font-medium text-red-600">{errors.city}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                                    Regional Sector *
                                </Label>
                                <Select
                                    value={formData.state}
                                    onValueChange={(value) => handleInputChange('state', value)}
                                >
                                    <SelectTrigger className={cn(
                                        "h-12 rounded-xl border-2 bg-gray-50/50 font-medium dark:bg-gray-800/50",
                                        errors.state && "border-red-300 bg-red-50/50"
                                    )}>
                                        <SelectValue placeholder="Select Emirate" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Dubai">Dubai</SelectItem>
                                        <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                                        <SelectItem value="Sharjah">Sharjah</SelectItem>
                                        <SelectItem value="Ajman">Ajman</SelectItem>
                                        <SelectItem value="Umm Al Quwain">Umm Al Quwain</SelectItem>
                                        <SelectItem value="Ras Al Khaimah">Ras Al Khaimah</SelectItem>
                                        <SelectItem value="Fujairah">Fujairah</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.state && (
                                    <p className="text-xs font-medium text-red-600">{errors.state}</p>
                                )}
                            </div>
                        </div>

                        {/* Country and Postal Code */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                                    Territory *
                                </Label>
                                <Select
                                    value={formData.country}
                                    onValueChange={(value) => handleInputChange('country', value)}
                                >
                                    <SelectTrigger className="h-12 rounded-xl border-2 bg-gray-50/50 font-medium dark:bg-gray-800/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UAE">United Arab Emirates</SelectItem>
                                        <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                                        <SelectItem value="Qatar">Qatar</SelectItem>
                                        <SelectItem value="Kuwait">Kuwait</SelectItem>
                                        <SelectItem value="Bahrain">Bahrain</SelectItem>
                                        <SelectItem value="Oman">Oman</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Input
                                    value={formData.postalCode}
                                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                                    label="Postal Code"
                                    className="h-12 rounded-xl border-2 bg-gray-50/50 font-medium dark:bg-gray-800/50"
                                />
                            </div>
                        </div>

                        {/* Default Address Toggle */}
                        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/30 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                            <button
                                type="button"
                                onClick={() => handleInputChange('isDefault', !formData.isDefault)}
                                className={cn(
                                    "flex h-5 w-5 items-center justify-center rounded border-2 transition-all",
                                    formData.isDefault ? "border-primary bg-primary" : "border-gray-300"
                                )}
                            >
                                {formData.isDefault && <Check className="h-3 w-3 text-white" />}
                            </button>
                            <div>
                                <p className="text-sm font-bold text-gray-950 dark:text-white">
                                    Set as Primary Deployment Sector
                                </p>
                                <p className="text-xs text-gray-500">
                                    This address will be selected by default for future operations
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 md:flex-row dark:border-gray-800">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                className="h-12 flex-1 rounded-xl border-2 text-xs font-black tracking-widest uppercase"
                            >
                                Abort Mission
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-primary hover:shadow-primary/30 h-12 flex-1 rounded-xl text-xs font-black tracking-widest uppercase shadow-xl transition-all hover:scale-[1.02]"
                            >
                                {isLoading ? 'Synchronizing...' : 'Deploy Sector'}
                            </Button>
                        </div>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
};

export default AddressForm;