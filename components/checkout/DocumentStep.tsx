'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2, AlertOctagon, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserProfile } from '@/common/interfaces';
import DocumentUploadForm from './DocumentUploadForm';
import { useDocument, useVehicle, useBooking } from '@/app/axios/hooks';

interface DocumentStepProps {
  profile: UserProfile | null;
  onNext: () => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
  onProfileRefresh?: () => Promise<void>;
}

const DocumentStep: React.FC<DocumentStepProps> = ({ profile, onNext, onBack, isLoading, onProfileRefresh }) => {
  const t = useTranslations('documentStep');
  const { checkBookingEligibility, isLoading: documentLoading } = useDocument();
  const { bookingData } = useVehicle();
  const { currentBooking } = useBooking();
  const [localProfile, setLocalProfile] = useState(profile);
  const [documentsUploaded, setDocumentsUploaded] = useState(() => {
    // Check session storage for uploaded documents state
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('documentsUploaded');
      return stored === 'true';
    }
    return false;
  });

  // Update local profile when prop changes
  React.useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  // Persist documents uploaded state
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('documentsUploaded', documentsUploaded.toString());
    }
  }, [documentsUploaded]);

  const handleDocumentsChange = async (files: Record<string, File>) => {
    // Files are automatically uploaded via the DocumentUploadForm
    // Mark documents as uploaded
    setDocumentsUploaded(true);

    // After upload, refresh the profile to get updated verification status
    if (onProfileRefresh) {
      await onProfileRefresh();
    }
  };

  const handleNext = async () => {
    // If booking already exists, skip eligibility check and proceed directly
    if (bookingData && (currentBooking || documentsUploaded)) {
      console.log('[DocumentStep] Booking exists or documents uploaded, proceeding directly');
      await onNext();
      return;
    }

    // Check eligibility using the new comprehensive endpoint
    try {
      const response = await checkBookingEligibility(bookingData.bookingType);

      if (response?.success && response.data) {
        const { eligible, reason, verificationStatus } = response.data;

        // Allow proceeding if:
        // 1. Fully verified and eligible
        // 2. Documents are pending verification (graceful degradation)
        // 3. Documents have been uploaded in this session
        if (eligible || verificationStatus === 'PENDING' || documentsUploaded || currentBooking) {
          await onNext();
        } else {
          // If we have a booking, we should be able to proceed regardless of eligibility check failure
          // (which might be due to the booking itself)
          if (currentBooking) {
            await onNext();
          } else {
            // Show specific error message
            throw new Error(reason || 'Document requirements not met');
          }
        }
      } else {
        throw new Error(response?.message || 'Unable to verify eligibility');
      }
    } catch (error) {
      throw error; // Let parent handle the error
    }
  };

  const isVerified = localProfile?.verificationStatus === 'VERIFIED';
  const isPending = localProfile?.verificationStatus === 'PENDING';
  const isRejected = localProfile?.verificationStatus === 'REJECTED';

  // Check if required documents are uploaded (either in profile or in previews)
  const hasRequiredDocuments = React.useMemo(() => {
    // Check profile
    const inProfile = !!(
      localProfile?.driverLicenseFront &&
      localProfile?.driverLicenseBack &&
      localProfile?.passportPhoto &&
      localProfile?.selfieWithLicense
    );

    if (inProfile) return true;

    // Check session storage previews as fallback (for current session)
    if (typeof window !== 'undefined') {
      const storedPreviews = sessionStorage.getItem('documentPreviews');
      if (storedPreviews) {
        try {
          const previews = JSON.parse(storedPreviews);
          return !!(
            previews.driverLicenseFront &&
            previews.driverLicenseBack &&
            previews.passportPhoto &&
            previews.selfieWithLicense
          );
        } catch (e) {
          return false;
        }
      }
    }
    return false;
  }, [localProfile, documentsUploaded]);

  // Enhanced logic: Allow proceeding if documents are uploaded OR documents uploaded in this session OR booking already exists
  const canProceed = hasRequiredDocuments || documentsUploaded || isRejected || !!currentBooking;

  return (
    <div className="space-y-10">
      {/* Header Info */}
      <div className="space-y-2">
        <h3 className="text-xl font-black tracking-tight text-gray-950 uppercase italic dark:text-white">
          {t('title')} <span className="text-primary">{t('sync')}</span>
        </h3>
        <p className="max-w-lg text-sm leading-relaxed font-medium text-gray-500">{t('description')}</p>
      </div>

      {/* Document Upload Area */}
      <div className="rounded-3xl border border-gray-100 bg-gray-50/50 p-8 dark:border-gray-800 dark:bg-gray-800/50">
        {isPending && hasRequiredDocuments ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-600 ring-8 ring-yellow-500/5">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
              <h3 className="mb-2 text-xl font-black tracking-tight uppercase italic">{t('verificationPendingMsg')}</h3>
              <p className="max-w-md text-sm font-medium text-gray-600 dark:text-gray-400">
                Your documents have been uploaded successfully and are awaiting admin verification. This usually takes
                24-48 hours.
              </p>
            </div>

            {/* Show uploaded documents */}
            <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-6 dark:border-gray-700">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500">Driver License (Front)</p>
                <p className="text-sm text-green-600">✓ Uploaded</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500">Driver License (Back)</p>
                <p className="text-sm text-green-600">✓ Uploaded</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500">Passport Photo</p>
                <p className="text-sm text-green-600">✓ Uploaded</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500">Selfie with License</p>
                <p className="text-sm text-green-600">✓ Uploaded</p>
              </div>
            </div>

            {/* Info about proceeding */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                <strong>Good news!</strong> You can proceed with your booking. Verification must be completed before
                vehicle pickup.
              </p>
            </div>
          </div>
        ) : isRejected ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-red-600 ring-8 ring-red-500/5">
                <AlertOctagon className="h-10 w-10" />
              </div>
              <h3 className="mb-2 text-xl font-black tracking-tight text-red-600 uppercase italic">
                Documents Rejected
              </h3>
              <p className="mb-6 max-w-xs text-sm font-medium text-gray-600 dark:text-gray-400">
                Your documents were rejected. Please upload valid documents to continue.
              </p>
            </div>
            <DocumentUploadForm
              initialData={profile}
              onChange={handleDocumentsChange}
              onBack={onBack}
              isLoading={documentLoading}
            />
          </div>
        ) : (
          <DocumentUploadForm
            initialData={profile}
            onChange={handleDocumentsChange}
            onBack={onBack}
            isLoading={documentLoading}
          />
        )}
      </div>

      {/* Verification Status Bar */}
      <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
            isVerified
              ? 'bg-green-100 text-green-600'
              : isPending
                ? 'bg-yellow-100 text-yellow-600'
                : isRejected
                  ? 'bg-red-100 text-red-600'
                  : documentsUploaded
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-400',
          )}
        >
          {isVerified ? (
            <ShieldCheck className="h-5 w-5" />
          ) : isRejected ? (
            <AlertOctagon className="h-5 w-5" />
          ) : (
            <Loader2 className={cn('h-5 w-5', (isPending || documentsUploaded) && 'animate-spin')} />
          )}
        </div>
        <div className="flex-1">
          <p className="text-xs font-black tracking-widest text-gray-400 uppercase">{t('status')}</p>
          <p
            className={cn(
              'text-sm font-bold uppercase',
              isVerified
                ? 'text-green-600'
                : isPending
                  ? 'text-yellow-600'
                  : isRejected
                    ? 'text-red-600'
                    : documentsUploaded
                      ? 'text-blue-600'
                      : 'text-gray-950 dark:text-white',
            )}
          >
            {isVerified
              ? 'Verified'
              : isPending
                ? 'Pending Verification'
                : isRejected
                  ? 'Rejected - Reupload Required'
                  : documentsUploaded
                    ? 'Documents Uploaded'
                    : 'Awaiting Documents'}
          </p>
        </div>
        {isVerified && (
          <div className="rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-black tracking-widest text-green-600 uppercase">
            Verified
          </div>
        )}
        {isPending && (
          <div className="rounded-full bg-yellow-500/10 px-3 py-1 text-[10px] font-black tracking-widest text-yellow-600 uppercase">
            Pending
          </div>
        )}
        {documentsUploaded && !isPending && !isVerified && (
          <div className="rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-black tracking-widest text-blue-600 uppercase">
            Uploaded
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={isLoading || documentLoading || !canProceed}
          className="flex flex-1 items-center justify-center gap-2"
          title={
            !canProceed ? (isRejected ? 'Please upload valid documents' : 'Please upload all required documents') : ''
          }
        >
          {isLoading || documentLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {isPending && hasRequiredDocuments
                ? 'Continue with Pending Verification'
                : documentsUploaded
                  ? 'Continue to Payment'
                  : 'Continue to Payment'}
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Helper text */}
      {(isPending && hasRequiredDocuments) || documentsUploaded ? (
        <p className="text-center text-xs text-gray-500">
          Your booking will be confirmed, but you must complete verification before vehicle pickup.
        </p>
      ) : null}
    </div>
  );
};

export default DocumentStep;
