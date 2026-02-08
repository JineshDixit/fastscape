'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@/app/axios/hooks/useUser';
import { useBooking } from '@/app/axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Car,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
  Shield,
} from 'lucide-react';
import { BookingHistorySection } from './BookingHistorySection';
import { ProfileEditModal } from './ProfileEditModal';
import { ActiveBookingsSection } from './ActiveBookingsSection';

export const UserProfilePage: React.FC = () => {
  const { profile, isLoading: profileLoading, error: profileError, fetchProfile } = useUser();
  const { bookingStats, fetchBookingStats, isLoading: statsLoading } = useBooking();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'overview');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    fetchProfile();
    fetchBookingStats();
  }, [fetchProfile, fetchBookingStats]);

  const getVerificationBadge = (status?: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <Badge className="bg-primary hover:bg-primary/90">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Verified
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="mr-1 h-3 w-3" />
            Not Submitted
          </Badge>
        );
    }
  };

  if (profileLoading || statsLoading) {
    return (
      <div className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-48 rounded-xl bg-muted" />
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="container mx-auto max-w-7xl p-4 sm:p-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to load profile. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {/* Profile Header Card */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600 sm:h-32" />
        <CardContent className="relative px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Avatar className="-mt-12 h-24 w-24 border-4 border-background bg-muted sm:-mt-16 sm:h-32 sm:w-32">
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-12 w-12 text-muted-foreground sm:h-16 sm:w-16" />
                </div>
              </Avatar>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold sm:text-3xl">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  {getVerificationBadge(profile.verificationStatus)}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {profile.phone}
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={() => setIsEditModalOpen(true)} className="rounded-full">
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {bookingStats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{bookingStats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{bookingStats.active}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{bookingStats.completed}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-secondary/10 p-3">
                <Clock className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{bookingStats.pending}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-lg">
          <TabsTrigger value="overview" className="rounded-md">
            Overview
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-md">
            Active Bookings
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-md">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">
                      {profile.firstName} {profile.lastName}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Email Address</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                    <p className="font-medium">{profile.phone}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {[profile.city, profile.state, profile.country].filter(Boolean).join(', ') ||
                          'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Driving Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Driving Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <p className="text-sm text-gray-600">License Issuing Country</p>
                    <p className="font-medium">{profile.licenseIssuingCountry || 'Not provided'}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600">License Expiry Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <p className="font-medium">
                        {profile.licenseExpiryDate
                          ? new Date(profile.licenseExpiryDate).toLocaleDateString()
                          : 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600">Driving Experience</p>
                    <p className="font-medium">
                      {profile.drivingExperienceYears
                        ? `${profile.drivingExperienceYears} years`
                        : 'Not provided'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Verification Status */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Document Verification
                </CardTitle>
                <CardDescription>Upload and verify your identity documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Driver License</p>
                        <p className="text-xs text-muted-foreground">Front & Back</p>
                      </div>
                    </div>
                    {profile.driverLicenseFront && profile.driverLicenseBack ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground/50" />
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Passport Photo</p>
                        <p className="text-xs text-muted-foreground">Required</p>
                      </div>
                    </div>
                    {profile.passportPhoto ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground/50" />
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Selfie w/ License</p>
                        <p className="text-xs text-muted-foreground">Required</p>
                      </div>
                    </div>
                    {profile.selfieWithLicense ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground/50" />
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Int'l Permit</p>
                        <p className="text-xs text-muted-foreground">Optional</p>
                      </div>
                    </div>
                    {profile.internationalDrivingPermit ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground/50" />
                    )}
                  </div>
                </div>

                {profile.verificationStatus === 'PENDING' && (
                  <Alert className="mt-4">
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Your documents are being reviewed. This usually takes 24-48 hours.
                    </AlertDescription>
                  </Alert>
                )}

                {profile.verificationStatus === 'REJECTED' && (
                  <Alert variant="destructive" className="mt-4">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your documents were rejected. Please re-upload clear, valid documents.
                    </AlertDescription>
                  </Alert>
                )}

                {!profile.verificationStatus && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please upload your documents to complete verification and start booking.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <ActiveBookingsSection />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <BookingHistorySection />
        </TabsContent>
      </Tabs>

      {/* Edit Profile Modal */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSuccess={() => {
          fetchProfile();
          setIsEditModalOpen(false);
        }}
      />
    </div>
  );
};
