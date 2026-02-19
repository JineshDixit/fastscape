'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
  Eye,
} from 'lucide-react';
import { BookingHistorySection } from './BookingHistorySection';
import { ProfileEditModal } from './ProfileEditModal';
import { ActiveBookingsSection } from './ActiveBookingsSection';

export const UserProfilePage: React.FC = () => {
  const t = useTranslations('profile');
  const tNav = useTranslations('navigation');
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
            {t('verified')}
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            {t('pending')}
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            {t('rejected')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="mr-1 h-3 w-3" />
            {t('notSubmitted')}
          </Badge>
        );
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http')) return path;
    const baseUrl = process.env.NEXT_PUBLIC_IMAGE_URL || 'http://localhost:3000';
    // Ensure we don't end up with double slashes if baseUrl ends with one or path starts with one
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBaseUrl}${cleanPath.replace(/\\/g, '/')}`;
  };

  if (profileLoading || statsLoading) {
    return (
      <div className="container mx-auto max-w-7xl space-y-6 sm:p-6">
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
          <AlertDescription>{t('failedToLoadProfile')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-6">
      {/* Profile Header Card */}
      <Card className="overflow-hidden pt-0">
        <div className="h-24 bg-linear-to-r from-blue-500 to-purple-600 sm:h-32" />
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
              {t('editProfile')}
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
                <p className="text-sm text-muted-foreground">{t('totalBookings')}</p>
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
                <p className="text-sm text-muted-foreground">{t('active')}</p>
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
                <p className="text-sm text-muted-foreground">{t('completed')}</p>
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
                <p className="text-sm text-muted-foreground">{t('pending')}</p>
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
            {t('overview')}
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-md">
            {tNav('activeBookings')}
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-md">
            {tNav('bookingHistory')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t('personalInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('fullName')}</p>
                    <p className="font-medium">
                      {profile.firstName} {profile.lastName}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('emailAddress')}</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('phoneNumber')}</p>
                    <p className="font-medium">{profile.phone}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('location')}</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">
                        {[profile.city, profile.state, profile.country].filter(Boolean).join(', ') ||
                          t('notProvided')}
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
                  {t('drivingInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <p className="text-sm text-gray-600">{t('licenseIssuingCountry')}</p>
                    <p className="font-medium">{profile.licenseIssuingCountry || t('notProvided')}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600">{t('licenseExpiryDate')}</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <p className="font-medium">
                        {profile.licenseExpiryDate
                          ? new Date(profile.licenseExpiryDate).toLocaleDateString()
                          : t('notProvided')}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600">{t('drivingExperience')}</p>
                    <p className="font-medium">
                      {profile.drivingExperienceYears
                        ? `${profile.drivingExperienceYears} ${t('years')}`
                        : t('notProvided')}
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
                  {t('documentVerification')}
                </CardTitle>
                <CardDescription>{t('uploadDocuments')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Driver License */}
                  <div className="flex flex-col gap-2 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{t('driverLicense')}</p>
                          <p className="text-xs text-muted-foreground">{t('frontAndBack')}</p>
                        </div>
                      </div>
                      {profile.driverLicenseFront && profile.driverLicenseBack ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground/50" />
                      )}
                    </div>
                    {(profile.driverLicenseFront || profile.driverLicenseBack) && (
                      <div className="flex gap-2">
                        {profile.driverLicenseFront && (
                          <div className="group relative h-16 w-24 overflow-hidden rounded border bg-muted">
                            <img
                              src={getImageUrl(profile.driverLicenseFront)}
                              alt="License Front"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                              <Eye className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                        {profile.driverLicenseBack && (
                          <div className="group relative h-16 w-24 overflow-hidden rounded border bg-muted">
                            <img
                              src={getImageUrl(profile.driverLicenseBack)}
                              alt="License Back"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                              <Eye className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Passport Photo */}
                  <div className="flex flex-col gap-2 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{t('passportPhoto')}</p>
                          <p className="text-xs text-muted-foreground">{t('required')}</p>
                        </div>
                      </div>
                      {profile.passportPhoto ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground/50" />
                      )}
                    </div>
                    {profile.passportPhoto && (
                      <div className="group relative h-16 w-24 overflow-hidden rounded border bg-muted">
                        <img
                          src={getImageUrl(profile.passportPhoto)}
                          alt="Passport"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selfie with License */}
                  <div className="flex flex-col gap-2 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{t('selfieWithLicense')}</p>
                          <p className="text-xs text-muted-foreground">{t('required')}</p>
                        </div>
                      </div>
                      {profile.selfieWithLicense ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground/50" />
                      )}
                    </div>
                    {profile.selfieWithLicense && (
                      <div className="group relative h-16 w-24 overflow-hidden rounded border bg-muted">
                        <img
                          src={getImageUrl(profile.selfieWithLicense)}
                          alt="Selfie with License"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* International Permit */}
                  <div className="flex flex-col gap-2 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{t('internationalPermit')}</p>
                          <p className="text-xs text-muted-foreground">{t('optional')}</p>
                        </div>
                      </div>
                      {profile.internationalDrivingPermit ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground/50" />
                      )}
                    </div>
                    {profile.internationalDrivingPermit && (
                      <div className="group relative h-16 w-24 overflow-hidden rounded border bg-muted">
                        <img
                          src={getImageUrl(profile.internationalDrivingPermit)}
                          alt="International Permit"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {profile.verificationStatus === 'PENDING' && (
                  <Alert className="mt-4">
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      {t('documentsUnderReview')}
                    </AlertDescription>
                  </Alert>
                )}

                {profile.verificationStatus === 'REJECTED' && (
                  <Alert variant="destructive" className="mt-4">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t('documentsRejected')}
                    </AlertDescription>
                  </Alert>
                )}

                {!profile.verificationStatus && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t('uploadDocuments')}
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
