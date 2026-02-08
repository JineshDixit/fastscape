'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FloatingInput as Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, ShieldCheck, LogIn, Mail, Phone, ChevronRight, Car, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { UserProfile, UpdateProfileRequest } from '@/common/interfaces';
import { useAuth } from '@/app/axios';
import { useUser } from '@/app/axios/hooks';
import loginModel from '@/components/auth/loginModel';
import registerModel from '@/components/auth/registerModel';
import forgotPassword from '@/components/auth/forgotPassword';
import { useTranslations } from 'next-intl';

const LoginModel = loginModel;
const RegisterModel = registerModel;
const ForgotPasswordModel = forgotPassword;

interface IdentityStepProps {
  profile: UserProfile | null;
  onNext: (password: string) => void;
  isLoading?: boolean;
}

interface DrivingInfoForm {
  licenseIssuingCountry: string;
  licenseExpiryDate: string;
  drivingExperienceYears: string;
  visaStatus: 'Resident' | 'Tourist' | 'Visit' | '';
}

const IdentityStep: React.FC<IdentityStepProps> = ({ profile, onNext, isLoading }) => {
  const t = useTranslations('identityStep');
  const { user } = useAuth();
  const { updateProfile } = useUser();
  const [authView, setAuthView] = useState<'NONE' | 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD'>('NONE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Driving info form state
  const [drivingInfo, setDrivingInfo] = useState<DrivingInfoForm>({
    licenseIssuingCountry: '',
    licenseExpiryDate: '',
    drivingExperienceYears: '',
    visaStatus: '',
  });

  // Check if user has driving info
  const hasDrivingInfo = !!(
    profile?.licenseIssuingCountry &&
    profile?.licenseExpiryDate &&
    profile?.drivingExperienceYears !== undefined
  );

  // Initialize form with existing data
  useEffect(() => {
    if (profile && hasDrivingInfo) {
      setDrivingInfo({
        licenseIssuingCountry: profile.licenseIssuingCountry || '',
        licenseExpiryDate: profile.licenseExpiryDate || '',
        drivingExperienceYears: profile.drivingExperienceYears?.toString() || '',
        visaStatus: (profile as any).visaStatus || '',
      });
    }
  }, [profile, hasDrivingInfo]);

  const handleDrivingInfoChange = (field: keyof DrivingInfoForm, value: string) => {
    setDrivingInfo((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateDrivingInfo = (): boolean => {
    if (!drivingInfo.licenseIssuingCountry.trim()) {
      setError('License issuing country is required');
      return false;
    }
    if (!drivingInfo.licenseExpiryDate) {
      setError('License expiry date is required');
      return false;
    }
    // Check if license is not expired
    const expiryDate = new Date(drivingInfo.licenseExpiryDate);
    if (expiryDate <= new Date()) {
      setError('License expiry date must be in the future');
      return false;
    }
    if (!drivingInfo.drivingExperienceYears || parseInt(drivingInfo.drivingExperienceYears) < 0) {
      setError('Valid driving experience is required');
      return false;
    }
    if (!drivingInfo.visaStatus) {
      setError('Visa status is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    // Check basic profile info
    if (!profile?.firstName || !profile?.lastName || !profile?.phone) {
      setError('Please complete your basic profile information first');
      return;
    }

    // If driving info already exists, proceed
    if (hasDrivingInfo) {
      onNext('');
      return;
    }

    // Validate driving info form
    if (!validateDrivingInfo()) {
      return;
    }

    // Submit driving info
    setIsSubmitting(true);
    try {
      const updateData: UpdateProfileRequest = {
        licenseIssuingCountry: drivingInfo.licenseIssuingCountry,
        licenseExpiryDate: drivingInfo.licenseExpiryDate,
        drivingExperienceYears: parseInt(drivingInfo.drivingExperienceYears),
        visaStatus: drivingInfo.visaStatus as 'Resident' | 'Tourist' | 'Visit',
      };

      await updateProfile(updateData);
      setSuccess('Driving information saved successfully');
      
      // Proceed to next step after a brief delay
      setTimeout(() => {
        onNext('');
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to save driving information');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="animate-in fade-in flex flex-col items-center justify-center space-y-8 py-16 duration-700">
        <div className="bg-primary/10 text-primary ring-primary/5 relative rounded-full p-6 ring-8">
          <LogIn className="h-12 w-12" />
        </div>
        <div className="space-y-3 text-center">
          <h3 className="text-3xl font-black tracking-tighter uppercase italic">{t('restricted')}</h3>
          <p className="mx-auto max-w-sm text-base font-medium text-gray-400">{t('authRequired')}</p>
        </div>
        <Button
          onClick={() => setAuthView('LOGIN')}
          className="shadow-primary/20 h-14 rounded-2xl px-12 text-xs font-black tracking-[0.2em] uppercase shadow-2xl transition-all hover:scale-105 active:scale-95"
        >
          {t('initializeLogin')}
        </Button>
        <LoginModel
          open={authView === 'LOGIN'}
          onOpenChange={(open) => !open && setAuthView('NONE')}
          onRegisterClick={() => setAuthView('REGISTER')}
          onForgotPasswordClick={() => setAuthView('FORGOT_PASSWORD')}
        />
        <RegisterModel
          open={authView === 'REGISTER'}
          onOpenChange={(open) => !open && setAuthView('NONE')}
          onLoginClick={() => setAuthView('LOGIN')}
        />
        <ForgotPasswordModel
          open={authView === 'FORGOT_PASSWORD'}
          onOpenChange={(open) => !open && setAuthView('NONE')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="space-y-2">
        <h3 className="text-xl font-black tracking-tight text-gray-950 uppercase italic dark:text-white">
          {t('title')} <span className="text-primary">{t('verification')}</span>
        </h3>
        <p className="max-w-lg text-sm leading-relaxed font-medium text-gray-500">{t('description')}</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="rounded-xl border-green-500/20 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="ml-2 text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Read-only Profile Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border-gray-100 dark:border-gray-800">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-3">
              <User className="text-primary h-4 w-4" />
              <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{t('callsign')}</span>
            </div>
            <p className="truncate text-lg font-black text-gray-950 uppercase dark:text-white">
              {profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : t('awaitingIntel')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-100 dark:border-gray-800">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-3">
              <Mail className="text-primary h-4 w-4" />
              <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{t('commLink')}</span>
            </div>
            <p className="truncate text-base font-bold text-gray-600 dark:text-gray-400">{profile?.email}</p>
          </CardContent>
        </Card>

        <Card className="border-gray-100 dark:border-gray-800">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-3">
              <Phone className="text-primary h-4 w-4" />
              <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{t('secureLine')}</span>
            </div>
            <p className="truncate text-base font-bold text-gray-600 dark:text-gray-400">
              {profile?.phone || t('fieldMissing')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-100 dark:border-gray-800">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-3">
              <ShieldCheck className="text-primary h-4 w-4" />
              <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{t('status')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <p className="text-[11px] font-black tracking-tighter text-green-600 uppercase dark:text-green-500">
                {t('activeAuthorized')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Driving Information Section */}
      <div className="border-primary/10 bg-primary/5 dark:bg-primary/5 space-y-6 rounded-3xl border-2 p-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Car className="text-primary h-5 w-5" />
            <h4 className="text-lg font-black tracking-tight text-gray-950 dark:text-white">
              Driving License Information
            </h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {hasDrivingInfo
              ? 'Your driving information is on file. Review and proceed to the next step.'
              : 'Please provide your driving license information to continue with the booking.'}
          </p>
        </div>

        {hasDrivingInfo ? (
          // Display existing driving info
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500">License Issuing Country</Label>
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                <p className="font-semibold text-gray-900 dark:text-white">{profile?.licenseIssuingCountry}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500">License Expiry Date</Label>
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {profile?.licenseExpiryDate ? new Date(profile.licenseExpiryDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500">Driving Experience (Years)</Label>
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                <p className="font-semibold text-gray-900 dark:text-white">{profile?.drivingExperienceYears}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500">Visa Status</Label>
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                <p className="font-semibold text-gray-900 dark:text-white">{(profile as any)?.visaStatus || 'N/A'}</p>
              </div>
            </div>
          </div>
        ) : (
          // Form to collect driving info
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Input
                id="licenseCountry"
                type="text"
                label="License Issuing Country *"
                placeholder="e.g., United Arab Emirates"
                value={drivingInfo.licenseIssuingCountry}
                onChange={(e) => handleDrivingInfoChange('licenseIssuingCountry', e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Input
                id="licenseExpiry"
                type="date"
                label="License Expiry Date *"
                value={drivingInfo.licenseExpiryDate}
                onChange={(e) => handleDrivingInfoChange('licenseExpiryDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Input
                id="experience"
                type="number"
                label="Driving Experience (Years) *"
                min="0"
                max="80"
                placeholder="e.g., 5"
                value={drivingInfo.drivingExperienceYears}
                onChange={(e) => handleDrivingInfoChange('drivingExperienceYears', e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visaStatus" className="text-sm font-semibold">
                Visa Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={drivingInfo.visaStatus}
                onValueChange={(value) => handleDrivingInfoChange('visaStatus', value)}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select visa status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Resident">Resident</SelectItem>
                  <SelectItem value="Tourist">Tourist</SelectItem>
                  <SelectItem value="Visit">Visit Visa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isLoading || isSubmitting || !profile?.firstName || !profile?.lastName || !profile?.phone}
          className="group relative h-16 w-full overflow-hidden rounded-2xl bg-gray-950 font-black tracking-widest text-white uppercase transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50"
        >
          <div className="relative z-10 flex items-center justify-center gap-4">
            {isSubmitting ? 'Saving...' : hasDrivingInfo ? t('authorizeAndProceed') : 'Save & Continue'}
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </div>
        </Button>
      </div>

      <p className="text-center text-[9px] font-bold tracking-widest text-gray-400 uppercase">{t('disclaimer')}</p>
    </div>
  );
};

export default IdentityStep;
