'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, MapPin, Phone, Mail, Calendar, FileText } from 'lucide-react';
import type { UserProfile } from '@/common/interfaces';

interface UserProfileCardProps {
  profile: UserProfile;
  onEditClick?: () => void;
  showEditButton?: boolean;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ profile, onEditClick, showEditButton = true }) => {
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

  const formatLocation = () => {
    const parts = [profile.city, profile.state, profile.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Not provided';
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <CardTitle className="text-xl">
            {profile.firstName} {profile.lastName}
          </CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          {getVerificationStatusBadge(profile.verificationStatus)}
          {showEditButton && (
            <Button variant="outline" size="sm" onClick={onEditClick}>
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex items-center space-x-2">
            <Mail className="text-muted-foreground h-4 w-4" />
            <span className="text-sm">{profile.email}</span>
          </div>

          <div className="flex items-center space-x-2">
            <Phone className="text-muted-foreground h-4 w-4" />
            <span className="text-sm">{profile.phone}</span>
          </div>

          <div className="flex items-center space-x-2">
            <MapPin className="text-muted-foreground h-4 w-4" />
            <span className="text-sm">{formatLocation()}</span>
          </div>

          {profile.dateOfBirth && (
            <div className="flex items-center space-x-2">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <span className="text-sm">{new Date(profile.dateOfBirth).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {(profile.licenseIssuingCountry || profile.drivingExperienceYears) && (
          <div className="border-t pt-4">
            <h4 className="mb-2 flex items-center text-sm font-medium">
              <FileText className="mr-1 h-4 w-4" />
              Driving Information
            </h4>
            <div className="text-muted-foreground grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              {profile.licenseIssuingCountry && <div>License Country: {profile.licenseIssuingCountry}</div>}
              {profile.drivingExperienceYears && <div>Experience: {profile.drivingExperienceYears} years</div>}
              {profile.licenseExpiryDate && (
                <div>License Expires: {new Date(profile.licenseExpiryDate).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="mb-2 text-sm font-medium">Document Status</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Driver License:</span>
              <span
                className={profile.driverLicenseFront && profile.driverLicenseBack ? 'text-green-600' : 'text-gray-500'}
              >
                {profile.driverLicenseFront && profile.driverLicenseBack ? 'Complete' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Passport Photo:</span>
              <span className={profile.passportPhoto ? 'text-green-600' : 'text-gray-500'}>
                {profile.passportPhoto ? 'Uploaded' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Selfie w/ License:</span>
              <span className={profile.selfieWithLicense ? 'text-green-600' : 'text-gray-500'}>
                {profile.selfieWithLicense ? 'Uploaded' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Int'l Permit:</span>
              <span className={profile.internationalDrivingPermit ? 'text-green-600' : 'text-gray-400'}>
                {profile.internationalDrivingPermit ? 'Uploaded' : 'Optional'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
