import { useState, useEffect, type FC } from 'react';
import { ArrowLeft, ArrowRight, Car, Settings, Camera, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import ImageUpload from '@/components/ui/image-upload';
import type { Vehicle } from '@/common/interface/vehicleInterface';
import { cn } from '@/lib/utils';
import { locationService, type Location } from '@/api/services/locationService';

interface VehicleFormStepperProps {
  vehicle?: Vehicle;
  onCancel: () => void;
  onSuccess: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  isLoading?: boolean;
}

interface Step {
  id: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Basic Information',
    icon: Car,
  },
  {
    id: 2,
    title: 'Specifications',
    icon: Settings,
  },
  {
    id: 3,
    title: 'Vehicle Images',
    icon: Camera,
  },
  {
    id: 4,
    title: 'Pricing',
    icon: DollarSign,
  },
];

const VehicleFormStepper: FC<VehicleFormStepperProps> = ({
  vehicle,
  onCancel,
  onSuccess,
  onSubmit,
  isLoading = false,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [images, setImages] = useState<Record<string, File>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [canSubmit, setCanSubmit] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);

  const isEditMode = !!vehicle;

  // Form data state
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    trim: '',
    year: new Date().getFullYear().toString(),
    exteriorColor: '',
    interiorColor: '',
    bodyType: '',
    transmission: '',
    drivetrain: '',
    fuelType: '',
    engine: '',
    horsepower: '',
    fuelConsumption: '',
    pricePerDay: '',
    delayChargePerHour: '',
    depositPercentage: '',
    currency: 'USD',
    isAvailable: 'true',
    passengerCapacity: '5',
    city: 'Dubai',
    locationId: '',
  });

  // Fetch locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await locationService.getAllLocations({ limit: 1000, isActive: true });
        setLocations(response.data || []);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      }
    };
    fetchLocations();
  }, []);

  // Reset canSubmit when step changes
  useEffect(() => {
    setCanSubmit(false);
  }, [currentStep]);

  // Populate form with existing vehicle data
  useEffect(() => {
    if (vehicle) {
      setFormData({
        make: vehicle.make || '',
        model: vehicle.model || '',
        trim: vehicle.trim || '',
        year: vehicle.year?.toString() || new Date().getFullYear().toString(),
        exteriorColor: vehicle.exteriorColor || '',
        interiorColor: vehicle.interiorColor || '',
        bodyType: vehicle.bodyType || '',
        transmission: vehicle.transmission || '',
        drivetrain: vehicle.drivetrain || '',
        fuelType: vehicle.fuelType || '',
        engine: vehicle.engine || '',
        horsepower: vehicle.horsepower?.toString() || '',
        fuelConsumption: vehicle.fuelConsumption || '',
        pricePerDay: vehicle.pricePerDay || '',
        delayChargePerHour: vehicle.delayChargePerHour || '',
        depositPercentage: vehicle.depositPercentage || '',
        currency: vehicle.currency || 'USD',
        isAvailable: vehicle.isAvailable?.toString() || 'true',
        passengerCapacity: vehicle.passengerCapacity?.toString() || '5',
        city: vehicle.city || 'Dubai',
        locationId: (vehicle as any).locationId || '',
      });
    }
  }, [vehicle]);

  const getExistingImageUrl = (fieldName: string): string | undefined => {
    if (!vehicle?.media?.length) return undefined;

    const media = vehicle.media.find((m) => m.isPrimary) || vehicle.media[0];
    if (!media) return undefined;

    const imageMap: Record<string, string | null | undefined> = {
      frontImage: media.frontImage,
      backImage: media.backImage,
      leftSideImage: media.leftSideImage,
      rightSideImage: media.rightSideImage,
      frontLeftImage: media.frontLeftImage,
      frontRightImage: media.frontRightImage,
      interiorFrontImage: media.interiorFrontImage,
      interiorBackImage: media.interiorBackImage,
      dashboardImage: media.dashboardImage,
      engineImage: media.engineImage,
    };

    const imagePath = imageMap[fieldName];
    if (!imagePath) return undefined;

    return `http://localhost:3001/${imagePath.replace(/\\/g, '/')}`;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageChange = (field: string, file: File | undefined) => {
    setImages((prev) => {
      const newImages = { ...prev };
      if (file) {
        newImages[field] = file;
      } else {
        delete newImages[field];
      }
      return newImages;
    });
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        if (!formData.make.trim()) newErrors.make = 'Make is required';
        if (!formData.model.trim()) newErrors.model = 'Model is required';
        if (!formData.year.trim()) newErrors.year = 'Year is required';
        if (!formData.exteriorColor.trim()) newErrors.exteriorColor = 'Exterior color is required';
        if (!formData.interiorColor.trim()) newErrors.interiorColor = 'Interior color is required';
        break;
      case 2:
        if (!formData.bodyType) newErrors.bodyType = 'Body type is required';
        if (!formData.transmission) newErrors.transmission = 'Transmission is required';
        if (!formData.drivetrain) newErrors.drivetrain = 'Drivetrain is required';
        if (!formData.fuelType) newErrors.fuelType = 'Fuel type is required';
        if (!formData.engine.trim()) newErrors.engine = 'Engine is required';
        if (!formData.horsepower.trim()) newErrors.horsepower = 'Horsepower is required';
        if (!formData.fuelConsumption.trim()) newErrors.fuelConsumption = 'Fuel consumption is required';
        if (!formData.passengerCapacity) newErrors.passengerCapacity = 'Passenger capacity is required';
        break;
      case 3:
        // Check if left side image is uploaded (required)
        const hasLeftSideImage = images.leftSideImage || getExistingImageUrl('leftSideImage');
        if (!hasLeftSideImage) {
          newErrors.leftSideImage = 'Left side image is required';
        }
        break;
      case 4:
        if (!formData.pricePerDay.trim()) newErrors.pricePerDay = 'Price per day is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.locationId.trim()) newErrors.locationId = 'Location is required';
        break;
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;

    if (isValid && !completedSteps.includes(currentStep)) {
      setCompletedSteps((prev) => [...prev, currentStep]);
    }

    return isValid;
  };

  const handleNext = () => {
    console.log('Next button clicked, current step:', currentStep);
    const isValid = validateCurrentStep();
    console.log('Validation result:', isValid);
    if (isValid && currentStep < steps.length) {
      console.log('Moving to next step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCurrentStep()) {
      return;
    }

    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value) {
        data.append(key, value);
      }
    });

    Object.entries(images).forEach(([key, file]) => {
      if (file) {
        data.append(key, file);
      }
    });

    try {
      await onSubmit(data);
      onSuccess();
    } catch (error) {
      console.error('Failed to save vehicle:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (currentStep !== steps.length || !canSubmit)) {
      e.preventDefault();
      console.log('Enter key prevented on step:', currentStep);
      return false;
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log(
      'Form submit triggered, current step:',
      currentStep,
      'total steps:',
      steps.length,
      'canSubmit:',
      canSubmit,
    );

    // Only allow submission on the final step AND when explicitly allowed
    if (currentStep !== steps.length || !canSubmit) {
      console.log('Form submission prevented - not on final step or not allowed');
      return false;
    }

    console.log('Form submission allowed - on final step and canSubmit is true');
    handleSubmit(e);
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button type="button" variant="ghost" size="icon" onClick={onCancel} disabled={isLoading}>
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{isEditMode ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
          <p className="text-muted-foreground">
            Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.title}
          </p>
        </div>
      </div>

      <Card className="bg-background hidden rounded-2xl border md:block">
        <CardContent className="relative">
          <div className="flex justify-center">
            <Separator className="bg-border absolute top-4.5 hidden h-px w-3/4! md:block" />
          </div>

          <div className="grid grid-cols-4 gap-y-12">
            {steps.map((step) => {
              const isActive = currentStep === step.id;
              const isCompleted = completedSteps.includes(step.id);

              return (
                <div key={step.id} className="flex flex-col items-center text-center">
                  <div
                    className={cn(
                      'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border transition-all',
                      isActive && 'border-primary bg-primary text-primary-foreground',
                      isCompleted && 'border-primary bg-primary text-primary-foreground',
                      !isActive && !isCompleted && 'border-muted bg-muted text-muted-foreground',
                    )}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>

                  <h4 className={cn('mt-4 text-sm font-medium', isActive ? 'text-primary' : 'text-foreground')}>
                    {step.title}
                  </h4>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleFormSubmit} onKeyDown={handleKeyDown} className="space-y-6" noValidate>
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="size-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Vehicle make, model, and basic details</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="make">
                  Make <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) => handleInputChange('make', e.target.value)}
                  placeholder="e.g., Toyota"
                  disabled={isLoading}
                />
                {errors.make && <p className="text-destructive text-sm">{errors.make}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">
                  Model <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="e.g., Camry"
                  disabled={isLoading}
                />
                {errors.model && <p className="text-destructive text-sm">{errors.model}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="trim">Trim</Label>
                <Input
                  id="trim"
                  value={formData.trim}
                  onChange={(e) => handleInputChange('trim', e.target.value)}
                  placeholder="e.g., XLE"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">
                  Year <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  placeholder="e.g., 2023"
                  disabled={isLoading}
                />
                {errors.year && <p className="text-destructive text-sm">{errors.year}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="exteriorColor">
                  Exterior Color <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="exteriorColor"
                  value={formData.exteriorColor}
                  onChange={(e) => handleInputChange('exteriorColor', e.target.value)}
                  placeholder="e.g., Pearl White"
                  disabled={isLoading}
                />
                {errors.exteriorColor && <p className="text-destructive text-sm">{errors.exteriorColor}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="interiorColor">
                  Interior Color <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="interiorColor"
                  value={formData.interiorColor}
                  onChange={(e) => handleInputChange('interiorColor', e.target.value)}
                  placeholder="e.g., Black Leather"
                  disabled={isLoading}
                />
                {errors.interiorColor && <p className="text-destructive text-sm">{errors.interiorColor}</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="size-5" />
                Specifications
              </CardTitle>
              <CardDescription>Technical specifications and features</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bodyType">
                  Body Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.bodyType}
                  onValueChange={(value) => handleInputChange('bodyType', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select body type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUV">SUV</SelectItem>
                    <SelectItem value="Sedan">Sedan</SelectItem>
                    <SelectItem value="Coupe">Coupe</SelectItem>
                    <SelectItem value="Supercar">Supercar</SelectItem>
                    <SelectItem value="Pickup">Pickup</SelectItem>
                    <SelectItem value="Hatchback">Hatchback</SelectItem>
                  </SelectContent>
                </Select>
                {errors.bodyType && <p className="text-destructive text-sm">{errors.bodyType}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="transmission">
                  Transmission <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.transmission}
                  onValueChange={(value) => handleInputChange('transmission', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transmission" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Automatic">Automatic</SelectItem>
                    <SelectItem value="Manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
                {errors.transmission && <p className="text-destructive text-sm">{errors.transmission}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="drivetrain">
                  Drivetrain <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.drivetrain}
                  onValueChange={(value) => handleInputChange('drivetrain', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select drivetrain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AWD">AWD</SelectItem>
                    <SelectItem value="RWD">RWD</SelectItem>
                    <SelectItem value="FWD">FWD</SelectItem>
                    <SelectItem value="4x4">4x4</SelectItem>
                  </SelectContent>
                </Select>
                {errors.drivetrain && <p className="text-destructive text-sm">{errors.drivetrain}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelType">
                  Fuel Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.fuelType}
                  onValueChange={(value) => handleInputChange('fuelType', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Petrol">Petrol</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="Electric">Electric</SelectItem>
                  </SelectContent>
                </Select>
                {errors.fuelType && <p className="text-destructive text-sm">{errors.fuelType}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="engine">
                  Engine <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="engine"
                  value={formData.engine}
                  onChange={(e) => handleInputChange('engine', e.target.value)}
                  placeholder="e.g., 2.5L 4-Cylinder"
                  disabled={isLoading}
                />
                {errors.engine && <p className="text-destructive text-sm">{errors.engine}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="horsepower">
                  Horsepower <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="horsepower"
                  type="number"
                  value={formData.horsepower}
                  onChange={(e) => handleInputChange('horsepower', e.target.value)}
                  placeholder="e.g., 203"
                  disabled={isLoading}
                />
                {errors.horsepower && <p className="text-destructive text-sm">{errors.horsepower}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="fuelConsumption">
                  Fuel Consumption <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fuelConsumption"
                  value={formData.fuelConsumption}
                  onChange={(e) => handleInputChange('fuelConsumption', e.target.value)}
                  placeholder="e.g., 8.5L/100km or 28 MPG"
                  disabled={isLoading}
                />
                {errors.fuelConsumption && <p className="text-destructive text-sm">{errors.fuelConsumption}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="passengerCapacity">
                  Passenger Capacity <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="passengerCapacity"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.passengerCapacity}
                  onChange={(e) => handleInputChange('passengerCapacity', e.target.value)}
                  placeholder="e.g., 5"
                  disabled={isLoading}
                />
                {errors.passengerCapacity && <p className="text-destructive text-sm">{errors.passengerCapacity}</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="size-5" />
                Vehicle Images
              </CardTitle>
              <CardDescription>
                Upload high-quality images of your vehicle. Left side image is required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
                {[
                  { id: 'frontImage', label: 'Front Image', required: false },
                  { id: 'backImage', label: 'Back Image', required: false },
                  { id: 'leftSideImage', label: 'Left Side Image', required: true },
                  { id: 'rightSideImage', label: 'Right Side Image', required: false },
                  { id: 'frontLeftImage', label: 'Front Left Image', required: false },
                  { id: 'frontRightImage', label: 'Front Right Image', required: false },
                  { id: 'interiorFrontImage', label: 'Interior Front Image', required: false },
                  { id: 'interiorBackImage', label: 'Interior Back Image', required: false },
                  { id: 'dashboardImage', label: 'Dashboard Image', required: false },
                  { id: 'engineImage', label: 'Engine Image', required: false },
                ].map((image) => (
                  <div key={image.id} className="space-y-2">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-sm font-medium">{image.label}</span>
                      {image.required && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    <ImageUpload
                      id={image.id}
                      existingImageUrl={getExistingImageUrl(image.id)}
                      onChange={(file) => handleImageChange(image.id, file)}
                      disabled={isLoading}
                    />
                  </div>
                ))}
              </div>

              {/* Required image validation message */}
              {errors.leftSideImage && (
                <div className="border-destructive/20 bg-destructive/10 mt-4 rounded-md border p-3">
                  <p className="text-destructive text-sm">{errors.leftSideImage}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="size-5" />
                Pricing & Availability
              </CardTitle>
              <CardDescription>Set pricing and availability</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="locationId">
                  Location <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.locationId}
                  onValueChange={(value) => handleInputChange('locationId', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="locationId">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} - {location.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.locationId && <p className="text-destructive text-sm">{errors.locationId}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="city">
                  City / Location <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="e.g., Dubai"
                  disabled={isLoading}
                />
                {errors.city && <p className="text-destructive text-sm">{errors.city}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerDay">
                  Price Per Day <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pricePerDay"
                  type="number"
                  step="0.01"
                  value={formData.pricePerDay}
                  onChange={(e) => handleInputChange('pricePerDay', e.target.value)}
                  placeholder="e.g., 89.99"
                  disabled={isLoading}
                />
                {errors.pricePerDay && <p className="text-destructive text-sm">{errors.pricePerDay}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="delayChargePerHour">Delay Charge Per Hour</Label>
                <Input
                  id="delayChargePerHour"
                  type="number"
                  step="0.01"
                  value={formData.delayChargePerHour}
                  onChange={(e) => handleInputChange('delayChargePerHour', e.target.value)}
                  placeholder="e.g., 15.00"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="depositPercentage">Deposit Percentage (%)</Label>
                <Input
                  id="depositPercentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.depositPercentage}
                  onChange={(e) => handleInputChange('depositPercentage', e.target.value)}
                  placeholder="e.g., 20.00"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleInputChange('currency', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                    <SelectItem value="QAR">QAR - Qatari Riyal</SelectItem>
                    <SelectItem value="KWD">KWD - Kuwaiti Dinar</SelectItem>
                    <SelectItem value="BHD">BHD - Bahraini Dinar</SelectItem>
                    <SelectItem value="OMR">OMR - Omani Rial</SelectItem>
                    <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                    <SelectItem value="PKR">PKR - Pakistani Rupee</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1 || isLoading}>
            <ArrowLeft className="mr-2 size-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>

            {currentStep < steps.length ? (
              <Button type="button" onClick={handleNext} disabled={isLoading}>
                Next
                <ArrowRight className="ml-2 size-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading} onClick={() => setCanSubmit(true)}>
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 size-4" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : isEditMode ? (
                  'Update Vehicle'
                ) : (
                  'Create Vehicle'
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default VehicleFormStepper;
