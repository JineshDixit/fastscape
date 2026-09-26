'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBooking } from '@/app/axios';
import { Button } from '@/components/ui/button';
import { FloatingInput as Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, MapPinIcon, CarIcon, UserIcon } from 'lucide-react';
import type { CreateBookingRequest, Vehicle } from '@/common/interfaces';

interface BookingFormProps {
  vehicle: Vehicle;
  onBookingCreated?: (bookingId: string) => void;
  onCancel?: () => void;
}

interface BookingFormData {
  startDatetime: string;
  endDatetime: string;
  pickupLocation: string;
  dropoffLocation: string;
  bookingType: 'SELF_DRIVE' | 'CHAUFFEUR';
  paymentMethod: 'PICKUP' | 'DROPOFF' | 'ONLINE';
  notes?: string;
  chauffeurInstructions?: string;
}

export default function BookingForm({ vehicle, onBookingCreated, onCancel }: BookingFormProps) {
  const { createBooking, checkAvailability, isCreatingBooking, error, clearError } = useBooking();
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError: setFormError,
  } = useForm<BookingFormData>({
    defaultValues: {
      bookingType: 'SELF_DRIVE',
      paymentMethod: 'ONLINE',
    },
  });

  const bookingType = watch('bookingType');
  const startDatetime = watch('startDatetime');
  const endDatetime = watch('endDatetime');

  const handleCheckAvailability = async () => {
    if (!startDatetime || !endDatetime) {
      setFormError('startDatetime', { message: 'Please select pickup and dropoff dates' });
      return;
    }

    setIsCheckingAvailability(true);
    clearError();

    try {
      const response = await checkAvailability({
        vehicleId: vehicle.id,
        startDatetime,
        endDatetime,
      });

      if (response?.success) {
        if (response.data.isAvailable) {
          setAvailabilityChecked(true);
        } else {
          setFormError('startDatetime', { 
            message: 'Vehicle is not available for the selected dates. Please choose different dates.' 
          });
        }
      }
    } catch (err) {
      console.error('Availability check failed:', err);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!availabilityChecked) {
      setFormError('startDatetime', { message: 'Please check availability first' });
      return;
    }

    clearError();

    const bookingData: CreateBookingRequest = {
      vehicleId: vehicle.id,
      startDatetime: data.startDatetime,
      endDatetime: data.endDatetime,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      bookingType: data.bookingType,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      chauffeurInstructions: data.chauffeurInstructions,
    };

    const response = await createBooking(bookingData);

    if (response?.success && response.data) {
      onBookingCreated?.(response.data.id);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CarIcon className="h-5 w-5" />
          Book {vehicle.make} {vehicle.model}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Vehicle Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Vehicle Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Make & Model:</span>
                <p className="font-medium">{vehicle.make} {vehicle.model}</p>
              </div>
              <div>
                <span className="text-gray-600">Price per day:</span>
                <p className="font-medium">${vehicle.pricePerDay}</p>
              </div>
              <div>
                <span className="text-gray-600">Body Type:</span>
                <p className="font-medium">{vehicle.bodyType}</p>
              </div>
              <div>
                <span className="text-gray-600">Transmission:</span>
                <p className="font-medium">{vehicle.transmission}</p>
              </div>
            </div>
          </div>

          {/* Booking Type */}
          <div className="space-y-3">
            <Label>Booking Type</Label>
            <RadioGroup
              value={bookingType}
              onValueChange={(value) => register('bookingType').onChange({ target: { value } })}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="SELF_DRIVE" id="self-drive" />
                <Label htmlFor="self-drive" className="flex items-center gap-2">
                  <CarIcon className="h-4 w-4" />
                  Self Drive
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CHAUFFEUR" id="chauffeur" />
                <Label htmlFor="chauffeur" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  With Chauffeur
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Input
                id="startDatetime"
                type="datetime-local"
                label="Pickup Date & Time"
                {...register('startDatetime', { required: 'Pickup date is required' })}
                className={errors.startDatetime ? 'border-red-500' : ''}
              />
              {errors.startDatetime && (
                <p className="text-red-500 text-sm">{errors.startDatetime.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                id="endDatetime"
                type="datetime-local"
                label="Dropoff Date & Time"
                {...register('endDatetime', { required: 'Dropoff date is required' })}
                className={errors.endDatetime ? 'border-red-500' : ''}
              />
              {errors.endDatetime && (
                <p className="text-red-500 text-sm">{errors.endDatetime.message}</p>
              )}
            </div>
          </div>

          {/* Availability Check */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCheckAvailability}
              disabled={isCheckingAvailability || !startDatetime || !endDatetime}
              className="w-full"
            >
              {isCheckingAvailability ? 'Checking...' : 'Check Availability'}
            </Button>
            {availabilityChecked && (
              <p className="text-green-600 text-sm text-center">✓ Vehicle is available for selected dates</p>
            )}
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Input
                id="pickupLocation"
                label="Pickup Location"
                placeholder="Enter pickup address"
                {...register('pickupLocation', { required: 'Pickup location is required' })}
                className={errors.pickupLocation ? 'border-red-500' : ''}
              />
              {errors.pickupLocation && (
                <p className="text-red-500 text-sm">{errors.pickupLocation.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Input
                id="dropoffLocation"
                label="Dropoff Location"
                placeholder="Enter dropoff address"
                {...register('dropoffLocation', { required: 'Dropoff location is required' })}
                className={errors.dropoffLocation ? 'border-red-500' : ''}
              />
              {errors.dropoffLocation && (
                <p className="text-red-500 text-sm">{errors.dropoffLocation.message}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any special requirements or notes..."
              {...register('notes')}
            />
          </div>

          {/* Chauffeur Instructions */}
          {bookingType === 'CHAUFFEUR' && (
            <div className="space-y-2">
              <Label htmlFor="chauffeurInstructions">Instructions for Chauffeur</Label>
              <Textarea
                id="chauffeurInstructions"
                placeholder="Special instructions for your chauffeur..."
                {...register('chauffeurInstructions')}
              />
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
              type="submit"
              disabled={isCreatingBooking || !availabilityChecked}
              className="flex-1"
            >
              {isCreatingBooking ? 'Creating Booking...' : 'Create Booking'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}