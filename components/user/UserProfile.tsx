'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/app/axios/hooks/useUser';
import { Button } from '@/components/ui/button';
import { FloatingInput as Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { UpdateProfileRequest } from '@/common/interfaces';

export const UserProfile: React.FC = () => {
  const { profile, isLoading, error, fetchProfile, updateProfile, clearError } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileRequest>({});
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    driverLicenseFront: null,
    driverLicenseBack: null,
    passportPhoto: null,
    internationalDrivingPermit: null,
    selfieWithLicense: null,
  });

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

  const handleInputChange = (field: keyof UpdateProfileRequest, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [field]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const updateData: UpdateProfileRequest = { ...formData };

    // Add files to update data
    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        (updateData as any)[key] = file;
      }
    });

    const result = await updateProfile(updateData);
    if (result) {
      setIsEditing(false);
      setFiles({
        driverLicenseFront: null,
        driverLicenseBack: null,
        passportPhoto: null,
        internationalDrivingPermit: null,
        selfieWithLicense: null,
      });
    }
  };

  const getVerificationStatusBadge = (status?: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <Badge variant="default" className="bg-green-500">
            Verified
          </Badge>
        );
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Not Submitted</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Profile</h1>
        {!isEditing && <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>}
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="driving">Driving Info</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic profile information</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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

                  <div>
                    <Input
                      id="phone"
                      label="Phone"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        id="city"
                        label="City"
                        value={formData.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      />
                    </div>
                    <div>
                      <Input
                        id="state"
                        label="State"
                        value={formData.state || ''}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Input
                      id="country"
                      label="Country"
                      value={formData.country || ''}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>First Name</Label>
                      <p className="text-muted-foreground text-sm">{profile.firstName}</p>
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <p className="text-muted-foreground text-sm">{profile.lastName}</p>
                    </div>
                  </div>

                  <div>
                    <Label>Email</Label>
                    <p className="text-muted-foreground text-sm">{profile.email}</p>
                  </div>

                  <div>
                    <Label>Phone</Label>
                    <p className="text-muted-foreground text-sm">{profile.phone}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>City</Label>
                      <p className="text-muted-foreground text-sm">{profile.city || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label>State</Label>
                      <p className="text-muted-foreground text-sm">{profile.state || 'Not provided'}</p>
                    </div>
                  </div>

                  <div>
                    <Label>Country</Label>
                    <p className="text-muted-foreground text-sm">{profile.country || 'Not provided'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="driving">
          <Card>
            <CardHeader>
              <CardTitle>Driving Information</CardTitle>
              <CardDescription>Your driving license and experience details</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Input
                      id="licenseIssuingCountry"
                      label="License Issuing Country"
                      value={formData.licenseIssuingCountry || ''}
                      onChange={(e) => handleInputChange('licenseIssuingCountry', e.target.value)}
                    />
                  </div>

                  <div>
                    <Input
                      id="licenseExpiryDate"
                      label="License Expiry Date"
                      type="date"
                      value={formData.licenseExpiryDate || ''}
                      onChange={(e) => handleInputChange('licenseExpiryDate', e.target.value)}
                    />
                  </div>

                  <div>
                    <Input
                      id="drivingExperienceYears"
                      label="Driving Experience (Years)"
                      type="number"
                      min="0"
                      max="80"
                      value={formData.drivingExperienceYears || ''}
                      onChange={(e) => handleInputChange('drivingExperienceYears', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label>License Issuing Country</Label>
                    <p className="text-muted-foreground text-sm">{profile.licenseIssuingCountry || 'Not provided'}</p>
                  </div>

                  <div>
                    <Label>License Expiry Date</Label>
                    <p className="text-muted-foreground text-sm">{profile.licenseExpiryDate || 'Not provided'}</p>
                  </div>

                  <div>
                    <Label>Driving Experience</Label>
                    <p className="text-muted-foreground text-sm">
                      {profile.drivingExperienceYears ? `${profile.drivingExperienceYears} years` : 'Not provided'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Identity Documents</CardTitle>
              <CardDescription>
                Upload your identity documents for verification
                {getVerificationStatusBadge(profile.verificationStatus)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Input
                      id="driverLicenseFront"
                      label="Driver License (Front)"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('driverLicenseFront', e.target.files?.[0] || null)}
                    />
                  </div>

                  <div>
                    <Input
                      id="driverLicenseBack"
                      label="Driver License (Back)"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('driverLicenseBack', e.target.files?.[0] || null)}
                    />
                  </div>

                  <div>
                    <Input
                      id="passportPhoto"
                      label="Passport Photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('passportPhoto', e.target.files?.[0] || null)}
                    />
                  </div>

                  <div>
                    <Input
                      id="internationalDrivingPermit"
                      label="International Driving Permit (Optional)"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('internationalDrivingPermit', e.target.files?.[0] || null)}
                    />
                  </div>

                  <div>
                    <Input
                      id="selfieWithLicense"
                      label="Selfie with License"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('selfieWithLicense', e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Verification Status</Label>
                    {getVerificationStatusBadge(profile.verificationStatus)}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Driver License (Front)</Label>
                      <p className="text-muted-foreground text-sm">
                        {profile.driverLicenseFront ? 'Uploaded' : 'Not uploaded'}
                      </p>
                    </div>
                    <div>
                      <Label>Driver License (Back)</Label>
                      <p className="text-muted-foreground text-sm">
                        {profile.driverLicenseBack ? 'Uploaded' : 'Not uploaded'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Passport Photo</Label>
                      <p className="text-muted-foreground text-sm">
                        {profile.passportPhoto ? 'Uploaded' : 'Not uploaded'}
                      </p>
                    </div>
                    <div>
                      <Label>Selfie with License</Label>
                      <p className="text-muted-foreground text-sm">
                        {profile.selfieWithLicense ? 'Uploaded' : 'Not uploaded'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label>International Driving Permit</Label>
                    <p className="text-muted-foreground text-sm">
                      {profile.internationalDrivingPermit ? 'Uploaded' : 'Not uploaded (Optional)'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
