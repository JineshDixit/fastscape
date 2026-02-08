'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/app/axios/hooks/useUser';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FloatingInput as Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Upload, X, CheckCircle } from 'lucide-react';
import type { UserProfile, UpdateProfileRequest } from '@/common/interfaces';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSuccess: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose, profile, onSuccess }) => {
  const { updateProfile, isLoading, error, clearError } = useUser();
  const [formData, setFormData] = useState<UpdateProfileRequest>({});
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    driverLicenseFront: null,
    driverLicenseBack: null,
    passportPhoto: null,
    internationalDrivingPermit: null,
    selfieWithLicense: null,
  });
  const [filePreviews, setFilePreviews] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        licenseIssuingCountry: profile.licenseIssuingCountry,
        licenseExpiryDate: profile.licenseExpiryDate,
        drivingExperienceYears: profile.drivingExperienceYears,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!isOpen) {
      clearError();
      setFiles({
        driverLicenseFront: null,
        driverLicenseBack: null,
        passportPhoto: null,
        internationalDrivingPermit: null,
        selfieWithLicense: null,
      });
      setFilePreviews({});
    }
  }, [isOpen, clearError]);

  const handleInputChange = (field: keyof UpdateProfileRequest, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [field]: file }));

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews((prev) => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreviews((prev) => {
        const newPreviews = { ...prev };
        delete newPreviews[field];
        return newPreviews;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const updateData: UpdateProfileRequest = { ...formData };

    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        (updateData as any)[key] = file;
      }
    });

    const result = await updateProfile(updateData);
    if (result) {
      onSuccess();
    }
  };

  const documentFields = [
    {
      key: 'driverLicenseFront',
      label: 'Driver License (Front)',
      required: true,
      uploaded: profile.driverLicenseFront,
    },
    {
      key: 'driverLicenseBack',
      label: 'Driver License (Back)',
      required: true,
      uploaded: profile.driverLicenseBack,
    },
    {
      key: 'passportPhoto',
      label: 'Passport Photo',
      required: true,
      uploaded: profile.passportPhoto,
    },
    {
      key: 'selfieWithLicense',
      label: 'Selfie with License',
      required: true,
      uploaded: profile.selfieWithLicense,
    },
    {
      key: 'internationalDrivingPermit',
      label: 'International Driving Permit',
      required: false,
      uploaded: profile.internationalDrivingPermit,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your personal information and documents</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-lg">
              <TabsTrigger value="personal" className="rounded-md">
                Personal
              </TabsTrigger>
              <TabsTrigger value="driving" className="rounded-md">
                Driving
              </TabsTrigger>
              <TabsTrigger value="documents" className="rounded-md">
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Input
                    id="firstName"
                    label="First Name"
                    value={formData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    id="lastName"
                    label="Last Name"
                    value={formData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <Input
                id="phone"
                label="Phone Number"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
              />

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="city"
                  label="City"
                  value={formData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                />
                <Input
                  id="state"
                  label="State/Province"
                  value={formData.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                />
              </div>

              <Input
                id="country"
                label="Country"
                value={formData.country || ''}
                onChange={(e) => handleInputChange('country', e.target.value)}
              />
            </TabsContent>

            <TabsContent value="driving" className="mt-6 space-y-4">
              <Input
                id="licenseIssuingCountry"
                label="License Issuing Country"
                value={formData.licenseIssuingCountry || ''}
                onChange={(e) => handleInputChange('licenseIssuingCountry', e.target.value)}
              />

              <Input
                id="licenseExpiryDate"
                label="License Expiry Date"
                type="date"
                value={formData.licenseExpiryDate || ''}
                onChange={(e) => handleInputChange('licenseExpiryDate', e.target.value)}
              />

              <Input
                id="drivingExperienceYears"
                label="Driving Experience (Years)"
                type="number"
                min="0"
                max="80"
                value={formData.drivingExperienceYears || ''}
                onChange={(e) => handleInputChange('drivingExperienceYears', parseInt(e.target.value))}
              />
            </TabsContent>

            <TabsContent value="documents" className="mt-6 space-y-4">
              <Alert>
                <AlertDescription className="text-sm">
                  Upload clear, high-quality images of your documents. All documents must be valid and not expired.
                </AlertDescription>
              </Alert>

              {documentFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label className="flex items-center gap-2">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                    {field.uploaded && !files[field.key] && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </Label>

                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="file"
                        id={field.key}
                        accept="image/*"
                        onChange={(e) => handleFileChange(field.key, e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <label
                        htmlFor={field.key}
                        className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-gray-400 hover:bg-gray-100"
                      >
                        <Upload className="h-5 w-5 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {files[field.key] ? files[field.key]!.name : 'Choose file'}
                        </span>
                      </label>
                    </div>

                    {files[field.key] && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileChange(field.key, null)}
                        className="rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {filePreviews[field.key] && (
                    <div className="relative h-32 w-full overflow-hidden rounded-lg border">
                      <img
                        src={filePreviews[field.key]}
                        alt={field.label}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="rounded-full">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="rounded-full">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
