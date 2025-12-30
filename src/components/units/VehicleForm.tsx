import { useState, useEffect, type FC, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import ImageUpload from '@/components/ui/image-upload';
import type { Vehicle } from '@/common/interface/vehicleInterface';

interface VehicleFormProps {
  vehicle?: Vehicle;
  onCancel: () => void;
  onSuccess: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  isLoading?: boolean;
}

const VehicleForm: FC<VehicleFormProps> = ({ vehicle, onCancel, onSuccess, onSubmit, isLoading = false }) => {
  const isEditMode = !!vehicle;

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    trim: '',
    year: '',
    exteriorColor: '',
    interiorColor: '',
    bodyType: '',
    transmission: '',
    drivetrain: '',
    engine: '',
    fuelType: '',
    horsepower: '',
    fuelConsumption: '',
    pricePerDay: '',
    delayChargePerHour: '',
    depositPercentage: '',
    currency: 'USD',
    isAvailable: 'true',
  });

  const [images, setImages] = useState<{
    frontImage?: File;
    backImage?: File;
    leftSideImage?: File;
    rightSideImage?: File;
    frontLeftImage?: File;
    frontRightImage?: File;
    interiorFrontImage?: File;
    interiorBackImage?: File;
    dashboardImage?: File;
    engineImage?: File;
  }>({});

  useEffect(() => {
    if (vehicle) {
      console.log('vehicle in edit', vehicle);
      setFormData({
        make: vehicle.make || '',
        model: vehicle.model || '',
        trim: vehicle.trim || '',
        year: vehicle.year?.toString() || '',
        exteriorColor: vehicle.exteriorColor || '',
        interiorColor: vehicle.interiorColor || '',
        bodyType: vehicle.bodyType || '',
        transmission: vehicle.transmission || '',
        drivetrain: vehicle.drivetrain,
        engine: vehicle.engine || '',
        fuelType: vehicle.fuelType || '',
        horsepower: vehicle.horsepower?.toString() || '',
        fuelConsumption: vehicle.fuelConsumption || '',
        pricePerDay: vehicle.pricePerDay || '',
        delayChargePerHour: vehicle.delayChargePerHour || '',
        depositPercentage: vehicle.depositPercentage || '',
        currency: vehicle.currency || 'USD',
        isAvailable: vehicle.isAvailable?.toString() || 'true',
      });
    }
  }, [vehicle]);

  const getExistingImageUrl = (fieldName: string): string | undefined => {
    if (!vehicle || !vehicle.media || vehicle.media.length === 0) return undefined;

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
  };

  const handleImageChange = (field: string, file: File | undefined) => {
    setImages((prev) => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      console.error('Failed to create vehicle:', error);
    }
  };

  return (
    <Fragment>
      <div className="mb-2 flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon" onClick={onCancel} disabled={isLoading}>
          <ArrowLeft className="size-5" />
        </Button>
        <h2 className="text-xl font-semibold">{isEditMode ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Images</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { id: 'frontImage', label: 'Front Image' },
              { id: 'backImage', label: 'Back Image' },
              { id: 'leftSideImage', label: 'Left Side Image' },
              { id: 'rightSideImage', label: 'Right Side Image' },
              { id: 'frontLeftImage', label: 'Front Left Image' },
              { id: 'frontRightImage', label: 'Front Right Image' },
              { id: 'interiorFrontImage', label: 'Interior Front Image' },
              { id: 'interiorBackImage', label: 'Interior Back Image' },
              { id: 'dashboardImage', label: 'Dashboard Image' },
              { id: 'engineImage', label: 'Engine Image' },
            ].map((image) => (
              <ImageUpload
                key={image.id}
                id={image.id}
                label={image.label}
                existingImageUrl={getExistingImageUrl(image.id)}
                onChange={(file) => handleImageChange(image.id, file)}
                disabled={isLoading}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="make">
                Make <span className="text-destructive">*</span>
              </Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => handleInputChange('make', e.target.value)}
                placeholder="e.g., Toyota"
                required
                disabled={isLoading}
              />
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
                required
                disabled={isLoading}
              />
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
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exteriorColor">
                Exterior Color <span className="text-destructive">*</span>
              </Label>
              <Input
                id="exteriorColor"
                value={formData.exteriorColor}
                onChange={(e) => handleInputChange('exteriorColor', e.target.value)}
                placeholder="e.g., White"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interiorColor">
                Interior Color <span className="text-destructive">*</span>
              </Label>
              <Input
                id="interiorColor"
                value={formData.interiorColor}
                onChange={(e) => handleInputChange('interiorColor', e.target.value)}
                placeholder="e.g., Black"
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bodyType">
                Body Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.bodyType}
                onValueChange={(value) => handleInputChange('bodyType', value)}
                disabled={isLoading}
                required
              >
                <SelectTrigger className="w-full" id="bodyType">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="transmission">
                Transmission <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.transmission}
                onValueChange={(value) => handleInputChange('transmission', value)}
                disabled={isLoading}
                required
              >
                <SelectTrigger className="w-full" id="transmission">
                  <SelectValue placeholder="Select transmission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Automatic">Automatic</SelectItem>
                  <SelectItem value="Manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="drivetrain">
                Drivetrain <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.drivetrain}
                onValueChange={(value) => handleInputChange('drivetrain', value)}
                disabled={isLoading}
                required
              >
                <SelectTrigger className="w-full" id="drivetrain">
                  <SelectValue placeholder="Select drivetrain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AWD">AWD</SelectItem>
                  <SelectItem value="RWD">RWD</SelectItem>
                  <SelectItem value="FWD">FWD</SelectItem>
                  <SelectItem value="4x4">4x4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuelType">
                Fuel Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.fuelType}
                onValueChange={(value) => handleInputChange('fuelType', value)}
                disabled={isLoading}
                required
              >
                <SelectTrigger className="w-full" id="fuelType">
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                  <SelectItem value="Electric">Electric</SelectItem>
                </SelectContent>
              </Select>
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
                required
                disabled={isLoading}
              />
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
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fuelConsumption">
                Fuel Consumption <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fuelConsumption"
                value={formData.fuelConsumption}
                onChange={(e) => handleInputChange('fuelConsumption', e.target.value)}
                placeholder="e.g., 8.5L/100km"
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                required
                disabled={isLoading}
              />
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
              <Label htmlFor="depositPercentage">Deposit Percentage</Label>
              <Input
                id="depositPercentage"
                type="number"
                step="0.01"
                value={formData.depositPercentage}
                onChange={(e) => handleInputChange('depositPercentage', e.target.value)}
                placeholder="e.g., 20.00"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                placeholder="e.g., USD"
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
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
        </div>
      </form>
    </Fragment>
  );
};

export default VehicleForm;
